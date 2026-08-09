import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OnboardingScreen.module.css';

const PAGES = [
  {
    id: 1,
    image: '/assets/images/reference pages/png/page 1 image.png',
    title: 'Interactive Modules',
    subtitle: 'Learn calculus with structured, bite-sized modules designed for students.',
  },
  {
    id: 2,
    image: '/assets/images/reference pages/png/page 2 image.png',
    title: 'Track Your Progress',
    subtitle: 'Monitor your learning journey with stats, streaks, and achievements.',
  },
  {
    id: 3,
    image: '/assets/images/reference pages/png/page 3 image.png',
    title: 'Master Calculus',
    subtitle: 'Practice with exercises and become confident in derivatives, integrals & more.',
  },
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef(null);

  const handleNext = () => {
    if (current < PAGES.length - 1) {
      const next = current + 1;
      scrollRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', inline: 'start' });
      setCurrent(next);
    } else {
      navigate('/dashboard');
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const page = Math.round(container.scrollLeft / container.offsetWidth);
    setCurrent(page);
  };

  const isLast = current === PAGES.length - 1;

  return (
    <div className={styles.container}>
      <img
        src="/assets/images/reference pages/gradient.png"
        alt=""
        className={styles.gradientBg}
      />

      <div className={styles.inner}>
        <div className={styles.skipRow}>
          <div style={{ flex: 1 }} />
          <button className={styles.skipBtn} onClick={() => navigate('/dashboard')}>
            Skip
          </button>
        </div>

        <div
          className={styles.scroll}
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {PAGES.map((page) => (
            <div key={page.id} className={styles.page}>
              <img
                src={page.image}
                alt=""
                className={styles.image}
              />
              <h2 className={styles.title}>{page.title}</h2>
              <p className={styles.subtitle}>{page.subtitle}</p>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <div className={styles.dots}>
            {PAGES.map((_, i) => (
              <div
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              />
            ))}
          </div>

          <button className={styles.btn} onClick={handleNext}>
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
