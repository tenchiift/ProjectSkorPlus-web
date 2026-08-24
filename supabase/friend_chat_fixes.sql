-- Friend chat fixes (idempotent — safe to re-run)
-- 1) The old "update own conversations" policy had a broken with-check subquery
--    (`where id = id` matches every row → "more than one row returned" once a
--    user has 2+ conversations). markRead silently failed, so unread badges
--    never cleared. Replace it with a simple participant check.
-- 2) Add a DELETE policy so users can delete their conversations.
-- 3) Ensure profiles.bio exists for friend profile display.

-- 1. Fix the update policy
drop policy if exists "update own conversations" on public.friend_conversations;
create policy "update own conversations"
  on public.friend_conversations for update
  using (auth.uid() = user1_id or auth.uid() = user2_id)
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- 2. Allow participants to delete the conversation (messages cascade via FK)
drop policy if exists "delete own conversations" on public.friend_conversations;
create policy "delete own conversations"
  on public.friend_conversations for delete
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- 3. Bio column (no-op when it already exists)
alter table public.profiles add column if not exists bio text;
