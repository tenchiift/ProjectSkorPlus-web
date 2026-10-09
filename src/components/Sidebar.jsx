import { useCallback, useEffect, useId } from 'react';
import { useLocation } from 'react-router-dom';
import { animate, LayoutGroup, motion, useMotionValue, useTransform, useReducedMotion } from 'motion/react';
import { LayoutDashboard, FileText, CheckSquare, Users, Inbox, FolderOpen, MessageCircle, X, User, LogOut, Settings, Layers, Bug } from 'lucide-react';
import { layoutSpring, motionEase, motionTiming, pressFeedback } from '../utils/motion';
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
    const controls = animate(mv, value, { duration: motionTiming.progress, ease: motionEase });
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

// Keep the section selected while visiting one of its detail screens.
// PDF viewer is deliberately omitted: it also opens notes and submissions.
function selectedSection(pathname, isLecturer) {
  if (/^\/friend(?:s|\/)/.test(pathname)) return '/friends';
  if (/^\/(?:messages|chat\/)/.test(pathname)) return '/messages';
  if (/^\/submission\//.test(pathname)) return isLecturer ? '/inbox' : '/my-submissions';
  if (pathname === '/submit-work') return '/my-submissions';
  if (/^\/manage-topics\//.test(pathname)) return '/manage-modules';
  if (['/about', '/admin'].includes(pathname)) return '/settings';
  if (/^\/(?:module(?:s|\/)|question\/|student(?:s|\/))/.test(pathname)
    || ['/profile', '/set-exam', '/scan-solve', '/ai-chat'].includes(pathname)) return '/dashboard';
  return pathname;
}

// Admin access lives in Settings, not the sidebar.

export default function Sidebar({ visible, onClose, onNavigate, userData, persistent }) {
  const reducedMotion = useReducedMotion();
  const { pathname } = useLocation();
  const navigationId = useId();
  const openReportBug = useCallback(() => {
    document.dispatchEvent(new CustomEvent('open-report-bug'));
  }, []);
  const handleNav = useCallback((route) => {
    // Dismiss and navigate together; never queue stale navigation behind a timer.
    onClose();
    if (route === REPORT_BUG_ACTION) {
      openReportBug();
      return;
    }
    onNavigate(route);
  }, [onClose, onNavigate, openReportBug]);

  // Profile still loading — render nothing role-specific so the lecturer
  // never sees the student menu / streak flash before the fetch lands.
  const profileLoaded = !!userData?.role;

  const MENU =
    userData?.role === 'lecturer' ? LECTURER_MENU
    : userData?.role ? STUDENT_MENU
    : [];
  const xp = xpInfo(userData?.total_exp);
  const streak = userData?.days_streak ?? 0;

  const isLecturer = userData?.role === 'lecturer';
  const selectedRoute = selectedSection(pathname, isLecturer);

  const roleTag = userData?.role ? (
    <span className={styles.roleTag}>
      {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
    </span>
  ) : null;

  const profileBlock = (
    <div className={styles.profileCenter}>
      {userData?.photo_url ? (
        <img src={userData.photo_url} className={styles.avatarBig} alt="" />
      ) : (
        <div className={styles.avatarBigPlaceholder}>
          <User size={32} color="#FFFFFF" />
        </div>
      )}
      <p className={styles.profileName}>{userData?.name ?? ''}</p>
      <p className={styles.profileSem}>{profileLoaded ? (userData?.semester ?? 'Semester') : ''}</p>
      {profileLoaded && !isLecturer && (
        <>
          <span className={styles.streakPill}>
            {streak > 0 ? (
              <>🔥 <CountUp value={streak} /> Day Streak</>
            ) : (
              '🔥 Start Streak!'
            )}
          </span>
          <div className={styles.xpRow}>
            <span className={styles.xpLevel}>LVL {xp.level}</span>
            <div className={styles.xpBar}>
              <motion.div
                className={styles.xpFill}
                initial={reducedMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: xp.into / 100 }}
                transition={reducedMotion ? { duration: 0 } : { duration: motionTiming.progress, ease: motionEase }}
              />
            </div>
            <span className={styles.xpCount}><CountUp value={xp.total} /> XP</span>
          </div>
        </>
      )}
    </div>
  );

  const selection = (route) => selectedRoute === route ? (
    <motion.span
      aria-hidden="true"
      className={styles.activeIndicator}
      layoutId="selected-section"
      initial={false}
      transition={reducedMotion ? { duration: 0 } : layoutSpring}
      style={{ borderRadius: 16 }}
    />
  ) : null;

  const currentPage = (route) => selectedRoute === route
    ? (pathname === route ? 'page' : 'location')
    : undefined;

  const menuBlock = (
    <motion.nav className={styles.menu} aria-label="Primary" layoutScroll>
      {MENU.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.route}
            type="button"
            className={styles.menuItem}
            aria-current={currentPage(item.route)}
            onClick={() => handleNav(item.route)}
            {...pressFeedback(reducedMotion)}
          >
            {selection(item.route)}
            <Icon size={20} aria-hidden="true" />
            <span className={styles.menuLabel}>{item.label}</span>
          </motion.button>
        );
      })}
    </motion.nav>
  );

  const footerBlock = (
    <div className={styles.footer}>
      <motion.button
        type="button"
        className={styles.footerBtn}
        aria-current={currentPage('/settings')}
        onClick={() => handleNav('/settings')}
        {...pressFeedback(reducedMotion)}
      >
        {selection('/settings')}
        <Settings size={20} aria-hidden="true" />
        <span className={styles.menuLabel}>Settings</span>
      </motion.button>
      <motion.button
        type="button"
        className={styles.logoutBtn}
        onClick={() => handleNav('logout')}
        {...pressFeedback(reducedMotion)}
      >
        <LogOut size={20} color="var(--color-error)" aria-hidden="true" />
        <span style={{ color: 'var(--color-error)' }}>Log Out</span>
      </motion.button>
    </div>
  );

  const headerBlock = (
    <div className={`${styles.header} bg-graph-purple`}>
      {userData?.photo_url && <img src={userData.photo_url} className={styles.headerBg} alt="" />}
      <div className={styles.headerOverlay} />
      {!persistent && (
        <motion.button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close navigation"
          {...pressFeedback(reducedMotion)}
        >
          <X size={22} color="#FFFFFF" aria-hidden="true" />
        </motion.button>
      )}
      {roleTag}
      {profileBlock}
    </div>
  );

  return (
    <LayoutGroup id={navigationId}>
      {persistent ? (
        <aside className={styles.persistent} aria-label="App navigation">
          <div className={styles.persistentInner}>
            {headerBlock}
            {menuBlock}
            {footerBlock}
          </div>
        </aside>
      ) : (
        <div
          className={styles.wrapper}
          style={{ pointerEvents: visible ? 'auto' : 'none' }}
          inert={!visible}
          aria-hidden={!visible}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onClose();
          }}
        >
          <div
            className={`${styles.backdrop} ${visible ? styles.backdropVisible : ''}`}
            onClick={onClose}
            aria-hidden="true"
          />
          <aside
            className={`${styles.sidebar} ${visible ? styles.sidebarVisible : ''}`}
            aria-label="App navigation"
          >
            {headerBlock}
            {menuBlock}
            {footerBlock}
          </aside>
        </div>
      )}
    </LayoutGroup>
  );
}
