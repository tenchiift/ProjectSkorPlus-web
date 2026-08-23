import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStudentSubmissionsForLecturer } from '../services/submissionService';
import styles from './SubmissionListScreen.module.css';

export default function LecturerStudentScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId } = useParams();
  const { user } = useAuth();

  const [student, setStudent] = useState(location.state?.student ?? null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !studentId) return;
    getStudentSubmissionsForLecturer(user.id, studentId)
      .then((list) => {
        setSubmissions(list);
        if (!student && list.length > 0) setStudent(list[0]?.student ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, studentId]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/inbox')} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>{student?.name ?? 'Student'}</h1>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>
        {student && (
          <div className={styles.groupHeader}>
            {student.photo_url ? (
              <img src={student.photo_url} alt="" className={styles.groupAvatar} />
            ) : (
              <div className={styles.groupAvatarPlaceholder}>
                <span>{(student?.name?.[0] || 'S').toUpperCase()}</span>
              </div>
            )}
            <div className={styles.groupNameCol}>
              <span className={styles.groupName}>{student.name ?? 'Student'}</span>
              {student.username && (
                <span className={styles.groupUsername}>@{student.username}</span>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : submissions.length === 0 ? (
          <div className={styles.center}><p className={styles.emptyText}>No submissions from this student.</p></div>
        ) : (
          submissions.map((sub) => {
            const fileNames = (sub.files ?? []).map((f) => f.file_name).filter(Boolean);
            const title = fileNames.length > 0
              ? (fileNames.length === 1 ? fileNames[0] : `${fileNames[0]} +${fileNames.length - 1} more`)
              : (sub.message || 'Submission');
            return (
              <button
                key={sub.id}
                className={styles.card}
                onClick={() => navigate(`/submission/${sub.id}`)}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.cardTitle}>
                    <FileText size={14} color="var(--color-text-secondary)" />
                    {title}
                  </span>
                  <ChevronRight size={18} color="var(--color-text-secondary)" />
                </div>
                <div className={styles.cardBodyRow}>
                  {sub.message
                    ? <p className={styles.cardMessage}>{sub.message}</p>
                    : <span />}
                  <span className={styles.cardMeta}>
                    <span className={styles.cardTime}>
                      {new Date(sub.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className={`${styles.statusBadge} ${sub.status === 'reviewed' ? styles.statusReviewed : styles.statusPending}`}>
                      {sub.status === 'reviewed' ? 'Reviewed' : 'New'}
                    </span>
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
