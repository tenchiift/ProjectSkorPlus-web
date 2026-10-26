-- Per-user archive state for friend conversations (idempotent — safe to re-run)
-- Run this in the Supabase SQL editor.

alter table public.friend_conversations
  add column if not exists archived_by_user1 boolean not null default false,
  add column if not exists archived_by_user2 boolean not null default false;
