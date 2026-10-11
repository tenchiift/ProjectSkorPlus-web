import { supabase } from '../config/supabase';

// Past papers CRUD — lecturers/admins manage via /manage-exams; students
// read the same `exams` table in FinalExamScreen and ScanSolve.

export const getExams = async () => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createExam = async (exam) => {
  const { data, error } = await supabase
    .from('exams')
    .insert(exam)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateExam = async (id, changes) => {
  const { data, error } = await supabase
    .from('exams')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteExam = async (id) => {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const uploadExamPdf = async (file) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from('exams')
    .upload(path, file, { contentType: file.type || 'application/pdf' });
  if (error) throw error;
  return supabase.storage.from('exams').getPublicUrl(path).data.publicUrl;
};

// Folders (subtopics) exist independently so empty folders still show.
// Lecturers/admins write; students read (RLS enforces this server-side).
export const getFolders = async () => {
  const { data, error } = await supabase
    .from('exam_folders')
    .select('name')
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => row.name);
};

export const createFolder = async (name) => {
  const clean = (name ?? '').trim();
  if (!clean) throw new Error('Folder name is required.');
  const { data, error } = await supabase
    .from('exam_folders')
    .insert({ name: clean })
    .select('name')
    .single();
  if (error) throw error;
  return data.name;
};

export const renameFolder = async (oldName, newName) => {
  const from = (oldName ?? '').trim();
  const to = (newName ?? '').trim();
  if (!from || !to) throw new Error('Folder name is required.');
  if (from === to) return to;
  const { error: insertError } = await supabase
    .from('exam_folders')
    .insert({ name: to });
  if (insertError) throw insertError;
  const { error: moveError } = await supabase
    .from('exams')
    .update({ folder: to })
    .eq('folder', from);
  if (moveError) throw moveError;
  const { error: deleteError } = await supabase
    .from('exam_folders')
    .delete()
    .eq('name', from);
  if (deleteError) throw deleteError;
  return to;
};

export const deleteFolder = async (name) => {
  const clean = (name ?? '').trim();
  if (!clean) throw new Error('Folder name is required.');
  const { error } = await supabase
    .from('exam_folders')
    .delete()
    .eq('name', clean);
  if (error) throw error;
};

// Counts for the lecturer dashboard.
export const getExamCount = async () => {
  const { count, error } = await supabase
    .from('exams')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
};
