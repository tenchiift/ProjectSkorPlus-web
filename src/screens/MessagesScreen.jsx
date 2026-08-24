import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, User, Trash2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getConversations,
  getUnreadCounts,
  getLastMessages,
  deleteConversation,
  subscribeToPresence,
} from '../services/friendChatService';
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
  const [previews, setPreviews] = useState({});
  const [onlineIds, setOnlineIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const list = await getConversations(user.id);
      setConversations(list);
      const [counts, lastMsgs] = await Promise.all([
        getUnreadCounts(user.id, list),
        getLastMessages(list.map((c) => c.id)),
      ]);
      setUnread(counts);
      setPreviews(lastMsgs);
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

  const otherProfile = (c) => (c.user1_id === user?.id ? c.user2 : c.user1);

  const toggleSelect = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const exitEditMode = () => {
    setEditMode(false);
    setSelected([]);
  };

  const handleDelete = async () => {
    if (selected.length === 0 || deleting) return;
    setDeleting(true);
    try {
      await Promise.all(selected.map((id) => deleteConversation(id)));
      setSelected([]);
      setEditMode(false);
      await load();
    } catch (err) {
      console.error('Delete conversation error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const previewText = (c) => {
    const m = previews[c.id];
    if (!m) return 'No messages yet';
    const content = m.image_url && !m.body ? '📷 Photo' : m.body;
    return m.sender_id === user?.id ? `You: ${content}` : content;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
      </div>

      <div className={styles.scroll}>
        <div className={styles.titleRow}>
          <h1 className={styles.pageTitle}>Messages</h1>
          <button
            className={`${styles.editBtn} ${editMode ? styles.editBtnActive : ''}`}
            onClick={() => (editMode ? exitEditMode() : setEditMode(true))}
          >
            {editMode ? 'Done' : 'Edit'}
          </button>
        </div>

        {editMode && selected.length > 0 && (
          <button className={styles.deleteBar} onClick={handleDelete} disabled={deleting}>
            <Trash2 size={16} color="#FFFFFF" />
            <span>{deleting ? 'Deleting...' : `Delete ${selected.length} chat${selected.length > 1 ? 's' : ''}`}</span>
          </button>
        )}

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : conversations.length === 0 ? (
          <div className={styles.center}>
            <MessageCircle size={40} color="var(--color-text-secondary)" />
            <p className={styles.emptyText}>No chats yet — open a chat from your Friends list.</p>
          </div>
        ) : (
          <div className={styles.listGroup}>
            {conversations.map((c) => {
              const other = otherProfile(c);
              const online = onlineIds.includes(other?.id);
              const unreadCount = unread[c.id] ?? 0;
              const isSelected = selected.includes(c.id);
              return (
                <button
                  key={c.id}
                  className={`${styles.convoCard} ${isSelected ? styles.convoCardSelected : ''}`}
                  onClick={() =>
                    editMode
                      ? toggleSelect(c.id)
                      : other && navigate(`/chat/${other.id}`, { state: { friend: other, conversationId: c.id } })
                  }
                >
                  {editMode && (
                    <span className={`${styles.checkCircle} ${isSelected ? styles.checkCircleOn : ''}`}>
                      {isSelected && <Check size={12} color="#FFFFFF" />}
                    </span>
                  )}
                  <div className={styles.avatarWrap}>
                    {other?.photo_url ? (
                      <img src={other.photo_url} alt="" className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarPlaceholder}><User size={22} color="#FFFFFF" /></div>
                    )}
                    {online && !editMode && <span className={styles.onlineDot} />}
                  </div>
                  <div className={styles.convoInfo}>
                    <span className={styles.convoName}>{other?.name ?? 'Unknown'}</span>
                    <span className={`${styles.convoPreview} ${unreadCount > 0 ? styles.convoPreviewUnread : ''}`}>
                      {previewText(c)}
                    </span>
                  </div>
                  <div className={styles.rightCol}>
                    <span className={styles.time}>{c.last_message_at ? timeAgo(c.last_message_at) : ''}</span>
                    {unreadCount > 0 && !editMode && <span className={styles.unreadBadge}>{unreadCount}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
