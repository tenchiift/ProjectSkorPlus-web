import { useEffect } from 'react';
import ClassInput from './ClassInput';
import styles from './ClassPrompt.module.css';

// One-time prompt for students whose profile predates class codes.
// Shown once per session until they save; dismissing asks again next login.
export default function ClassPrompt({
  value,
  onChange,
  confirming,
  onContinue,
  onConfirm,
  onCancel,
  saving = false,
  error = '',
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Tell us your class"
      >
        <h2 className={styles.title}>What class are you in?</h2>
        <p className={styles.sub}>
          One quick question so your semester is always right.
        </p>
        <ClassInput
          id="prompt-class-code"
          value={value}
          onChange={onChange}
          confirming={confirming}
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
        {error && <p className={styles.error} role="alert">{error}</p>}
        {!confirming && (
          <button type="button" className={styles.continueBtn} onClick={onContinue} disabled={saving}>
            Continue
          </button>
        )}
        {saving && <p className={styles.sub}>Saving...</p>}
      </div>
    </div>
  );
}
