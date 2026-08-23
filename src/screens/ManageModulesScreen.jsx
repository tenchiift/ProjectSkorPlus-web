import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Pencil, Trash2, Layers, ListChecks } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { getModules, createModule, updateModule, deleteModule } from '../services/moduleService';
import styles from './ManageModulesScreen.module.css';

const BLANK = { title: '', description: '', color: 'purple', order: 1 };

export default function ManageModulesScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK);
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
      setModules(await getModules());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...BLANK, order: (modules.length ?? 0) + 1 });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (mod) => {
    setEditId(mod.id);
    setForm({
      title: mod.title ?? '',
      description: mod.description ?? '',
      color: mod.color ?? 'purple',
      order: mod.order ?? 1,
    });
    setError('');
    setModalOpen(true);
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
      const payload = {
        title,
        description: form.description.trim() || null,
        color: form.color === 'amber' ? 'amber' : 'purple',
        order: Number(form.order) || 1,
      };
      if (editId) {
        await updateModule(editId, payload);
      } else {
        await createModule(payload);
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

  const handleDelete = async (mod) => {
    if (!window.confirm(`Delete module "${mod.title}"?`)) return;
    try {
      await deleteModule(mod.id);
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
          <span>Add Module</span>
        </button>
      </div>

      <div className={styles.scroll}>
        <h2 className={styles.pageTitle}>Modules</h2>
        <p className={styles.pageSub}>Manage learning modules — students see these on their dashboard.</p>

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : modules.length === 0 ? (
          <div className={styles.emptyCard}>
            <Layers size={32} color="var(--color-text-secondary)" />
            <span className={styles.emptyText}>No modules yet. Add the first one!</span>
          </div>
        ) : (
          modules.map((mod) => (
            <div key={mod.id} className={styles.card}>
              <div className={styles.row}>
                <span className={`${styles.colorDot} ${mod.color === 'amber' ? styles.colorAmber : styles.colorPurple}`} />
                <div className={styles.info}>
                  <span className={styles.title}>{mod.title}</span>
                  <span className={styles.sub}>{mod.description || 'No description'}</span>
                </div>
                <span className={styles.orderBadge}>#{mod.order}</span>
                <div className={styles.actions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => navigate(`/manage-topics/${mod.id}`, { state: { module: mod } })}
                    title="Topics"
                  >
                    <ListChecks size={17} color="var(--color-primary)" />
                  </button>
                  <button className={styles.iconBtn} onClick={() => openEdit(mod)} title="Edit">
                    <Pencil size={17} color="var(--color-text-secondary)" />
                  </button>
                  <button className={styles.iconBtn} onClick={() => handleDelete(mod)} title="Delete">
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
              <h3 className={styles.modalTitle}>{editId ? 'Edit Module' : 'Add Module'}</h3>
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
                  placeholder="e.g. Differentiation"
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description students will see"
                  rows={2}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Card Color</label>
                <div className={styles.colorRow}>
                  {[{ key: 'purple', label: 'Purple' }, { key: 'amber', label: 'Orange' }].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`${styles.colorOption} ${form.color === opt.key ? styles.colorOptionActive : ''}`}
                      onClick={() => setForm((f) => ({ ...f, color: opt.key }))}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Order (display position)</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                />
              </div>
              {error && <p className={styles.errorText}>{error}</p>}
              <button className={styles.submitBtn} onClick={handleSave} disabled={busy}>
                {busy ? 'Saving...' : editId ? 'Save Changes' : 'Add Module'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
