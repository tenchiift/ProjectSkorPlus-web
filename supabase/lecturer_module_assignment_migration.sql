-- Lecturer ↔ Student ↔ Module assignment.
-- Run this in the Supabase SQL editor.
--
-- Model:
--   - lecturer_modules : which modules a lecturer teaches (module = many lecturers)
--   - student_lecturers : which lecturers a student has selected
-- A student sees modules taught by the lecturers they selected.

-- 1. lecturer_modules
create table if not exists public.lecturer_modules (
  id uuid primary key default gen_random_uuid(),
  lecturer_id uuid not null references public.profiles(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (lecturer_id, module_id)
);

alter table public.lecturer_modules enable row level security;

drop policy if exists "anyone can read lecturer modules" on public.lecturer_modules;
create policy "anyone can read lecturer modules"
  on public.lecturer_modules for select
  to authenticated
  using (true);

drop policy if exists "staff write lecturer modules" on public.lecturer_modules;
create policy "staff write lecturer modules"
  on public.lecturer_modules for all
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

-- 2. student_lecturers
create table if not exists public.student_lecturers (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lecturer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, lecturer_id)
);

alter table public.student_lecturers enable row level security;

-- Students read/write their own selections.
drop policy if exists "student read own lecturers" on public.student_lecturers;
create policy "student read own lecturers"
  on public.student_lecturers for select
  to authenticated
  using (auth.uid() = student_id);

drop policy if exists "student write own lecturers" on public.student_lecturers;
create policy "student write own lecturers"
  on public.student_lecturers for all
  to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- A lecturer can read which students selected them.
drop policy if exists "lecturer read own students" on public.student_lecturers;
create policy "lecturer read own students"
  on public.student_lecturers for select
  to authenticated
  using (lecturer_id = auth.uid());

-- 3. Indexes
create index if not exists idx_lecturer_modules_module on public.lecturer_modules (module_id);
create index if not exists idx_lecturer_modules_lecturer on public.lecturer_modules (lecturer_id);
create index if not exists idx_student_lecturers_student on public.student_lecturers (student_id);
create index if not exists idx_student_lecturers_lecturer on public.student_lecturers (lecturer_id);
