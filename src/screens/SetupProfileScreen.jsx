import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';
import styles from './SetupProfileScreen.module.css';

export default function SetupProfileScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [semester, setSemester] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const userId = location.state?.userId;
  const email = location.state?.email ?? '';
  // Role comes via router state normally; falls back to signup metadata
  // when the user lands here through the email redirect.
  const [role, setRole] = useState(location.state?.role ?? null);

  useEffect(() => {
    if (role) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      setRole(user?.user_metadata?.role ?? 'student');
    });
  }, [role]);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !userId) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image is too large. Please choose one under 10MB.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${extension}`;
      const path = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      setPhotoURL(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Photo upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername)) {
      setError('Username must be 3-20 chars (letters, numbers, underscore)');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data: taken } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', trimmedUsername)
        .neq('id', userId)
        .maybeSingle();
      if (taken) {
        setError('That username is already taken');
        setLoading(false);
        return;
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: trimmedName,
          username: trimmedUsername,
          role,
          // Lecturers aren't tied to a semester/year.
          semester: role === 'lecturer' ? null : semester.trim(),
          email,
          ...(photoURL ? { photo_url: photoURL } : {}),
          total_exp: 0,
          days_streak: 0,
          completed: 0,
          exercise_progress: 0,
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

        <div className={styles.avatarContainer} onClick={handlePickImage} role="button" aria-label="Add photo">
          <div className={styles.avatar}>
            {photoURL ? (
              <img src={photoURL} alt="" className={styles.avatarImage} />
            ) : (
              <span className={styles.avatarText}>{uploading ? '' : '+'}</span>
            )}
            {uploading && <div className={styles.avatarSpinner} />}
          </div>
          <span className={styles.avatarLabel}>Add photo (optional)</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Display Name</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ahmad"
            />
          </div>

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

          {role !== 'lecturer' && (
            <div className={styles.inputGroup}>
              <label className={styles.label}>Semester / Year</label>
              <input
                className={styles.input}
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="e.g. Semester 2, 2025"
              />
            </div>
          )}

          {error && <p className={styles.error} role="alert">{error}</p>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? <div className={styles.spinner} /> : 'Next'}
          </button>
        </form>
      </div>
    </div>
  );
}
