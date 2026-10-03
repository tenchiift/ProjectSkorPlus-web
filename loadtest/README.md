# Load test: 20 concurrent logins (burst)

Simulates 20 students opening the app at the same time, off-peak, against
the live Supabase project. Protocol-level (API), no browsers.

## One-time setup (owner only, holds the service_role key)

```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY2d3ZXptcm9hc2h4ZW1meXFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDAxMTc3MiwiZXhwIjoyMDk5NTg3NzcyfQ.Wm5FUhyeHfBE4JK2XAGP2MpJEz4nCHHAo4sQYdegmMg" node loadtest/create-users.mjs
```

Creates `loadtest01@example.com` … `loadtest20@example.com` (confirmed,
staggered 3s apart) plus minimal student profiles. Credentials land in
`loadtest/.accounts.json`, which is gitignored and never committed.

## Run the burst

```bash
k6 run loadtest/burst-20.js
```

Phase 1: 20 simultaneous logins + one Realtime socket each.
Phase 2 (starts at 30s): the same 20 users repeat the dashboard request
sequence for ~2.5 minutes.

Pass bars: p95 under 2s, failure rate under 1%, no 429/500.

## Cleanup

Delete the 20 `loadtestXX@example.com` accounts via `/admin` > Users
(search `loadtest`), or re-run the create script flow in reverse. Verify
with Query 1 that they are gone from `auth.users`.
