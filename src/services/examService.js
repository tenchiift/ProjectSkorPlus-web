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

// Counts for the lecturer dashboard.
export const getExamCount = async () => {
  const { count, error } = await supabase
    .from('exams')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
};
