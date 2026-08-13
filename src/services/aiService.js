const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';
const API_URL = 'https://api.openai.com/v1/chat/completions';

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

export async function solveWithDeepSeek(imageUri, paperContext) {
  const base64 = await imageUriToBase64(imageUri);

  let prompt;
  if (paperContext) {
    prompt = `Exam Paper: ${paperContext}

You are a strict math tutor grading a student's answer. The image contains a question from this exam paper and possibly the student's handwritten answer.

1. Read the question from the image
2. Solve it step-by-step with clear explanations
3. If the image contains a handwritten answer, label it as "Student's Answer:" and check if it is correct
4. At the end, clearly say "✅ CORRECT" or "❌ INCORRECT" with reasoning
5. If incorrect, show the correct solution

Format your response nicely with line breaks between steps.`;
  } else {
    prompt = `You are a helpful math tutor.

1. Read the question from the image
2. Solve it step-by-step with clear explanations
3. Give the final answer clearly

Format your response nicely with line breaks between steps.`;
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
        ]
      }],
      max_tokens: 2000,
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'OpenAI API error');
  return data?.choices?.[0]?.message?.content || 'No response from AI. Please try again.';
}
