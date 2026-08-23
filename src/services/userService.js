import { supabase } from '../config/supabase';

export const createUserProfile = async (userId, data) => {
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).single();
  if (!existing) {
    const { error } = await supabase.from('profiles').insert({
      id: userId, name: data.name || 'Student', email: data.email || '',
      total_exp: 0, days_streak: 0, completed: 0, exercise_progress: 0,
    });
    if (error) throw error;
  }
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data;
};

// All registered students, for the lecturer's Students page.
export const getAllStudents = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, photo_url')
    .eq('role', 'student')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

export const setWeekAnchor = async (userId, { week, day }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { error } = await supabase
    .from('profiles')
    .update({
      week_anchor_date: today.toISOString().slice(0, 10),
      week_anchor_week: week,
      week_anchor_day: day,
      semester_paused: false,
    })
    .eq('id', userId);
  if (error) throw error;
};

export const setSemesterPaused = async (userId, paused) => {
  const { error } = await supabase
    .from('profiles')
    .update({ semester_paused: paused })
    .eq('id', userId);
  if (error) throw error;
};

export const updateUserStats = async (userId, { expGained, completed }) => {
  const { data: current } = await supabase.from('profiles').select('total_exp, completed, exercise_progress').eq('id', userId).single();
  if (current) {
    const { error } = await supabase.from('profiles').update({
      total_exp: current.total_exp + expGained,
      completed: current.completed + completed,
      exercise_progress: Math.min((current.exercise_progress || 0) + 0.05, 1),
    }).eq('id', userId);
    if (error) throw error;
  }
};

const localDateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Daily streak: +1 day & +5 EXP when the last active day was yesterday,
// reset to 1 day & +2 EXP when there was a gap. Call once per dashboard load.
// Requires profiles.last_active_date (supabase/streak_migration.sql).
export const claimDailyStreak = async (userId) => {
  const { data: p, error } = await supabase
    .from('profiles')
    .select('days_streak, last_active_date, total_exp')
    .eq('id', userId)
    .single();
  if (error || !p) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateStr(today);
  if (p.last_active_date === todayStr) {
    return { streak: p.days_streak ?? 0, claimed: false };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const continued = p.last_active_date === localDateStr(yesterday);
  const streak = continued ? (p.days_streak ?? 0) + 1 : 1;
  const expGain = continued ? 5 : 2;

  const { error: updErr } = await supabase
    .from('profiles')
    .update({
      days_streak: streak,
      last_active_date: todayStr,
      total_exp: (p.total_exp ?? 0) + expGain,
    })
    .eq('id', userId);
  if (updErr) throw updErr;
  return { streak, claimed: true, expGain };
};
