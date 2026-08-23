-- Content write access for lecturers/admins (modules + past papers)
-- and the exams PDF storage bucket.
-- Run this in the Supabase SQL editor.

-- 1. Modules: everyone (authenticated) can read; lecturers & admins can write.
alter table public.modules enable row level security;

drop policy if exists "anyone can read modules" on public.modules;
create policy "anyone can read modules"
  on public.modules for select
  to authenticated
  using (true);

drop policy if exists "staff write modules" on public.modules;
create policy "staff write modules"
  on public.modules for all
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

-- 2. Exams (past papers): same pattern.
alter table public.exams enable row level security;

drop policy if exists "anyone can read exams" on public.exams;
create policy "anyone can read exams"
  on public.exams for select
  to authenticated
  using (true);

drop policy if exists "staff write exams" on public.exams;
create policy "staff write exams"
  on public.exams for all
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

-- 3. Public bucket for exam PDFs.
insert into storage.buckets (id, name, public)
values ('exams', 'exams', true)
on conflict (id) do nothing;

drop policy if exists "public read exam pdfs" on storage.objects;
create policy "public read exam pdfs"
  on storage.objects for select
  using (bucket_id = 'exams');

drop policy if exists "staff upload exam pdfs" on storage.objects;
create policy "staff upload exam pdfs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'exams'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('lecturer', 'admin')
    )
  );

drop policy if exists "staff delete exam pdfs" on storage.objects;
create policy "staff delete exam pdfs"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'exams'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('lecturer', 'admin')
    )
  );
