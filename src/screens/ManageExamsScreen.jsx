import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Pencil, Trash2, FileText, Upload, Eye, FolderPlus } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import PaperFolder from '../components/PaperFolder';
import folderStyles from '../components/PaperFolder.module.css';
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
  uploadExamPdf,
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
} from '../services/examService';
import styles from './ManageExamsScreen.module.css';

// Folder = subtopic (e.g. Vector). Differentiation and Integration are
// placeholders until papers are added. Vector is not a placeholder: it
// comes from actual papers (renamed from Mathematics).
const FALLBACK_FOLDERS = ['Differentiation', 'Integration'];
const DEFAULT_FOLDER = 'Vector';

const normalizeFolder = (value) => {
  const name = (value ?? '').trim();
  return name || DEFAULT_FOLDER;
};

// Legacy subject names all mean the Vector subtopic.
const canonicalFolder = (value) => {
  const name = (value ?? '').trim();
  if (!name) return '';
  const lower = name.toLowerCase();
  if (lower === 'mathematics' || lower === 'discrete mathematics') return 'Vector';
  return name;
};

const BLANK = { title: '', folder: DEFAULT_FOLDER, semester: '', year: '' };

export default function ManageExamsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [exams, setExams] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [folderModal, setFolderModal] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [folderBusy, setFolderBusy] = useState(false);
  const [folderError, setFolderError] = useState('');

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
      const rows = await getExams();
      setExams(rows);
      try {
        setFolders(await getFolders());
      } catch (folderErr) {
        console.warn('Folders table missing, deriving from papers:', folderErr);
        setFolders([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = (prefillFolder) => {
    setEditId(null);
    setForm({ ...BLANK, folder: normalizeFolder(prefillFolder ?? DEFAULT_FOLDER) });
    setPdfFile(null);
    setPdfName('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (exam) => {
    setEditId(exam.id);
    setForm({
      title: exam.title ?? '',
      folder: normalizeFolder(exam.folder ?? exam.subject ?? ''),
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
        folder: normalizeFolder(form.folder),
        subject: 'Discrete Mathematics',
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

  const handleView = (exam) => {
    if (!exam.pdf_url) return;
    navigate('/pdf-viewer', { state: { exam } });
  };

  const openNewFolder = () => {
    setFolderModal({ mode: 'create', target: '' });
    setFolderName('');
    setFolderError('');
  };

  const openRenameFolder = (name) => {
    setFolderModal({ mode: 'rename', target: name });
    setFolderName(name);
    setFolderError('');
  };

  const handleSaveFolder = async () => {
    const clean = folderName.trim();
    if (!clean) {
      setFolderError('Folder name is required.');
      return;
    }
    const names = [...folderMap.keys()].map((n) => n.toLowerCase());
    const duplicate = names.includes(clean.toLowerCase()) && clean !== folderModal?.target;
    if (duplicate) {
      setFolderError('A folder with this name already exists.');
      return;
    }
    setFolderBusy(true);
    setFolderError('');
    try {
      if (folderModal?.mode === 'rename') {
        await renameFolder(folderModal.target, clean);
      } else {
        await createFolder(clean);
      }
      setFolderModal(null);
      await load();
    } catch (err) {
      console.error(err);
      setFolderError('Failed to save folder. It may already exist.');
    } finally {
      setFolderBusy(false);
    }
  };

  const handleDeleteFolder = async (name) => {
    const count = folderMap.get(name)?.length ?? 0;
    if (count > 0) {
      alert(`"${name}" still has ${count} ${count === 1 ? 'paper' : 'papers'}. Move or delete them first.`);
      return;
    }
    if (!window.confirm(`Delete empty folder "${name}"?`)) return;
    try {
      await deleteFolder(name);
      await load();
    } catch (err) {
      console.error(err);
      alert('Failed to delete folder.');
    }
  };

  if (checking) {
    return <div className={styles.container}><div className={styles.center}><div className={styles.spinner} /></div></div>;
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
  const existingFolders = [...folderMap.keys()].sort();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <div className={styles.headerActions}>
          <button className={styles.folderBtn} onClick={openNewFolder}>
            <FolderPlus size={18} />
            <span>New Folder</span>
          </button>
          <button className={styles.newBtn} onClick={() => openCreate()}>
            <Plus size={18} color="#FFFFFF" />
            <span>Add Paper</span>
          </button>
        </div>
      </div>

      <div className={styles.scroll}>
        <h2 className={styles.pageTitle}>Past Papers</h2>
        <p className={styles.pageSub}>Folders are subtopics. Students see these instantly in Final Exam and Scan Solve.</p>

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : folderMap.size === 0 ? (
          <div className={styles.emptyCard}>
            <FileText size={32} color="var(--color-text-secondary)" />
            <span className={styles.emptyText}>No folders yet. Create the first one!</span>
          </div>
        ) : (
          <div className={styles.folderGrid}>
            {sortedFolders.map(([folder, papers]) => (
              <div key={folder} className={styles.folderCell}>
                <PaperFolder
                  title={folder}
                  papers={papers}
                  onSelect={handleView}
                  onAdd={() => openCreate(folder)}
                  addLabel={`Add paper to ${folder}`}
                  renderActions={(paper, close) => (
                    <>
                      <button
                        type="button"
                        className={folderStyles.miniBtn}
                        onClick={() => { close(); handleView(paper); }}
                        disabled={!paper.pdf_url}
                        aria-label={`View ${paper.title}`}
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        type="button"
                        className={folderStyles.miniBtn}
                        onClick={() => { close(); openEdit(paper); }}
                        aria-label={`Edit ${paper.title}`}
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        className={folderStyles.miniBtn}
                        onClick={() => { close(); handleDelete(paper); }}
                        aria-label={`Delete ${paper.title}`}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </>
                  )}
                />
                <div className={styles.folderToolbar}>
                  <button
                    type="button"
                    className={styles.toolbarBtn}
                    onClick={() => openRenameFolder(folder)}
                    aria-label={`Rename ${folder} folder`}
                  >
                    <Pencil size={14} /> Rename
                  </button>
                  <button
                    type="button"
                    className={styles.toolbarBtnDanger}
                    onClick={() => handleDeleteFolder(folder)}
                    aria-label={`Delete ${folder} folder`}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {folderModal && (
        <div className={styles.modalOverlay} onClick={() => setFolderModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{folderModal.mode === 'rename' ? `Rename "${folderModal.target}"` : 'New Folder'}</h3>
              <button className={styles.modalClose} onClick={() => setFolderModal(null)} aria-label="Close folder dialog">
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            <div className={styles.formBody}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Folder name (subtopic) *</label>
                <input
                  className={styles.input}
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g. Vector"
                />
              </div>
              {folderError && <p className={styles.errorText}>{folderError}</p>}
              <button className={styles.submitBtn} onClick={handleSaveFolder} disabled={folderBusy}>
                {folderBusy ? 'Saving...' : folderModal.mode === 'rename' ? 'Save Changes' : 'Create Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <label className={styles.label}>Folder (subtopic)</label>
                  <input
                    className={styles.input}
                    value={form.folder}
                    onChange={(e) => setForm((f) => ({ ...f, folder: e.target.value }))}
                    placeholder="e.g. Vector"
                    list="exam-folder-options"
                  />
                  <datalist id="exam-folder-options">
                    {existingFolders.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
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
