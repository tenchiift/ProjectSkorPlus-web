import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../config/supabase';
import registerImage from '../assets/images/get-started.png';
import styles from './RegisterScreen.module.css';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { username: username.trim() },
          emailRedirectTo: window.location.origin + '/setup-profile',
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        navigate('/setup-profile', { state: { userId: data.user.id, email: data.user.email, username: username.trim(), role }, replace: true });
      }
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('This email is already registered');
      } else if (err.message?.includes('valid email')) {
        setError('Please enter a valid email');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/')} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h2 className={styles.headerTitle}>Create account</h2>
      </div>

      <div className={styles.content}>
        <img src={registerImage} alt="Get started" className={styles.logoImage} />
        <h1 className={styles.title}>Get started with ProjectSkor+</h1>

        <div className={styles.roleRow}>
          {[
            { key: 'student', label: 'Student' },
            { key: 'lecturer', label: 'Lecturer' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`${styles.roleOption} ${role === opt.key ? styles.roleOptionActive : ''}`}
              onClick={() => setRole(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleRegister}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="register-username">Username</label>
            <input
              id="register-username"
              className={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoCapitalize="off"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="register-email">Email</label>
            <input
              id="register-email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoCapitalize="off"
              autoCorrect="off"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="register-password">Password</label>
            <input
              id="register-password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="register-confirm-password">Confirm Password</label>
            <input
              id="register-confirm-password"
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? <div className={styles.spinner} /> : 'Create Account'}
          </button>
        </form>

        <div className={styles.link}>
          <p className={styles.linkText}>
            Already have an account?{' '}
            <button className={styles.linkBold} onClick={() => navigate('/login')}>
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
