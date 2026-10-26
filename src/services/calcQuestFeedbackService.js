import { supabase } from '../config/supabase';

export async function submitCalcQuestFeedback({ rating, category, message, difficultTopic }) {
  const cleanMessage = message.trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5 || cleanMessage.length < 10 || cleanMessage.length > 2000) {
    throw new Error('Choose a rating and write 10–2,000 characters of feedback.');
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Please sign in again before sending feedback. Your text is still here.');
  const { error } = await supabase.from('calcquest_feedback').insert({
    user_id: user.id, rating, category, message: cleanMessage, difficult_topic: difficultTopic,
  });
  if (error) throw new Error('Feedback could not be sent. Please try again. Your text is still here.');
}
