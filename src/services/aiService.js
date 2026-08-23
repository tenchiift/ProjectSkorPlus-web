import { supabase } from '../config/supabase';

async function imageUriToBase64(imageUri) {
  if (imageUri instanceof File || imageUri instanceof Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageUri);
    });
  }
  const response = await fetch(imageUri);
  const blob = await response.blob();
  return imageUriToBase64(blob);
}

// Calls the /api/ai-solve serverless function (vision model), which holds
// the AI provider key server-side. `paperContext` is the selected exam
// paper's "title - subject (semester)" — when present the AI grades the
// student's answer strictly instead of just solving.
export async function solveQuestion(imageUri, paperContext) {
  const base64 = await imageUriToBase64(imageUri);

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  const res = await fetch('/api/ai-solve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      image: base64,
      ...(paperContext ? { paperContext } : {}),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to solve. Please try again.');
  return data.solution;
}
