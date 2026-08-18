-- Fix friends / cross-user profile reads.
-- profiles has RLS enabled with only an "own row" select policy, so searching
-- other users by username returned nothing ("User not found").
-- Run this in the Supabase SQL editor (idempotent - safe to run again).

drop policy if exists "Users can read all profiles" on public.profiles;
create policy "Users can read all profiles"
  on public.profiles for select
  to authenticated
  using (true);
