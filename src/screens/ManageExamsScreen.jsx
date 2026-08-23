import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Pencil, Trash2, FileText, Upload } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
  uploadExamPdf,
} from '../services/examService';
import styles from './ManageExamsScreen.module.css';

const BLANK = { title: '', subject: '', semester: '', year: '' };

export default function ManageExamsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!['lecturer', 'admin'].includes(data?.role)) {
          navigate('/dashboard', { replace: true });
        } else {
          setChecking(false);
          load();
        }
      });
  }, [user, navigate]);

  const load = async () => {
    try {
      setExams(await getExams());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(BLANK);
    setPdfFile(null);
    setPdfName('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (exam) => {
    setEditId(exam.id);
    setForm({
      title: exam.title ?? '',
      subject: exam.subject ?? '',
      semester: exam.semester ?? '',
      year: exam.year ?? '',
    });
    setPdfFile(null);
    setPdfName(exam.pdf_url ? 'Current PDF kept' : '');
    setError('');
    setModalOpen(true);
  };

  const handlePickPdf = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please choose a PDF file.');
      return;
    }
    setPdfFile(file);
    setPdfName(file.name);
    e.target.value = '';
  };

  const handleSave = async () => {
    const title = form.title.trim();
    if (!title) {
      setError('Title is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      let pdfUrl;
      if (pdfFile) {
        pdfUrl = await uploadExamPdf(pdfFile);
      }
      const payload = {
        title,
        subject: form.subject.trim() || null,
        semester: form.semester.trim() || null,
        year: form.year ? Number(form.year) : null,
        ...(pdfUrl ? { pdf_url: pdfUrl } : {}),
      };
      if (editId) {
        await updateExam(editId, payload);
      } else {
        await createExam(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      setError('Failed to save. Check that the migration has been applied.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (exam) => {
    if (!window.confirm(`Delete "${exam.title}"? Students will no longer see it.`)) return;
    try {
      await deleteExam(exam.id);
      await load();
    } catch (err) {
      console.error(err);
      alert('Failed to delete.');
    }
  };

  if (checking) {
    return <div className={styles.container}><div className={styles.center}><div className={styles.spinner} /></div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <button className={styles.newBtn} onClick={openCreate}>
          <Plus size={18} color="#FFFFFF" />
          <span>Add Paper</span>
        </button>
      </div>

      <div className={styles.scroll}>
        <h2 className={styles.pageTitle}>Past Papers</h2>
        <p className={styles.pageSub}>Manage exam papers — students see these instantly in Final Exam & Scan Solve.</p>

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : exams.length === 0 ? (
          <div className={styles.emptyCard}>
            <FileText size={32} color="var(--color-text-secondary)" />
            <span className={styles.emptyText}>No papers yet. Add the first one!</span>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className={styles.card}>
              <div className={styles.row}>
                <div className={styles.info}>
                  <span className={styles.title}>{exam.title}</span>
                  <span className={styles.sub}>
                    {[exam.subject, exam.semester, exam.year ? `Year ${exam.year}` : null].filter(Boolean).join(' · ') || 'No details'}
                  </span>
                  <span className={`${styles.pdfBadge} ${exam.pdf_url ? styles.pdfYes : styles.pdfNo}`}>
                    {exam.pdf_url ? 'PDF attached' : 'No PDF'}
                  </span>
                </div>
                <div className={styles.actions}>
                  <button className={styles.iconBtn} onClick={() => openEdit(exam)} title="Edit">
                    <Pencil size={17} color="var(--color-text-secondary)" />
                  </button>
                  <button className={styles.iconBtn} onClick={() => handleDelete(exam)} title="Delete">
                    <Trash2 size={17} color="var(--color-error)" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{editId ? 'Edit Paper' : 'Add Past Paper'}</h3>
              <button className={styles.modalClose} onClick={() => setModalOpen(false)}>
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            <div className={styles.formBody}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Title *</label>
                <input
                  className={styles.input}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Final Exam 2025"
                />
              </div>
              <div className={styles.inputPair}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Subject</label>
                  <input
                    className={styles.input}
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Year</label>
                  <input
                    className={styles.input}
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                    placeholder="e.g. 2025"
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Semester</label>
                <input
                  className={styles.input}
                  value={form.semester}
                  onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}
                  placeholder="e.g. Semester 2"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>PDF File</label>
                <div className={styles.uploadRow}>
                  <span className={styles.pdfFileName}>{pdfName || 'No file chosen'}</span>
                  <label className={styles.uploadBtn}>
                    <Upload size={15} color="var(--color-text-secondary)" />
                    <span>{pdfFile ? 'Change' : 'Choose PDF'}</span>
                    <input type="file" accept="application/pdf" onChange={handlePickPdf} hidden />
                  </label>
                </div>
              </div>
              {error && <p className={styles.errorText}>{error}</p>}
              <button className={styles.submitBtn} onClick={handleSave} disabled={busy}>
                {busy ? 'Saving...' : editId ? 'Save Changes' : 'Add Paper'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
