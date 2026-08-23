import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, KeyRound, ShieldCheck, ShieldOff, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import {
  getLecturerCodes,
  createLecturerCode,
  setCodeActive,
  deleteLecturerCode,
  generateCode,
} from '../services/adminService';
import styles from './AdminScreen.module.css';

export default function AdminScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');
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
        if (data?.role !== 'admin') {
          navigate('/dashboard', { replace: true });
        } else {
          setChecking(false);
          loadCodes();
        }
      });
  }, [user, navigate]);

  const loadCodes = async () => {
    try {
      setCodes(await getLecturerCodes());
    } catch (err) {
      console.error(err);
      setError('Failed to load codes.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const code = newCode.trim();
    if (!code) return;
    setBusy(true);
    setError('');
    try {
      await createLecturerCode(code, newLabel);
      setCreateOpen(false);
      setNewCode('');
      setNewLabel('');
      await loadCodes();
    } catch (err) {
      setError(err.message?.includes('duplicate') ? 'That code already exists.' : 'Failed to create code.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (codeRow) => {
    try {
      await setCodeActive(codeRow.id, !codeRow.active);
      await loadCodes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (codeRow) => {
    if (codeRow.used_by) return;
    try {
      await deleteLecturerCode(codeRow.id);
      await loadCodes();
    } catch (err) {
      console.error(err);
    }
  };

  const statusFor = (c) => {
    if (c.used_by) return { text: `Used — ${c.used_by_profile?.name ?? 'lecturer'}`, cls: styles.badgeUsed };
    if (!c.active) return { text: 'Inactive', cls: styles.badgeInactive };
    return { text: 'Available', cls: styles.badgeAvailable };
  };

  if (checking) {
    return (
      <div className={styles.container}><div className={styles.center}><div className={styles.spinner} /></div></div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <button
          className={styles.newBtn}
          onClick={() => { setNewCode(generateCode()); setNewLabel(''); setCreateOpen(true); }}
        >
          <Plus size={18} color="#FFFFFF" />
          <span>New Code</span>
        </button>
      </div>

      <div className={styles.scroll}>
        <h2 className={styles.pageTitle}>Lecturer Codes</h2>
        <p className={styles.pageSub}>Single-use codes — one code verifies one lecturer.</p>

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : codes.length === 0 ? (
          <div className={styles.empty}>
            <KeyRound size={32} color="var(--color-text-secondary)" />
            <span className={styles.emptyText}>No codes yet. Create one to invite a lecturer.</span>
          </div>
        ) : (
          codes.map((c) => {
            const status = statusFor(c);
            return (
              <div key={c.id} className={styles.card}>
                <div className={styles.codeRow}>
                  <div className={styles.codeInfo}>
                    <span className={styles.codeText}>{c.code}</span>
                    {c.label && <span className={styles.codeLabel}>{c.label}</span>}
                    <span className={`${styles.badge} ${status.cls}`}>{status.text}</span>
                  </div>
                  <div className={styles.codeActions}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => handleToggle(c)}
                      title={c.active ? 'Deactivate' : 'Reactivate'}
                      disabled={!!c.used_by}
                    >
                      {c.active ? <ShieldOff size={18} color="var(--color-text-secondary)" /> : <ShieldCheck size={18} color="var(--color-success)" />}
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={() => handleDelete(c)}
                      title="Delete"
                      disabled={!!c.used_by}
                    >
                      <Trash2 size={18} color="var(--color-error)" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {createOpen && (
        <div className={styles.modalOverlay} onClick={() => setCreateOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>New Lecturer Code</h3>
              <button className={styles.modalClose} onClick={() => setCreateOpen(false)}>
                <X size={20} color="var(--color-text-primary)" />
              </button>
            </div>
            <div className={styles.formBody}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Code</label>
                <div className={styles.codeInputRow}>
                  <input
                    className={styles.input}
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="SKOR-XXXXXXXX"
                    autoCapitalize="characters"
                  />
                  <button
                    className={styles.regenerateBtn}
                    onClick={() => setNewCode(generateCode())}
                    title="Generate new"
                  >
                    <RefreshCw size={16} color="var(--color-text-primary)" />
                  </button>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Label (optional)</label>
                <input
                  className={styles.input}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. For Dr. Ahmad"
                />
              </div>
              {error && <p className={styles.errorText}>{error}</p>}
              <button className={styles.submitBtn} onClick={handleCreate} disabled={busy || !newCode.trim()}>
                {busy ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
