import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllStudents } from '../services/userService';
import { getSubmissionCounts } from '../services/submissionService';
import listStyles from './SubmissionListScreen.module.css';
import styles from './LecturerStudentsScreen.module.css';

export default function LecturerStudentsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getAllStudents(), getSubmissionCounts(user.id)])
      .then(([list, c]) => {
        setStudents(list);
        setCounts(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const reviewedCount = counts.total - counts.pending;

  return (
    <div className={listStyles.container}>
      <div className={listStyles.header}>
        <button
          className={listStyles.backButton}
          onClick={() => navigate('/dashboard')}
          aria-label="Back"
        >
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <div className={listStyles.headerSpacer} />
      </div>

      <div className={listStyles.scroll}>
        <h1 className={listStyles.pageTitle}>Students</h1>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{counts.total}</span>
            <span className={styles.statLabel}>Submissions</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statPending}`}>{counts.pending}</span>
            <span className={styles.statLabel}>Pending</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statValue} ${styles.statReviewed}`}>{reviewedCount}</span>
            <span className={styles.statLabel}>Reviewed</span>
          </div>
        </div>

        {loading ? (
          <div className={listStyles.center}><div className={listStyles.spinner} /></div>
        ) : students.length === 0 ? (
          <div className={listStyles.center}><p className={listStyles.emptyText}>No registered students yet.</p></div>
        ) : (
          <div className={listStyles.studentList}>
            {students.map((student) => (
              <div key={student.id} className={styles.studentRow}>
                {student.photo_url ? (
                  <img src={student.photo_url} alt="" className={listStyles.rowAvatar} />
                ) : (
                  <div className={listStyles.rowAvatarPlaceholder}>
                    <span>{(student.name?.[0] || 'S').toUpperCase()}</span>
                  </div>
                )}
                <div className={listStyles.rowMain}>
                  <span className={listStyles.rowName}>{student.name ?? 'Student'}</span>
                  {student.username && (
                    <span className={listStyles.rowSub}>@{student.username}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
