// Vercel serverless function — AI Study Buddy chat proxy.
// Keeps the OpenRouter API key server-side; only authenticated
// Supabase users can call it.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ujcgwezmroashxemfyqc.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY2d3ZXptcm9hc2h4ZW1meXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTE3NzIsImV4cCI6MjA5OTU4Nzc3Mn0.xDyX6NLfcA-3dbPZWD_z_ZMsKfU5OY5QCueRGDBlbTM';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || 'z-ai/glm-5.2:free';
// Free-first chain (:free pools are often congested — OpenRouter retries
// the next model). OpenRouter allows at most 3 models in the array.
const CHAT_FALLBACK_MODELS = ['google/gemma-4-31b-it:free', 'google/gemini-2.5-flash'];

const MAX_HISTORY = 20;
const MAX_CONTENT_CHARS = 8000;

const SYSTEM_PROMPT = `You are the SkorPlus AI Study Buddy — a friendly, encouraging tutor for Malaysian university students.

Rules:
- ALWAYS reply in the same language the student writes in. Malay gets Malay, English gets English, and if they mix (Manglish), mirror their mix naturally.
- Be concise but thorough — explain concepts step-by-step instead of just giving final answers.
- For math, show the working clearly with line breaks between steps.
- Encourage good study habits and suggest practice when relevant.
- If you're not sure about something, say so instead of guessing.`;

// Settings-driven prompt extras (from the app's Settings screen).
const PERSONA_PROMPTS = {
  chill:
    '- Persona: talk like a supportive friend — casual tone, a few emojis where natural, light Manglish/slang is welcome.',
  formal:
    '- Persona: act as a formal tutor — professional and structured, no slang or emojis.',
};
const LANGUAGE_PROMPTS = {
  bm: '- IMPORTANT: Always reply in Bahasa Melayu, regardless of the language the student writes in.',
  en: '- IMPORTANT: Always reply in English, regardless of the language the student writes in.',
};

export const maxDuration = 30;

async function isAuthenticated(req) {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!token) return false;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!(await isAuthenticated(req))) {
    res.status(401).json({ error: 'Please sign in to use the AI study buddy.' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'AI is not configured (missing OPENROUTER_API_KEY).' });
    return;
  }

  const history = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const messages = history
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CONTENT_CHARS) }));

  if (messages.length === 0) {
    res.status(400).json({ error: 'A non-empty messages array is required.' });
    return;
  }

  const { language, persona } = req.body || {};
  let systemPrompt = SYSTEM_PROMPT;
  if (PERSONA_PROMPTS[persona]) systemPrompt += `\n${PERSONA_PROMPTS[persona]}`;
  if (LANGUAGE_PROMPTS[language]) systemPrompt += `\n${LANGUAGE_PROMPTS[language]}`;

  try {
    const aiRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:5173',
        'X-Title': 'SkorPlus',
      },
      body: JSON.stringify({
        models: [CHAT_MODEL, ...CHAT_FALLBACK_MODELS.filter((m) => m !== CHAT_MODEL)].slice(0, 3),
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 1000,
      }),
    });

    const data = await aiRes.json();
    if (!aiRes.ok) {
      const detail = data?.error?.metadata?.raw || data?.error?.message;
      res.status(502).json({
        error: detail
          ? `AI provider failed (${detail}). Please try again.`
          : 'AI provider error. Please try again.',
      });
      return;
    }

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) {
      res.status(502).json({ error: 'No response from AI. Please try again.' });
      return;
    }
    res.status(200).json({ reply });
  } catch (err) {
    console.error('ai-chat error:', err);
    res.status(500).json({ error: 'Failed to get an AI reply. Please try again.' });
  }
}
