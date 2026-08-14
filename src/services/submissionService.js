import { supabase } from '../config/supabase';

export const searchLecturers = async (query) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'lecturer')
    .ilike('username', `%${query.trim()}%`)
    .limit(10);
  if (error) throw error;
  return data;
};

export const createSubmission = async (studentId, lecturerId, message, files) => {
  const { data: submission, error: subErr } = await supabase
    .from('submissions')
    .insert({ student_id: studentId, lecturer_id: lecturerId, message })
    .select()
    .single();
  if (subErr) throw subErr;

  if (files && files.length > 0) {
    const fileRows = [];
    for (const file of files) {
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
      const path = `${submission.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('submissions')
        .upload(path, file, { contentType: file.type || 'application/octet-stream' });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('submissions')
        .getPublicUrl(path);

      fileRows.push({
        submission_id: submission.id,
        file_url: publicUrl,
        file_type: file.type?.startsWith('image/') ? 'image' : 'pdf',
      });
    }

    if (fileRows.length > 0) {
      const { error: filesErr } = await supabase.from('submission_files').insert(fileRows);
      if (filesErr) throw filesErr;
    }
  }

  return submission;
};

export const getStudentSubmissions = async (studentId) => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, lecturer:profiles!submissions_lecturer_id_fkey(name, username, photo_url)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getLecturerSubmissions = async (lecturerId) => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, student:profiles!submissions_student_id_fkey(name, username, photo_url)')
    .eq('lecturer_id', lecturerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getSubmission = async (submissionId) => {
  const { data, error } = await supabase
    .from('submissions')
    .select('*, student:profiles!submissions_student_id_fkey(name, username, photo_url), lecturer:profiles!submissions_lecturer_id_fkey(name, username, photo_url)')
    .eq('id', submissionId)
    .single();
  if (error) throw error;

  const { data: files, error: filesErr } = await supabase
    .from('submission_files')
    .select('*')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true });
  if (filesErr) throw filesErr;

  return { ...data, files };
};

export const getMessages = async (submissionId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(name, username, photo_url)')
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

export const sendMessage = async (submissionId, senderId, body) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ submission_id: submissionId, sender_id: senderId, body })
    .select()
    .single();
  if (error) throw error;
  return data;
};
