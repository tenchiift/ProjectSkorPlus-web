-- Friend chat image uploads (idempotent - safe to run even if the bucket already exists).
-- Run this in the Supabase SQL editor.

-- 1. Ensure chat bucket exists and is public (public read is needed for getPublicUrl to display)
insert into storage.buckets (id, name, public)
values ('chat', 'chat', true)
on conflict (id) do update set public = true;

-- 2. Storage policies on storage.objects
drop policy if exists "Chat images are publicly accessible" on storage.objects;
create policy "Chat images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'chat');

drop policy if exists "Users can upload their own chat images" on storage.objects;
create policy "Users can upload their own chat images"
  on storage.objects for insert
  with check (
    bucket_id = 'chat'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

drop policy if exists "Users can update their own chat images" on storage.objects;
create policy "Users can update their own chat images"
  on storage.objects for update
  using (
    bucket_id = 'chat'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );

drop policy if exists "Users can delete their own chat images" on storage.objects;
create policy "Users can delete their own chat images"
  on storage.objects for delete
  using (
    bucket_id = 'chat'
    and auth.uid() = (storage.foldername(name))[1]::uuid
  );
