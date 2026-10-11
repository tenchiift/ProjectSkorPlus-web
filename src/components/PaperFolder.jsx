import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import styles from './PaperFolder.module.css';

const SPRING = { type: 'spring', stiffness: 280, damping: 28 };
const PAGE_COLORS = ['#3D9970', '#E5B878', '#A8D4F0', '#C0AEE8', '#B3A983'];

function pageColor(id) {
  let hash = 0;
  for (const character of String(id)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return PAGE_COLORS[hash % PAGE_COLORS.length];
}

function PaperFace({ paper, className }) {
  return (
    <span className={`${styles.document} ${className}`} style={{ backgroundColor: pageColor(paper.id) }} aria-hidden="true">
      <span className={styles.documentTab} />
      <span className={styles.documentLine} />
      <span className={styles.documentLine} />
      <span className={styles.documentLetter}>{Array.from(paper.title?.trim() || 'Paper')[0].toLocaleUpperCase()}</span>
    </span>
  );
}

export default function PaperFolder({ title, papers, onSelect, renderActions, onAdd, addLabel }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const trigger = useRef(null);
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const restoring = useRef(false);
  const leaveTimer = useRef(null);
  const id = useId();
  const reduced = useReducedMotion();
  const transition = reduced ? { duration: 0 } : SPRING;
  const previews = papers.slice(0, 5);
  const open = hovered || focused || expanded;
  const count = `${papers.length} ${papers.length === 1 ? 'paper' : 'papers'}`;

  useEffect(() => {
    if (!expanded) return;
    const element = dialog.current;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      restoring.current = true;
      trigger.current?.focus();
      restoring.current = false;
    };
  }, [expanded]);

  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  // Fade the panel out before unmounting so closing never snaps.
  const close = () => {
    if (leaving) return;
    if (reduced) {
      setExpanded(false);
      setHovered(false);
      setFocused(false);
      return;
    }
    setLeaving(true);
    leaveTimer.current = setTimeout(() => {
      setLeaving(false);
      setExpanded(false);
      setHovered(false);
      setFocused(false);
    }, 180);
  };

  return (
    <LayoutGroup id={id}>
      <motion.button
        ref={trigger}
        type="button"
        className={styles.folder}
        aria-label={`${title}, ${count}`}
        aria-haspopup="dialog"
        aria-expanded={expanded}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => { if (!restoring.current) setFocused(true); }}
        onBlur={() => setFocused(false)}
        onClick={() => setExpanded(true)}
        whileTap={reduced ? undefined : { scale: 0.98 }}
      >
        <motion.span className={styles.back} animate={{ rotateX: open && !reduced ? 15 : 0 }} transition={transition} />
        <span className={styles.fan} aria-hidden="true">
          {!expanded && previews.map((paper, index) => {
            const offset = index - (previews.length - 1) / 2;
            const distance = Math.abs(offset);
            const lift = Math.max(0, 2 - distance) * 8;
            const scale = distance === 0 ? 1.04 : distance === 1 ? 0.95 : 0.88;
            const opacity = distance === 0 ? 1 : distance === 1 ? 0.78 : 0.58;
            const spread = open && !reduced;
            return (
              <motion.span
                key={paper.id}
                layoutId={`paper-${paper.id}`}
                className={styles.preview}
                animate={{
                  x: offset * 44 * (spread ? 1.4 : 1),
                  y: 8 - lift - (spread ? 8 : 0),
                  rotate: offset * 6 * (spread ? 1.3 : 1),
                  scale: scale * (spread ? 1.02 : 1),
                  opacity: spread ? Math.min(1, opacity + 0.18) : opacity,
                }}
                style={{ zIndex: 10 - distance }}
                transition={transition}
              >
                <PaperFace paper={paper} className={styles.colorPage} />
              </motion.span>
            );
          })}
        </span>
        <motion.span className={styles.front} animate={{ rotateX: open && !reduced ? -25 : 0 }} transition={transition}>
          <span className={styles.title}>{title}</span>
          <span className={styles.summary}>{count}<span>View papers</span></span>
        </motion.span>
      </motion.button>

      {expanded && createPortal(
        <dialog
          ref={dialog}
          className={styles.dialog}
          aria-labelledby={`${id}-title`}
          onCancel={(event) => { event.preventDefault(); close(); }}
          onClick={(event) => { if (event.target === event.currentTarget) close(); }}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={leaving ? { opacity: 0, y: 8, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
            transition={reduced ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
          >
            <header className={styles.header}>
              <div><h2 id={`${id}-title`}>{title}</h2><p>{count}</p></div>
              <button ref={closeButton} type="button" className={styles.close} onClick={close} aria-label={`Close ${title}`}><X size={22} /></button>
            </header>
            <div className={styles.papers}>
              {papers.length === 0 ? (
                <div className={styles.emptyPapers}>
                  <p>No papers in this folder yet.</p>
                  {onAdd && (
                    <button type="button" className={styles.addBtn} onClick={() => { close(); onAdd(); }}>
                      {addLabel || 'Add paper to this folder'}
                    </button>
                  )}
                </div>
              ) : (
                papers.map((paper, index) => (
                  <div key={paper.id} className={styles.paperWrap}>
                    <motion.button
                      layoutId={index < 5 ? `paper-${paper.id}` : undefined}
                      transition={transition}
                      className={styles.paper}
                      type="button"
                      onClick={() => { close(); onSelect(paper); }}
                    >
                      <PaperFace paper={paper} className={styles.page} />
                      <span className={styles.paperTitle}>{paper.title}</span>
                      <span className={styles.meta}>{[paper.semester, paper.year].filter(Boolean).join(' · ')}</span>
                    </motion.button>
                    {renderActions && (
                      <div className={styles.paperActions}>
                        {renderActions(paper, close)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {papers.length > 0 && onAdd && (
              <div className={styles.dialogFooter}>
                <button type="button" className={styles.addBtn} onClick={() => { close(); onAdd(); }}>
                  {addLabel || 'Add paper to this folder'}
                </button>
              </div>
            )}
          </motion.div>
        </dialog>, document.body,
      )}
    </LayoutGroup>
  );
}
