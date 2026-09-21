import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Camera, ImageIcon, ChevronDown, Sparkles, X, History, Trash2, Clock } from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';
import { BorderBeam } from 'border-beam';
import { ImageGeneration } from 'img-fx';
import { solveQuestion } from '../services/aiService';
import { stripMarkdown } from '../utils/plainText';
import styles from './ScanSolveScreen.module.css';

const HISTORY_KEY = 'skorplus-scan-history';
const HISTORY_LIMIT = 10;

function resizeImage(file, maxWidth = 1024) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      try {
        // dataURL persists in localStorage (objectURLs die on reload)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        URL.revokeObjectURL(img.src);
        resolve(dataUrl);
      } catch {
        resolve(img.src);
      }
    };
    img.onerror = () => resolve(URL.createObjectURL(file));
    img.src = URL.createObjectURL(file);
  });
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Bottom pop-out sheet — same spring as AI Chats sheet (AiChatScreen Sheet).
function BottomSheet({ onClose, children }) {
  const rm = useReducedMotion();
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
  return (
    <motion.div className={styles.sheetOverlay} onClick={onClose} {...overlay}>
      <motion.div className={styles.sheet} onClick={(e) => e.stopPropagation()} {...panel}>
        {children}
      </motion.div>
    </motion.div>
  );
}

// Top solving sheet — drops from top, covers ~70% viewport, same spring family.
function TopSheet({ onClose, children }) {
  const rm = useReducedMotion();
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
        initial: { y: '100%', opacity: 0.6, scale: 0.98 },
        animate: { y: 0, opacity: 1, scale: 1 },
        exit: { y: '100%', opacity: 0, scale: 0.98 },
        transition: { type: 'spring', stiffness: 320, damping: 30 },
      };
  return (
    <motion.div className={styles.topSheetOverlay} onClick={onClose} {...overlay}>
      <motion.div className={styles.topSheet} onClick={(e) => e.stopPropagation()} {...panel}>
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function ScanSolveScreen() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [solvingOpen, setSolvingOpen] = useState(false);
  const [problemDesc, setProblemDesc] = useState('');
  const [history, setHistory] = useState([]);
  const galleryRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const persistHistory = (next) => {
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next.slice(0, HISTORY_LIMIT)));
    } catch { /* quota full — keep in-memory only */ }
  };

  const handleGallery = () => {
    galleryRef.current?.click();
  };

  const handleCamera = () => {
    cameraRef.current?.click();
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    try {
      const resized = await resizeImage(file);
      setImage(resized);
    } catch {
      setImage(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const handleSolve = async () => {
    if (!image || loading) return;
    setLoading(true);
    setResult('loading');
    setSolvingOpen(true);
    try {
      const context = problemDesc.trim() || undefined;
      const aiResponse = await solveQuestion(image, context);
      setResult(aiResponse);
      const entry = {
        id: `${Date.now()}`,
        image,
        paperId: null,
        paperLabel: 'General solve',
        desc: problemDesc.trim().slice(0, 140),
        result: (aiResponse || '').slice(0, 500),
        createdAt: new Date().toISOString(),
      };
      persistHistory([entry, ...history].slice(0, HISTORY_LIMIT));
    } catch (err) {
      setResult('Error: ' + (err.message || 'Failed to solve. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (entry) => {
    setImage(entry.image || null);
    setProblemDesc(entry.desc || '');
    setResult(entry.result || null);
    setPickerOpen(false);
    // Reopen the 70% sheet with the stored image + solution
    setSolvingOpen(true);
  };

  const handleDeleteHistory = (id) => {
    persistHistory(history.filter((h) => h.id !== id));
  };

  const handleClearHistory = () => {
    persistHistory([]);
  };

  const getTriggerLabel = () => {
    if (history.length === 0) return 'Recent scans';
    return `Recent scans (${history.length})`;
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>Scan &amp; Solve</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.scrollContent}>
        <button className={styles.dropdown} onClick={() => setPickerOpen(true)}>
          <History size={18} color="var(--color-text-secondary)" />
          <span className={styles.dropdownText}>
            {getTriggerLabel()}
          </span>
          <ChevronDown size={18} color="var(--color-text-secondary)" />
        </button>

        <div className={styles.imageArea} onClick={handleCamera} role="button" tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCamera(); }}
          aria-label="Take a photo with camera">
          {image ? (
            <div className={styles.imagePreview}>
              {reducedMotion ? (
                <img src={image} className={styles.imagePreviewImg} alt="Question" />
              ) : (
                <ImageGeneration
                  preset="pixels-organic"
                  images={[image]}
                  autoReveal
                  theme="auto"
                  className={styles.revealWrap}
                >
                  <img src={image} className={styles.imagePreviewImg} alt="Question" />
                </ImageGeneration>
              )}
              <button
                className={styles.clearImage}
                onClick={(e) => { e.stopPropagation(); setImage(null); setResult(null); }}
                aria-label="Remove image"
              >
                <X size={18} color="#FFFFFF" />
              </button>
            </div>
          ) : (
            <div className={styles.loaderWrap}>
              {reducedMotion ? (
                <div className={styles.imagePlaceholder}>
                  <Camera size={48} color="var(--color-text-secondary)" />
                  <span className={styles.imagePlaceholderText}>Snap a photo of your question</span>
                  <span className={styles.imagePlaceholderHint}>or choose from gallery</span>
                </div>
              ) : (
                <>
                  <ImageGeneration
                    preset="pixels-organic"
                    images={[]}
                    autoReveal
                    theme="auto"
                    className={styles.loaderFx}
                  >
                    <div className={styles.loaderCard} />
                  </ImageGeneration>
                  <div className={styles.loaderText}>
                    <Camera size={40} color="var(--color-text-secondary)" />
                    <span className={styles.imagePlaceholderText}>Snap a photo of your question</span>
                    <span className={styles.imagePlaceholderHint}>or choose from gallery</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className={styles.problemBox}>
          <span className={styles.problemLabel}>Describe your problem</span>
          <textarea
            className={styles.problemInput}
            value={problemDesc}
            onChange={(e) => setProblemDesc(e.target.value)}
            placeholder="What are you trying to solve? Add context so the AI can help better..."
            rows={5}
          />
        </div>

        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFilePicked}
        />

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFilePicked}
        />

        <button className={styles.actionBtnFull} onClick={handleGallery}>
          <ImageIcon size={20} color="var(--color-primary)" />
          <span className={styles.actionBtnText}>Gallery</span>
        </button>

        {/* Dark-only beam wrapper so the beam pops in any theme */}
        <BorderBeam
          size="pulse-outside"
          colorVariant="colorful"
          theme="dark"
          duration={2.0}
          brightness={2}
          saturation={1.8}
          hueRange={90}
          strength={1}
          className={styles.solveBeam}
        >
          <button
            className={`${styles.solveBtn} ${!image ? styles.solveBtnDisabled : ''}`}
            onClick={handleSolve}
            disabled={!image || loading}
          >
            {loading ? (
              <div className={styles.spinner} />
            ) : (
              <>
                <Sparkles size={20} color="#FFFFFF" />
                <span className={styles.solveBtnText}>Solve</span>
              </>
            )}
          </button>
        </BorderBeam>
      </div>

      {/* Recent scans picker */}
      <AnimatePresence>
        {pickerOpen && (
          <BottomSheet key="picker" onClose={() => setPickerOpen(false)}>
            <div className={styles.dropdownHeader}>
              <h3 className={styles.dropdownTitle}>Recent scans</h3>
              <button className={styles.modalClose} onClick={() => setPickerOpen(false)} aria-label="Close">
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>

            {history.length > 0 ? (
              <>
                <div className={styles.sectionRow}>
                  <span className={styles.sectionLabel}>
                    <History size={14} color="var(--color-text-secondary)" /> Your past solves
                  </span>
                  <button className={styles.clearHistory} onClick={handleClearHistory}>
                    Clear
                  </button>
                </div>
                <div className={styles.recentList}>
                  {history.map((h) => (
                    <div key={h.id} className={styles.recentItem}>
                      <button className={styles.recentMain} onClick={() => handleSelectHistory(h)}>
                        {h.image ? (
                          <img src={h.image} className={styles.recentThumb} alt="" />
                        ) : (
                          <div className={styles.recentThumbEmpty}>
                            <Clock size={16} color="var(--color-text-secondary)" />
                          </div>
                        )}
                        <span className={styles.recentText}>
                          <span className={styles.recentLabel}>{h.paperLabel || 'General solve'}</span>
                          {h.desc ? (
                            <span className={styles.recentDesc}>{h.desc}</span>
                          ) : null}
                          <span className={styles.recentDate}>{formatDate(h.createdAt)}</span>
                        </span>
                      </button>
                      <button
                        className={styles.recentDelete}
                        onClick={() => handleDeleteHistory(h.id)}
                        aria-label="Delete history item"
                      >
                        <Trash2 size={15} color="var(--color-text-secondary)" />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className={styles.emptyHistory}>No scans yet — snap a question to get started.</p>
            )}
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* Solving sheet from bottom (~70% screen) */}
      <AnimatePresence>
        {solvingOpen && (
          <TopSheet key="solving" onClose={() => { if (!loading) setSolvingOpen(false); }}>
            <div className={styles.topHandle} />
            <div className={styles.dropdownHeader}>
              {loading || result === 'loading' ? (
                <span />
              ) : (
                <h3 className={styles.dropdownTitle}>AI Solution</h3>
              )}
              <button
                className={styles.modalClose}
                onClick={() => { if (!loading) setSolvingOpen(false); }}
                aria-label="Close"
                disabled={loading}
                style={loading ? { opacity: 0.4 } : undefined}
              >
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            {image && (
              <div className={styles.topThumbWrap}>
                <img src={image} className={styles.topThumb} alt="Question" />
              </div>
            )}
            {loading || result === 'loading' ? (
              <div className={styles.solvingLoading}>
                <p className={styles.solvingShimmer}>
                  <span className={styles.shimmer} data-text="Solving…">Solving…</span>
                </p>
                <ThinkingOrb state="composing" size={64} />
                <p className={styles.solvingText}>AI is reading your question…</p>
              </div>
            ) : result && result.startsWith('Error:') ? (
              <div className={styles.topResult}>
                <p className={styles.resultText}>{stripMarkdown(result)}</p>
                <button className={styles.topCloseBtn} onClick={handleSolve} disabled={loading}>
                  Retry
                </button>
                <button className={styles.topGhostBtn} onClick={() => setSolvingOpen(false)}>
                  Close
                </button>
              </div>
            ) : (
              <div className={styles.topResult}>
                <p className={styles.resultText}>{stripMarkdown(result)}</p>
                <button className={styles.topCloseBtn} onClick={() => setSolvingOpen(false)}>
                  Done
                </button>
              </div>
            )}
          </TopSheet>
        )}
      </AnimatePresence>
    </div>
  );
}
