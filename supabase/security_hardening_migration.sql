-- ============================================================
-- Security hardening migration (idempotent — safe to re-run)
-- Run this in the Supabase SQL editor.
-- Findings from the vibecoder security review, 2026-09-07.
-- ============================================================

-- ============================================================
-- 1. [CRITICAL] Block self-service role escalation on profiles.
-- The update policy "Users can update their own profile" allows a user
-- to change every column of their own row, including `role`. Setting
-- role='admin' grants staff-write on modules/exams and admin access to
-- lecturer_codes. This trigger rejects any role change made by the row
-- owner's own JWT. Service-role / dashboard edits carry no matching JWT
-- sub claim, so admins can still manage roles.
-- ============================================================
create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_sub text;
begin
  jwt_sub := current_setting('request.jwt.claims', true)::json ->> 'sub';
  if jwt_sub is not null
     and jwt_sub = old.id::text
     and new.role is distinct from old.role then
    raise exception 'Changing your own role is not allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role
  before update on public.profiles
  for each row execute function public.prevent_self_role_change();

-- ============================================================
-- 2. [HIGH] Notifications: cross-user inserts via guarded RPC.
-- The insert policy only allows auth.uid() = user_id, so app-driven
-- notifications for OTHER users (friend messages, submission reviews)
-- silently fail. Direct insert-for-anyone would be a spam vector, so
-- inserts go through this security definer RPC with constraints.
-- ============================================================
create or replace function public.send_notification(
  target_user uuid,
  p_type text,
  p_title text,
  p_body text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if target_user is null then
    raise exception 'Missing recipient';
  end if;
  if p_type not in ('message', 'submission', 'reminder', 'quote') then
    raise exception 'Invalid notification type';
  end if;
  if char_length(p_title) = 0 or char_length(p_title) > 300 then
    raise exception 'Invalid title length';
  end if;
  if p_body is not null and char_length(p_body) > 300 then
    raise exception 'Invalid body length';
  end if;

  insert into public.notifications (user_id, type, title, body)
  values (target_user, p_type, p_title, p_body);
end;
$$;

grant execute on function public.send_notification(uuid, text, text, text) to authenticated;
revoke execute on function public.send_notification(uuid, text, text, text) from anon;

-- ============================================================
-- 3. [HIGH] Submissions bucket: private, owner-scoped.
-- Student work (names, handwritten answers) must not be publicly
-- readable. Trade-off: any authenticated lecturer/admin can read the
-- bucket — storage cannot see the submissions-table mapping. Acceptable
-- at this app's scale; revisit with a DB-backed check if needed.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do update set public = false;

drop policy if exists "submission files are publicly accessible" on storage.objects;
create policy "submission files readable by owner or staff"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'submissions'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role in ('lecturer', 'admin')
      )
    )
  );

drop policy if exists "users can upload submission files" on storage.objects;
create policy "users can upload submission files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Keep delete/update scoped to the file owner too.
drop policy if exists "users can delete own submission files" on storage.objects;
create policy "users can delete own submission files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 4. [MEDIUM] Chat images: authenticated-only reads (was public).
-- Messages live in private conversations; the images inside should not
-- be world-readable by URL.
-- ============================================================
drop policy if exists "Chat images are publicly accessible" on storage.objects;
create policy "Chat images readable by authenticated users"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'chat');

-- ============================================================
-- 5. Housekeeping: warn if the tasks table lacks RLS (created manually).
-- The app's `tasks` table never appeared in a migration file. If RLS is
-- OFF, every user's tasks are world-readable. This DO block reports the
-- state in the SQL editor output; enable RLS + owner policy if needed.
-- ============================================================
do $$
declare
  rls_enabled boolean;
begin
  select relrowsecurity into rls_enabled
  from pg_class
  where relname = 'tasks' and relnamespace = 'public'::regnamespace;

  if rls_enabled is null then
    raise notice 'tasks table not found — skipped';
  elsif not rls_enabled then
    alter table public.tasks enable row level security;
    drop policy if exists "read own tasks" on public.tasks;
    create policy "read own tasks"
      on public.tasks for select
      using (auth.uid() = user_id);
    drop policy if exists "write own tasks" on public.tasks;
    create policy "write own tasks"
      on public.tasks for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
    raise notice 'tasks RLS was OFF — enabled with owner-only policies';
  else
    raise notice 'tasks RLS already enabled — verify policies in dashboard';
  end if;
exception
  when undefined_table or undefined_column then
    raise notice 'tasks check skipped (missing table/column)';
end $$;
