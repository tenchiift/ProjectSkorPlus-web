import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Heart, ChevronRight, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import styles from './SettingsScreen.module.css';

const THEME_OPTIONS = [
  { mode: 'light', icon: Sun, label: 'Light', color: '#FFFFFF', accent: '#8E6BE2', hint: 'Bright & clean' },
  { mode: 'dark', icon: Moon, label: 'Dark', color: '#151517', accent: '#8E6BE2', hint: 'Easy on the eyes' },
  { mode: 'pink', icon: Heart, label: 'Soft Pink', color: '#FBF0F1', accent: '#8E6BE2', hint: 'Warm & cozy' },
];

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { themeMode, setThemeMode } = useTheme();
  const [themeModal, setThemeModal] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h2 className={styles.headerTitle}>Settings</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.scroll}>
        <div className={styles.card}>
          <button
            className={styles.row}
            onClick={() => navigate('/profile')}
          >
            <div className={`${styles.rowIcon} ${styles.profileIcon}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Profile</span>
              <span className={styles.rowHint}>Manage your account details</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </button>

          <div className={styles.divider} />

          <button
            className={styles.row}
            onClick={() => setThemeModal(true)}
          >
            <div className={`${styles.rowIcon} ${styles.themeIcon}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2" /><circle cx="6.5" cy="13.5" r="2" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M12 2v2" /><path d="M12 20v2" /><circle cx="17.5" cy="17.5" r="2" /></svg>
            </div>
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>App Theme</span>
              <span className={styles.rowHint}>
                {themeMode === 'light' ? 'Light' : themeMode === 'dark' ? 'Dark' : 'Soft Pink'}
              </span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </button>
        </div>
      </div>

      {themeModal && (
        <div className={styles.modalOverlay} onClick={() => setThemeModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Choose Theme</h3>
              <button className={styles.modalClose} onClick={() => setThemeModal(false)}>
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = themeMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  className={styles.themeRow}
                  onClick={() => { setThemeMode(opt.mode); setThemeModal(false); }}
                >
                  <div
                    className={styles.themePreview}
                    style={{ backgroundColor: opt.color, borderColor: opt.accent }}
                  >
                    <Icon size={18} color={opt.accent} />
                  </div>
                  <div className={styles.themeInfo}>
                    <span className={styles.themeLabel}>{opt.label}</span>
                    <span className={styles.themeHint}>{opt.hint}</span>
                  </div>
                  <div className={`${styles.radio} ${active ? styles.radioActive : ''}`}>
                    {active && <div className={styles.radioFill} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
