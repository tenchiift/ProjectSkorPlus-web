import { supabase } from '../config/supabase';

export const createUserProfile = async (userId, data) => {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!existing) {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: data.name || 'Student',
        email: data.email || '',
        total_exp: 0,
        days_streak: 0,
        completed: 0,
        exercise_progress: 0,
      });

    if (error) throw error;
  }
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
};

export const updateUserStats = async (userId, { expGained, completed }) => {
  const { data: current } = await supabase
    .from('profiles')
    .select('total_exp, completed, exercise_progress')
    .eq('id', userId)
    .single();

  if (current) {
    const { error } = await supabase
      .from('profiles')
      .update({
        total_exp: current.total_exp + expGained,
        completed: current.completed + completed,
        exercise_progress: Math.min((current.exercise_progress || 0) + 0.05, 1),
      })
      .eq('id', userId);

    if (error) throw error;
  }
};
