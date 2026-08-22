import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getConversations, getUnreadCounts, subscribeToPresence } from '../services/friendChatService';
import styles from './MessagesScreen.module.css';

function timeAgo(dateStr) {
  const then = new Date(dateStr);
  const diff = Date.now() - then.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 0 ? 'now' : `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return then.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
}

export default function MessagesScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [unread, setUnread] = useState({});
  const [onlineIds, setOnlineIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    try {
      const list = await getConversations(user.id);
      setConversations(list);
      const counts = await getUnreadCounts(user.id, list);
      setUnread(counts);
    } catch (err) {
      console.error('Load conversations error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  useEffect(() => {
    const channel = subscribeToPresence(setOnlineIds);
    return () => {
      channel?.unsubscribe();
    };
  }, []);

  const otherProfile = (c) => (c.user1_id === user.id ? c.user2 : c.user1);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>Messages</h1>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>
        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : conversations.length === 0 ? (
          <div className={styles.center}>
            <MessageCircle size={40} color="var(--color-text-secondary)" />
            <p className={styles.emptyText}>No chats yet — open a chat from your Friends list.</p>
          </div>
        ) : (
          conversations.map((c) => {
            const other = otherProfile(c);
            const online = onlineIds.includes(other?.id);
            const unreadCount = unread[c.id] ?? 0;
            return (
              <button
                key={c.id}
                className={styles.convoCard}
                onClick={() => navigate(`/chat/${other.id}`, { state: { friend: other, conversationId: c.id } })}
              >
                <div className={styles.avatarWrap}>
                  {other?.photo_url ? (
                    <img src={other.photo_url} alt="" className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarPlaceholder}><User size={22} color="#FFFFFF" /></div>
                  )}
                  {online && <span className={styles.onlineDot} />}
                </div>
                <div className={styles.convoInfo}>
                  <span className={styles.convoName}>{other?.name ?? 'Unknown'}</span>
                  <span className={styles.convoPreview}>{c.last_message_at ? timeAgo(c.last_message_at) : ''}</span>
                </div>
                {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
