import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSubmission, getMessages, sendMessage, markSubmissionStatus } from '../services/submissionService';
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
  const isLecturer = submission?.lecturer_id === user.id;

  const handleMarkReviewed = async () => {
    const next = submission.status === 'reviewed' ? 'submitted' : 'reviewed';
    try {
      await markSubmissionStatus(id, next);
      setSubmission((s) => ({ ...s, status: next }));
    } catch (err) {
      console.error('Mark reviewed error:', err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>{other?.name ?? 'Conversation'}</h1>
        <div className={styles.headerSpacer} />
      </div>

      {isLecturer && (
        <div className={styles.reviewBar}>
          <button
            className={`${styles.markBtn} ${submission.status === 'reviewed' ? styles.markBtnDone : ''}`}
            onClick={handleMarkReviewed}
          >
            {submission.status === 'reviewed' ? '✓ Reviewed' : 'Mark as Reviewed'}
          </button>
        </div>
      )}

      <div className={styles.scroll}>
        {submission?.message && (
          <div className={styles.initialMessage}>
            <p className={styles.initialMessageText}>{submission.message}</p>
          </div>
        )}

        {submission?.files?.length > 0 && (
          <div className={styles.fileCards}>
            {submission.files.map((f) => (
              <button
                key={f.id}
                className={styles.fileCard}
                onClick={() => {
                  if (f.file_type === 'pdf') {
                    navigate('/pdf-viewer', {
                      state: { exam: { title: f.file_name ?? 'Attachment', pdf_url: f.file_url } },
                    });
                  } else {
                    window.open(f.file_url, '_blank', 'noopener');
                  }
                }}
              >
                <FileText size={18} color="var(--color-primary)" />
                <span className={styles.fileCardName}>{f.file_name ?? 'Attachment'}</span>
                <span className={styles.fileCardType}>{f.file_type === 'pdf' ? 'PDF' : 'Image'}</span>
              </button>
            ))}
          </div>
        )}

        <div className={styles.messages}>
          {messages.map((m) => {
            // Lecturer bubbles sit on the right, student bubbles on the left,
            // no matter who is viewing the thread.
            const fromLecturer = m.sender_id === submission?.lecturer_id;
            return (
              <div key={m.id} className={`${styles.bubbleRow} ${fromLecturer ? styles.bubbleRowMine : ''}`}>
                <div className={`${styles.bubble} ${fromLecturer ? styles.bubbleMine : styles.bubbleTheirs}`}>
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
