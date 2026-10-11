import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import PaperFolder from '../components/PaperFolder';
import { supabase } from '../config/supabase';
import styles from './FinalExamScreen.module.css';

// Lecturer-created subtopics. Differentiation and Integration are
// placeholders until papers are added. Used as fallback when the
// exam_folders migration has not been applied yet. Vector is not a
// placeholder: it comes from actual papers (renamed from Mathematics).
const FALLBACK_FOLDERS = ['Differentiation', 'Integration'];

// Legacy subject names all mean the Vector subtopic.
const canonicalFolder = (value) => {
  const name = (value ?? '').trim();
  if (!name) return '';
  const lower = name.toLowerCase();
  if (lower === 'mathematics' || lower === 'discrete mathematics') return 'Vector';
  return name;
};

export default function FinalExamScreen() {
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const { data: examRows, error: supabaseError } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      // Folders live in their own table so empty subtopics still show.
      // If the migration is not applied yet, fall back to folders seen
      // in exams plus the three known subtopics.
      let folderNames = [];
      try {
        const { data: folderRows, error: folderError } = await supabase
          .from('exam_folders')
          .select('name')
          .order('name', { ascending: true });
        if (folderError) throw folderError;
        folderNames = (folderRows ?? []).map((row) => canonicalFolder(row.name)).filter(Boolean);
      } catch (folderErr) {
        console.warn('Fetch folders fallback:', folderErr);
        folderNames = [];
      }

      setExams(examRows || []);
      setFolders(folderNames);
    } catch (err) {
      console.error('Fetch exams error:', err);
      setError(err?.message || 'Failed to load exam papers');
      setExams([]);
      setFolders([]);
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

  const folderMap = new Map();
  const ensureFolder = (name) => {
    const clean = canonicalFolder(name);
    if (!clean) return '';
    if (!folderMap.has(clean)) folderMap.set(clean, []);
    return clean;
  };
  for (const name of [...folders, ...FALLBACK_FOLDERS]) ensureFolder(name);
  for (const exam of exams) {
    const clean = ensureFolder(exam.folder ?? exam.subject ?? '') || 'Vector';
    if (!folderMap.has(clean)) folderMap.set(clean, []);
    folderMap.get(clean).push(exam);
  }
  // Folders with papers first (most papers first), empty placeholders last.
  const sortedFolders = [...folderMap].sort(
    ([nameA, papersA], [nameB, papersB]) =>
      Number(papersB.length > 0) - Number(papersA.length > 0)
      || papersB.length - papersA.length
      || nameA.localeCompare(nameB),
  );

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
        <p className={styles.pageSub}>Choose a subtopic folder to practice with previous questions.</p>

        {error ? (
          <div className={styles.errorState}>
            <AlertTriangle size={48} color="var(--color-error)" />
            <p className={styles.errorTitle}>Failed to load</p>
            <p className={styles.errorMessage}>{error}</p>
            <button className={styles.retryBtn} onClick={() => fetchExams(true)}>
              Retry
            </button>
          </div>
        ) : folderMap.size === 0 ? (
          <div className={styles.emptyState}>
            <Search size={48} color="var(--color-text-secondary)" />
            <p className={styles.emptyTitle}>No exam papers yet</p>
            <p className={styles.emptySubtitle}>
              Exam papers will appear here once added.
            </p>
          </div>
        ) : (
          <div className={styles.folderGrid}>
            {sortedFolders.map(([folder, papers]) => (
              <PaperFolder
                key={folder}
                title={folder}
                papers={papers}
                onSelect={(exam) => navigate('/pdf-viewer', { state: { exam } })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
