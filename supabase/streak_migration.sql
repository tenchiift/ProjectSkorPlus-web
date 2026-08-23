-- Daily streak tracking for profiles.
-- Run this in the Supabase SQL editor.
-- Powers: login harian → days_streak +1 & +5 EXP (claimDailyStreak in userService.js),
-- shown as 🔥 chip on the Dashboard semester card.

alter table public.profiles
  add column if not exists last_active_date date;
