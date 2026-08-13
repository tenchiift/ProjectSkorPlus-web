import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.png';
import styles from './HomeScreen.module.css';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.welcomeContainer}>
        <p className={styles.welcomeTitle}>Welcome to</p>
      </div>

      <div className={styles.logoContainer}>
        <img src={logo} alt="ProjectSkor+ logo" className={styles.logoImage} />
      </div>

      <div className={styles.heroContainer}>
        <h1 className={styles.title}>ProjectSkor+</h1>
        <p className={styles.tagline}>Learn Smarter, Score Better</p>
      </div>

      <div className={styles.buttonContainer}>
        <button className={styles.btnPrimary} onClick={() => navigate('/register')}>
          Get Started
        </button>

        <p className={styles.dividerText}>or</p>

        <button className={styles.btnOutline} onClick={() => navigate('/login')}>
          I already have an account
        </button>
      </div>
    </div>
  );
}
