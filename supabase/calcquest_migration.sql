-- ============================================================================
-- SKOR+ CALCQUEST — THE INTERACTIVE CALCULUS ADVENTURE
-- Database Migration for Supabase (PostgreSQL + RLS)
-- ============================================================================

-- 1. Player Game Profile
create table if not exists public.player_game_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Explorer',
  level integer not null default 1,
  total_xp integer not null default 0,
  calc_coins integer not null default 50,
  current_world text not null default 'world_1',
  last_position jsonb not null default '{"worldId":"world_1","x":6,"y":14}'::jsonb,
  diagnostic_completed boolean not null default false,
  diagnostic_recommended_world text default 'world_1',
  world_states jsonb not null default '{}'::jsonb,
  inventory jsonb not null default '[]'::jsonb,
  claimed_rewards jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{"sfxVolume":0.6,"musicVolume":0.35,"muted":false,"reducedMotion":false}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_game_profiles enable row level security;

drop policy if exists "Users can read own game profile" on public.player_game_profiles;
create policy "Users can read own game profile"
  on public.player_game_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own game profile" on public.player_game_profiles;
create policy "Users can insert own game profile"
  on public.player_game_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own game profile" on public.player_game_profiles;
create policy "Users can update own game profile"
  on public.player_game_profiles for update
  using (auth.uid() = user_id);

-- 2. Player Avatar Customization
create table if not exists public.player_avatars (
  user_id uuid primary key references auth.users(id) on delete cascade,
  base_character text not null default 'tone_2',
  selected_hair text not null default 'spiky',
  selected_outfit text not null default 'tunic',
  selected_colors jsonb not null default '{"hair":"#3B2618","outfit":"#3E7BD6","trim":"#F59E0B"}'::jsonb,
  selected_accessories jsonb not null default '{"head":"none","back":"none","effect":"none"}'::jsonb,
  unlocked_cosmetics jsonb not null default '["none","tunic","robe","jacket","spiky","bob","long","curly"]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_avatars enable row level security;

drop policy if exists "Users can manage own avatar" on public.player_avatars;
create policy "Users can manage own avatar"
  on public.player_avatars for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. World Progress
create table if not exists public.world_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  world_id text not null,
  unlocked boolean not null default false,
  completed boolean not null default false,
  knowledge_core_restored boolean not null default false,
  boss_defeated boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, world_id)
);

create index if not exists idx_world_progress_user on public.world_progress(user_id);
alter table public.world_progress enable row level security;

drop policy if exists "Users can manage own world progress" on public.world_progress;
create policy "Users can manage own world progress"
  on public.world_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Quest Progress
create table if not exists public.quest_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id text not null,
  world_id text not null,
  status text not null default 'available' check (status in ('locked', 'available', 'active', 'completed')),
  current_objective integer not null default 0,
  progress_data jsonb not null default '{}'::jsonb,
  completion_time timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, quest_id)
);

create index if not exists idx_quest_progress_user on public.quest_progress(user_id);
alter table public.quest_progress enable row level security;

drop policy if exists "Users can manage own quest progress" on public.quest_progress;
create policy "Users can manage own quest progress"
  on public.quest_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. Question Bank
create table if not exists public.calcquest_questions (
  id text primary key,
  world_id text not null,
  topic text not null,
  subtopic text not null,
  difficulty integer not null default 1 check (difficulty between 1 and 3),
  question_type text not null,
  prompt text not null,
  answer_data jsonb not null,
  explanation text not null,
  hint text not null,
  misconception_tags jsonb not null default '[]'::jsonb,
  curriculum_ref text
);

alter table public.calcquest_questions enable row level security;

drop policy if exists "Authenticated users can read questions" on public.calcquest_questions;
create policy "Authenticated users can read questions"
  on public.calcquest_questions for select
  to authenticated
  using (true);

-- 6. Quiz Attempt History
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  submitted_answer text not null,
  correct boolean not null,
  attempt_number integer not null default 1,
  hints_used integer not null default 0,
  detected_misconception text,
  timestamp timestamptz not null default now()
);

create index if not exists idx_quiz_attempts_user on public.quiz_attempts(user_id, timestamp desc);
alter table public.quiz_attempts enable row level security;

drop policy if exists "Users can manage own quiz attempts" on public.quiz_attempts;
create policy "Users can manage own quiz attempts"
  on public.quiz_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 7. Student Skill Progress (12 Calculus Skills + Misconception Tracking)
create table if not exists public.student_skill_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_id text not null,
  mastery_estimate numeric(4,3) not null default 0.0,
  observed_accuracy numeric(4,3) not null default 0.0,
  evidence_count integer not null default 0,
  correct_count integer not null default 0,
  misconception_counts jsonb not null default '{}'::jsonb,
  last_practiced timestamptz,
  review_due timestamptz,
  unique (user_id, skill_id)
);

create index if not exists idx_student_skill_user on public.student_skill_progress(user_id);
alter table public.student_skill_progress enable row level security;

drop policy if exists "Users can manage own skill progress" on public.student_skill_progress;
create policy "Users can manage own skill progress"
  on public.student_skill_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 8. Player Achievements
create table if not exists public.player_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index if not exists idx_player_achievements_user on public.player_achievements(user_id);
alter table public.player_achievements enable row level security;

drop policy if exists "Users can manage own achievements" on public.player_achievements;
create policy "Users can manage own achievements"
  on public.player_achievements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 9. Daily Quests Progress
create table if not exists public.daily_quest_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_date date not null default current_date,
  quest_id text not null,
  progress integer not null default 0,
  target integer not null default 1,
  completed boolean not null default false,
  claimed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, quest_date, quest_id)
);

alter table public.daily_quest_progress enable row level security;

drop policy if exists "Users can manage own daily quests" on public.daily_quest_progress;
create policy "Users can manage own daily quests"
  on public.daily_quest_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 10. Multiplayer Study Party Rooms, Participants & Activities
create table if not exists public.multiplayer_rooms (
  room_id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'in_progress', 'completed', 'closed')),
  activity_id text not null default 'mission_derivative_reactor',
  created_at timestamptz not null default now()
);

alter table public.multiplayer_rooms enable row level security;

drop policy if exists "Authenticated users can view and join rooms" on public.multiplayer_rooms;
create policy "Authenticated users can view and join rooms"
  on public.multiplayer_rooms for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create rooms" on public.multiplayer_rooms;
create policy "Authenticated users can create rooms"
  on public.multiplayer_rooms for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Room participants can update room state" on public.multiplayer_rooms;
create policy "Room participants can update room state"
  on public.multiplayer_rooms for update
  to authenticated
  using (true);

create table if not exists public.multiplayer_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.multiplayer_rooms(room_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Explorer',
  role text not null default 'solver' check (role in ('solver', 'analyst', 'verifier')),
  ready_state boolean not null default false,
  avatar_snapshot jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);

alter table public.multiplayer_participants enable row level security;

drop policy if exists "Authenticated users can view room participants" on public.multiplayer_participants;
create policy "Authenticated users can view room participants"
  on public.multiplayer_participants for select
  to authenticated
  using (true);

drop policy if exists "Users can manage own participant row" on public.multiplayer_participants;
create policy "Users can manage own participant row"
  on public.multiplayer_participants for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.multiplayer_activities (
  activity_id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.multiplayer_rooms(room_id) on delete cascade,
  mission_key text not null default 'mission_derivative_reactor',
  current_stage integer not null default 1,
  progress jsonb not null default '{"solverDone":false,"analystDone":false,"verifierDone":false}'::jsonb,
  completion_status text not null default 'active' check (completion_status in ('active', 'completed')),
  updated_at timestamptz not null default now(),
  unique (room_id)
);

alter table public.multiplayer_activities enable row level security;

drop policy if exists "Authenticated users can view and update multiplayer activities" on public.multiplayer_activities;
create policy "Authenticated users can view and update multiplayer activities"
  on public.multiplayer_activities for all
  to authenticated
  using (true)
  with check (true);
