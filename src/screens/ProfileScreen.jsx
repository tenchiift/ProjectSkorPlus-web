import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import styles from './ProfileScreen.module.css';

const GENDER_OPTIONS = ['Male', 'Female'];

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [semester, setSemester] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [existingProfileSetup, setExistingProfileSetup] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const getUserId = () => user?.id;

  const loadProfile = async () => {
    try {
      const userId = getUserId();
      if (!userId) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setName(profile.name ?? '');
        setUsername(profile.username ?? '');
        setEmail(profile.email ?? '');
        setGender(profile.gender ?? '');
        setSemester(profile.semester ?? '');
        setBio(profile.bio ?? '');
        setExistingProfileSetup(profile.profile_setup ?? false);
        if (profile.photo_url) {
          setPhotoURL(profile.photo_url);
        }
      }
    } catch (err) {
      console.error('Load profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${extension}`;
      const userId = getUserId();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${userId}/${fileName}`, file, { upsert: true, contentType: file.type || 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${userId}/${fileName}`);

      setPhotoURL(publicUrl);
      await supabase.from('profiles').upsert({ id: userId, photo_url: publicUrl });
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const userId = getUserId();
      if (!userId) return;

      const trimmedUsername = username.trim();
      if (trimmedUsername && !/^[a-zA-Z0-9_]{3,20}$/.test(trimmedUsername)) {
        setSaving(false);
        return;
      }

      if (trimmedUsername) {
        const { data: taken } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', trimmedUsername)
          .neq('id', userId)
          .maybeSingle();
        if (taken) {
          setSaving(false);
          return;
        }
      }

      const updateData = {
        id: userId,
        name: name.trim(),
        email,
        gender,
        semester,
        bio: bio.trim(),
      };
      if (trimmedUsername) updateData.username = trimmedUsername;
      if (!existingProfileSetup) {
        updateData.profile_setup = true;
      }
      const { error } = await supabase
        .from('profiles')
        .upsert(updateData);

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save profile error:', err);
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
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h2 className={styles.headerTitle}>Profile</h2>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <div className={styles.smallSpinner} />
          ) : saved ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          ) : (
            <span className={styles.saveText}>Save</span>
          )}
        </button>
      </div>

      <div className={styles.scroll}>
        <div className={styles.avatarContainer}>
          <button className={styles.avatarWrapper} onClick={handlePickImage} type="button">
            {photoURL ? (
              <img src={photoURL} alt="" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatar}>
                <span className={styles.avatarText}>
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </span>
              </div>
            )}
            <div className={styles.cameraBadge}>
              {uploading ? (
                <div className={styles.tinySpinner} />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          <span className={styles.avatarHint}>Change photo</span>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Display Name</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Username</label>
          <input
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. ahmad123"
            autoCapitalize="none"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input
            className={`${styles.input} ${styles.readOnly}`}
            value={email}
            readOnly
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Gender</label>
          <div className={styles.genderRow}>
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`${styles.genderOption} ${gender === opt ? styles.genderOptionActive : ''}`}
                onClick={() => setGender(opt)}
              >
                <span className={`${styles.genderText} ${gender === opt ? styles.genderTextActive : ''}`}>
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Semester / Year</label>
          <input
            className={styles.input}
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            placeholder="e.g. Semester 2, 2026"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Bio</label>
          <textarea
            className={`${styles.input} ${styles.bioInput}`}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}
