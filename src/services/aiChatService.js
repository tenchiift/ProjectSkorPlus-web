import { supabase } from '../config/supabase';

export const createConversation = async (userId) => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({ user_id: userId, title: 'New chat' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getConversations = async (userId) => {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

export const getMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
};

export const addMessage = async (conversationId, role, content) => {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateConversationTitle = async (id, title) => {
  const { error } = await supabase
    .from('ai_conversations')
    .update({ title })
    .eq('id', id);
  if (error) throw error;
};

const MAX_HISTORY = 20;

// Calls the /api/ai-chat serverless function, which holds the AI provider
// key server-side. `history` is [{ role: 'user' | 'assistant', content }] —
// the AI needs the conversation so far to keep context. Language/persona
// come from the Settings screen (localStorage) and are applied to the
// system prompt server-side.
export const getAiReply = async (history) => {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  let language = 'auto';
  let persona = 'chill';
  try {
    language = localStorage.getItem('skorplus-ai-lang') || 'auto';
    persona = localStorage.getItem('skorplus-ai-persona') || 'chill';
  } catch { /* ignore */ }

  const messages = (Array.isArray(history) ? history : [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-MAX_HISTORY)
    .map(({ role, content }) => ({ role, content }));

  const res = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, language, persona }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to get an AI reply.');
  return data.reply;
};

// Deletes every AI conversation (and its messages via FK cascade) for the
// signed-in user. Requires the delete policy in
// supabase/ai_chat_delete_policy.sql to have been applied.
export const deleteAllConversations = async (userId) => {
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
};
