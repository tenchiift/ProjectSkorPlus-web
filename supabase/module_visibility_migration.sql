-- Per-module visibility: admin can flag a module to show for ALL students,
-- bypassing the lecturer-student link requirement.
-- Run this in the Supabase SQL editor.

alter table public.modules
  add column if not exists visible_to_all boolean not null default false;
