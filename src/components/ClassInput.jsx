import { parseClassCode } from '../utils/parseClass';
import styles from './ClassInput.module.css';

// Shared class-code field: input, live semester hint, invalid-format error,
// and the "You're on Semester X, right?" confirmation step.
// Parents own the value and the confirming state; this component only renders.
export default function ClassInput({
  id = 'class-code',
  value,
  onChange,
  inputError = '',
  confirming = null,
  onConfirm,
  onCancel,
}) {
  const parsed = parseClassCode(value);

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>Class</label>
      <input
        id={id}
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. DCS 4B"
        autoCapitalize="characters"
        autoComplete="off"
      />
      {!inputError && parsed && (
        <p className={styles.hint}>{parsed.semesterLabel}</p>
      )}
      {inputError && <p className={styles.error} role="alert">{inputError}</p>}

      {confirming && (
        <div className={styles.confirmBox} role="dialog" aria-label="Confirm your semester">
          <p className={styles.confirmTitle}>
            You are in {confirming.canonical}. You are on {confirming.semesterLabel}, right?
          </p>
          <div className={styles.confirmRow}>
            <button type="button" className={styles.confirmYes} onClick={onConfirm}>
              Yes, that is me
            </button>
            <button type="button" className={styles.confirmNo} onClick={onCancel}>
              No, fix it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
