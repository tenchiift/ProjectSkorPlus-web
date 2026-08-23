import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, Pencil, Trash2, ListChecks, Upload } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { getTopics, createTopic, updateTopic, deleteTopic, uploadTopicPdf } from '../services/moduleService';
import styles from './ManageModulesScreen.module.css';

const BLANK = { title: '', order: 1 };

export default function ManageTopicsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { moduleId } = useParams();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [moduleName, setModuleName] = useState(location.state?.module?.title ?? 'Module');
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfName, setPdfName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !moduleId) return;
    const init = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!['lecturer', 'admin'].includes(profile?.role)) {
        navigate('/dashboard', { replace: true });
        return;
      }
      setChecking(false);
      if (!location.state?.module?.title) {
        const { data: mod } = await supabase
          .from('modules')
          .select('title')
          .eq('id', moduleId)
          .single();
        if (mod?.title) setModuleName(mod.title);
      }
      load();
    };
    init();
  }, [user, moduleId, navigate]);

  const load = async () => {
    try {
      setTopics(await getTopics(moduleId));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...BLANK, order: (topics.length ?? 0) + 1 });
    setPdfFile(null);
    setPdfName('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (topic) => {
    setEditId(topic.id);
    setForm({ title: topic.title ?? '', order: topic.order_num ?? 1 });
    setPdfFile(null);
    setPdfName(topic.pdf_url ? 'Current PDF kept' : '');
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
        pdfUrl = await uploadTopicPdf(pdfFile);
      }
      const payload = {
        module_id: moduleId,
        title,
        order_num: Number(form.order) || 1,
        ...(pdfUrl ? { pdf_url: pdfUrl } : {}),
      };
      if (editId) {
        await updateTopic(editId, payload);
      } else {
        await createTopic(payload);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      setError('Failed to save. Check that module_topics_migration.sql has been applied.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (topic) => {
    if (!window.confirm(`Delete "${topic.title}"?`)) return;
    try {
      await deleteTopic(topic.id);
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
        <button className={styles.backButton} onClick={() => navigate('/manage-modules')}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <button className={styles.newBtn} onClick={openCreate}>
          <Plus size={18} color="#FFFFFF" />
          <span>Add Topic</span>
        </button>
      </div>

      <div className={styles.scroll}>
        <h2 className={styles.pageTitle}>{moduleName} — Topics</h2>
        <p className={styles.pageSub}>Subtopics shown as the notes checklist in the module page.</p>

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : topics.length === 0 ? (
          <div className={styles.emptyCard}>
            <ListChecks size={32} color="var(--color-text-secondary)" />
            <span className={styles.emptyText}>No topics yet. Add the first subtopic!</span>
          </div>
        ) : (
          topics.map((topic) => (
            <div key={topic.id} className={styles.card}>
              <div className={styles.row}>
                <div className={styles.info}>
                  <span className={styles.title}>{topic.title}</span>
                  <span className={styles.sub}>{topic.pdf_url ? 'PDF attached' : 'No PDF'}</span>
                </div>
                <span className={styles.orderBadge}>#{topic.order_num}</span>
                <div className={styles.actions}>
                  <button className={styles.iconBtn} onClick={() => openEdit(topic)} title="Edit">
                    <Pencil size={17} color="var(--color-text-secondary)" />
                  </button>
                  <button className={styles.iconBtn} onClick={() => handleDelete(topic)} title="Delete">
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
              <h3 className={styles.modalTitle}>{editId ? 'Edit Topic' : 'Add Topic'}</h3>
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
                  placeholder="e.g. 4.1 Introduction to Vector"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Order</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Notes PDF</label>
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
                {busy ? 'Saving...' : editId ? 'Save Changes' : 'Add Topic'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
