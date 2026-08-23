import { supabase } from '../config/supabase';

// Lecturer code management — admin only (RLS enforces this server-side).

export const getLecturerCodes = async () => {
  const { data, error } = await supabase
    .from('lecturer_codes')
    .select('*, used_by_profile:used_by(name, username)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const createLecturerCode = async (code, label) => {
  const { data, error } = await supabase
    .from('lecturer_codes')
    .insert({ code: code.trim().toUpperCase(), label: label?.trim() || null })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const setCodeActive = async (id, active) => {
  const { error } = await supabase
    .from('lecturer_codes')
    .update({ active })
    .eq('id', id);
  if (error) throw error;
};

export const deleteLecturerCode = async (id) => {
  const { error } = await supabase
    .from('lecturer_codes')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Called right after a lecturer signs up — atomically claims the code
// for the signed-in user. Returns true when the code is valid & unused.
export const verifyLecturerCode = async (code) => {
  const { data, error } = await supabase.rpc('verify_lecturer_code', {
    input_code: code.trim(),
  });
  if (error) throw error;
  return data === true;
};

export const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no lookalikes (I/1/O/0)
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `SKOR-${out}`;
};
