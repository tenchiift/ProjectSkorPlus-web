import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllStudents } from '../services/userService';
import { getStudentsForLecturer } from '../services/moduleService';
import { getSubmissionCounts } from '../services/submissionService';
import ClassTabs from '../components/ClassTabs';
import listStyles from './SubmissionListScreen.module.css';
import styles from './LecturerStudentsScreen.module.css';

export default function LecturerStudentsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [mine, setMine] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    Promise.all([getAllStudents(), getStudentsForLecturer(user.id), getSubmissionCounts(user.id)])
      .then(([list, myStudents, c]) => {
        setStudents(list);
        setMine(myStudents);
        setCounts(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const reviewedCount = counts.total - counts.pending;

  // Auto-detected classes from My Students (no hardcoding — a new class
  // appears here on its own once a student of that class selects you).
  const classCounts = {};
  mine.forEach((s) => {
    if (s.class_code) classCounts[s.class_code] = (classCounts[s.class_code] || 0) + 1;
  });
  const classTabs = [
    { value: 'all', label: 'All', count: mine.length },
    ...Object.keys(classCounts).sort().map((c) => ({ value: c, label: c, count: classCounts[c] })),
  ];
  const visibleMine = classFilter === 'all' ? mine : mine.filter((s) => s.class_code === classFilter);

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

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>My Students</h2>
          <span className={styles.sectionCount}>{mine.length}</span>
        </div>
        {!loading && mine.length > 0 && (
          <ClassTabs tabs={classTabs} value={classFilter} onChange={setClassFilter} />
        )}
        {loading ? null : mine.length === 0 ? (
          <p className={listStyles.emptyText} style={{ padding: '16px 0' }}>No students have selected you yet.</p>
        ) : visibleMine.length === 0 ? (
          <p className={listStyles.emptyText} style={{ padding: '16px 0' }}>No students in this class yet.</p>
        ) : (
          <div className={listStyles.studentList} style={{ marginBottom: '24px' }}>
            {visibleMine.map((student) => (
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
                {student.class_code && (
                  <span className={styles.sectionCount}>{student.class_code}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>All Students</h2>
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
