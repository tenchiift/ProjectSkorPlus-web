import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Send, Sparkles, MessageCircle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createConversation,
  getConversations,
  getMessages,
  addMessage,
  updateConversationTitle,
  getAiReply,
} from '../services/aiChatService';
import styles from './AiChatScreen.module.css';

export default function AiChatScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    getConversations(user.id)
      .then((list) => {
        setConversations(list);
        if (list.length > 0) {
          setActiveId(list[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    getMessages(activeId)
      .then(setMessages)
      .catch(console.error);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, waiting]);

  const handleNewChat = async () => {
    if (!user) return;
    const conv = await createConversation(user.id);
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || waiting) return;
    setError(null);

    let convId = activeId;
    if (!convId) {
      const conv = await createConversation(user.id);
      setConversations((prev) => [conv, ...prev]);
      convId = conv.id;
      setActiveId(conv.id);
      await updateConversationTitle(conv.id, text.slice(0, 40));
    } else if (messages.length === 0) {
      await updateConversationTitle(convId, text.slice(0,40));
    }

    await addMessage(convId, 'user', text);
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);

    setWaiting(true);
    try {
      // `messages` here is the state before this send, so append the new
      // user message to give the AI the full conversation context.
      const history = [...messages, { role: 'user', content: text }].map(
        ({ role, content }) => ({ role, content })
      );
      const reply = await getAiReply(history);
      await addMessage(convId, 'assistant', reply);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('AI reply error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setWaiting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.headerBtn} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={22} color="var(--color-text-primary)" />
        </button>
        <div className={styles.headerTitleWrap}>
          <Sparkles size={18} color="var(--color-primary)" />
          <h1 className={styles.headerTitle}>AI Study Buddy</h1>
        </div>
        <button className={styles.headerBtn} onClick={handleNewChat} aria-label="New chat">
          <Plus size={22} color="var(--color-primary)" />
        </button>
      </div>

      <div className={styles.body}>
        {conversations.length > 0 && (
          <div className={styles.history}>
            <span className={styles.historyLabel}>Recent chats</span>
            {conversations.map((c) => (
              <button
                key={c.id}
                className={`${styles.historyItem} ${c.id === activeId ? styles.historyItemActive : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <MessageCircle size={14} color="var(--color-text-secondary)" />
                <span className={styles.historyTitle}>{c.title}</span>
              </button>
            ))}
          </div>
        )}

        <div className={styles.chat}>
          {loading ? (
            <div className={styles.center}><div className={styles.spinner} /></div>
          ) : messages.length === 0 && !waiting ? (
            <div className={styles.center}>
              <div className={styles.emptyIcon}><Sparkles size={28} color="var(--color-primary)" /></div>
              <p className={styles.emptyTitle}>Ask me anything!</p>
              <p className={styles.emptySub}>I'm your AI study buddy — here to help you learn.</p>
            </div>
          ) : (
            <div className={styles.messages}>
              {messages.map((m) => {
                const mine = m.role === 'user';
                return (
                  <div key={m.id} className={`${styles.bubbleRow} ${mine ? styles.bubbleRowMine : ''}`}>
                    <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                      <p className={styles.bubbleText}>{m.content}</p>
                    </div>
                  </div>
                );
              })}
              {waiting && (
                <div className={styles.bubbleRow}>
                  <div className={`${styles.bubble} ${styles.bubbleTheirs}`}>
                    <div className={styles.typing}>
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.errorBar}>
          <span className={styles.errorText}>{error}</span>
          <button className={styles.errorClose} onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={16} color="var(--color-error)" />
          </button>
        </div>
      )}

      <div className={styles.inputBar}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask your study buddy..."
        />
        <button className={styles.sendBtn} onClick={handleSend} disabled={waiting || !input.trim()}>
          <Send size={20} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
}
