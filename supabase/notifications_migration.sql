-- Notifications migration
-- Run this in the Supabase SQL editor.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);
