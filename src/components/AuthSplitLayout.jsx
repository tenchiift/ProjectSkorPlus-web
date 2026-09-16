import { useEffect, useState } from 'react';
import styles from './AuthSplitLayout.module.css';
import pillIcon from '../assets/images/auth/auth-pill-icon.png';
import iconModules from '../assets/images/auth/auth-icon-modules.png';
import iconPapers from '../assets/images/auth/auth-icon-papers.png';
import iconBuddy from '../assets/images/auth/auth-icon-buddy.png';
import illustration from '../assets/images/auth/auth-illustration.png';
import doodle1 from '../assets/images/auth/auth-doodle-1.svg';
import doodle2 from '../assets/images/auth/auth-doodle-2.svg';
import doodle3 from '../assets/images/auth/auth-doodle-3.svg';
import doodle4 from '../assets/images/auth/auth-doodle-4.svg';

const FEATURES = [
  { icon: iconModules, title: 'Structured Modules', desc: 'Organise your topics easily.' },
  { icon: iconPapers, title: 'Past Papers', desc: 'Practice with previous questions' },
  { icon: iconBuddy, title: 'AI Study Buddy', desc: 'Get study support anytime' },
];

// Desktop-only split screen for the pre-dashboard pages (landing, auth,
// setup, onboarding): brand panel on the left, page content on the right.
// Mobile renders children unchanged.
export default function AuthSplitLayout({ children }) {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!isDesktop) return children;

  return (
    <div className={styles.backdrop}>
      <div className={styles.card}>
        <div className={styles.brandPanel}>
          <img src={doodle1} className={`${styles.brandDoodle} ${styles.doodle1}`} alt="" aria-hidden="true" />
          <img src={doodle2} className={`${styles.brandDoodle} ${styles.doodle2}`} alt="" aria-hidden="true" />
          <img src={doodle3} className={`${styles.brandDoodle} ${styles.doodle3}`} alt="" aria-hidden="true" />
          <img src={doodle4} className={`${styles.brandDoodle} ${styles.doodle4}`} alt="" aria-hidden="true" />
          <div className={styles.brandTop}>
            <span className={styles.brandWordmark}>ProjectSkor+</span>
          </div>
          <div className={styles.brandPill}>
            <img src={pillIcon} className={styles.brandPillIcon} alt="" />
            <span>Built for Calculus Students</span>
          </div>
          <div className={styles.brandCopy}>
            <p className={styles.brandHeadline}>
              Learn smarter.
              <br />
              Score better.
            </p>
            <p className={styles.brandTagline}>
              Structured modules, past papers, and an AI study buddy — everything you need to ace calculus.
            </p>
          </div>
          <div className={styles.brandFeatures}>
            {FEATURES.map((f, i) => (
              <div key={f.title} className={styles.brandFeatureWrap}>
                {i > 0 && <div className={styles.brandDivider} />}
                <div className={styles.brandFeature}>
                  <img src={f.icon} className={styles.brandFeatureIcon} alt="" />
                  <span className={styles.brandFeatureTitle}>{f.title}</span>
                  <span className={styles.brandFeatureDesc}>{f.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <img src={illustration} className={styles.brandIllustration} alt="" aria-hidden="true" />
        </div>
        <div className={styles.contentPanel}>{children}</div>
      </div>
    </div>
  );
}
