-- Semester progress migration
-- Run this in the Supabase SQL editor.

alter table public.profiles
  add column if not exists semester_start_date date;
