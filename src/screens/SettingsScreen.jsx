import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sun, Moon, Heart, Waves, TreePine, Stars, ChevronRight, X,
  Bell, Languages, Smile, Trash2, User, KeyRound, LogOut, Info, Palette, ShieldCheck,
} from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteAllConversations } from '../services/aiChatService';
import styles from './SettingsScreen.module.css';

const THEME_OPTIONS = [
  { mode: 'light', icon: Sun, label: 'Light', color: '#FFFFFF', accent: '#8E6BE2', hint: 'Bright & clean' },
  { mode: 'dark', icon: Moon, label: 'Dark', color: '#1C1C20', accent: '#9D82E8', hint: 'Easy on the eyes' },
  { mode: 'pink', icon: Heart, label: 'Soft Pink', color: '#FDF6F7', accent: '#E0698C', hint: 'Warm & cozy' },
  { mode: 'ocean', icon: Waves, label: 'Ocean Blue', color: '#F4F8FC', accent: '#3E7BD6', hint: 'Cool & focused' },
  { mode: 'forest', icon: TreePine, label: 'Forest', color: '#F4FAF5', accent: '#2F9E5F', hint: 'Fresh & calm' },
  { mode: 'midnight', icon: Stars, label: 'Midnight', color: '#0D1220', accent: '#6C8CFF', hint: 'Deep night vibes' },
];

const AI_LANG_OPTIONS = [
  { value: 'auto', label: 'Auto', hint: 'Matches the language you type' },
  { value: 'bm', label: 'Malay', hint: 'Always reply in Malay' },
  { value: 'en', label: 'English', hint: 'Always reply in English' },
];

const AI_PERSONA_OPTIONS = [
  { value: 'chill', label: 'Chill Bro', hint: 'Casual like a friend, light emojis, Manglish welcome' },
  { value: 'formal', label: 'Formal Tutor', hint: 'Professional, straight to the point' },
];

const NOTIF_PREFS = [
  { key: 'quote', label: 'Daily Quotes', hint: 'Daily quote in notifications' },
  { key: 'study', label: 'Study Tips', hint: 'Daily study tip' },
  { key: 'exam', label: 'Exam & Week Reminders', hint: 'Exam countdown + week reminders' },
];

const getPref = (key) => {
  try { return localStorage.getItem(`skorplus-notif-${key}`) !== 'off'; } catch { return true; }
};

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const [role, setRole] = useState(null);
  const [themeModal, setThemeModal] = useState(false);
  const [langModal, setLangModal] = useState(false);
  const [personaModal, setPersonaModal] = useState(false);
  const [aboutModal, setAboutModal] = useState(false);
  const [passModal, setPassModal] = useState(false);
  const [clearModal, setClearModal] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(() =>
    Object.fromEntries(NOTIF_PREFS.map((p) => [p.key, getPref(p.key)]))
  );
  const [aiLang, setAiLang] = useState(() => {
    try { return localStorage.getItem('skorplus-ai-lang') || 'auto'; } catch { return 'auto'; }
  });
  const [aiPersona, setAiPersona] = useState(() => {
    try { return localStorage.getItem('skorplus-ai-persona') || 'chill'; } catch { return 'chill'; }
  });
  const [newPassword, setNewPassword] = useState('');
  const [passBusy, setPassBusy] = useState(false);
  const [passMsg, setPassMsg] = useState(null);
  const [clearBusy, setClearBusy] = useState(false);
  const [clearError, setClearError] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setRole(data?.role ?? null))
      .catch(() => {});
  }, [user]);

  const toggleNotif = (key) => {
    const next = !notifPrefs[key];
    setNotifPrefs((prev) => ({ ...prev, [key]: next }));
    try { localStorage.setItem(`skorplus-notif-${key}`, next ? 'on' : 'off'); } catch { /* ignore */ }
  };

  const pickLang = (value) => {
    setAiLang(value);
    try { localStorage.setItem('skorplus-ai-lang', value); } catch { /* ignore */ }
    setLangModal(false);
  };

  const pickPersona = (value) => {
    setAiPersona(value);
    try { localStorage.setItem('skorplus-ai-persona', value); } catch { /* ignore */ }
    setPersonaModal(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      setPassMsg({ error: 'Password must be at least 6 characters.' });
      return;
    }
    setPassBusy(true);
    setPassMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPassMsg({ ok: 'Password changed! ✅' });
      setNewPassword('');
    } catch (err) {
      setPassMsg({ error: err.message || 'Failed to change password.' });
    } finally {
      setPassBusy(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;
    setClearBusy(true);
    setClearError(null);
    try {
      await deleteAllConversations(user.id);
      setClearModal(false);
    } catch (err) {
      setClearError(
        'Cannot delete — run supabase/ai_chat_delete_policy.sql in the Supabase SQL editor first.'
      );
      console.error('Clear AI history error:', err);
    } finally {
      setClearBusy(false);
    }
  };

  const labelFor = (opts, value) => opts.find((o) => o.value === value)?.label ?? opts[0].label;

  const radioRow = (opts, value, onPick) =>
    opts.map((opt) => {
      const active = value === opt.value;
      return (
        <button key={opt.value} className={styles.themeRow} onClick={() => onPick(opt.value)}>
          <div className={styles.themeInfo}>
            <span className={styles.themeLabel}>{opt.label}</span>
            <span className={styles.themeHint}>{opt.hint}</span>
          </div>
          <div className={`${styles.radio} ${active ? styles.radioActive : ''}`}>
            {active && <div className={styles.radioFill} />}
          </div>
        </button>
      );
    });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
      </div>

      <div className={styles.scroll}>
        <h2 className={styles.pageTitle}>Settings</h2>
        <div className={styles.card}>
          <button className={styles.row} onClick={() => setThemeModal(true)}>
            <Palette size={20} color="var(--color-text-secondary)" />
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>App Theme</span>
              <span className={styles.rowHint}>{THEME_OPTIONS.find((t) => t.mode === themeMode)?.label}</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </button>
        </div>

        <div className={styles.card}>
          {NOTIF_PREFS.map((pref, i) => (
            <div key={pref.key}>
              <button className={styles.row} onClick={() => toggleNotif(pref.key)}>
                <Bell size={20} color="var(--color-text-secondary)" />
                <div className={styles.rowInfo}>
                  <span className={styles.rowLabel}>{pref.label}</span>
                  <span className={styles.rowHint}>{pref.hint}</span>
                </div>
                <div className={`${styles.switch} ${notifPrefs[pref.key] ? styles.switchOn : ''}`}>
                  <div className={styles.switchKnob} />
                </div>
              </button>
            </div>
          ))}
        </div>

        <div className={styles.card}>
          <button className={styles.row} onClick={() => setLangModal(true)}>
            <Languages size={20} color="var(--color-text-secondary)" />
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Language</span>
              <span className={styles.rowHint}>{labelFor(AI_LANG_OPTIONS, aiLang)}</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </button>


          <button className={styles.row} onClick={() => setPersonaModal(true)}>
            <Smile size={20} color="var(--color-text-secondary)" />
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Personality</span>
              <span className={styles.rowHint}>{labelFor(AI_PERSONA_OPTIONS, aiPersona)}</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </button>


          <button className={styles.row} onClick={() => { setClearError(null); setClearModal(true); }}>
            <Trash2 size={20} color="var(--color-text-secondary)" />
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Clear Chat History</span>
              <span className={styles.rowHint}>Delete all AI conversations</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </button>
        </div>

        <div className={styles.card}>
          <button className={styles.row} onClick={() => navigate('/profile')}>
            <User size={20} color="var(--color-text-secondary)" />
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Profile</span>
              <span className={styles.rowHint}>Manage your account details</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </button>


          <button className={styles.row} onClick={() => { setPassMsg(null); setNewPassword(''); setPassModal(true); }}>
            <KeyRound size={20} color="var(--color-text-secondary)" />
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>Change Password</span>
              <span className={styles.rowHint}>Change your account password</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </button>
        </div>

        {role === 'admin' && (
          <div className={styles.card}>
            <button className={styles.row} onClick={() => navigate('/admin')}>
              <ShieldCheck size={20} color="var(--color-text-secondary)" />
              <div className={styles.rowInfo}>
                <span className={styles.rowLabel}>Admin</span>
                <span className={styles.rowHint}>Manage lecturer codes</span>
              </div>
              <ChevronRight size={18} color="var(--color-text-secondary)" />
            </button>
          </div>
        )}

        <div className={styles.card}>
          <button className={styles.row} onClick={handleLogout}>
            <LogOut size={20} color="var(--color-error)" />
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel} style={{ color: 'var(--color-error)' }}>Log Out</span>
              <span className={styles.rowHint}>Sign out from SkorPlus</span>
            </div>
          </button>
        </div>

        <div className={styles.card}>
          <button className={styles.row} onClick={() => setAboutModal(true)}>
            <Info size={20} color="var(--color-text-secondary)" />
            <div className={styles.rowInfo}>
              <span className={styles.rowLabel}>About</span>
              <span className={styles.rowHint}>Version & app info</span>
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

      {langModal && (
        <div className={styles.modalOverlay} onClick={() => setLangModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>AI Buddy Language</h3>
              <button className={styles.modalClose} onClick={() => setLangModal(false)}>
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            {radioRow(AI_LANG_OPTIONS, aiLang, pickLang)}
          </div>
        </div>
      )}

      {personaModal && (
        <div className={styles.modalOverlay} onClick={() => setPersonaModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>AI Personality</h3>
              <button className={styles.modalClose} onClick={() => setPersonaModal(false)}>
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            {radioRow(AI_PERSONA_OPTIONS, aiPersona, pickPersona)}
          </div>
        </div>
      )}

      {passModal && (
        <div className={styles.modalOverlay} onClick={() => setPassModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Change Password</h3>
              <button className={styles.modalClose} onClick={() => setPassModal(false)}>
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            <div className={styles.formBody}>
              <input
                className={styles.formInput}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
              />
              {passMsg && (
                <p className={passMsg.ok ? styles.formOk : styles.formError}>{passMsg.ok || passMsg.error}</p>
              )}
              <button className={styles.formSubmit} onClick={handleChangePassword} disabled={passBusy}>
                {passBusy ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {clearModal && (
        <div className={styles.modalOverlay} onClick={() => setClearModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Clear Chat History?</h3>
              <button className={styles.modalClose} onClick={() => setClearModal(false)}>
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            <div className={styles.formBody}>
              <p className={styles.formError}>{clearError}</p>
              <p className={styles.aboutText}>
                All AI Study Buddy conversations will be permanently deleted.
                This action cannot be undone.
              </p>
              <div className={styles.formBtnRow}>
                <button className={styles.formCancel} onClick={() => setClearModal(false)}>Cancel</button>
                <button className={styles.formDanger} onClick={handleClearHistory} disabled={clearBusy}>
                  {clearBusy ? 'Deleting...' : 'Delete All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {aboutModal && (
        <div className={styles.modalOverlay} onClick={() => setAboutModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>About SkorPlus</h3>
              <button className={styles.modalClose} onClick={() => setAboutModal(false)}>
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            <div className={styles.aboutBody}>
              <p className={styles.aboutName}>SkorPlus</p>
              <p className={styles.aboutVersion}>Version 1.0.0</p>
              <p className={styles.aboutText}>
                Study companion for Malaysian students — semester tracking, past papers,
                AI study buddy & scan solve, tasks, and classmates.
              </p>
              <p className={styles.aboutText}>AI features powered by OpenRouter.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
