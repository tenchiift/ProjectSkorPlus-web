import { supabase } from '../config/supabase';

export const getModules = async () => {
  const { data, error } = await supabase.from('modules').select('*').order('order', { ascending: true });
  if (error) throw error;
  return data;
};

export const getUserModuleProgress = async (userId) => {
  const { data, error } = await supabase.from('module_progress').select('*').eq('user_id', userId);
  if (error) throw error;
  const progress = {};
  data.forEach((row) => { progress[row.module_id] = row; });
  return progress;
};

export const updateModuleProgress = async (userId, moduleId, score) => {
  const { data: existing } = await supabase
    .from('module_progress').select('*').eq('user_id', userId).eq('module_id', moduleId).single();

  if (existing) {
    const newProgress = Math.min(existing.progress + 0.1, 1);
    const highScore = Math.max(existing.high_score || 0, score);
    const { error } = await supabase
      .from('module_progress')
      .update({ progress: newProgress, high_score: highScore, last_played: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('module_progress')
      .insert({ user_id: userId, module_id: moduleId, progress: 0.1, high_score: score, last_played: new Date().toISOString() });
    if (error) throw error;
  }
};
