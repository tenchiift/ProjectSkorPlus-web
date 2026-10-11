import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bug, ImagePlus, Lightbulb, ThumbsUp, X } from 'lucide-react';
import SlideToSend from './SlideToSend';
import {
  BUG_CATEGORIES,
  BUG_STATUSES,
  MAX_SCREENSHOT_BYTES,
  listMyIdeas,
  submitBugReport,
  submitIdea,
} from '../services/bugReportService';
import styles from './ReportBugModal.module.css';

// Global bug-report popup. Opened from the sidebar via the
// 'open-report-bug' custom event (see AppLayout). With mode="idea" it
// becomes the suggestion box (two panels: form + My ideas), opened via
// 'open-suggest-idea'.
const ideaStatusLabel = (status) =>
  BUG_STATUSES.find((s) => s.value === status)?.label ?? status;

export default function ReportBugModal({ open, onClose, mode = 'bug' }) {
  const isIdea = mode === 'idea';
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ui');
  const [severity, setSeverity] = useState('medium');
  const [details, setDetails] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideaView, setIdeaView] = useState('form');
  const fileRef = useRef(null);
  const rm = useReducedMotion();

  // Bottom-sheet spring — same as the AI Chats sheet (AiChatScreen Sheet).
  const overlay = rm
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.18, ease: 'easeOut' },
      };
  const panel = rm
    ? {}
    : {
        initial: { y: 64, opacity: 0, scale: 0.97 },
        animate: { y: 0, opacity: 1, scale: 1 },
        exit: { y: 40, opacity: 0, scale: 0.98 },
        transition: { type: 'spring', stiffness: 320, damping: 30 },
      };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview ]);

  // Suggestion box: fresh form first, plus the student's own ideas.
  useEffect(() => {
    if (!open || !isIdea) return;
    setIdeaView('form');
    setIdeasLoading(true);
    listMyIdeas()
      .then(setIdeas)
      .catch(() => setIdeas([]))
      .finally(() => setIdeasLoading(false));
  }, [open, isIdea]);

  const pickFile = (picked) => {
    setError('');
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError('Screenshot must be an image file.');
      return;
    }
    if (picked.size > MAX_SCREENSHOT_BYTES) {
      setError('Screenshot must be under 5MB.');
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const clearFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const resetForm = () => {
    setTitle('');
    setCategory('ui');
    setSeverity('medium');
    setDetails('');
    clearFile();
    setError('');
    setSent(false);
  };

  const handleClose = () => {
    if (busy) return;
    resetForm();
    onClose();
  };

  const handleSend = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (isIdea) {
        await submitIdea({ title, details, file });
        setIdeas(await listMyIdeas().catch(() => ideas));
      } else {
        await submitBugReport({ title, category, severity, details, file });
      }
      setSent(true);
      setTimeout(() => {
        resetForm();
        // Ideas stay open and land on the list; bug reports close as before.
        if (isIdea) setIdeaView('ideas');
        else onClose();
      }, 1400);
    } catch (err) {
      console.error('Submit bug report error:', err);
      setError(err.message || 'Failed to send. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Shared field pieces used by both modes.
  const titleField = (
    <div className={styles.group}>
      <label className={styles.label} htmlFor="bug-title">Title</label>
      <input
        id="bug-title"
        className={styles.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={isIdea ? 'e.g. Dark mode for study pages' : undefined}
        maxLength={120}
      />
    </div>
  );

  const detailsField = (
    <div className={styles.group}>
      <label className={styles.label} htmlFor="bug-details">Details</label>
      <textarea
        id="bug-details"
        className={`${styles.input} ${styles.textarea}`}
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder={isIdea ? 'Describe the feature and why it helps your studies.' : undefined}
        rows={4}
      />
    </div>
  );

  const sendControl = (
    <>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <SlideToSend
        busy={busy}
        disabled={!title.trim() || busy}
        onComplete={handleSend}
      >
        {isIdea ? 'Slide to send idea' : 'Slide to send report'}
      </SlideToSend>
    </>
  );

  const ideasPanel = (
    <div className={styles.ideasBlock}>
      {ideasLoading ? (
        <p className={styles.ideasEmpty}>Loading your ideas...</p>
      ) : ideas.length === 0 ? (
        <p className={styles.ideasEmpty}>No ideas yet. Your suggestions will appear here.</p>
      ) : (
        ideas.map((idea) => (
          <div key={idea.id} className={styles.ideaRow}>
            <span className={styles.ideaTitle}>{idea.title}</span>
            <span className={styles.ideaMeta}>
              <span className={`${styles.statusPill} ${styles[`status_${idea.status}`] || ''}`}>
                {ideaStatusLabel(idea.status)}
              </span>
                            <span className={styles.voteBadge}>
                              <ThumbsUp size={12} />
                              <span className={styles.voteLabel}>Votes</span>
                              {idea.voteCount ?? 0}
                            </span>
            </span>
          </div>
        ))
      )}
    </div>
  );

  const successPanel = (
    <div className={styles.success} role="status">
      <p className={styles.successTitle}>{isIdea ? 'Idea sent. Thank you.' : 'Report sent. Thank you.'}</p>
      <p className={styles.successSub}>
        {isIdea ? 'We read every idea.' : 'Our team will look into it.'}
      </p>
    </div>
  );

  const closeButton = (
    <button className={styles.close} onClick={handleClose} aria-label="Close">
      <X size={20} color="var(--color-text-primary)" />
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
      <motion.div key="report-bug" className={styles.overlay} onClick={handleClose} {...overlay}>
        <motion.div
          className={styles.content}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={isIdea ? 'Suggest a feature' : 'Report a bug'}
          {...panel}
        >
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <span className={styles.iconWrap}>
                {isIdea ? <Lightbulb size={20} color="#FFFFFF" /> : <Bug size={20} color="#FFFFFF" />}
              </span>
              <div>
                <h3 className={styles.title}>{isIdea ? 'Suggest a Feature' : 'Report a Bug'}</h3>
                <p className={styles.sub}>
                  {isIdea
                    ? 'Tell us what you want. Every idea reaches the team.'
                    : 'Tell us what went wrong. We read every report.'}
                </p>
              </div>
            </div>
            {closeButton}
          </div>
          <div className={styles.body}>
            {sent ? successPanel : isIdea ? (
              <>
                <div className={styles.segWrap} role="tablist" aria-label="Suggestion views">
                  {[
                    { value: 'form', label: 'New Idea' },
                    { value: 'ideas', label: `My Ideas${ideas.length > 0 ? ` (${ideas.length})` : ''}` },
                  ].map((tab) => {
                    const active = ideaView === tab.value;
                    return (
                      <button
                        key={tab.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`${styles.segBtn} ${active ? styles.segActive : ''}`}
                        onClick={() => setIdeaView(tab.value)}
                      >
                        {active && (
                          <motion.span
                            layoutId="idea-seg-pill"
                            className={styles.segPill}
                            transition={rm ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
                          />
                        )}
                        <span className={styles.segLabel}>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div className={styles.ideaViews}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={ideaView}
                      initial={rm ? { opacity: 0 } : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={rm ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={rm ? { duration: 0.12 } : { type: 'spring', stiffness: 380, damping: 34 }}
                    >
                      {ideaView === 'form' ? (
                        <div className={styles.ideaForm}>
                          {titleField}
                          {detailsField}
                          {sendControl}
                        </div>
                      ) : ideasPanel}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                {titleField}
                  <div className={styles.group}>
                    <label className={styles.label} htmlFor="bug-category">Category</label>
                    <select
                      id="bug-category"
                      className={styles.input}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {BUG_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  {detailsField}
                <div className={styles.group}>
                  <span className={styles.label}>Screenshot (optional)</span>
                  {preview ? (
                    <div className={styles.previewWrap}>
                      <img src={preview} alt="Bug screenshot preview" className={styles.preview} />
                      <button type="button" className={styles.removeShot} onClick={clearFile}>
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button type="button" className={styles.shotBtn} onClick={() => fileRef.current?.click()}>
                      <ImagePlus size={18} color="var(--color-text-secondary)" />
                      <span>Add a screenshot</span>
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className={styles.hidden}
                    onChange={(e) => pickFile(e.target.files?.[0])}
                  />
                </div>
                {sendControl}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
