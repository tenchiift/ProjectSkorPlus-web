import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';
import styles from './SetupProfileScreen.module.css';

export default function SetupProfileScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userId = location.state?.userId;
  const email = location.state?.email ?? '';

  const handleSave = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: username.trim(),
          semester: semester.trim(),
          email,
          total_exp: 0,
          days_streak: 0,
          completed: 0,
          exercise_progress: 0,
          created_at: new Date().toISOString(),
          profile_setup: true,
        });
      if (upsertError) throw upsertError;
      navigate('/onboarding');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.scroll}>
        <div className={styles.header}>
          <h1 className={styles.title}>Setup your profile</h1>
          <p className={styles.subtitle}>Let us know who you are before we begin!</p>
        </div>

        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>
            <span className={styles.avatarText}>+</span>
          </div>
          <span className={styles.avatarLabel}>Add photo (optional)</span>
        </div>

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <input
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. ahmad123"
              autoCapitalize="none"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Semester / Year</label>
            <input
              className={styles.input}
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="e.g. Semester 2, 2025"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? <div className={styles.spinner} /> : 'Next'}
          </button>
        </form>
      </div>
    </div>
  );
}
