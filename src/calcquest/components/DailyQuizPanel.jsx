import { useState } from 'react';
import { CALCQUEST_QUESTIONS } from '../data/questionsData';
import { RichMathText } from '../math/MathRenderer';
import { validateQuestionAnswer } from '../math/mathEngine';
import styles from './StudentPanels.module.css';

export default function DailyQuizPanel({ gameState, onAnswer }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const pool = CALCQUEST_QUESTIONS.filter(
    (q) =>
      ['multiple_choice', 'missing_step', 'spot_error', 'graph_interpretation'].includes(q.question_type) &&
      q.world_id !== 'world_1'
  );
  const seed = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  const questions = Array.from(
    { length: Math.min(3, pool.length) },
    (_, i) => pool[(seed * 3 + i) % pool.length]
  );
  const saved = gameState.profile.settings?.dailyQuiz;
  const answers = saved?.date === date ? saved.answers : [];
  const question = questions[answers.length];
  const latest = answers.at(-1);
  const score = answers.filter((a) => a.correct).length;

  async function answer(index) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = validateQuestionAnswer(question, index);
      await onAnswer({
        date,
        answers: [
          ...answers,
          {
            questionId: question.id,
            correct: result.correct,
            explanation: question.explanation,
          },
        ],
        question,
        index,
        result,
      });
    } catch {
      setError('Could not save answer. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.sheet} aria-label="Daily quiz">
      <div className={styles.headerRow}>
        <h2>Daily 3-Q Challenge</h2>
        <span className={styles.badge}>
          {answers.length}/{questions.length} • {score} ✓
        </span>
      </div>
      {error && <p role="alert" className={styles.errorText}>{error}</p>}
      <div aria-live="polite">
        {latest && (
          <div className={styles.feedbackBox}>
            <strong>{latest.correct ? '✓ Correct!' : '✗ Keep practicing:'}</strong>{' '}
            <RichMathText text={latest.explanation} />
          </div>
        )}
        {question ? (
          <>
            <div className={styles.promptBox}>
              <div className={styles.subtopicLabel}>
                Q{answers.length + 1}: {question.subtopic}
              </div>
              <RichMathText text={question.prompt} />
            </div>
            <div className={styles.options}>
              {question.answer_data.options.map((option, index) => (
                <button key={index} type="button" disabled={busy} onClick={() => answer(index)}>
                  <RichMathText text={option} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.doneBanner}>
            🎉 Daily quiz complete ({score}/{questions.length} correct)!
          </div>
        )}
      </div>
    </section>
  );
}
