import { supabase } from '../config/supabase';

export const searchByUsername = async (username) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username.trim())
    .limit(10);
  if (error) throw error;
  return data;
};

export const getUserByUsername = async (username) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', username.trim())
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const sendFriendRequest = async (requesterId, addresseeId) => {
  const { data, error } = await supabase
    .from('friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getFriendshipBetween = async (userId, otherId) => {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const acceptFriendRequest = async (friendshipId) => {
  const { error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', friendshipId);
  if (error) throw error;
};

export const declineFriendRequest = async (friendshipId) => {
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendshipId);
  if (error) throw error;
};

export const getFriends = async (userId) => {
  const { data, error } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');
  if (error) throw error;

  return (data || []).map((row) => {
    const isRequester = row.requester_id === userId;
    return { friendshipId: row.id, friend: isRequester ? row.addressee : row.requester };
  });
};

export const getPendingRequests = async (userId) => {
  const { data: incoming, error: inErr } = await supabase
    .from('friendships')
    .select('*, requester:profiles!friendships_requester_id_fkey(*)')
    .eq('addressee_id', userId)
    .eq('status', 'pending');
  if (inErr) throw inErr;

  const { data: outgoing, error: outErr } = await supabase
    .from('friendships')
    .select('*, addressee:profiles!friendships_addressee_id_fkey(*)')
    .eq('requester_id', userId)
    .eq('status', 'pending');
  if (outErr) throw outErr;

  return {
    incoming: (incoming || []).map((row) => ({ friendshipId: row.id, friend: row.requester })),
    outgoing: (outgoing || []).map((row) => ({ friendshipId: row.id, friend: row.addressee })),
  };
};

export const getLeaderboard = async (userId) => {
  const friends = await getFriends(userId);
  const rows = friends.map((f) => f.friend);
  rows.sort((a, b) => (b.total_exp ?? 0) - (a.total_exp ?? 0));
  return rows;
};
