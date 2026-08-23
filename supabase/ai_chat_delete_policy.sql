-- Allow users to delete their own AI chat data (Settings → Clear Chat History).
-- Run this in the Supabase SQL editor.
-- ai_messages rows cascade automatically when their conversation is deleted.

create policy "delete own conversations"
  on public.ai_conversations for delete
  using (auth.uid() = user_id);
