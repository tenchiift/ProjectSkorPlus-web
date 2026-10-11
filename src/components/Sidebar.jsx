import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { animate, motion, useMotionValue, useTransform, useReducedMotion } from 'motion/react';
import { LayoutDashboard, FileText, CheckSquare, Users, Inbox, FolderOpen, MessageCircle, User, LogOut, Settings, Layers, Bug } from 'lucide-react';
import styles from './Sidebar.module.css';

// Opens the global bug-report popup (handled in AppLayout).
export const REPORT_BUG_ACTION = 'report-bug';

// Animated number: counts up from 0 when `value` lands (profile fetch).
function CountUp({ value }) {
  const reduced = useReducedMotion();
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));

  useEffect(() => {
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.8, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, reduced, mv]);

  return <motion.span>{rounded}</motion.span>;
}

// Level naik setiap 100 EXP; `into` ialah progress dalam level semasa.
const xpInfo = (exp) => {
  const total = exp ?? 0;
  return { total, level: Math.floor(total / 100) + 1, into: total % 100 };
};

const STUDENT_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard' },
  { icon: FileText, label: 'Past Papers', route: '/final-exam' },
  { icon: CheckSquare, label: 'Tasks', route: '/tasks' },
  { icon: Users, label: 'Friends', route: '/friends' },
  { icon: MessageCircle, label: 'Messages', route: '/messages' },
  { icon: FolderOpen, label: 'My Submissions', route: '/my-submissions' },
  { icon: Bug, label: 'Report Bug', route: REPORT_BUG_ACTION },
];

const LECTURER_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard' },
  { icon: Inbox, label: 'Inbox', route: '/inbox' },
  { icon: FileText, label: 'Past Papers', route: '/manage-exams' },
  { icon: Layers, label: 'Modules', route: '/manage-modules' },
  { icon: Users, label: 'Friends', route: '/friends' },
  { icon: MessageCircle, label: 'Messages', route: '/messages' },
  { icon: Bug, label: 'Report Bug', route: REPORT_BUG_ACTION },
];

// Admin access lives in Settings, not the sidebar.

export default function Sidebar({ visible, onClose, onNavigate, userData, persistent }) {
  const reducedMotion = useReducedMotion();
  const location = useLocation();
  const openReportBug = useCallback(() => {
    document.dispatchEvent(new CustomEvent('open-report-bug'));
  }, []);
  const handleNav = useCallback((route) => {
    if (route === REPORT_BUG_ACTION) {
      onClose();
      setTimeout(() => openReportBug(), 200);
      return;
    }
    onClose();
    setTimeout(() => onNavigate(route), 200);
  }, [onClose, onNavigate, openReportBug]);

  // Profile still loading: render nothing role-specific so the lecturer
  // never sees the student menu before the fetch lands.
  const profileLoaded = !!userData?.role;

  const MENU =
    userData?.role === 'lecturer' ? LECTURER_MENU
    : userData?.role ? STUDENT_MENU
    : [];
  const xp = xpInfo(userData?.total_exp);

  const isLecturer = userData?.role === 'lecturer';
  const isActive = (route) => route !== REPORT_BUG_ACTION && location.pathname === route;

  // Blurred photo backdrop shared by the whole rail (profile + nav).
  const sideBg = userData?.photo_url ? (
    <img src={userData.photo_url} className={styles.sideBg} alt="" aria-hidden="true" />
  ) : null;

  // X button removed: drawer closes via backdrop tap, navigation, or Escape.
  useEffect(() => {
    if (persistent || !visible) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [persistent, visible, onClose]);

  const navList = (click) => (
    <nav className={styles.menu} aria-label="Primary">
      {MENU.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.route);
        return (
          <button
            key={item.label}
            type="button"
            className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`}
            onClick={() => click(item.route)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  const profileBlock = (
    <div className={styles.profileTop}>
      <div className={styles.profileCenter}>
        {userData?.photo_url ? (
          <img src={userData.photo_url} className={styles.avatarBig} alt="" />
        ) : (
          <div className={styles.avatarBigPlaceholder} aria-hidden="true">
            <User size={26} color="var(--color-text-secondary)" />
          </div>
        )}
        <p className={styles.profileName}>{userData?.name ?? ''}</p>
        <p className={styles.profileSem}>
          {profileLoaded
            ? (isLecturer ? 'Lecturer' : (userData?.semester ?? 'Semester'))
            : ''}
        </p>
        {profileLoaded && (
          <span className={styles.roleTag}>
            {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
          </span>
        )}
      </div>
      {profileLoaded && !isLecturer && (
        <div className={styles.gamify}>
          <div className={styles.xpRow}>
            <span className={styles.xpLevel}>LVL {xp.level}</span>
            <div className={styles.xpBar} role="progressbar" aria-valuenow={xp.into} aria-valuemin={0} aria-valuemax={100} aria-label="Experience progress">
              <motion.div
                className={styles.xpFill}
                initial={reducedMotion ? false : { width: 0 }}
                animate={{ width: `${xp.into}%` }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut', delay: 0.15 }}
              />
            </div>
            <span className={styles.xpCount}><CountUp value={xp.total} /> XP</span>
          </div>
        </div>
      )}
    </div>
  );

  const footerBlock = (click) => (
    <div className={styles.account}>
      <div className={styles.footer}>
        <button
          type="button"
          className={`${styles.footerBtn} ${isActive('/settings') ? styles.menuItemActive : ''}`}
          onClick={() => click('/settings')}
          aria-current={isActive('/settings') ? 'page' : undefined}
        >
          <Settings size={20} aria-hidden="true" />
          <span>Settings</span>
        </button>
        <button type="button" className={styles.logoutBtn} onClick={() => click('logout')}>
          <LogOut size={20} aria-hidden="true" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );

  if (persistent) {
    return (
      <aside className={styles.persistent} aria-label="Sidebar">
        <div className={styles.persistentInner}>
          {sideBg}
          {profileBlock}
          {navList(onNavigate)}
          {footerBlock(onNavigate)}
        </div>
      </aside>
    );
  }

  return (
    <div className={styles.wrapper} style={{ pointerEvents: visible ? 'auto' : 'none' }}>
      <div
        className={`${styles.backdrop} ${visible ? styles.backdropVisible : ''}`}
        onClick={onClose}
      />
      <div className={`${styles.sidebar} ${visible ? styles.sidebarVisible : ''}`} role="dialog" aria-modal="true" aria-label="Menu">
        {sideBg}
        {profileBlock}
        {navList(handleNav)}
        {footerBlock(handleNav)}
      </div>
    </div>
  );
}
