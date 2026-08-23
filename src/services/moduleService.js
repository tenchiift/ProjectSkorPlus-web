import { supabase } from '../config/supabase';

export const getModules = async () => {
  const { data, error } = await supabase.from('modules').select('*').order('order', { ascending: true });
  if (error) throw error;
  return data;
};

// Content management (lecturer/admin) — used by /manage-modules.
export const createModule = async (module) => {
  const { data, error } = await supabase.from('modules').insert(module).select().single();
  if (error) throw error;
  return data;
};

export const updateModule = async (id, changes) => {
  const { data, error } = await supabase.from('modules').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteModule = async (id) => {
  const { error } = await supabase.from('modules').delete().eq('id', id);
  if (error) throw error;
};

// Module topics (notes checklist) — managed via /manage-topics/:moduleId.
export const getTopics = async (moduleId) => {
  const { data, error } = await supabase
    .from('module_topics')
    .select('*')
    .eq('module_id', moduleId)
    .order('order_num', { ascending: true });
  if (error) throw error;
  return data;
};

export const createTopic = async (topic) => {
  const { data, error } = await supabase.from('module_topics').insert(topic).select().single();
  if (error) throw error;
  return data;
};

export const updateTopic = async (id, changes) => {
  const { data, error } = await supabase.from('module_topics').update(changes).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteTopic = async (id) => {
  const { error } = await supabase.from('module_topics').delete().eq('id', id);
  if (error) throw error;
};

// Topic PDFs live in the public 'exams' storage bucket (shared PDF storage).
export const uploadTopicPdf = async (file) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `notes/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from('exams')
    .upload(path, file, { contentType: file.type || 'application/pdf' });
  if (error) throw error;
  return supabase.storage.from('exams').getPublicUrl(path).data.publicUrl;
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
