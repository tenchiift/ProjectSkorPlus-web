-- Audit log for admin user deletions (api/admin-users.js).
-- Run this in the Supabase SQL editor. Idempotent, safe to re-run.
-- The endpoint works without this table (it skips logging when missing),
-- but applying it keeps a record of who deleted whom.

create table if not exists public.admin_deletion_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id),
  target_id uuid not null,
  target_email text,
  created_at timestamptz not null default now()
);

alter table public.admin_deletion_log enable row level security;

drop policy if exists "admins read deletion log" on public.admin_deletion_log;
create policy "admins read deletion log"
  on public.admin_deletion_log for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
