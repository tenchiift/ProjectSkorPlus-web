import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { listBugReports, submitBugReport } from '../services/bugReportService';
import { getAllStudents, getUserProfile } from '../services/userService';
import { buildFeedbackReport, IMPROVEMENTS, USEFUL_FEATURES } from '../utils/studentFeedback';
import { attachUsersToReviews, parseSubmittedReviewReports, studentReviews } from '../data/studentDemoReviews';
import styles from './StudentFeedbackScreen.module.css';

const questions = [
  { key: 'rating', title: 'How has SKOR+ been for you?', options: ['1 · Poor', '2 · Fair', '3 · Okay', '4 · Good', '5 · Excellent'] },
  { key: 'ease', title: 'How easy is it to use the app?', options: ['1 · Very difficult', '2 · Difficult', '3 · Okay', '4 · Easy', '5 · Very easy'] },
  { key: 'useful', title: 'Which part helps you most?', options: USEFUL_FEATURES },
  { key: 'improvement', title: 'What should we improve first?', options: IMPROVEMENTS },
];

const INITIAL_ANSWERS = { rating: null, ease: null, useful: '', improvement: '', comment: '' };

export default function StudentFeedbackScreen({
  submitReport = submitBugReport,
  loadStudents = getAllStudents,
  loadReports = listBugReports,
}) {
  const { user } = useAuth() || {};
  const location = useLocation();
  const [answers, setAnswers] = useState(INITIAL_ANSWERS);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [baseReviews, setBaseReviews] = useState(() => attachUsersToReviews(studentReviews));
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const heading = useRef(null);
  const sending = useRef(false);
  const question = questions[step];

  const isAdmin = currentUserProfile?.role === 'admin';
  const showAllReviewsPage = isAdmin && location.pathname === '/reviews';

  useEffect(() => {
    if (modalOpen || !showAllReviewsPage) heading.current?.focus();
  }, [step, sent, modalOpen, showAllReviewsPage]);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) setModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen, busy]);

  useEffect(() => {
    let active = true;
    Promise.resolve(loadStudents?.())
      .then((students) => {
        if (active && Array.isArray(students) && students.length > 0) {
          setBaseReviews(attachUsersToReviews(studentReviews, students));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [loadStudents]);

  useEffect(() => {
    let active = true;
    Promise.resolve(loadReports?.({ category: 'other' }))
      .then((rows) => {
        if (active && Array.isArray(rows)) {
          setSubmittedReviews(parseSubmittedReviewReports(rows));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [loadReports]);

  useEffect(() => {
    let active = true;
    if (!user?.id) return () => { active = false; };
    Promise.resolve(getUserProfile(user.id))
      .then((profile) => {
        if (active && profile) setCurrentUserProfile(profile);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [user?.id]);

  function openReviewModal() {
    setError('');
    if (sent) {
      setSent(false);
      setStep(0);
      setAnswers(INITIAL_ANSWERS);
    }
    setModalOpen(true);
  }

  function closeReviewModal() {
    if (busy) return;
    setModalOpen(false);
  }

  async function send(event) {
    event.preventDefault();
    if (sending.current) return;
    setError('');
    if (step < questions.length) {
      if (!answers[question.key]) {
        setError('Choose an answer before continuing.');
        return;
      }
      setStep(step + 1);
      return;
    }
    sending.current = true;
    setBusy(true);
    try {
      await submitReport(buildFeedbackReport(answers));
      const trimmedComment = answers.comment.trim();
      const name =
        currentUserProfile?.name?.trim() ||
        user?.user_metadata?.name?.trim() ||
        currentUserProfile?.username?.trim() ||
        user?.email?.split('@')[0] ||
        'Student';
      const username = currentUserProfile?.username?.trim()
        ? `@${currentUserProfile.username.trim()}`
        : '';
      const meta =
        currentUserProfile?.class_code?.trim() ||
        currentUserProfile?.semester?.trim() ||
        '';
      const newReview = {
        id: `user-review-${Date.now()}`,
        name,
        username,
        meta,
        photoUrl: currentUserProfile?.photo_url || null,
        rating: answers.rating,
        message:
          trimmedComment ||
          `${answers.useful} has been really helpful for my revision. Rating: ${answers.rating}/5.`,
      };
      setSubmittedReviews((prev) => [newReview, ...prev]);
      setSent(true);
    } catch {
      setError('Your review could not be sent. Your answers are still here. Check your connection and try again.');
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  const allReviews = [...submittedReviews, ...baseReviews];

  const renderFormContent = (inModal = false) =>
    sent ? (
      <div role="status" className={styles.sentBox}>
        <h2 ref={heading} tabIndex={-1}>Thank you for your review!</h2>
        <p>Your review has been sent to the SKOR+ team.</p>
        <div className={styles.actions}>
          {inModal ? (
            <button type="button" className={styles.primary} onClick={closeReviewModal}>
              Done
            </button>
          ) : (
            <Link to="/dashboard" className={styles.primary}>
              Back to dashboard
            </Link>
          )}
        </div>
      </div>
    ) : (
      <form onSubmit={send} aria-busy={busy}>
        <p className={styles.progressLabel}>
          {step < 4 ? `Question ${step + 1} of 4` : 'Write your review'}
        </p>
        <progress className={styles.progress} value={step} max={4} aria-label="Questions completed" />
        <h2 ref={heading} tabIndex={-1} id="feedback-question">
          {question?.title || 'Share your experience'}
        </h2>
        {question ? (
          <fieldset className={styles.options} aria-labelledby="feedback-question">
            {question.options.map((option, index) => {
              const value = step < 2 ? index + 1 : option;
              return (
                <label
                  key={`${question.key}-${value}`}
                  className={`${styles.option} ${answers[question.key] === value ? styles.selected : ''}`}
                >
                  <input
                    type="radio"
                    name={question.key}
                    value={value}
                    checked={answers[question.key] === value}
                    onChange={() => {
                      setAnswers({ ...answers, [question.key]: value });
                      setError('');
                    }}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <>
            <dl className={styles.summary}>
              <div><dt>Overall experience</dt><dd>{answers.rating}/5</dd></div>
              <div><dt>Ease of use</dt><dd>{answers.ease}/5</dd></div>
              <div><dt>Most useful</dt><dd>{answers.useful}</dd></div>
              <div><dt>Improve first</dt><dd>{answers.improvement}</dd></div>
            </dl>
            <label className={styles.commentLabel} htmlFor="feedback-comment">
              Your review
            </label>
            <textarea
              id="feedback-comment"
              rows={4}
              maxLength={2000}
              value={answers.comment}
              disabled={busy}
              placeholder="Share how SKOR+ helps with your studies..."
              onChange={(event) => setAnswers({ ...answers, comment: event.target.value })}
              aria-describedby="feedback-comment-help"
            />
            <p id="feedback-comment-help" className={styles.privacy}>
              What works well or would make your next study session better? {answers.comment.length}/2,000 characters.
            </p>
          </>
        )}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          {step > 0 && (
            <button
              type="button"
              className={styles.secondary}
              disabled={busy}
              onClick={() => {
                setStep(step - 1);
                setError('');
              }}
            >
              Back
            </button>
          )}
          <button type="submit" className={styles.primary} disabled={busy}>
            {busy ? 'Submitting…' : question ? 'Next' : 'Post review'}
          </button>
        </div>
        {busy && <p role="status">Submitting your review. Please wait.</p>}
      </form>
    );

  // Only admins opening /reviews from the sidebar see all students' reviews;
  // clicking the circular Review button on the Dashboard (/feedback) leads directly to the review form.
  if (!showAllReviewsPage) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <Link to="/dashboard" className={styles.back} aria-label="Back to dashboard">
            <ArrowLeft size={22} aria-hidden="true" />
          </Link>
          <span>Write a Review</span>
        </header>
        <main className={styles.content}>
          <h1>Help shape SKOR+</h1>
          <p>Tell us what works for your studies and what needs attention.</p>
          <section className={styles.survey} aria-label="App review form">
            {renderFormContent(false)}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/dashboard" className={styles.back} aria-label="Back to dashboard">
          <ArrowLeft size={22} aria-hidden="true" />
        </Link>
        <span>Student Reviews</span>
      </header>
      <main className={styles.content}>
        <h1>Student Reviews</h1>
        <p>All student reviews across classes on SKOR+.</p>
        <ul className={styles.reviews} aria-label="All user reviews">
          {allReviews.map((review) => (
            <li key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                {review.photoUrl ? (
                  <img src={review.photoUrl} alt="" className={styles.reviewAvatar} />
                ) : (
                  <div className={styles.reviewAvatarFallback} aria-hidden="true">
                    {(review.name?.[0] || 'S').toUpperCase()}
                  </div>
                )}
                <div className={styles.reviewAuthor}>
                  <h3>{review.name}</h3>
                  {(review.username || review.meta) && (
                    <span className={styles.reviewMeta}>
                      {[review.username, review.meta].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
              </div>
              <p className={styles.reviewMessage}>{review.message}</p>
            </li>
          ))}
        </ul>
      </main>

      <button
        type="button"
        className={styles.fab}
        onClick={openReviewModal}
        aria-label="Write a review"
        title="Write a review"
      >
        <Plus size={24} aria-hidden="true" />
      </button>

      {modalOpen && (
        <div className={styles.modalBackdrop} onClick={closeReviewModal}>
          <section
            className={styles.modalSheet}
            role="dialog"
            aria-modal="true"
            aria-label="Write a review"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalTopBar}>
              <span className={styles.modalTitle}>Write a Review</span>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeReviewModal}
                disabled={busy}
                aria-label="Close review form"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {renderFormContent(true)}
          </section>
        </div>
      )}
    </div>
  );
}
