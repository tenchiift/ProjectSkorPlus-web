import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Volume2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
  deleteAllNotifications,
} from '../services/notificationService';
import styles from './NotificationsScreen.module.css';

function timeAgo(dateStr) {
  const then = new Date(dateStr);
  const diff = Date.now() - then.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 0 ? 'just now' : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return then.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function NotificationsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);

  const load = async () => {
    if (!user) return;
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error('Load notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleOpen = async (n) => {
    if (selectMode) {
      setSelected((prev) =>
        prev.includes(n.id) ? prev.filter((id) => id !== n.id) : [...prev, n.id]
      );
      return;
    }
    if (!n.read) {
      await markRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
  };

  const handleReadAll = async () => {
    if (!user) return;
    await markAllRead(user.id);
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
  };

  const handleDeleteSelected = async () => {
    for (const id of selected) {
      await deleteNotification(id);
    }
    setSelected([]);
    setSelectMode(false);
    await load();
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    await deleteAllNotifications(user.id);
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Back">
          <ChevronLeft size={22} color="var(--color-text-primary)" />
        </button>

        <h1 className={styles.title}>Notifications</h1>

        {selectMode ? (
          <button
            className={styles.pillBtn}
            onClick={() => {
              setSelectMode(false);
              setSelected([]);
            }}
          >
            Cancel
          </button>
        ) : (
          <button className={styles.pillBtn} onClick={handleReadAll}>
            <CheckCircle2 size={16} color="var(--color-primary)" />
            <span className={styles.readAllText}>Read all</span>
          </button>
        )}

        <button
          className={`${styles.pillBtn} ${selectMode ? styles.pillBtnActive : ''}`}
          onClick={() => setSelectMode((v) => !v)}
        >
          Select
        </button>
      </div>

      <div className={styles.scroll}>
        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : notifications.length === 0 ? (
          <div className={styles.center}>
            <p className={styles.emptyText}>No notifications</p>
          </div>
        ) : (
          notifications.map((n) => {
            const isSelected = selected.includes(n.id);
            return (
              <button
                key={n.id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
                onClick={() => handleOpen(n)}
              >
                {!n.read && <span className={styles.unreadDot} />}
                <div className={`${styles.iconCircle} ${!n.read ? styles.iconCircleUnread : ''}`}>
                  <Volume2 size={22} color={n.read ? 'var(--color-text-secondary)' : 'var(--color-primary)'} />
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardTitleRow}>
                    <span className={styles.cardTitle}>{n.title}</span>
                    <span className={styles.timestamp}>{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && (
                    <div className={styles.bodyRow}>
                      <Volume2 size={16} color="var(--color-text-secondary)" />
                      <span className={styles.cardBodyText}>{n.body}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
        <div className={styles.footer}>
          {selectMode ? (
            <button
              className={styles.deleteAllBtn}
              onClick={handleDeleteSelected}
              disabled={selected.length === 0}
            >
              <Trash2 size={18} color="var(--color-error)" />
              <span className={styles.deleteAllText}>Delete selected ({selected.length})</span>
            </button>
          ) : (
            <button className={styles.deleteAllBtn} onClick={handleDeleteAll}>
              <Trash2 size={18} color="var(--color-error)" />
              <span className={styles.deleteAllText}>Delete all notifications</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
