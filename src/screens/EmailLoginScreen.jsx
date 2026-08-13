import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import styles from './EmailLoginScreen.module.css';

export default function EmailLoginScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && sent) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, sent, navigate]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
      });

      if (otpError) throw otpError;
      setSent(true);
    } catch (err) {
      console.error(err);
      setError('Failed to send link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/login')} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h2 className={styles.headerTitle}>Continue with Email</h2>
      </div>

      <div className={styles.content}>
        {!sent ? (
          <>
            <h1 className={styles.title}>Enter your email</h1>
            <p className={styles.subtitle}>
              We&apos;ll send you a magic link to sign in instantly — no password needed!
            </p>

            <form onSubmit={handleSendOTP}>
              <div className={styles.inputGroup}>
                <label className={styles.label} htmlFor="email-login-email">Email address</label>
                <input
                  id="email-login-email"
                  className={styles.input}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? <div className={styles.spinner} /> : 'Send Magic Link'}
              </button>
            </form>
          </>
        ) : (
          <div className={styles.sentContainer}>
            <p className={styles.sentEmoji}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 7l-10 7L2 7" />
              </svg>
            </p>
            <h1 className={styles.sentTitle}>Check your email!</h1>
            <p className={styles.sentSubtitle}>
              We sent a magic link to
            </p>
            <p className={styles.sentEmail}>{email}</p>
            <p className={styles.sentHint}>
              Tap the link in your email to sign in. You can close this screen.
            </p>
            <button className={styles.resend} onClick={() => setSent(false)}>
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
