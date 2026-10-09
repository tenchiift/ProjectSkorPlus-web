import { motion, useReducedMotion } from 'motion/react';
import styles from './ClassTabs.module.css';

// Morphing class-filter tabs (simplified port of the beui morphing-tabs
// idea: an animated pill glides to the active tab — no drag-reorder,
// no close buttons, which don't fit a class filter).
// tabs: [{ value, label, count }], value: active tab value.
export default function ClassTabs({ tabs, value, onChange }) {
  const reduce = useReducedMotion();
  return (
    <div className={styles.row} role="tablist" aria-label="Filter by class">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => onChange(t.value)}
          >
            {active && (
              <motion.span
                layoutId="class-tab-pill"
                className={styles.pill}
                transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <span className={styles.tabText}>{t.label}</span>
            {typeof t.count === 'number' && (
              <span className={styles.tabCount}>{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
