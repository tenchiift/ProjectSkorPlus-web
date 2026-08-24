import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStudentSubmissions } from '../services/submissionService';
import styles from './SubmissionListScreen.module.css';

export default function MySubmissionsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getStudentSubmissions(user.id)
      .then(setSubmissions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // Group submissions under each lecturer (lecturers listed once).
  const groups = [];
  const byLecturer = {};
  submissions.forEach((sub) => {
    const key = sub.lecturer?.id ?? 'unknown';
    if (!byLecturer[key]) {
      byLecturer[key] = { lecturer: sub.lecturer, items: [] };
      groups.push(byLecturer[key]);
    }
    byLecturer[key].items.push(sub);
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
        <h1 className={styles.pageTitle}>My Submissions</h1>
        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : submissions.length === 0 ? (
          <div className={styles.center}><p className={styles.emptyText}>No submissions yet.</p></div>
        ) : (
          groups.map((group) => (
            <div key={group.lecturer?.id ?? 'unknown'} className={styles.lecturerGroup}>
              <div className={styles.groupHeader}>
                {group.lecturer?.photo_url ? (
                  <img src={group.lecturer.photo_url} alt="" className={styles.groupAvatar} />
                ) : (
                  <div className={styles.groupAvatarPlaceholder}>
                    <span>{(group.lecturer?.name?.[0] || 'L').toUpperCase()}</span>
                  </div>
                )}
                <div className={styles.groupNameCol}>
                  <span className={styles.groupName}>{group.lecturer?.name ?? 'Lecturer'}</span>
                  {group.lecturer?.username && (
                    <span className={styles.groupUsername}>@{group.lecturer.username}</span>
                  )}
                </div>
              </div>

              {group.items.map((sub) => {
                const fileNames = (sub.files ?? []).map((f) => f.file_name).filter(Boolean);
                const title = fileNames.length > 0
                  ? (fileNames.length === 1 ? fileNames[0] : `${fileNames[0]} +${fileNames.length - 1} more`)
                  : (sub.message || 'Submission');
                return (
                  <button
                    key={sub.id}
                    className={styles.subRow}
                    onClick={() => navigate(`/submission/${sub.id}`)}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.cardTitle}>
                        <FileText size={14} color="var(--color-text-secondary)" />
                        {title}
                      </span>
                      <span className={styles.cardTime}>
                        {new Date(sub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className={styles.cardBodyRow}>
                        {sub.message
                          ? <p className={styles.cardMessage}>{sub.message}</p>
                          : <span />}
                        <span className={`${styles.statusBadge} ${sub.status === 'reviewed' ? styles.statusReviewed : styles.statusPending}`}>
                          {sub.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                        </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
