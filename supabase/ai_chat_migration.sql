-- AI Study Buddy Chat migration
-- Run this in the Supabase SQL editor.

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

create policy "read own conversations"
  on public.ai_conversations for select
  using (auth.uid() = user_id);

create policy "insert own conversations"
  on public.ai_conversations for insert
  with check (auth.uid() = user_id);

create policy "update own conversations"
  on public.ai_conversations for update
  using (auth.uid() = user_id);

create policy "read own messages"
  on public.ai_messages for select
  using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "insert own messages"
  on public.ai_messages for insert
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
