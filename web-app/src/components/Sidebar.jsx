import { useCallback } from 'react';
import { LayoutDashboard, FileText, Scan, CheckSquare, X, User, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';

const MENU = [
  { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard' },
  { icon: FileText, label: 'Past Papers', route: '/final-exam' },
  { icon: Scan, label: 'Scan & Solve', route: '/scan-solve' },
  { icon: CheckSquare, label: 'Tasks', route: '/tasks' },
];

export default function Sidebar({ visible, onClose, onNavigate, userData }) {
  const handleNav = useCallback((route) => {
    onClose();
    setTimeout(() => onNavigate(route), 200);
  }, [onClose, onNavigate]);

  return (
    <div className={styles.wrapper} style={{ pointerEvents: visible ? 'auto' : 'none' }}>
      <div
        className={`${styles.backdrop} ${visible ? styles.backdropVisible : ''}`}
        onClick={onClose}
      />
      <div className={`${styles.sidebar} ${visible ? styles.sidebarVisible : ''}`}>
        <div
          className={styles.header}
          style={{
            background: `linear-gradient(135deg, var(--color-sidebar-header-start), var(--color-sidebar-header-end))`,
          }}
        >
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={22} color="#FFFFFF" />
          </button>
          <div className={styles.userInfo}>
            {userData?.photo_url ? (
              <img src={userData.photo_url} className={styles.avatar} alt="" />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <User size={28} color="#FFFFFF" />
              </div>
            )}
            <div>
              <p className={styles.userName}>{userData?.name ?? 'Student'}</p>
              <p className={styles.userSem}>{userData?.semester ?? 'Semester'}</p>
            </div>
          </div>
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
          <button className={styles.logoutBtn} onClick={() => handleNav('logout')}>
            <LogOut size={20} color="var(--color-error)" />
            <span style={{ color: 'var(--color-error)' }}>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
