import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Search } from 'lucide-react';
import { supabase } from '../config/supabase';
import styles from './FinalExamScreen.module.css';

export default function FinalExamScreen() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (err) {
      console.error('Fetch exams error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>Past Papers</h1>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scrollContent}>
        {exams.length === 0 ? (
          <div className={styles.emptyState}>
            <Search size={48} color="var(--color-text-secondary)" />
            <p className={styles.emptyTitle}>No exam papers yet</p>
            <p className={styles.emptySubtitle}>
              Exam papers will appear here once added.
            </p>
          </div>
        ) : (
          exams.map((exam) => (
            <button
              key={exam.id}
              className={styles.examCard}
              onClick={() => navigate('/pdf-viewer', { state: { exam } })}
            >
              <div className={styles.examIcon}>
                <FileText size={28} color="#FFFFFF" />
              </div>
              <div className={styles.examInfo}>
                <p className={styles.examTitle}>{exam.title}</p>
                {exam.subject ? (
                  <p className={styles.examMeta}>
                    {exam.subject}{exam.semester ? ` \u2014 ${exam.semester}` : ''}
                  </p>
                ) : null}
                {exam.year ? (
                  <p className={styles.examYear}>Year {exam.year}</p>
                ) : null}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
