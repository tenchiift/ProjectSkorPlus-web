-- Lecturer verification codes (single-use).
-- Run this in the Supabase SQL editor.

-- 1. Codes table: one code = one lecturer. `used_by` marks who claimed it.
create table if not exists public.lecturer_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text,
  active boolean not null default true,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.lecturer_codes enable row level security;

-- Only admins can manage codes. Everyone else sees nothing
-- (verification happens through the RPC below, not direct reads).
drop policy if exists "admin manage lecturer codes" on public.lecturer_codes;
create policy "admin manage lecturer codes"
  on public.lecturer_codes for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 2. Atomic single-use verification. Called by the app right after a
--    lecturer signs up: claims the code for the new user or returns false.
--    security definer so it can read/write the table without exposing it.
create or replace function public.verify_lecturer_code(input_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  code_row public.lecturer_codes%rowtype;
begin
  if auth.uid() is null then
    return false;
  end if;

  select * into code_row
    from public.lecturer_codes
    where upper(code) = upper(input_code)
      and active = true
      and used_by is null
    for update;

  if not found then
    return false;
  end if;

  update public.lecturer_codes
    set used_by = auth.uid(), used_at = now()
    where id = code_row.id;

  return true;
end;
$$;

-- 3. Make YOUR account the admin (replace the email, then run):
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';
--
-- Optional: an initial starter code you can hand out immediately:
-- insert into public.lecturer_codes (code, label) values ('SKOR-PROF-01', 'Starter code');
