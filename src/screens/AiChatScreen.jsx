import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Send, Sparkles, MessageCircle, X, Menu, Zap, ChevronDown, Pencil, Trash2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createConversation,
  getConversations,
  getMessages,
  addMessage,
  updateConversationTitle,
  deleteConversation,
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
  const [chatDropdown, setChatDropdown] = useState(false);
  const [modeDropdown, setModeDropdown] = useState(false);
  const [tipsDropdown, setTipsDropdown] = useState(false);
  const [persona, setPersona] = useState('chill');
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const bottomRef = useRef(null);

  const AI_MODES = [
    { id: 'chill', label: 'Chill', desc: 'Casual, friendly, light slang' },
    { id: 'formal', label: 'Formal', desc: 'Professional & structured' },
    { id: 'exam', label: 'Exam Prep', desc: 'Focused, exam-style answers' },
  ];

  const QUICK_TIPS = [
    'Explain this topic simply',
    'Give me study tips',
    'Quiz me on this',
    'Summarize key points',
    'Help me plan my study schedule',
  ];

  useEffect(() => {
    try {
      const saved = localStorage.getItem('skorplus-ai-persona') || 'chill';
      setPersona(saved);
    } catch { /* ignore */ }
  }, []);

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
    setChatDropdown(false);
  };

  const handleModeChange = (modeId) => {
    setPersona(modeId);
    try { localStorage.setItem('skorplus-ai-persona', modeId); } catch { /* ignore */ }
    setModeDropdown(false);
  };

  const handleQuickTip = (tip) => {
    setInput(tip);
    setTipsDropdown(false);
  };

  const handleDelete = async (id) => {
    await deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      setActiveId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleRename = async (id) => {
    const newTitle = editValue.trim();
    if (!newTitle) return;
    await updateConversationTitle(id, newTitle);
    setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: newTitle } : c));
    setEditingId(null);
  };

  const getModeLabel = () => AI_MODES.find((m) => m.id === persona)?.label || 'Chill';

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
      await updateConversationTitle(convId, text.slice(0, 40));
    }

    await addMessage(convId, 'user', text);
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);

    setWaiting(true);
    try {
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

      <div className={styles.mobileToolbar}>
        <button
          className={styles.toolbarPill}
          onClick={() => { setChatDropdown((v) => !v); setModeDropdown(false); setTipsDropdown(false); }}
          aria-label="Chat sessions"
        >
          <Menu size={18} color="var(--color-text-secondary)" />
          <span className={styles.toolbarPillText}>Chats</span>
        </button>

        <button
          className={styles.toolbarPill}
          onClick={() => { setModeDropdown((v) => !v); setChatDropdown(false); setTipsDropdown(false); }}
          aria-label="AI mode"
        >
          <Sparkles size={16} color="var(--color-primary)" />
          <span className={styles.toolbarPillText}>{getModeLabel()}</span>
          <ChevronDown size={14} color="var(--color-text-secondary)" />
        </button>

        <button
          className={styles.toolbarPill}
          onClick={() => { setTipsDropdown((v) => !v); setChatDropdown(false); setModeDropdown(false); }}
          aria-label="Quick tips"
        >
          <Zap size={16} color="var(--color-primary)" />
          <span className={styles.toolbarPillText}>Tips</span>
        </button>
      </div>

      {chatDropdown && (
        <div className={styles.chatDropdownOverlay} onClick={() => setChatDropdown(false)}>
          <div className={styles.chatDropdown} onClick={(e) => e.stopPropagation()}>
            <div className={styles.chatDropdownHeader}>
              <span className={styles.chatDropdownTitle}>Chat Sessions</span>
              <div className={styles.chatDropdownActions}>
                <button className={styles.chatDropdownEdit} onClick={() => setEditMode((v) => !v)}>
                  {editMode ? <Check size={16} color="var(--color-primary)" /> : <Pencil size={16} color="var(--color-text-secondary)" />}
                  <span>{editMode ? 'Done' : 'Edit'}</span>
                </button>
                <button className={styles.chatDropdownNew} onClick={handleNewChat}>
                  <Plus size={16} color="var(--color-primary)" />
                  <span>New</span>
                </button>
              </div>
            </div>
            {conversations.length === 0 ? (
              <p className={styles.chatDropdownEmpty}>No chats yet</p>
            ) : (
              conversations.map((c) => (
                <div key={c.id} className={`${styles.chatDropdownRow} ${c.id === activeId ? styles.chatDropdownRowActive : ''}`}>
                  {editingId === c.id ? (
                    <div className={styles.chatDropdownEditRow}>
                      <input
                        className={styles.chatDropdownInput}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename(c.id)}
                        autoFocus
                      />
                      <button className={styles.chatDropdownSave} onClick={() => handleRename(c.id)}>
                        <Check size={16} color="#FFFFFF" />
                      </button>
                      <button className={styles.chatDropdownCancel} onClick={() => setEditingId(null)}>
                        <X size={16} color="var(--color-text-secondary)" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        className={styles.chatDropdownItem}
                        onClick={() => { setActiveId(c.id); setChatDropdown(false); }}
                      >
                        <span className={styles.chatDropdownItemText}>{c.title}</span>
                      </button>
                      {editMode && (
                        <div className={styles.chatDropdownItemActions}>
                          <button
                            className={styles.chatDropdownPillBtn}
                            onClick={() => { setEditingId(c.id); setEditValue(c.title); }}
                          >
                            Rename
                          </button>
                          <button
                            className={styles.chatDropdownPillBtnDanger}
                            onClick={() => handleDelete(c.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {modeDropdown && (
        <div className={styles.chatDropdownOverlay} onClick={() => setModeDropdown(false)}>
          <div className={styles.chatDropdown} onClick={(e) => e.stopPropagation()}>
            <div className={styles.chatDropdownHeader}>
              <span className={styles.chatDropdownTitle}>AI Mode</span>
            </div>
            {AI_MODES.map((m) => (
              <button
                key={m.id}
                className={`${styles.chatDropdownItem} ${m.id === persona ? styles.chatDropdownItemActive : ''}`}
                onClick={() => handleModeChange(m.id)}
              >
                <div className={styles.modeItemContent}>
                  <span className={styles.modeItemLabel}>{m.label}</span>
                  <span className={styles.modeItemDesc}>{m.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tipsDropdown && (
        <div className={styles.chatDropdownOverlay} onClick={() => setTipsDropdown(false)}>
          <div className={styles.chatDropdown} onClick={(e) => e.stopPropagation()}>
            <div className={styles.chatDropdownHeader}>
              <span className={styles.chatDropdownTitle}>Quick Tips</span>
            </div>
            {QUICK_TIPS.map((tip) => (
              <button
                key={tip}
                className={styles.chatDropdownItem}
                onClick={() => handleQuickTip(tip)}
              >
                <Zap size={14} color="var(--color-text-secondary)" />
                <span className={styles.chatDropdownItemText}>{tip}</span>
              </button>
            ))}
          </div>
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
