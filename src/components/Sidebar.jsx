import { useCallback } from 'react';
import { LayoutDashboard, FileText, CheckSquare, Users, Inbox, FolderOpen, MessageCircle, X, User, LogOut, Settings, Layers } from 'lucide-react';
import styles from './Sidebar.module.css';

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
];

const LECTURER_MENU = [
  { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard' },
  { icon: Inbox, label: 'Inbox', route: '/inbox' },
  { icon: FileText, label: 'Past Papers', route: '/manage-exams' },
  { icon: Layers, label: 'Modules', route: '/manage-modules' },
  { icon: Users, label: 'Friends', route: '/friends' },
  { icon: MessageCircle, label: 'Messages', route: '/messages' },
];

// Admin access lives in Settings, not the sidebar.
const MENU = STUDENT_MENU;

export default function Sidebar({ visible, onClose, onNavigate, userData, persistent }) {
  const handleNav = useCallback((route) => {
    onClose();
    setTimeout(() => onNavigate(route), 200);
  }, [onClose, onNavigate]);

  const MENU =
    userData?.role === 'lecturer' ? LECTURER_MENU
    : STUDENT_MENU;
  const xp = xpInfo(userData?.total_exp);
  const streak = userData?.days_streak ?? 0;

  const isLecturer = userData?.role === 'lecturer';

  const profileBlock = (
    <div className={styles.profileCenter}>
      {userData?.photo_url ? (
        <img src={userData.photo_url} className={styles.avatarBig} alt="" />
      ) : (
        <div className={styles.avatarBigPlaceholder}>
          <User size={32} color="#FFFFFF" />
        </div>
      )}
      <p className={styles.profileName}>{userData?.name ?? 'Student'}</p>
      <p className={styles.profileSem}>{userData?.semester ?? 'Semester'}</p>
      {!isLecturer && (
        <>
          <span className={styles.streakPill}>
            {streak > 0 ? `🔥 ${streak} Day Streak` : '🔥 Start Streak!'}
          </span>
          <div className={styles.xpRow}>
            <span className={styles.xpLevel}>LVL {xp.level}</span>
            <div className={styles.xpBar}>
              <div className={styles.xpFill} style={{ width: `${xp.into}%` }} />
            </div>
            <span className={styles.xpCount}>{xp.total} XP</span>
          </div>
        </>
      )}
    </div>
  );

  if (persistent) {
    return (
      <aside className={styles.persistent}>
        <div className={styles.persistentInner}>
          <div className={`${styles.header} bg-graph-purple`}>
            {userData?.photo_url && <img src={userData.photo_url} className={styles.headerBg} alt="" />}
            <div className={styles.headerOverlay} />
            {profileBlock}
          </div>
          <div className={styles.menu}>
            {MENU.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.route} className={styles.menuItem} onClick={() => onNavigate(item.route)}>
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <div className={styles.footer}>
            <button className={styles.footerBtn} onClick={() => onNavigate('/settings')}>
              <Settings size={20} color="var(--color-text-primary)" />
              <span>Settings</span>
            </button>
            <button className={styles.logoutBtn} onClick={() => onNavigate('logout')}>
              <LogOut size={20} color="var(--color-error)" />
              <span style={{ color: 'var(--color-error)' }}>Log Out</span>
            </button>
          </div>
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
      <div className={`${styles.sidebar} ${visible ? styles.sidebarVisible : ''}`}>
          <div className={`${styles.header} bg-graph-purple`}>
            {userData?.photo_url && <img src={userData.photo_url} className={styles.headerBg} alt="" />}
            <div className={styles.headerOverlay} />
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={22} color="#FFFFFF" />
            </button>
            {profileBlock}
          </div>

        <div className={styles.menu}>
          {MENU.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.route} className={styles.menuItem} onClick={() => handleNav(item.route)}>
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          <button className={styles.footerBtn} onClick={() => handleNav('/settings')}>
            <Settings size={20} color="var(--color-text-primary)" />
            <span>Settings</span>
          </button>
          <button className={styles.logoutBtn} onClick={() => handleNav('logout')}>
            <LogOut size={20} color="var(--color-error)" />
            <span style={{ color: 'var(--color-error)' }}>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
