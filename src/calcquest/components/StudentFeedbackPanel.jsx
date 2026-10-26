import { useEffect, useState } from 'react';
import { attachUsersToCalcQuestReviews, CALCQUEST_REVIEW_ITEMS, DEMO_REVIEWS } from '../data/demoReviews';
import { submitCalcQuestFeedback } from '../../services/calcQuestFeedbackService';
import { getAllStudents } from '../../services/userService';
import styles from './StudentPanels.module.css';

export default function StudentFeedbackPanel({
  submitFeedback = submitCalcQuestFeedback,
  loadStudents = getAllStudents,
}) {
  const [rating, setRating] = useState('');
  const [category, setCategory] = useState('Learning difficulty');
  const [difficultTopic, setDifficultTopic] = useState('None');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reviews, setReviews] = useState(DEMO_REVIEWS);

  useEffect(() => {
    let active = true;
    Promise.resolve(loadStudents?.())
      .then((students) => {
        if (active && Array.isArray(students) && students.length > 0) {
          setReviews(attachUsersToCalcQuestReviews(CALCQUEST_REVIEW_ITEMS, students));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [loadStudents]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setStatus('');
    if (message.trim().length < 10) {
      setError('Please write at least 10 characters.');
      document.getElementById('cq-feedback-message')?.focus();
      return;
    }
    setBusy(true);
    try {
      await submitFeedback({ rating: Number(rating), category, difficultTopic, message });
      setMessage('');
      setRating('');
      setStatus('Feedback sent! Thank you.');
    } catch (err) {
      setError(err.message || 'Unable to send feedback.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.sheet}>
      <div className={styles.headerRow}>
        <h2>Quick Feedback</h2>
        <span className={styles.badge}>Private</span>
      </div>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <p id="cq-feedback-error" role="alert" className={styles.errorText}>
            {error}
          </p>
        )}
        <div className={styles.compactGrid}>
          <label>
            Rating
            <select required value={rating} onChange={(e) => setRating(e.target.value)} disabled={busy}>
              <option value="">Select...</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {'★'.repeat(n)} ({n}/5)
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={busy}>
              {['Learning difficulty', 'Game experience', 'Bug report', 'Suggestion'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Topic
            <select value={difficultTopic} onChange={(e) => setDifficultTopic(e.target.value)} disabled={busy}>
              {['None', 'Algebra', 'Limits', 'Differentiation', 'Integration', 'Applications'].map(
                (item) => (
                  <option key={item}>{item}</option>
                )
              )}
            </select>
          </label>
        </div>
        <label htmlFor="cq-feedback-message">
          Note
          <textarea
            id="cq-feedback-message"
            required
            minLength={10}
            maxLength={2000}
            rows={3}
            placeholder="What felt tricky or fun?"
            value={message}
            aria-describedby={error ? 'cq-feedback-error' : undefined}
            onChange={(e) => {
              setMessage(e.target.value);
              setStatus('');
            }}
            disabled={busy}
          />
        </label>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.68rem', color: '#5C4938' }}>{message.length}/2000</span>
          <button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send Feedback'}
          </button>
        </div>
        {status && <p role="status" className={styles.doneBanner}>{status}</p>}
      </form>
      <details>
        <summary>Recent Student Notes ({reviews.length})</summary>
        <ol className={styles.reviews}>
          {reviews.map((review) => (
            <li key={review.id}>
              <strong>
                {review.author} · {review.rating}/5
              </strong>
              <span style={{ fontSize: '0.68rem', color: '#5C4938', marginLeft: '6px' }}>
                ({review.topic})
              </span>
              <p>{review.message}</p>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
