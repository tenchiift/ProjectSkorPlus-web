import { useEffect, useState } from 'react';
import styles from './AuthSplitLayout.module.css';

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
          <div className={styles.brandTop}>
            <span className={styles.brandWordmark}>ProjectSkor+</span>
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
        </div>
        <div className={styles.contentPanel}>{children}</div>
      </div>
    </div>
  );
}
