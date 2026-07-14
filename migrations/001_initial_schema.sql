-- ============================================
-- ProjectSkor+ Database Schema for Supabase
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Student',
  email       TEXT,
  gender      TEXT,
  semester    TEXT,
  bio         TEXT,
  photo_url   TEXT,
  total_exp   INTEGER NOT NULL DEFAULT 0,
  days_streak INTEGER NOT NULL DEFAULT 0,
  completed   INTEGER NOT NULL DEFAULT 0,
  exercise_progress FLOAT NOT NULL DEFAULT 0,
  profile_setup BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  color       TEXT NOT NULL DEFAULT 'purple',
  "order"     INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Module progress per user
CREATE TABLE IF NOT EXISTS public.module_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id   UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  progress    FLOAT NOT NULL DEFAULT 0,
  high_score  INTEGER NOT NULL DEFAULT 0,
  last_played TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Exam papers
CREATE TABLE IF NOT EXISTS public.exams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  subject     TEXT,
  semester    TEXT,
  year        INTEGER,
  pdf_url     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Profiles: user can read/write their own
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Modules: anyone authenticated can read
CREATE POLICY "Anyone can read modules" ON public.modules
  FOR SELECT USING (auth.role() = 'authenticated');

-- Module progress: user can CRUD their own
CREATE POLICY "Users can read own progress" ON public.module_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.module_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.module_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Exams: anyone authenticated can read
CREATE POLICY "Anyone can read exams" ON public.exams
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, total_exp, days_streak, completed, exercise_progress, profile_setup, created_at)
  VALUES (NEW.id, 'Student', NEW.email, 0, 0, 0, 0, false, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Storage bucket for exam PDFs
-- ============================================
-- Run these separately in Supabase SQL Editor or create bucket via dashboard:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exams', 'exams', false);

-- Storage RLS: authenticated users can read
-- CREATE POLICY "Authenticated users can read exams" ON storage.objects
--   FOR SELECT USING (bucket_id = 'exams' AND auth.role() = 'authenticated');
