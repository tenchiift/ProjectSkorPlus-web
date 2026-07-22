// Vector module question set — Quizizz-style template.
// Each question renders from `prompt`/`options[].text` immediately.
// Drop a PNG into `questionImage` / `options[].image` later to show images instead.

export const vectorQuestions = [
  {
    id: 'v1',
    prompt: 'Given a = (3, 4), what is the magnitude |a|?',
    questionImage: null,
    options: [
      { text: '5', image: null },
      { text: '7', image: null },
      { text: '12', image: null },
      { text: '25', image: null },
    ],
    correctIndex: 0,
  },
  {
    id: 'v2',
    prompt: 'What is the dot product of (1, 2) and (3, 4)?',
    questionImage: null,
    options: [
      { text: '11', image: null },
      { text: '10', image: null },
      { text: '14', image: null },
      { text: '7', image: null },
    ],
    correctIndex: 0,
  },
  {
    id: 'v3',
    prompt: 'Two vectors are perpendicular when their dot product is...',
    questionImage: null,
    options: [
      { text: '0', image: null },
      { text: '1', image: null },
      { text: 'negative', image: null },
      { text: 'equal to |a||b|', image: null },
    ],
    correctIndex: 0,
  },
  {
    id: 'v4',
    prompt: 'What is a + b for a = (2, -1) and b = (-3, 5)?',
    questionImage: null,
    options: [
      { text: '(-1, 4)', image: null },
      { text: '(5, -6)', image: null },
      { text: '(-1, -4)', image: null },
      { text: '(1, 4)', image: null },
    ],
    correctIndex: 0,
  },
  {
    id: 'v5',
    prompt: 'The unit vector in the direction of (0, 4) is...',
    questionImage: null,
    options: [
      { text: '(0, 1)', image: null },
      { text: '(0, 4)', image: null },
      { text: '(1, 0)', image: null },
      { text: '(0, 0.25)', image: null },
    ],
    correctIndex: 0,
  },
];

// Lightweight, serializable form for passing across the DOM-component bridge
// (the canvas game can't receive require()'d image modules over the bridge).
export const toGamePayload = (questions) =>
  questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: q.options.map((o) => o.text),
    correctIndex: q.correctIndex,
  }));
