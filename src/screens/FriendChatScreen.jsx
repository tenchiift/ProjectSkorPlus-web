import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Send, Camera, ImageIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markRead,
  uploadChatImage,
  subscribeToMessages,
  subscribeToPresence,
} from '../services/friendChatService';
import styles from './FriendChatScreen.module.css';

export default function FriendChatScreen() {
  const navigate = useNavigate();
  const { friendId } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const friend = location.state?.friend;
  const [conversationId, setConversationId] = useState(location.state?.conversationId ?? null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [online, setOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !friendId) return;
      let convId = conversationId;
      if (!convId) {
        const conv = await getOrCreateConversation(user.id, friendId);
        convId = conv.id;
        setConversationId(conv.id);
      }
      const msgs = await getMessages(convId);
      if (!cancelled) setMessages(msgs);
      await markRead(convId, user.id);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, friendId]);

  useEffect(() => {
    if (!conversationId) return;
    const sub = subscribeToMessages(conversationId, (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (user) markRead(conversationId, user.id);
    });
    return () => { sub.unsubscribe(); };
  }, [conversationId, user]);

  useEffect(() => {
    const channel = subscribeToPresence((onlineIds) => {
      setOnline(onlineIds.includes(friendId));
    });
    return () => { channel?.unsubscribe(); };
  }, [friendId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && uploading) || !conversationId) return;
    if (!text) return;
    try {
      await sendMessage(conversationId, user.id, text, null);
      setInput('');
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  const handlePickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !conversationId) return;
    setUploading(true);
    try {
      const url = await uploadChatImage(user.id, file);
      await sendMessage(conversationId, user.id, null, url);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.headerBtn} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={22} color="var(--color-text-primary)" />
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>{friend?.name ?? 'Chat'}</h1>
          <span className={`${styles.status} ${online ? styles.statusOnline : ''}`}>
            {online ? 'online' : 'offline'}
          </span>
        </div>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>
        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : messages.length === 0 ? (
          <div className={styles.center}>
            <p className={styles.emptyText}>Say hi to start the conversation.</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`${styles.bubbleRow} ${mine ? styles.bubbleRowMine : ''}`}>
                <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                  {m.image_url && (
                    <img
                      src={m.image_url}
                      alt=""
                      className={styles.image}
                      onClick={() => window.open(m.image_url, '_blank')}
                    />
                  )}
                  {m.body && <p className={styles.bubbleText}>{m.body}</p>}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className={styles.inputBar}>
        <button className={styles.attachBtn} onClick={() => cameraRef.current?.click()} aria-label="Camera">
          <Camera size={22} color="var(--color-text-secondary)" />
        </button>
        <button className={styles.attachBtn} onClick={() => galleryRef.current?.click()} aria-label="Gallery">
          <ImageIcon size={22} color="var(--color-text-secondary)" />
        </button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePickImage} />
        <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePickImage} />

        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button className={styles.sendBtn} onClick={handleSend} disabled={uploading || !input.trim()}>
          {uploading ? <div className={styles.smallSpinner} /> : <Send size={20} color="#FFFFFF" />}
        </button>
      </div>
    </div>
  );
}
