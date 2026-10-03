import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '../assets/images/logo.png';
import styles from './AboutScreen.module.css';

export default function AboutScreen() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/settings')} aria-label="Back to settings">
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <span className={styles.headerTitle}>About</span>
      </header>

      <main className={styles.content}>
        <img src={logo} alt="ProjectSkor+" className={styles.logo} />
        <p className={styles.tagline}>Learn Smarter. Score Better</p>
        <p className={styles.version}>V 1.00</p>

        <h1 className={styles.heading}>About this app</h1>
        <p className={styles.body}>
          ProjectSkor+ is a study space for Calculus students. Learn a topic,
          practise it, ask for help when you get stuck, and share work with
          your lecturer, all in one place.
        </p>
        <p className={styles.body}>
          Built by students, guided by lecturers. Made for IMBOLDEN at Kolej
          Profesional MARA.
        </p>

        <footer className={styles.footer}>ProjectSkor+</footer>
      </main>
    </div>
  );
}
