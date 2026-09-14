import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLecturers, getStudentLecturers, setStudentLecturers } from '../services/moduleService';
import styles from './SelectLecturersScreen.module.css';

export default function SelectLecturersScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lecturers, setLecturers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [all, mine] = await Promise.all([
          getLecturers(),
          getStudentLecturers(user.id),
        ]);
        setLecturers(all ?? []);
        setSelected(mine ?? []);
      } catch (err) {
        console.error(err);
        setError('Failed to load lecturers.');
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    setError('');
    try {
      await setStudentLecturers(user.id, selected);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>Your Lecturers</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.scroll}>
        <h2 className={styles.title}>Who teaches you this semester?</h2>
        <p className={styles.subtitle}>
          Select your lecturers — your dashboard will only show modules from them.
        </p>

        {lecturers.length === 0 ? (
          <div className={styles.empty}>
            <User size={40} color="var(--color-text-secondary)" />
            <p className={styles.emptyText}>No lecturers available yet.</p>
          </div>
        ) : (
          <div className={styles.chipList}>
            {lecturers.map((lec) => {
              const active = selected.includes(lec.id);
              return (
                <button
                  key={lec.id}
                  className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                  onClick={() => toggle(lec.id)}
                  type="button"
                >
                  <div className={styles.chipAvatar}>
                    {lec.photo_url ? (
                      <img src={lec.photo_url} alt="" className={styles.chipAvatarImg} />
                    ) : (
                      <User size={20} color="var(--color-text-secondary)" />
                    )}
                  </div>
                  <span className={styles.chipInfo}>
                    <span className={styles.chipName}>{lec.name || lec.username}</span>
                    {lec.username && lec.name && (
                      <span className={styles.chipUsername}>@{lec.username}</span>
                    )}
                  </span>
                  <span className={`${styles.chipCheck} ${active ? styles.chipCheckOn : ''}`}>
                    {active && <Check size={14} color="#FFFFFF" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : selected.length ? `Save (${selected.length})` : 'Save'}
        </button>
      </div>
    </div>
  );
}
