// Vercel serverless function — Scan & Solve vision proxy.
// Routes through 9router (local proxy) when available, falls back to
// OpenRouter. API key is kept server-side; only authenticated Supabase
// users can call it.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ujcgwezmroashxemfyqc.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY2d3ZXptcm9hc2h4ZW1meXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTE3NzIsImV4cCI6MjA5OTU4Nzc3Mn0.xDyX6NLfcA-3dbPZWD_z_ZMsKfU5OY5QCueRGDBlbTM';

const NINEROUTER_BASE_URL = process.env.NINEROUTER_BASE_URL || 'http://localhost:20128/v1';
const NINEROUTER_URL = `${NINEROUTER_BASE_URL}/chat/completions`;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || 'google/gemma-4-31b-it:free';
const VISION_FALLBACK_MODELS = ['google/gemini-2.5-flash', 'openai/gpt-4o-mini'];

// Vercel rejects request bodies over 4.5MB; the client resizes images
// to 1024px JPEG so this cap should never trip in practice.
const MAX_IMAGE_CHARS = 6000000;

function buildPrompt(paperContext) {
  if (paperContext) {
    return `Exam Paper: ${paperContext}

You are a strict math tutor grading a student's answer. The image contains a question from this exam paper and possibly the student's handwritten answer.

1. Read the question from the image
2. Solve it step-by-step with clear explanations
3. If the image contains a handwritten answer, label it as "Student's Answer:" and check if it is correct
4. At the end, clearly say "✅ CORRECT" or "❌ INCORRECT" with reasoning
5. If incorrect, show the correct solution

Format your response nicely with line breaks between steps. NEVER use LaTeX, dollar signs ($), or any math markup — always write math in plain text.`;
  }
  return `You are a helpful math tutor.

1. Read the question from the image
2. Solve it step-by-step with clear explanations
3. Give the final answer clearly

Format your response nicely with line breaks between steps. NEVER use LaTeX, dollar signs ($), or any math markup — always write math in plain text.`;
}

async function isAuthenticated(req) {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '');
  if (!token) return false;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  });
  return res.ok;
}

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!(await isAuthenticated(req))) {
    res.status(401).json({ error: 'Please sign in to use Scan & Solve.' });
    return;
  }

  const ninerouterKey = process.env.NINEROUTER_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!ninerouterKey && !openrouterKey) {
    res.status(500).json({ error: 'AI is not configured (missing NINEROUTER_API_KEY or OPENROUTER_API_KEY).' });
    return;
  }

  const { image, paperContext } = req.body || {};
  if (typeof image !== 'string' || image.length === 0) {
    res.status(400).json({ error: 'A base64 image is required.' });
    return;
  }
  if (image.length > MAX_IMAGE_CHARS) {
    res.status(413).json({ error: 'Image is too large. Try a smaller photo.' });
    return;
  }

  const prompt = buildPrompt(typeof paperContext === 'string' ? paperContext : '');
  const visionMessages = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
      ],
    },
  ];

  async function callNinerouter() {
    const aiRes = await fetch(NINEROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ninerouterKey}`,
      },
      body: JSON.stringify({
        model: 'projectskorplus',
        messages: visionMessages,
        max_tokens: 2000,
        stream: false,
      }),
    });
    return { aiRes, data: await aiRes.json() };
  }

  async function callOpenRouter() {
    const aiRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openrouterKey}`,
        'HTTP-Referer': process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:5173',
        'X-Title': 'SkorPlus',
      },
      body: JSON.stringify({
        models: [VISION_MODEL, ...VISION_FALLBACK_MODELS.filter((m) => m !== VISION_MODEL)].slice(0, 3),
        messages: visionMessages,
        max_tokens: 2000,
      }),
    });
    return { aiRes, data: await aiRes.json() };
  }

  try {
    let data;
    let aiRes;

    if (ninerouterKey) {
      try {
        ({ aiRes, data } = await callNinerouter());
        if (!aiRes.ok) throw new Error(data?.error?.message || 'ninerouter error');
      } catch (nrErr) {
        console.warn('ai-solve: 9router failed, falling back to OpenRouter:', nrErr.message);
        if (openrouterKey) {
          ({ aiRes, data } = await callOpenRouter());
        } else {
          throw nrErr;
        }
      }
    } else {
      ({ aiRes, data } = await callOpenRouter());
    }

    if (!aiRes.ok) {
      const detail = data?.error?.metadata?.raw || data?.error?.message;
      res.status(502).json({
        error: detail
          ? `AI provider failed (${detail}). Please try again.`
          : 'AI provider error. Please try again.',
      });
      return;
    }

    const solution = data?.choices?.[0]?.message?.content;
    if (!solution) {
      res.status(502).json({ error: 'No response from AI. Please try again.' });
      return;
    }
    res.status(200).json({ solution });
  } catch (err) {
    console.error('ai-solve error:', err);
    res.status(500).json({ error: 'Failed to solve. Please try again.' });
  }
}
