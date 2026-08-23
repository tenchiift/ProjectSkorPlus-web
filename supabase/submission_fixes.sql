-- Fix Send Work: submission storage bucket + status update policy.
-- Run this in the Supabase SQL editor (idempotent).

-- 1. submissions table: allow the lecturer to update a submission
--    (powers "Mark as Reviewed").
drop policy if exists "lecturer update submission" on public.submissions;
create policy "lecturer update submission"
  on public.submissions for update
  using (auth.uid() = lecturer_id)
  with check (auth.uid() = lecturer_id);

-- 2. The 'submissions' storage bucket (was never created — uploads failed).
--    Public read so lecturers can open files via their public URL.
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', true)
on conflict (id) do update set public = true;

drop policy if exists "submission files are publicly accessible" on storage.objects;
create policy "submission files are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'submissions');

-- Any signed-in user can upload into the bucket; rows live under a
-- submission-id folder and the submission_files table controls who sees them.
drop policy if exists "users can upload submission files" on storage.objects;
create policy "users can upload submission files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'submissions');

-- 3. Keep the original file name so the thread/list can show it.
alter table public.submission_files
  add column if not exists file_name text;
update public.submission_files
  set file_name = split_part(file_url, '/', -1)
  where file_name is null;
