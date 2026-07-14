-- ============================================
-- Tasks table
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- Exam countdowns table
-- ============================================
CREATE TABLE IF NOT EXISTS public.exam_countdowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exam_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exam_countdowns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own countdowns" ON public.exam_countdowns
  FOR ALL USING (auth.uid() = user_id);
