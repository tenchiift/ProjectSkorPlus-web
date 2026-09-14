import { supabase } from '../config/supabase';

export const getModules = async () => {
  const { data, error } = await supabase.from('modules').select('*').order('order', { ascending: true });
  if (error) throw error;
  return data;
};

// Lecturers list (for the student picker dropdown / chips).
export const getLecturers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, photo_url')
    .eq('role', 'lecturer')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
};

// Modules visible to a student: those taught by any lecturer they selected.
export const getModulesForStudent = async (userId) => {
  const { data: links, error: linkError } = await supabase
    .from('student_lecturers')
    .select('lecturer_id')
    .eq('student_id', userId);
  if (linkError) throw linkError;

  const lecturerIds = (links ?? []).map((l) => l.lecturer_id);
  if (lecturerIds.length === 0) return [];

  const { data, error } = await supabase
    .from('lecturer_modules')
    .select('module:modules(*)')
    .in('lecturer_id', lecturerIds);
  if (error) throw error;

  const seen = new Map();
  (data ?? []).forEach((row) => {
    if (row.module) seen.set(row.module.id, row.module);
  });
  return Array.from(seen.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

// A lecturer's selected modules (their teaching scope).
export const getLecturerModules = async (lecturerId) => {
  const { data, error } = await supabase
    .from('lecturer_modules')
    .select('module_id')
    .eq('lecturer_id', lecturerId);
  if (error) throw error;
  return (data ?? []).map((row) => row.module_id);
};

export const assignLecturerModule = async (lecturerId, moduleId) => {
  const { error } = await supabase
    .from('lecturer_modules')
    .upsert({ lecturer_id: lecturerId, module_id: moduleId }, { onConflict: 'lecturer_id,module_id' });
  if (error) throw error;
};

export const unassignLecturerModule = async (lecturerId, moduleId) => {
  const { error } = await supabase
    .from('lecturer_modules')
    .delete()
    .eq('lecturer_id', lecturerId)
    .eq('module_id', moduleId);
  if (error) throw error;
};

// A student's selected lecturers.
export const getStudentLecturers = async (studentId) => {
  const { data, error } = await supabase
    .from('student_lecturers')
    .select('lecturer_id')
    .eq('student_id', studentId);
  if (error) throw error;
  return (data ?? []).map((row) => row.lecturer_id);
};

export const setStudentLecturers = async (studentId, lecturerIds) => {
  const { error: delError } = await supabase
    .from('student_lecturers')
    .delete()
    .eq('student_id', studentId);
  if (delError) throw delError;

  if (lecturerIds.length === 0) return;
  const rows = lecturerIds.map((lecturerId) => ({ student_id: studentId, lecturer_id: lecturerId }));
  const { error } = await supabase.from('student_lecturers').insert(rows);
  if (error) throw error;
};

// Students who selected a given lecturer.
export const getStudentsForLecturer = async (lecturerId) => {
  const { data, error } = await supabase
    .from('student_lecturers')
    .select('student:profiles!student_lecturers_student_id_fkey(id, name, username, photo_url)')
    .eq('lecturer_id', lecturerId);
  if (error) throw error;
  return (data ?? []).map((row) => row.student).filter(Boolean);
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
