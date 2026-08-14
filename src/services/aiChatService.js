import { supabase } from '../config/supabase';

const PLACEHOLDER_REPLY =
  "I'm your AI study buddy! 🤖\n\nRight now I'm just a placeholder — the real AI isn't connected yet. Once it's wired up, I'll be able to help you study, explain concepts, and answer your questions here.";

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

// Placeholder — swap with a real DeepSeek/OpenAI call later.
export const getAiReply = async () => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return PLACEHOLDER_REPLY;
};
