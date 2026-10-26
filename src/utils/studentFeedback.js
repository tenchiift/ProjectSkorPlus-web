export const USEFUL_FEATURES = ['Modules', 'Past Papers', 'Tasks', 'AI Chat', 'Submissions', 'Still exploring'];
export const IMPROVEMENTS = ['Explanations', 'Navigation', 'Loading speed', 'Study materials', 'Mobile layout', 'Nothing specific'];

export function buildFeedbackReport({ rating, ease, useful, improvement, comment = '' }) {
  if (![rating, ease].every((value) => Number.isInteger(value) && value >= 1 && value <= 5)) {
    throw new Error('Please answer both rating questions.');
  }
  if (!USEFUL_FEATURES.includes(useful) || !IMPROVEMENTS.includes(improvement)) {
    throw new Error('Please choose a feature and an area to improve.');
  }
  if (typeof comment !== 'string' || comment.length > 2000) {
    throw new Error('Keep your comment within 2,000 characters.');
  }
  return {
    title: `Student feedback: ${rating}/5`,
    category: 'other',
    severity: 'low',
    details: [
      'SKOR+ app feedback',
      `Overall experience: ${rating}/5`,
      `Ease of use: ${ease}/5`,
      `Most useful: ${useful}`,
      `Improve first: ${improvement}`,
      '',
      comment.trim() || 'No additional comment.',
    ].join('\n'),
  };
}
