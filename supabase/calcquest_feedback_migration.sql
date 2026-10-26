create table if not exists public.calcquest_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  category text not null check (category in ('Learning difficulty', 'Game experience', 'Bug report', 'Suggestion')),
  difficult_topic text not null check (difficult_topic in ('None', 'Algebra', 'Limits', 'Differentiation', 'Integration', 'Applications')),
  message text not null check (char_length(btrim(message)) between 10 and 2000),
  created_at timestamptz not null default now()
);
alter table public.calcquest_feedback enable row level security;
revoke all on public.calcquest_feedback from anon, authenticated;
grant insert, select on public.calcquest_feedback to authenticated;
drop policy if exists "Students submit own feedback" on public.calcquest_feedback;
create policy "Students submit own feedback" on public.calcquest_feedback
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Students read own feedback" on public.calcquest_feedback;
create policy "Students read own feedback" on public.calcquest_feedback
  for select to authenticated using ((select auth.uid()) = user_id);
