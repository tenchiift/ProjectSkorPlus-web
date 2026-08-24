import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '../config/supabase';
import styles from './FinalExamScreen.module.css';

export default function FinalExamScreen() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      setExams(data || []);
    } catch (err) {
      console.error('Fetch exams error:', err);
      setError(err?.message || 'Failed to load exam papers');
      setExams([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  if (loading && !refreshing) {
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
        <button className={styles.backButton} onClick={() => fetchExams(true)} disabled={refreshing} aria-label="Refresh">
          <RefreshCw size={20} color="var(--color-text-primary)" className={refreshing ? styles.spinIcon : ''} />
        </button>
      </div>

      <div className={styles.scrollContent}>
        <h1 className={styles.pageTitle}>Past Papers</h1>

        {error ? (
          <div className={styles.errorState}>
            <AlertTriangle size={48} color="var(--color-error)" />
            <p className={styles.errorTitle}>Failed to load</p>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryBtn} onClick={() => fetchExams(true)}>
              Retry
            </button>
          </div>
        ) : exams.length === 0 ? (
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
