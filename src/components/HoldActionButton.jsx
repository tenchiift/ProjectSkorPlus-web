import { motion, useReducedMotion } from 'motion/react';
import { forwardRef, useRef, useState } from 'react';
import styles from './HoldActionButton.module.css';

// ── Inlined beui lib helpers (lib/ease, lib/touch, lib/utils) ──
const EASE_OUT = [0.22, 1, 0.36, 1];
const SPRING_PRESS = { type: 'spring', stiffness: 500, damping: 32 };

function capturePointer(el, pointerId) {
  try {
    if (el?.hasPointerCapture?.(pointerId)) return;
    el?.setPointerCapture?.(pointerId);
  } catch { /* refusal must not kill the hold */ }
}

function releasePointer(el, pointerId) {
  try {
    if (el?.hasPointerCapture?.(pointerId)) el.releasePointerCapture(pointerId);
  } catch { /* ignore */ }
}

/**
 * Hold-to-confirm action button (ported from beui hold-action-button).
 * Press and hold for `holdDuration` ms to fire `onHoldComplete`.
 */
export const HoldActionButton = forwardRef(function HoldActionButton(
  {
    children,
    type = 'vertical',
    holdingLabel = 'Keep holding',
    completeLabel = 'Done',
    holdDuration = 1600,
    onHoldComplete,
    fillClassName = '',
    labelClassName = '',
    className = '',
    disabled,
    ...rest
  },
  ref,
) {
  const reduce = useReducedMotion();
  const completedRef = useRef(false);
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState(false);

  const startHold = () => {
    if (disabled || holding) return;
    completedRef.current = false;
    setCompleted(false);
    setHolding(true);
  };

  const cancelHold = () => {
    setHolding(false);
    setCompleted(false);
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    startHold();
    capturePointer(event.currentTarget, event.pointerId);
  };

  const handlePointerUp = (event) => {
    releasePointer(event.currentTarget, event.pointerId);
    cancelHold();
  };

  const handlePointerLeave = (event) => {
    if (event.pointerType !== 'touch') cancelHold();
  };

  const handlePointerMove = (event) => {
    if (!holding) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;
    if (outside) cancelHold();
  };

  const handleKeyDown = (event) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault();
      startHold();
    }
  };

  const handleKeyUp = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      cancelHold();
    }
  };

  const handleFillComplete = () => {
    if (!holding || completedRef.current) return;
    completedRef.current = true;
    setCompleted(true);
    onHoldComplete?.();
  };

  const active = holding || completed;
  const activeTransform = type === 'horizontal' ? 'translateX(0%)' : 'translateY(0%)';
  const idleTransform = type === 'horizontal' ? 'translateX(-100%)' : 'translateY(115%)';

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-label={typeof children === 'string' ? children : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelHold}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onContextMenu={(event) => event.preventDefault()}
      whileTap={reduce || disabled ? undefined : { scale: 0.98 }}
      transition={SPRING_PRESS}
      className={`${styles.hold} ${active ? styles.holdActive : ''} ${className}`}
      style={{ '--hold-duration': `${holdDuration}ms` }}
      {...rest}
    >
      <span aria-hidden="true" className={styles.clip}>
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={
            reduce
              ? { opacity: active ? 1 : 0, transform: 'none' }
              : { opacity: 1, transform: active ? activeTransform : idleTransform }
          }
          transition={
            active
              ? { duration: holdDuration / 1000, ease: 'linear' }
              : { duration: reduce ? 0.15 : 0.24, ease: EASE_OUT }
          }
          onAnimationComplete={handleFillComplete}
          className={`${styles.fill} ${fillClassName}`}
        >
          {!reduce ? (
            type === 'horizontal' ? (
              <motion.svg
                viewBox="0 0 24 240"
                preserveAspectRatio="none"
                aria-hidden="true"
                animate={{ transform: active ? 'translateY(-50%)' : 'translateY(0%)' }}
                transition={{ duration: 1.1, ease: 'linear', repeat: active ? Number.POSITIVE_INFINITY : 0 }}
                className={styles.waveH}
              >
                <path
                  d="M0 0h12C2 20 2 40 12 60s10 40 0 60-10 40 0 60 10 40 0 60H0Z"
                  fill="currentColor"
                />
              </motion.svg>
            ) : (
              <motion.svg
                viewBox="0 0 240 24"
                preserveAspectRatio="none"
                aria-hidden="true"
                animate={{ transform: active ? 'translateX(-50%)' : 'translateX(0%)' }}
                transition={{ duration: 1.1, ease: 'linear', repeat: active ? Number.POSITIVE_INFINITY : 0 }}
                className={styles.waveV}
              >
                <path
                  d="M0 12C20 2 40 2 60 12s40 10 60 0 40-10 60 0 40 10 60 0v12H0Z"
                  fill="currentColor"
                />
              </motion.svg>
            )
          ) : null}
        </motion.span>
      </span>

      <span className={`${styles.label} ${labelClassName}`}>
        <motion.span
          animate={{ opacity: active ? 0 : 1 }}
          transition={{ duration: reduce ? 0 : 0.12, ease: EASE_OUT }}
          className={styles.labelSwap}
        >
          {children}
        </motion.span>
        <motion.span
          aria-hidden={!holding || completed}
          animate={{ opacity: holding && !completed ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.12, ease: EASE_OUT }}
          className={styles.labelSwap}
        >
          {holdingLabel}
        </motion.span>
        <motion.span
          aria-hidden={!completed}
          animate={{ opacity: completed ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.12, ease: EASE_OUT }}
          className={styles.labelSwap}
        >
          {completeLabel}
        </motion.span>
      </span>
    </motion.button>
  );
});
