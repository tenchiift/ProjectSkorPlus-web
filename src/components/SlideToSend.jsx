import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import styles from './SlideToSend.module.css';

// Slide-to-send button (ported from the beui expanding-arrow-button idea
// to this repo's CSS-module + theme-token style — no Tailwind, no @/lib).
// Drag the thumb past the threshold (or press Enter/Space on it) to fire.
export default function SlideToSend({
  children = 'Slide to send',
  completeLabel = 'Sent',
  threshold = 0.82,
  resetDelay = 1600,
  disabled = false,
  busy = false,
  onComplete,
}) {
  const reduce = useReducedMotion();
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const resetTimerRef = useRef(null);
  const completedRef = useRef(false);
  const x = useMotionValue(0);
  const [maxDistance, setMaxDistance] = useState(0);
  const [completed, setCompleted] = useState(false);
  const safeDistance = Math.max(maxDistance, 1);
  const fillProgress = useTransform(x, [0, safeDistance], [0, 1]);
  const labelOpacity = useTransform(
    x,
    [0, safeDistance * 0.35, safeDistance * 0.65],
    [1, 0.75, 0],
  );

  useLayoutEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;
    const measure = () => {
      setMaxDistance(Math.max(track.clientWidth - thumb.clientWidth - 8, 0));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    observer.observe(thumb);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const moveTo = (target) => {
    if (reduce) {
      x.set(target);
      return;
    }
    animate(x, target, { type: 'spring', stiffness: 400, damping: 32 });
  };

  const reset = () => {
    completedRef.current = false;
    setCompleted(false);
    moveTo(0);
  };

  const complete = () => {
    if (completedRef.current || disabled || busy || maxDistance === 0) return;
    completedRef.current = true;
    setCompleted(true);
    moveTo(maxDistance);
    onComplete?.();
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(reset, resetDelay);
  };

  const locked = disabled || busy || completed;

  return (
    <div ref={trackRef} className={styles.track}>
      <motion.span aria-hidden="true" style={{ scaleX: fillProgress }} className={styles.fill} />
      <motion.span aria-hidden="true" style={{ opacity: labelOpacity }} className={styles.label}>
        {busy ? 'Sending...' : children}
      </motion.span>
      <motion.span
        aria-live="polite"
        animate={{ opacity: completed ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.15 }}
        className={styles.doneLabel}
      >
        {completed ? completeLabel : null}
      </motion.span>
      <motion.button
        ref={thumbRef}
        type="button"
        aria-label={typeof children === 'string' ? children : 'Slide to send'}
        disabled={locked}
        drag={locked ? false : 'x'}
        dragConstraints={{ left: 0, right: maxDistance }}
        dragElastic={0}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={() => {
          if (x.get() >= maxDistance * threshold) complete();
          else moveTo(0);
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          complete();
        }}
        whileTap={reduce || locked ? undefined : { scale: 0.94 }}
        className={`${styles.thumb} ${completed ? styles.thumbDone : ''}`}
      >
        {busy ? (
          <Loader2 size={20} className={styles.spin} />
        ) : completed ? (
          <Check size={20} />
        ) : (
          <ArrowRight size={20} />
        )}
      </motion.button>
    </div>
  );
}
