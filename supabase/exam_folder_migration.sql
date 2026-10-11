-- Past paper folders (subtopics, e.g. Vector) — lecturer-created.
-- Run this in the Supabase SQL editor.

alter table public.exams
  add column if not exists folder text not null default 'Vector';

update public.exams
set folder = 'Vector'
where folder is null or btrim(folder) = ''
   or btrim(folder) in ('Mathematics', 'mathematics', 'MATHEMATICS', 'Discrete Mathematics');

create index if not exists exams_folder_idx on public.exams (folder);

-- Folders exist independently so empty subtopics still show.
create table if not exists public.exam_folders (
  name text primary key,
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness (Vector vs vector).
create unique index if not exists exam_folders_name_lower_idx
  on public.exam_folders (lower(name));

insert into public.exam_folders (name) values
  ('Differentiation'),
  ('Integration')
on conflict (name) do nothing;

-- Backfill folders from any existing exam folder values.
insert into public.exam_folders (name)
select distinct btrim(folder)
from public.exams
where folder is not null and btrim(folder) <> ''
on conflict (name) do nothing;

alter table public.exam_folders enable row level security;

drop policy if exists "anyone can read exam folders" on public.exam_folders;
create policy "anyone can read exam folders"
  on public.exam_folders for select
  to authenticated
  using (true);

drop policy if exists "staff write exam folders" on public.exam_folders;
create policy "staff write exam folders"
  on public.exam_folders for all
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
