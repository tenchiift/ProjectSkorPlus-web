import { supabase } from '../config/supabase';

// Bug reports — users file from the sidebar popup, admins triage.
// RLS enforces ownership server-side (see supabase/bug_reports_migration.sql).

export const BUG_CATEGORIES = [
  { value: 'ui', label: 'UI Problem' },
  { value: 'crash', label: 'Crash / Error' },
  { value: 'data', label: 'Wrong Data' },
  { value: 'performance', label: 'Slow / Performance' },
  { value: 'other', label: 'Other' },
];

export const BUG_SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'critical', label: 'Critical' },
];

export const BUG_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
];

const SCREENSHOT_BUCKET = 'bug-screenshots';
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

const uploadScreenshot = async (userId, file) => {
  const ext = (file.name?.split('.').pop() || 'png').toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || 'image/png' });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from(SCREENSHOT_BUCKET)
    .getPublicUrl(path);
  return publicUrl;
};

export const submitBugReport = async ({ title, category, severity, details, file }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to report a bug.');

  const cleanTitle = (title || '').trim();
  if (!cleanTitle) throw new Error('Please add a short title.');

  let screenshot_url = null;
  if (file) {
    if (file.size > MAX_SCREENSHOT_BYTES) {
      throw new Error('Screenshot must be under 5MB.');
    }
    screenshot_url = await uploadScreenshot(user.id, file);
  }

  const { data, error } = await supabase
    .from('bug_reports')
    .insert({
      user_id: user.id,
      title: cleanTitle,
      category,
      severity,
      details: (details || '').trim(),
      screenshot_url,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const listBugReports = async ({ status = 'all', category = 'all', kind = 'all' } = {}) => {
  let query = supabase
    .from('bug_reports')
    .select('*, reporter:profiles!bug_reports_user_id_fkey(name, username, email), votes:idea_votes(count)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (status !== 'all') query = query.eq('status', status);
  if (category !== 'all') query = query.eq('category', category);
  if (kind !== 'all') query = query.eq('kind', kind);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => ({
    ...row,
    voteCount: row.votes?.[0]?.count ?? 0,
  }));
};

// Feature ideas (kind = 'idea'). Same pipeline as bug reports.
export const submitIdea = async ({ title, details, file }) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to suggest a feature.');

  const cleanTitle = (title || '').trim();
  if (!cleanTitle) throw new Error('Please add a short title.');

  let screenshot_url = null;
  if (file) {
    if (file.size > MAX_SCREENSHOT_BYTES) {
      throw new Error('Screenshot must be under 5MB.');
    }
    screenshot_url = await uploadScreenshot(user.id, file);
  }

  const { data, error } = await supabase
    .from('bug_reports')
    .insert({
      user_id: user.id,
      kind: 'idea',
      title: cleanTitle,
      category: 'idea',
      severity: 'low',
      details: (details || '').trim(),
      screenshot_url,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// The current student's own ideas, newest first, with vote counts.
export const listMyIdeas = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in.');
  const { data, error } = await supabase
    .from('bug_reports')
    .select('*, votes:idea_votes(count)')
    .eq('user_id', user.id)
    .eq('kind', 'idea')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map((row) => ({
    ...row,
    voteCount: row.votes?.[0]?.count ?? 0,
  }));
};

// Toggle the current student's vote on an idea. Returns true if voted.
export const toggleIdeaVote = async (reportId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in.');
  const { data: existing } = await supabase
    .from('idea_votes')
    .select('report_id')
    .eq('report_id', reportId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from('idea_votes')
      .delete()
      .eq('report_id', reportId)
      .eq('user_id', user.id);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase
    .from('idea_votes')
    .insert({ report_id: reportId, user_id: user.id });
  if (error) throw error;
  return true;
};

export const setBugStatus = async (id, status) => {
  const { error } = await supabase
    .from('bug_reports')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
};

// Screenshots live in a private bucket, so resolve a short-lived signed
// URL for viewing. Stored values are public-style URLs; the path is the
// part after "/bug-screenshots/".
export const getScreenshotViewUrl = async (screenshotUrl) => {
  if (!screenshotUrl) return null;
  const marker = '/bug-screenshots/';
  const idx = screenshotUrl.indexOf(marker);
  const path = idx >= 0 ? screenshotUrl.slice(idx + marker.length) : screenshotUrl;
  const { data, error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data?.signedUrl ?? null;
};
