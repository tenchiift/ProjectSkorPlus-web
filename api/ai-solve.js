// Vercel serverless function — Scan & Solve vision proxy.
// Primary: OpenRouter. Fallback: Cloudflare Workers AI (free 10k req/day).
// API key is kept server-side; only authenticated Supabase users can call it.

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ujcgwezmroashxemfyqc.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqY2d3ZXptcm9hc2h4ZW1meXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwMTE3NzIsImV4cCI6MjA5OTU4Nzc3Mn0.xDyX6NLfcA-3dbPZWD_z_ZMsKfU5OY5QCueRGDBlbTM';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const VISION_MODEL = process.env.OPENROUTER_VISION_MODEL || 'google/gemma-4-31b-it:free';
const VISION_FALLBACK_MODELS = ['google/gemini-2.5-flash', 'openai/gpt-4o-mini'];

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_AI_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_AI_API_TOKEN;
const CF_VISION_MODEL = '@cf/meta/llama-3.2-3b-instruct';
const CF_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/v1/chat/completions`;

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

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey && !(CF_API_TOKEN && CF_ACCOUNT_ID)) {
    res.status(500).json({ error: 'AI is not configured (missing OPENROUTER_API_KEY or CLOUDFLARE_AI credentials).' });
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

  async function callCloudflare() {
    const aiRes = await fetch(CF_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CF_API_TOKEN}`,
      },
      body: JSON.stringify({
        model: CF_VISION_MODEL,
        messages: [{ role: 'user', content: prompt + '\n\n[Image attached]' }],
        max_tokens: 2000,
      }),
    });
    return { aiRes, data: await aiRes.json() };
  }

  try {
    let data;
    let aiRes;

    // Primary: OpenRouter
    if (openrouterKey) {
      try {
        ({ aiRes, data } = await callOpenRouter());
        if (!aiRes.ok) throw new Error(data?.error?.message || 'openrouter error');
      } catch (orErr) {
        console.warn('ai-solve: OpenRouter failed, falling back to Cloudflare AI:', orErr.message);
        // Fallback: Cloudflare Workers AI
        if (CF_API_TOKEN && CF_ACCOUNT_ID) {
          ({ aiRes, data } = await callCloudflare());
        } else {
          throw orErr;
        }
      }
    } else {
      ({ aiRes, data } = await callCloudflare());
    }

    if (!aiRes.ok) {
      const detail = data?.error?.metadata?.raw || data?.error?.message || data?.errors?.[0]?.message;
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
