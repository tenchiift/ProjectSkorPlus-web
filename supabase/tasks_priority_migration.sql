-- Task priorities (High / Medium / Low).
-- Run this in the Supabase SQL editor.
-- Existing tasks default to 'medium'.

alter table public.tasks
  add column if not exists priority text not null default 'medium';

alter table public.tasks
  drop constraint if exists tasks_priority_check;

alter table public.tasks
  add constraint tasks_priority_check check (priority in ('high', 'medium', 'low'));
