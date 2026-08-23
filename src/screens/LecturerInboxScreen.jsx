import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLecturerSubmissions } from '../services/submissionService';
import { supabase } from '../config/supabase';
import styles from './SubmissionListScreen.module.css';

export default function LecturerInboxScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = () => {
    getLecturerSubmissions(user.id)
      .then(setSubmissions)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const sub = supabase
      .channel(`inbox-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions', filter: `lecturer_id=eq.${user.id}` },
        () => load()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'submissions', filter: `lecturer_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [user]);

  // Group by student — the inbox lists each student once with their counts.
  const students = [];
  const byStudent = {};
  submissions.forEach((sub) => {
    const key = sub.student?.id ?? 'unknown';
    if (!byStudent[key]) {
      byStudent[key] = { student: sub.student, items: [] };
      students.push(byStudent[key]);
    }
    byStudent[key].items.push(sub);
  });
  students.forEach((g) => {
    g.total = g.items.length;
    g.pending = g.items.filter((s) => s.status !== 'reviewed').length;
    g.reviewed = g.total - g.pending;
  });

  const visibleStudents = students.filter((g) => {
    if (filter === 'pending') return g.pending > 0;
    if (filter === 'reviewed') return g.reviewed > 0;
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>
        <h1 className={styles.pageTitle}>Inbox</h1>

        <div className={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'reviewed', label: 'Reviewed' },
          ].map((f) => (
            <button
              key={f.key}
              className={`${styles.filterChip} ${filter === f.key ? styles.filterChipActive : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : visibleStudents.length === 0 ? (
          <div className={styles.center}><p className={styles.emptyText}>No submissions yet.</p></div>
        ) : (
          visibleStudents.map((group) => (
            <button
              key={group.student?.id ?? 'unknown'}
              className={styles.card}
              onClick={() => group.student && navigate(`/student/${group.student.id}`, { state: { student: group.student } })}
            >
              <div className={styles.cardHeader}>
                <div className={styles.studentRowLeft}>
                  {group.student?.photo_url ? (
                    <img src={group.student.photo_url} alt="" className={styles.groupAvatar} />
                  ) : (
                    <div className={styles.groupAvatarPlaceholder}>
                      <span>{(group.student?.name?.[0] || 'S').toUpperCase()}</span>
                    </div>
                  )}
                  <div className={styles.groupNameCol}>
                    <span className={styles.groupName}>{group.student?.name ?? 'Student'}</span>
                    {group.student?.username && (
                      <span className={styles.groupUsername}>@{group.student.username}</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} color="var(--color-text-secondary)" />
              </div>
              <div className={styles.countRow}>
                <span className={styles.countChip}>
                  <b>{group.total}</b> submitted
                </span>
                <span className={`${styles.countChip} ${styles.countPending}`}>
                  <b>{group.pending}</b> pending
                </span>
                <span className={`${styles.countChip} ${styles.countReviewed}`}>
                  <b>{group.reviewed}</b> reviewed
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
