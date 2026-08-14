import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FileQuestion } from 'lucide-react';
import styles from './ModuleScreen.module.css';

const MODULE_COLORS = {
  purple: 'var(--color-gradient-vector-start), var(--color-gradient-vector-end)',
  amber: 'var(--color-gradient-diff-start), var(--color-gradient-diff-end)',
};

const ICON_BG_COLORS = {
  purple: 'rgba(142, 107, 226, 0.13)',
  amber: 'rgba(254, 201, 167, 0.13)',
};

export default function ModuleScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const moduleData = location.state?.module ?? {};
  const gradientColors = MODULE_COLORS[moduleData.color] ?? MODULE_COLORS.purple;
  const accentColor = moduleData.color === 'amber'
    ? 'var(--color-gradient-diff-start)'
    : 'var(--color-gradient-vector-start)';
  const iconBg = ICON_BG_COLORS[moduleData.color] ?? ICON_BG_COLORS.purple;

  return (
    <div className={styles.container}>
      <div
        className={styles.banner}
        style={{ background: `linear-gradient(135deg, ${gradientColors})` }}
      >
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </button>

        <div className={styles.bannerContent}>
          <div className={styles.bannerPill} />
          <h1 className={styles.bannerTitle}>{moduleData.title ?? 'Module'}</h1>
          <p className={styles.bannerDesc}>{moduleData.description ?? ''}</p>

          <div className={styles.bannerStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>12</span>
              <span className={styles.statLabel}>Lessons</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>45min</span>
              <span className={styles.statLabel}>Est. Time</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>20</span>
              <span className={styles.statLabel}>Problems</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <button
          className={styles.itemCard}
          onClick={() => navigate(`/question/${moduleData.id}`, { state: { module: moduleData } })}
        >
          <div className={styles.itemIcon} style={{ backgroundColor: iconBg }}>
            <FileQuestion size={24} style={{ color: accentColor }} />
          </div>
          <div className={styles.itemInfo}>
            <span className={styles.itemTitle}>Soalan</span>
            <span className={styles.itemSubtitle}>Practice problems to test your skills</span>
          </div>
          <ArrowRight size={20} className={styles.chevron} />
        </button>
      </div>
    </div>
  );
}
