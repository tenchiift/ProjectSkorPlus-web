import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Bug, ImagePlus, X } from 'lucide-react';
import SlideToSend from './SlideToSend';
import {
  BUG_CATEGORIES,
  BUG_SEVERITIES,
  MAX_SCREENSHOT_BYTES,
  submitBugReport,
} from '../services/bugReportService';
import styles from './ReportBugModal.module.css';

// Global bug-report popup. Opened from the sidebar via the
// 'open-report-bug' custom event (see AppLayout).
export default function ReportBugModal({ open, onClose }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('ui');
  const [severity, setSeverity] = useState('medium');
  const [details, setDetails] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
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
      await submitBugReport({ title, category, severity, details, file });
      setSent(true);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Submit bug report error:', err);
      setError(err.message || 'Failed to send. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
    <motion.div key="report-bug" className={styles.overlay} onClick={handleClose} {...overlay}>
      <motion.div
        className={styles.content}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Report a bug"
        {...panel}
      >
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.iconWrap}>
              <Bug size={20} color="#FFFFFF" />
            </span>
            <div>
              <h3 className={styles.title}>Report a Bug</h3>
              <p className={styles.sub}>Tell us what went wrong. We read every report.</p>
            </div>
          </div>
          <button className={styles.close} onClick={handleClose} aria-label="Close">
            <X size={20} color="var(--color-text-primary)" />
          </button>
        </div>

        <div className={styles.body}>
          {sent ? (
            <div className={styles.success} role="status">
              <p className={styles.successTitle}>Report sent. Thank you.</p>
              <p className={styles.successSub}>Our team will look into it.</p>
            </div>
          ) : (
            <>
              <div className={styles.group}>
                <label className={styles.label} htmlFor="bug-title">Title</label>
                <input
                  id="bug-title"
                  className={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Tasks page goes blank on refresh"
                  maxLength={120}
                />
              </div>

              <div className={styles.row2}>
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
                <div className={styles.group}>
                  <label className={styles.label} htmlFor="bug-severity">Severity</label>
                  <select
                    id="bug-severity"
                    className={styles.input}
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    {BUG_SEVERITIES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.group}>
                <label className={styles.label} htmlFor="bug-details">Details</label>
                <textarea
                  id="bug-details"
                  className={`${styles.input} ${styles.textarea}`}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="What happened, step by step? What did you expect instead?"
                  rows={4}
                />
              </div>

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

              {error && <p className={styles.error} role="alert">{error}</p>}

              <SlideToSend
                busy={busy}
                disabled={!title.trim() || busy}
                onComplete={handleSend}
              >
                Slide to send report
              </SlideToSend>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
