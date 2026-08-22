-- Friends Chat + Presence migration
-- Run this in the Supabase SQL editor.

-- 1. friend_conversations
create table if not exists public.friend_conversations (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references public.profiles(id) on delete cascade,
  user2_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at_user1 timestamptz,
  last_read_at_user2 timestamptz,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint friend_conversations_canonical_pair check (user1_id < user2_id),
  constraint friend_conversations_unique_pair unique (user1_id, user2_id)
);

-- 2. friend_messages
create table if not exists public.friend_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.friend_conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  image_url text,
  created_at timestamptz not null default now(),
  constraint friend_messages_has_content check (body is not null or image_url is not null)
);

-- 3. indexes
create index if not exists friend_messages_conversation_created_idx
  on public.friend_messages (conversation_id, created_at);
create index if not exists friend_conversations_pair_idx
  on public.friend_conversations (user1_id, user2_id);

-- 4. RLS
alter table public.friend_conversations enable row level security;
alter table public.friend_messages enable row level security;

create policy "read own conversations"
  on public.friend_conversations for select
  using (auth.uid() = user1_id or auth.uid() = user2_id);

create policy "insert own conversations"
  on public.friend_conversations for insert
  with check (auth.uid() = user1_id or auth.uid() = user2_id);

-- Participants may only update the two timestamp columns; never the participant ids.
create policy "update own conversations"
  on public.friend_conversations for update
  using (auth.uid() = user1_id or auth.uid() = user2_id)
  with check (
    user1_id = (select user1_id from public.friend_conversations where id = id)
    and user2_id = (select user2_id from public.friend_conversations where id = id)
  );

create policy "read own messages"
  on public.friend_messages for select
  using (
    exists (
      select 1 from public.friend_conversations c
      where c.id = conversation_id
        and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
    )
  );

create policy "insert own messages"
  on public.friend_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.friend_conversations c
      where c.id = conversation_id
        and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
    )
  );

-- 5. Realtime: enable for friend_messages (Dashboard -> Database -> Realtime -> toggle table).
--    Presence channels need no SQL.

-- 6. Realtime: ensure replica identity is set to full so INSERT/UPDATE/DELETE stream fully.
alter table public.friend_messages replica identity full;
alter table public.friend_conversations replica identity full;
