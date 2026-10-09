// Shared motion vocabulary: quick feedback, calm movement, faster exits.
export const motionEase = [0.22, 1, 0.36, 1];
export const motionTiming = {
  feedback: 0.12,
  enter: 0.24,
  exit: 0.16,
  progress: 0.45,
};
export const layoutSpring = { type: 'spring', stiffness: 420, damping: 36 };
export const sheetSpring = { type: 'spring', stiffness: 360, damping: 34 };

export function pressFeedback(reducedMotion) {
  return reducedMotion ? {} : { whileTap: { scale: 0.98 }, transition: { duration: motionTiming.feedback } };
}
