import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSubmission, getMessages, sendMessage } from '../services/submissionService';
import styles from './SubmissionThreadScreen.module.css';

export default function SubmissionThreadScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [submission, setSubmission] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = async () => {
    try {
      const sub = await getSubmission(id);
      setSubmission(sub);
      const msgs = await getMessages(id);
      setMessages(msgs);
    } catch (err) {
      console.error('Load thread error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      await sendMessage(id, user.id, text);
      setBody('');
      const msgs = await getMessages(id);
      setMessages(msgs);
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.center}><div className={styles.spinner} /></div>
      </div>
    );
  }

  const other = submission?.student_id === user.id ? submission?.lecturer : submission?.student;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>{other?.name ?? 'Conversation'}</h1>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>
        {submission?.message && (
          <div className={styles.initialMessage}>
            <p className={styles.initialMessageText}>{submission.message}</p>
          </div>
        )}

        {submission?.files?.length > 0 && (
          <div className={styles.filesRow}>
            {submission.files.map((f) => (
              f.file_type === 'image' ? (
                <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer">
                  <img src={f.file_url} alt="" className={styles.fileImage} />
                </a>
              ) : (
                <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer" className={styles.filePdf}>
                  <FileText size={20} color="var(--color-primary)" />
                  <span>PDF</span>
                </a>
              )
            ))}
          </div>
        )}

        <div className={styles.messages}>
          {messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`${styles.bubbleRow} ${mine ? styles.bubbleRowMine : ''}`}>
                <div className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                  <p className={styles.bubbleText}>{m.body}</p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className={styles.inputBar}>
        <input
          className={styles.input}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button className={styles.sendBtn} onClick={handleSend} disabled={sending || !body.trim()}>
          <Send size={20} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
}
