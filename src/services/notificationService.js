import { supabase } from '../config/supabase';
import { pickDaily } from '../data/notifications';

export const getNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
  return count ?? 0;
};

export const notifyEvent = async (userId, type, title, body) => {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, title, body: body || null });
  if (error) throw error;
};

export const ensureDailyNotifications = async (userId, profile, countdown) => {
  if (!userId) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const key = `skorplus-daily-${userId}`;
  try {
    if (localStorage.getItem(key) === todayStr) return;
  } catch { /* ignore */ }

  // Skip if already seeded today (check DB to avoid duplicates on multi-device).
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', todayStr)
    .limit(1);

  if (existing && existing.length > 0) {
    try { localStorage.setItem(key, todayStr); } catch { /* ignore */ }
    return;
  }

  const { quote, tip } = pickDaily(todayStr);

  const rows = [
    { user_id: userId, type: 'quote', title: quote.title, body: quote.body },
    { user_id: userId, type: 'reminder', title: tip.title, body: tip.body },
  ];

  // Data-driven study reminder.
  const daysLeft = countdown?.exam_date
    ? Math.ceil((new Date(countdown.exam_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  if (daysLeft != null && daysLeft > 0 && daysLeft <= 14) {
    rows.push({
      user_id: userId,
      type: 'reminder',
      title: `${daysLeft} hari je lagi 📅`,
      body: `Exam "${countdown.title}" makin dekat. Sikit hari ni, menang nanti.`,
    });
  }

  const week = profile?.week_anchor_week ?? null;
  if (week != null && week > 0) {
    rows.push({
      user_id: userId,
      type: 'reminder',
      title: `Week ${week} — keep the streak 🔥`,
      body: 'Dah separuh jalan. Jangan drop momentum sekarang, bro.',
    });
  }

  const { error } = await supabase.from('notifications').insert(rows);
  if (error) throw error;

  try { localStorage.setItem(key, todayStr); } catch { /* ignore */ }
};

export const subscribeToNotifications = (userId, callback) => {
  return supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => callback(payload.new)
    )
    .subscribe((status, err) => {
      if (err) console.error('Notifications realtime error:', err);
    });
};

export const markRead = async (id) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
};

export const markAllRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
};

export const deleteNotification = async (id) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const deleteAllNotifications = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
};
