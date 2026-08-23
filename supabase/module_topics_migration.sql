-- Module topics (notes checklist per module) + seed for the Vector module.
-- Run this in the Supabase SQL editor.

create table if not exists public.module_topics (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  order_num int not null default 1,
  pdf_url text,
  created_at timestamptz not null default now()
);

alter table public.module_topics enable row level security;

drop policy if exists "anyone can read module topics" on public.module_topics;
create policy "anyone can read module topics"
  on public.module_topics for select
  to authenticated
  using (true);

drop policy if exists "staff write module topics" on public.module_topics;
create policy "staff write module topics"
  on public.module_topics for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('lecturer', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('lecturer', 'admin')
    )
  );

-- No seed data: topics appear in the app only after a lecturer adds them
-- (with a PDF) via Modules Manager → Topics.
--
-- If you ran an earlier version of this migration that seeded placeholder
-- topics (4.1/4.2/4.3), remove them with:
-- delete from public.module_topics where pdf_url is null;
