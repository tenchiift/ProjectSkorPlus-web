// Vercel serverless function for admin user management.
// Lets an admin list auth users and hard-delete test accounts so their
// emails can be registered again. Deleting only the `profiles` row leaves
// the address reserved in `auth.users`, which caused the
// "email already registered" reports.
//
// Security: the Supabase service_role key never leaves the server. Every
// request must carry the caller's own Supabase JWT; the function verifies
// it with GoTrue and then checks `profiles.role = 'admin'` before doing
// anything. Self-deletion is always refused.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ujcgwezmroashxemfyqc.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY2d3ZXptcm9hc2h4ZW1meXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTE3NzIsImV4cCI6MjA5OTU4Nzc3Mn0.xDyX6NLfcA-3dbPZWD_z_ZMsKfU5OY5QCueRGDBlbTM';

const PAGE_SIZE = 20;
const MAX_SCAN = 500; // listUsers scans at most this many auth users per call
const STORAGE_BUCKETS = ['avatars', 'submissions', 'chat'];

export const maxDuration = 60;

const svcHeaders = (serviceKey) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
});

// Verify the caller's JWT with GoTrue, then confirm the admin role.
// Returns { id, email } for admins, throws otherwise.
async function requireAdmin(req, serviceKey) {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!token) {
    const err = new Error('Please sign in as an admin.');
    err.status = 401;
    throw err;
  }
  const meRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  if (!meRes.ok) {
    const err = new Error('Please sign in as an admin.');
    err.status = 401;
    throw err;
  }
  const me = await meRes.json();
  const profRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=id,role&id=eq.${me.id}`,
    { headers: svcHeaders(serviceKey) }
  );
  const rows = await profRes.json().catch(() => []);
  if (!Array.isArray(rows) || rows[0]?.role !== 'admin') {
    const err = new Error('Admin access required.');
    err.status = 403;
    throw err;
  }
  return { id: me.id, email: me.email };
}

// Fetch auth users (paged) and merge matching profiles. Filters run
// in-memory because GoTrue has no search parameter; fine at this scale.
async function handleList(serviceKey, { q = '', role = 'all', page = 1 }) {
  let authUsers = [];
  let fetchPage = 1;
  for (;;) {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${fetchPage}&per_page=50`,
      { headers: svcHeaders(serviceKey) }
    );
    if (!res.ok) throw new Error('Failed to list users from auth.');
    const body = await res.json();
    const batch = Array.isArray(body) ? body : body.users || [];
    authUsers = authUsers.concat(batch);
    if (batch.length < 50 || authUsers.length >= MAX_SCAN) break;
    fetchPage += 1;
  }

  const ids = authUsers.map((u) => u.id);
  let profilesById = {};
  if (ids.length > 0) {
    const pres = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=id,username,name,role,created_at&id=in.(${ids.join(',')})`,
      { headers: svcHeaders(serviceKey) }
    );
    const profiles = await pres.json().catch(() => []);
    if (Array.isArray(profiles)) {
      for (const p of profiles) profilesById[p.id] = p;
    }
  }

  const needle = q.trim().toLowerCase();
  const merged = authUsers.map((u) => ({
    id: u.id,
    email: u.email || '',
    created_at: u.created_at || null,
    profile: profilesById[u.id] || null,
  }));
  const filtered = merged.filter((row) => {
    if (role !== 'all' && (row.profile?.role || 'student') !== role) return false;
    if (!needle) return true;
    return (
      row.email.toLowerCase().includes(needle) ||
      (row.profile?.username || '').toLowerCase().includes(needle) ||
      (row.profile?.name || '').toLowerCase().includes(needle)
    );
  });

  const total = filtered.length;
  const start = (Math.max(1, page) - 1) * PAGE_SIZE;
  return { users: filtered.slice(start, start + PAGE_SIZE), total };
}

// Best-effort removal of one user's files in the app buckets.
async function removeUserFiles(serviceKey, userId) {
  for (const bucket of STORAGE_BUCKETS) {
    try {
      const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: svcHeaders(serviceKey),
        body: JSON.stringify({ prefix: userId, limit: 100 }),
      });
      if (!listRes.ok) continue;
      const files = await listRes.json().catch(() => []);
      if (!Array.isArray(files) || files.length === 0) continue;
      const prefixes = files.map((f) => (f.name ? `${userId}/${f.name}` : null)).filter(Boolean);
      if (prefixes.length === 0) continue;
      await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}`, {
        method: 'DELETE',
        headers: svcHeaders(serviceKey),
        body: JSON.stringify({ prefixes }),
      });
    } catch {
      // Storage cleanup must not block the account deletion itself.
    }
  }
}

async function deleteOne(serviceKey, adminId, targetId) {
  // lecturer_codes.used_by has no delete cascade, so release the claim first.
  await fetch(`${SUPABASE_URL}/rest/v1/lecturer_codes?used_by=eq.${targetId}`, {
    method: 'PATCH',
    headers: { ...svcHeaders(serviceKey), Prefer: 'return=minimal' },
    body: JSON.stringify({ used_by: null }),
  });

  await removeUserFiles(serviceKey, targetId);

  // Most app tables cascade from profiles(id); delete the row first so no
  // orphaned profile remains if the auth deletion below fails.
  let targetEmail = '';
  try {
    const uRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${targetId}`, {
      headers: svcHeaders(serviceKey),
    });
    if (uRes.ok) {
      const u = await uRes.json().catch(() => ({}));
      targetEmail = u.email || (u.user && u.user.email) || '';
    }
  } catch {
    // Non-fatal; the email is only used for the audit log.
  }

  const pRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${targetId}`, {
    method: 'DELETE',
    headers: { ...svcHeaders(serviceKey), Prefer: 'return=minimal' },
  });
  if (!pRes.ok && pRes.status !== 404) {
    throw new Error('Failed to delete profile row.');
  }

  // This is the step that frees the email address for re-registration.
  const aRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${targetId}`, {
    method: 'DELETE',
    headers: svcHeaders(serviceKey),
  });
  if (!aRes.ok) {
    throw new Error('Failed to delete auth user; email may still be reserved.');
  }

  // Audit log; ignored when the migration has not been applied yet.
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/admin_deletion_log`, {
      method: 'POST',
      headers: { ...svcHeaders(serviceKey), Prefer: 'return=minimal' },
      body: JSON.stringify({ admin_id: adminId, target_id: targetId, target_email: targetEmail }),
    });
  } catch {
    // Table missing is fine; the deletion itself already succeeded.
  }
  return targetEmail;
}

async function handleDelete(serviceKey, admin, ids) {
  const targets = [...new Set((Array.isArray(ids) ? ids : []).filter(Boolean))];
  if (targets.length === 0) throw new Error('No users selected.');
  const ok = [];
  const failed = [];
  for (const id of targets) {
    if (id === admin.id) {
      failed.push({ id, reason: 'You cannot delete your own admin account.' });
      continue;
    }
    try {
      const email = await deleteOne(serviceKey, admin.id, id);
      ok.push({ id, email });
    } catch (err) {
      failed.push({ id, reason: err.message || 'Delete failed.' });
    }
  }
  return { ok, failed };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    res.status(500).json({
      error: 'User management is not configured (missing SUPABASE_SERVICE_ROLE_KEY).',
    });
    return;
  }

  try {
    const admin = await requireAdmin(req, serviceKey);
    const { action, q, role, page, ids } = req.body || {};
    if (action === 'list') {
      res.status(200).json(await handleList(serviceKey, { q, role, page }));
      return;
    }
    if (action === 'delete') {
      res.status(200).json(await handleDelete(serviceKey, admin, ids));
      return;
    }
    res.status(400).json({ error: 'Unknown action. Use list or delete.' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Request failed.' });
  }
}
