import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLecturerSubmissions } from '../services/submissionService';
import { supabase } from '../config/supabase';
import { notifyEvent } from '../services/notificationService';
import styles from './SubmissionListScreen.module.css';

export default function LecturerInboxScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getLecturerSubmissions(user.id)
      .then(setSubmissions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const sub = supabase
      .channel(`submissions-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions', filter: `lecturer_id=eq.${user.id}` },
        (payload) => {
          notifyEvent(user.id, 'submission', 'Kerja baru masuk 📄', 'Ada student hantar kerja. Jom check!');
          getLecturerSubmissions(user.id).then(setSubmissions).catch(console.error);
        }
      )
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [user]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>Inbox</h1>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>
        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : submissions.length === 0 ? (
          <div className={styles.center}><p className={styles.emptyText}>No submissions yet.</p></div>
        ) : (
          submissions.map((sub) => (
            <button
              key={sub.id}
              className={styles.card}
              onClick={() => navigate(`/submission/${sub.id}`)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>{sub.student?.name ?? 'Student'}</span>
                <span className={styles.cardTime}>
                  {new Date(sub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              {sub.message && <p className={styles.cardMessage}>{sub.message}</p>}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
