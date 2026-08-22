-- Send Work + Messaging migration (idempotent — safe to re-run)
-- Run this in the Supabase SQL editor.

-- 1. Add role to profiles
alter table public.profiles
  add column if not exists role text not null default 'student';

-- 2. submissions table
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lecturer_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'submitted',
  created_at timestamptz not null default now()
);

-- 3. submission_files table
create table if not exists public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('image', 'pdf')),
  created_at timestamptz not null default now()
);

-- 4. messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- 5. Row Level Security
alter table public.submissions enable row level security;
alter table public.submission_files enable row level security;
alter table public.messages enable row level security;

drop policy if exists "read own submissions" on public.submissions;
create policy "read own submissions"
  on public.submissions for select
  using (auth.uid() = student_id or auth.uid() = lecturer_id);

drop policy if exists "student insert submission" on public.submissions;
create policy "student insert submission"
  on public.submissions for insert
  with check (auth.uid() = student_id);

drop policy if exists "read own submission files" on public.submission_files;
create policy "read own submission files"
  on public.submission_files for select
  using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id
        and (s.student_id = auth.uid() or s.lecturer_id = auth.uid())
    )
  );

drop policy if exists "insert own submission files" on public.submission_files;
create policy "insert own submission files"
  on public.submission_files for insert
  with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.student_id = auth.uid()
    )
  );

drop policy if exists "read own messages" on public.messages;
create policy "read own messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id
        and (s.student_id = auth.uid() or s.lecturer_id = auth.uid())
    )
  );

drop policy if exists "insert own messages" on public.messages;
create policy "insert own messages"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id
        and (s.student_id = auth.uid() or s.lecturer_id = auth.uid())
    )
  );

-- 6. Realtime: stream submissions (for lecturer notification events)
do $$
begin
  begin
    alter publication supabase_realtime add table public.submissions;
  exception when duplicate_object then null;
  end;
end $$;
alter table public.submissions replica identity full;
