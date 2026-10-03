// Creates 20 confirmed load-test users + minimal profiles, staggered.
// Run with: SUPABASE_SERVICE_ROLE_KEY=xxx node loadtest/create-users.mjs
// The key stays in YOUR shell only; credentials are written to
// loadtest/.accounts.json (gitignored) for the k6 script to consume.

import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ujcgwezmroashxemfyqc.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in env. Aborting.');
  process.exit(1);
}

const COUNT = 20;
const STAGGER_MS = 3000;
const svc = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const created = [];
for (let i = 1; i <= COUNT; i++) {
  const n = String(i).padStart(2, '0');
  const email = `loadtest${n}@example.com`;
  const password = `Lt-${randomBytes(9).toString('base64url')}`;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: svc,
      body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { role: 'student' } }),
    });
    const body = await res.json().catch(() => ({}));
    const id = body.id || body.user?.id;
    if (!res.ok || !id) throw new Error(body.msg || body.error || `HTTP ${res.status}`);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: { ...svc, Prefer: 'return=minimal' },
        body: JSON.stringify({ id, name: `Load Test ${n}`, username: `loadtest${n}`, role: 'student' }),
      });
    } catch {
      console.warn(`profile insert failed for ${email} (auth user exists, continuing)`);
    }
    created.push({ email, password, id });
    console.log(`ok ${i}/${COUNT} ${email}`);
  } catch (err) {
    console.error(`FAILED ${email}: ${err.message}`);
  }
  if (i < COUNT) await sleep(STAGGER_MS);
}

// Merge with existing credentials by email instead of overwriting, so a
// re-run never loses passwords of accounts created by an earlier run.
let previous = [];
try {
  previous = JSON.parse(await readFile(new URL('./.accounts.json', import.meta.url), 'utf8'));
  if (!Array.isArray(previous)) previous = [];
} catch {
  previous = [];
}
const merged = new Map(previous.map((a) => [a.email, a]));
for (const a of created) merged.set(a.email, a);
await writeFile(new URL('./.accounts.json', import.meta.url), JSON.stringify([...merged.values()], null, 2));
console.log(`\nDone: ${created.length}/${COUNT} created this run, ${merged.size} total in loadtest/.accounts.json (gitignored).`);
if (created.length !== COUNT) process.exitCode = 2;
