-- Semester progress migration (week/day with mid-sem break)
-- Run this in the Supabase SQL editor.

alter table public.profiles
  add column if not exists week_anchor_date date;
alter table public.profiles
  add column if not exists week_anchor_week integer;
alter table public.profiles
  add column if not exists week_anchor_day integer;
alter table public.profiles
  add column if not exists semester_paused boolean not null default false;
