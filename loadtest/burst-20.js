// Burst test: 20 concurrent students logging in and opening the dashboard.
// Mirrors the real app's DashboardScreen request sequence (profile, streak,
// modules, progress, countdown, notifications) plus one Realtime socket each.
//
// Run with: k6 run loadtest/burst-20.js
// Needs loadtest/.accounts.json (created by create-users.mjs).
// Override target: k6 run -e SUPABASE_URL=... -e SUPABASE_ANON_KEY=... loadtest/burst-20.js
//
// NOTE: all traffic comes from one machine/IP, same as 20 students sharing
// one campus WiFi egress. If Supabase rate-limits logins, that failure IS a
// finding, not a script bug.

import http from 'k6/http';
import ws from 'k6/ws';
import { check, fail, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

const BASE =
  __ENV.SUPABASE_URL || 'https://ujcgwezmroashxemfyqc.supabase.co';
const ANON =
  __ENV.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY2d3ZXptcm9hc2h4ZW1meXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTE3NzIsImV4cCI6MjA5OTU4Nzc3Mn0.xDyX6NLfcA-3dbPZWD_z_ZMsKfU5OY5QCueRGDBlbTM';

const accounts = new SharedArray('accounts', () => {
  try {
    return JSON.parse(open('./.accounts.json'));
  } catch {
    return [];
  }
});
if (accounts.length === 0) {
  fail('loadtest/.accounts.json missing or empty. Run create-users.mjs first.');
}

const loginFailed = new Counter('login_failed');

export const options = {
  scenarios: {
    // Phase 1: 20 simultaneous logins, one per VU, plus a Realtime socket each.
    login_burst: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 1,
      maxDuration: '2m',
      exec: 'loginBurst',
    },
    // Phase 2: the same 20 users hammer the dashboard request sequence.
    dashboard_burst: {
      executor: 'ramping-vus',
      startTime: '30s',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 20 },
        { duration: '15s', target: 0 },
      ],
      exec: 'dashboardBurst',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

function myAccount() {
  return accounts[(__VU - 1) % accounts.length];
}

function login() {
  const acc = myAccount();
  const res = http.post(
    `${BASE}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: acc.email, password: acc.password }),
    { headers: { apikey: ANON, 'Content-Type': 'application/json' }, tags: { endpoint: 'login' } }
  );
  const ok = check(res, { 'login 200': (r) => r.status === 200 });
  if (!ok) {
    loginFailed.add(1);
    return null;
  }
  const body = res.json();
  return { uid: body.user.id, token: body.access_token };
}

function authed(token) {
  return { apikey: ANON, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export function loginBurst() {
  const sess = login();
  if (!sess) return;
  // Hold one Realtime connection briefly, like subscribeToNotifications does.
  const url = `${BASE.replace('https://', 'wss://')}/realtime/v1/websocket?apikey=${ANON}&vsn=1.0.0`;
  ws.connect(url, { tags: { endpoint: 'realtime' } }, (socket) => {
    socket.setTimeout(() => socket.close(), 2000);
  });
  sleep(1);
}

function dashboardPass(sess) {
  const h = authed(sess.token);
  const uid = sess.uid;
  const today = new Date().toISOString().slice(0, 10);

  let r = http.get(`${BASE}/rest/v1/profiles?select=*&id=eq.${uid}`, { headers: h, tags: { endpoint: 'profile' } });
  check(r, { 'profile 200': (x) => x.status === 200 });

  r = http.get(`${BASE}/rest/v1/profiles?select=days_streak,last_active_date,total_exp&id=eq.${uid}`, {
    headers: h, tags: { endpoint: 'streak_read' },
  });
  check(r, { 'streak read 200': (x) => x.status === 200 });
  const row = r.json()[0];
  if (row && row.last_active_date !== today) {
    r = http.patch(
      `${BASE}/rest/v1/profiles?id=eq.${uid}`,
      JSON.stringify({ days_streak: (row.days_streak || 0) + 1, last_active_date: today, total_exp: (row.total_exp || 0) + 5 }),
      { headers: { ...h, Prefer: 'return=minimal' }, tags: { endpoint: 'streak_write' } }
    );
    check(r, { 'streak write ok': (x) => x.status === 200 || x.status === 204 });
  }

  r = http.get(`${BASE}/rest/v1/student_lecturers?select=lecturer_id&student_id=eq.${uid}`, {
    headers: h, tags: { endpoint: 'student_lecturers' },
  });
  check(r, { 'links 200': (x) => x.status === 200 });

  r = http.get(`${BASE}/rest/v1/modules?select=*&visible_to_all=eq.true`, {
    headers: h, tags: { endpoint: 'modules' },
  });
  check(r, { 'modules 200': (x) => x.status === 200 });

  r = http.get(`${BASE}/rest/v1/module_progress?select=*&user_id=eq.${uid}`, {
    headers: h, tags: { endpoint: 'progress' },
  });
  check(r, { 'progress 200': (x) => x.status === 200 });

  r = http.get(`${BASE}/rest/v1/exam_countdowns?select=*&user_id=eq.${uid}&order=exam_date.asc&limit=1`, {
    headers: h, tags: { endpoint: 'countdown' },
  });
  check(r, { 'countdown 200': (x) => x.status === 200 });

  r = http.get(
    `${BASE}/rest/v1/notifications?select=id&user_id=eq.${uid}&created_at=gte.${today}&limit=1`,
    { headers: h, tags: { endpoint: 'notif_check' } }
  );
  check(r, { 'notif check 200': (x) => x.status === 200 });
  if (Array.isArray(r.json()) && r.json().length === 0) {
    r = http.post(
      `${BASE}/rest/v1/notifications`,
      JSON.stringify({ user_id: uid, type: 'quote', title: 'Load test seed', body: 'Seeded by burst-20.' }),
      { headers: { ...h, Prefer: 'return=minimal' }, tags: { endpoint: 'notif_seed' } }
    );
    check(r, { 'notif seed ok': (x) => x.status === 200 || x.status === 201 });
  }

  r = http.request(
    'HEAD',
    `${BASE}/rest/v1/notifications?user_id=eq.${uid}&read=eq.false`,
    null,
    { headers: { ...h, Prefer: 'count=exact' }, tags: { endpoint: 'unread_count' } }
  );
  check(r, { 'unread count ok': (x) => x.status === 200 || x.status === 206 });
}

let vuToken = null;

export function dashboardBurst() {
  if (!vuToken) {
    vuToken = login();
    if (!vuToken) {
      sleep(2);
      return;
    }
  }
  dashboardPass(vuToken);
  sleep(2);
}
