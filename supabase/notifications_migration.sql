-- Notifications migration (idempotent — safe to re-run)
-- Run this in the Supabase SQL editor.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'quote',
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications
  add column if not exists type text not null default 'quote';

alter table public.notifications enable row level security;

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "update own notifications" on public.notifications;
create policy "update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

drop policy if exists "delete own notifications" on public.notifications;
create policy "delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- Realtime: stream notifications to the owner.
do $$
begin
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;
alter table public.notifications replica identity full;
