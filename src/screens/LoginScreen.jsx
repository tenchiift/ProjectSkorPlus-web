import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../config/supabase';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;

      const user = data.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_setup')
        .eq('id', user.id)
        .single();

      if (profile?.profile_setup) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/setup-profile', { state: { userId: user.id, email: user.email }, replace: true });
      }
    } catch (err) {
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please confirm your email first');
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
        <h2 className={styles.headerTitle}>Welcome back</h2>
      </div>

      <div className={styles.content}>
        <h1 className={styles.title}>Sign in to your account</h1>

        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="login-email">Email</label>
            <input
              id="login-email"
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
            <label className={styles.label} htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? <div className={styles.spinner} /> : 'Sign In'}
          </button>
        </form>

        <div className={styles.link}>
          <p className={styles.linkText}>
            Don&apos;t have an account?{' '}
            <button className={styles.linkBold} onClick={() => navigate('/register')}>
              Get Started
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
