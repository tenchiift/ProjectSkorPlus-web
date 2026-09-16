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

// Modules visible to a student: those taught by any lecturer they selected,
// plus any module flagged visible_to_all by an admin.
export const getModulesForStudent = async (userId) => {
  const { data: links, error: linkError } = await supabase
    .from('student_lecturers')
    .select('lecturer_id')
    .eq('student_id', userId);
  if (linkError) throw linkError;

  const lecturerIds = (links ?? []).map((l) => l.lecturer_id);
  const seen = new Map();

  if (lecturerIds.length > 0) {
    const { data, error } = await supabase
      .from('lecturer_modules')
      .select('module:modules(*)')
      .in('lecturer_id', lecturerIds);
    if (error) throw error;
    (data ?? []).forEach((row) => {
      if (row.module) seen.set(row.module.id, row.module);
    });
  }

  const { data: globalModules, error: globalError } = await supabase
    .from('modules')
    .select('*')
    .eq('visible_to_all', true);
  if (globalError) throw globalError;
  (globalModules ?? []).forEach((mod) => {
    if (!seen.has(mod.id)) seen.set(mod.id, mod);
  });

  return Array.from(seen.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

// Map of moduleId -> first lecturer (name, photo_url).
export const getLecturersForModules = async (moduleIds) => {
  if (!moduleIds || moduleIds.length === 0) return {};
  const { data, error } = await supabase
    .from('lecturer_modules')
    .select('module_id, lecturer:profiles!lecturer_modules_lecturer_id_fkey(name, photo_url)')
    .in('module_id', moduleIds);
  if (error) throw error;

  const map = {};
  (data ?? []).forEach((row) => {
    if (row.lecturer && !map[row.module_id]) {
      map[row.module_id] = row.lecturer;
    }
  });
  return map;
};

// Map of moduleId -> list of enrolled friends (max 4) for a student.
export const getEnrolledFriendsForModules = async (userId, moduleIds) => {
  if (!moduleIds || moduleIds.length === 0) return {};

  // 1. Accepted friends of the user.
  const { data: friendships, error: friendError } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  if (friendError) throw friendError;

  const friendIds = new Set();
  (friendships ?? []).forEach((f) => {
    if (f.requester_id === userId) friendIds.add(f.addressee_id);
    else friendIds.add(f.requester_id);
  });
  const friendIdArr = Array.from(friendIds);
  if (friendIdArr.length === 0) return {};

  // 2. Lecturers selected by those friends.
  const { data: friendLinks, error: linkError } = await supabase
    .from('student_lecturers')
    .select('student_id, lecturer_id')
    .in('student_id', friendIdArr);
  if (linkError) throw linkError;

  const lecturerByFriend = new Map();
  (friendLinks ?? []).forEach((row) => {
    const set = lecturerByFriend.get(row.student_id) || new Set();
    set.add(row.lecturer_id);
    lecturerByFriend.set(row.student_id, set);
  });
  const allLecturerIds = Array.from(new Set((friendLinks ?? []).map((r) => r.lecturer_id)));
  if (allLecturerIds.length === 0) return {};

  // 3. Which lecturers teach these modules.
  const { data: teachLinks, error: teachError } = await supabase
    .from('lecturer_modules')
    .select('lecturer_id, module_id')
    .in('lecturer_id', allLecturerIds)
    .in('module_id', moduleIds);
  if (teachError) throw teachError;

  // moduleId -> set of lecturerIds that teach it
  const lecturersByModule = new Map();
  (teachLinks ?? []).forEach((row) => {
    const set = lecturersByModule.get(row.module_id) || new Set();
    set.add(row.lecturer_id);
    lecturersByModule.set(row.module_id, set);
  });

  // 4. For each module, collect friends whose selected lecturer teaches it.
  const friendModuleMap = new Map();
  friendIdArr.forEach((fid) => {
    const lects = lecturerByFriend.get(fid);
    if (!lects) return;
    moduleIds.forEach((mid) => {
      const teachLects = lecturersByModule.get(mid);
      if (!teachLects) return;
      for (const lid of lects) {
        if (teachLects.has(lid)) {
          if (!friendModuleMap.has(mid)) friendModuleMap.set(mid, new Set());
          friendModuleMap.get(mid).add(fid);
          break;
        }
      }
    });
  });

  if (friendModuleMap.size === 0) return {};

  // 5. Fetch friend profiles.
  const allFriendIds = Array.from(new Set([...friendModuleMap.values()].flatMap((s) => [...s])));
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, name, photo_url')
    .in('id', allFriendIds);
  if (profError) throw profError;

  const profileById = {};
  (profiles ?? []).forEach((p) => { profileById[p.id] = p; });

  const result = {};
  friendModuleMap.forEach((fidSet, mid) => {
    const list = Array.from(fidSet)
      .map((id) => profileById[id])
      .filter(Boolean)
      .slice(0, 4);
    if (list.length > 0) result[mid] = list;
  });
  return result;
};

// Admin: flag a module as visible to all students.
export const setModuleVisibility = async (moduleId, visible) => {
  const { error } = await supabase
    .from('modules')
    .update({ visible_to_all: visible })
    .eq('id', moduleId);
  if (error) throw error;
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
