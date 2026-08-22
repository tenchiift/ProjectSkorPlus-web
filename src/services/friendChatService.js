import { supabase } from '../config/supabase';

function canonicalPair(a, b) {
  return a < b ? { user1_id: a, user2_id: b } : { user1_id: b, user2_id: a };
}

export const getOrCreateConversation = async (userIdA, userIdB) => {
  const pair = canonicalPair(userIdA, userIdB);

  const { data, error } = await supabase
    .from('friend_conversations')
    .upsert(pair, { onConflict: 'user1_id,user2_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getConversations = async (userId) => {
  const { data, error } = await supabase
    .from('friend_conversations')
    .select(`
      id,
      user1_id,
      user2_id,
      last_read_at_user1,
      last_read_at_user2,
      last_message_at,
      user1:profiles!friend_conversations_user1_id_fkey(id, name, username, photo_url),
      user2:profiles!friend_conversations_user2_id_fkey(id, name, username, photo_url)
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('friend_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, photo_url')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
};

export const sendMessage = async (conversationId, senderId, body, imageUrl) => {
  const { data, error } = await supabase
    .from('friend_messages')
    .insert({ conversation_id: conversationId, sender_id: senderId, body: body || null, image_url: imageUrl || null })
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from('friend_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
};

export const markRead = async (conversationId, userId) => {
  const { data, error } = await supabase
    .from('friend_conversations')
    .select('user1_id, user2_id')
    .eq('id', conversationId)
    .single();
  if (error) throw error;

  const column = data.user1_id === userId ? 'last_read_at_user1' : 'last_read_at_user2';
  await supabase
    .from('friend_conversations')
    .update({ [column]: new Date().toISOString() })
    .eq('id', conversationId);
};

export const getUnreadCounts = async (userId, conversations) => {
  const counts = {};
  for (const c of conversations) {
    const myLastRead = c.user1_id === userId ? c.last_read_at_user1 : c.last_read_at_user2;
    const { count, error } = await supabase
      .from('friend_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', c.id)
      .neq('sender_id', userId)
      .gt('created_at', myLastRead ?? '1970-01-01T00:00:00Z');
    if (error) throw error;
    counts[c.id] = count ?? 0;
  }
  return counts;
};

export const uploadChatImage = async (userId, file) => {
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const path = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from('chat')
    .upload(path, file, { contentType: file.type || 'image/jpeg' });
  if (error) throw error;

  const { data } = supabase.storage.from('chat').getPublicUrl(path);
  return data.publicUrl;
};

export const subscribeToMessages = (conversationId, callback) => {
  return supabase
    .channel(`friend-messages-${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'friend_messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => callback(payload.new)
    )
    .subscribe((status, err) => {
      if (err) console.error('Realtime subscribe error:', err);
    });
};

export const subscribeToPresence = (callback) => {
  const channel = supabase.channel('online-users');
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const onlineIds = Object.values(state).map((presences) => presences[0]?.user_id).filter(Boolean);
      callback(onlineIds);
    })
    .subscribe();
  return channel;
};
