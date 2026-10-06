-- Bug reports from users (popup form in the sidebar).
-- Run this in the Supabase SQL editor.

-- 1. Reports table: one row per submitted report.
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'other',
  severity text not null default 'medium',
  details text not null default '',
  screenshot_url text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.bug_reports enable row level security;

-- Users can file reports and read their own.
drop policy if exists "users insert own bug reports" on public.bug_reports;
create policy "users insert own bug reports"
  on public.bug_reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "users read own bug reports" on public.bug_reports;
create policy "users read own bug reports"
  on public.bug_reports for select
  using (auth.uid() = user_id);

-- Admins can read and triage every report.
drop policy if exists "admin read all bug reports" on public.bug_reports;
create policy "admin read all bug reports"
  on public.bug_reports for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "admin update bug reports" on public.bug_reports;
create policy "admin update bug reports"
  on public.bug_reports for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 2. Screenshots bucket (private: owner + admin read via signed URLs).
insert into storage.buckets (id, name, public)
values ('bug-screenshots', 'bug-screenshots', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can upload own bug screenshots" on storage.objects;
create policy "Users can upload own bug screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'bug-screenshots'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

drop policy if exists "Users can read own bug screenshots" on storage.objects;
create policy "Users can read own bug screenshots"
  on storage.objects for select
  using (
    bucket_id = 'bug-screenshots'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

drop policy if exists "Admins can read all bug screenshots" on storage.objects;
create policy "Admins can read all bug screenshots"
  on storage.objects for select
  using (
    bucket_id = 'bug-screenshots'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Users can delete own bug screenshots" on storage.objects;
create policy "Users can delete own bug screenshots"
  on storage.objects for delete
  using (
    bucket_id = 'bug-screenshots'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );
