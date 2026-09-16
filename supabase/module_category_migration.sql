-- Module category label (free-text subject tag shown on module cards).
-- Run this in the Supabase SQL editor.

alter table public.modules
  add column if not exists category text;
