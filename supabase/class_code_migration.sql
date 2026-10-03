-- Class code migration: registration now asks for the class (e.g. DCS 4B)
-- and derives the semester from its number instead of free text.
-- Run this in the Supabase SQL editor (idempotent, safe to re-run).
-- BEFORE using the new app build: the new screens write class_code.

alter table public.profiles
  add column if not exists class_code text;

-- Normalize old free-text semesters that contain a digit
-- ("Semester 2, 2025" -> "Semester 2"). Rows without a digit are left
-- alone; those students get a one-time class prompt in the app. Class
-- codes are never invented here.
update public.profiles
  set semester = 'Semester ' || (regexp_match(semester, '([1-9])'))[1]
  where semester is not null
    and semester !~ '^Semester [1-9]$'
    and semester ~ '[1-9]';
