-- Feature ideas from students (suggestion box).
-- Reuses the bug_reports pipeline: rows with kind = 'idea' are suggestions.
-- Run this in the Supabase SQL editor.

-- 1. Kind column: 'bug' (existing behaviour) or 'idea' (suggestion box).
alter table public.bug_reports
  add column if not exists kind text not null default 'bug';

update public.bug_reports
set kind = 'bug'
where kind is null or btrim(kind) = '';

create index if not exists bug_reports_kind_idx on public.bug_reports (kind);

-- 2. Votes: one row per student per idea. Students can vote on ideas
-- (including via a future browse list); counts surface in the popup
-- and the admin triage tab.
create table if not exists public.idea_votes (
  report_id uuid not null references public.bug_reports(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

alter table public.idea_votes enable row level security;

drop policy if exists "anyone can read idea votes" on public.idea_votes;
create policy "anyone can read idea votes"
  on public.idea_votes for select
  to authenticated
  using (true);

drop policy if exists "users vote on ideas" on public.idea_votes;
create policy "users vote on ideas"
  on public.idea_votes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users remove own idea vote" on public.idea_votes;
create policy "users remove own idea vote"
  on public.idea_votes for delete
  to authenticated
  using (auth.uid() = user_id);

-- 3. Browsing: everyone signed in can read ideas (bugs stay private —
-- users still only read their own bug rows, admins read everything).
drop policy if exists "anyone can read ideas" on public.bug_reports;
create policy "anyone can read ideas"
  on public.bug_reports for select
  to authenticated
  using (kind = 'idea');
