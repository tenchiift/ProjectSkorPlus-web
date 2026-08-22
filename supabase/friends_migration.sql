-- Friends feature migration (idempotent — safe to re-run)
-- Run this in the Supabase SQL editor.

-- 1. Add username column to profiles
alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_unique
  on public.profiles (lower(username));

-- 2. friendships table
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (requester_id, addressee_id)
);

-- 3. Row Level Security
alter table public.friendships enable row level security;

drop policy if exists "users can read their friendships" on public.friendships;
create policy "users can read their friendships"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "users can create requests" on public.friendships;
create policy "users can create requests"
  on public.friendships for insert
  with check (auth.uid() = requester_id);

drop policy if exists "users can update their incoming requests" on public.friendships;
create policy "users can update their incoming requests"
  on public.friendships for update
  using (auth.uid() = addressee_id);

drop policy if exists "users can delete their friendships" on public.friendships;
create policy "users can delete their friendships"
  on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- 4. Realtime: stream friend requests (for notification events)
do $$
begin
  begin
    alter publication supabase_realtime add table public.friendships;
  exception when duplicate_object then null;
  end;
end $$;
alter table public.friendships replica identity full;
