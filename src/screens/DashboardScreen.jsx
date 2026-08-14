import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MoreHorizontal, Settings, Calendar, Brain, ScanLine, Send, Bell, Sparkles } from 'lucide-react';
import { supabase } from '../config/supabase';
import { getModules, getUserModuleProgress } from '../services/moduleService';
import { setSemesterStartDate } from '../services/userService';
import styles from './DashboardScreen.module.css';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const fabDrag = useRef(null);
  const fabMoved = useRef(false);
  const [fabPos, setFabPos] = useState(null);

  const FAB_SIZE = 60;

  const [userData, setUserData] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [daysLeft, setDaysLeft] = useState(null);
  const [semesterStartDate, setSemesterStartDate] = useState(null);
  const [savingDate, setSavingDate] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setUserData(profile);
        if (profile.semester_start_date) setSemesterStartDate(profile.semester_start_date);
      }

      const [modulesData, progress, countdownData] = await Promise.all([
        getModules(),
        getUserModuleProgress(user.id),
        supabase.from('exam_countdowns').select('*').eq('user_id', user.id).order('exam_date', { ascending: true }).limit(1),
      ]);

      setModules(modulesData);
      setModuleProgress(progress);

      if (countdownData.data?.length > 0) {
        const cd = countdownData.data[0];
        setCountdown(cd);
        const examDate = new Date(cd.exam_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setDaysLeft(Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        setCountdown(null);
        setDaysLeft(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    setCarouselIndex(Math.round(carouselRef.current.scrollLeft / carouselRef.current.clientWidth));
  };

  const getSemesterWeek = () => {
    if (!semesterStartDate) return null;
    const start = new Date(semesterStartDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.max(0, Math.floor((today - start) / (1000 * 60 * 60 * 24)));
    const week = Math.floor(diffDays / 7) + 1;

    if (week <= 14) {
      return { phase: 'teaching', week, progress: week / 14 };
    }
    if (week === 15) {
      return { phase: 'study', week: 0, progress: 1 };
    }
    return { phase: 'exam', week: 0, progress: 1 };
  };

  const handleDateChange = async (e) => {
    const value = e.target.value;
    if (!value) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSavingDate(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const picked = new Date(value + 'T00:00:00');
      const anchor = picked > today
        ? value
        : today.toLocaleDateString('en-CA');
      await setSemesterStartDate(user.id, anchor);
      setSemesterStartDate(anchor);
    } catch (err) {
      console.error('Save start date error:', err);
    } finally {
      setSavingDate(false);
    }
  };

  const semester = getSemesterWeek();

  const handleFabPointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    fabDrag.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseLeft: rect.left,
      baseTop: rect.top,
    };
    fabMoved.current = false;
    setFabPos({ left: rect.left, top: rect.top });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleFabPointerMove = (e) => {
    const d = fabDrag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!fabMoved.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) fabMoved.current = true;
    const left = Math.max(0, Math.min(window.innerWidth - FAB_SIZE, d.baseLeft + dx));
    const top = Math.max(0, Math.min(window.innerHeight - FAB_SIZE, d.baseTop + dy));
    setFabPos({ left, top });
  };

  const handleFabPointerUp = () => {
    fabDrag.current = null;
  };

  const handleFabClick = () => {
    if (fabMoved.current) return;
    navigate('/ai-chat');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const actionCards = [
    { icon: ScanLine, label: 'Scan Solve', path: '/scan-solve' },
    { icon: Sparkles, label: 'AI Study Buddy', path: '/ai-chat' },
    { icon: Send, label: 'Send Work', path: '/submit-work' },
  ];

  const ModuleCards = () => (
    <>
      {modules.map((mod) => {
        const progress = moduleProgress[mod.id]?.progress ?? 0;
        const gradientClass = mod.color === 'amber' ? styles.moduleCardAmber : styles.moduleCardPurple;
        return (
          <button
            key={mod.id}
            className={`${styles.moduleCardWrapper} ${gradientClass}`}
            onClick={() => navigate('/module/' + mod.id, { state: { module: mod } })}
          >
            <div className={styles.moduleTopPill} />
            <h3 className={styles.moduleTitle}>{mod.title}</h3>
            <p className={styles.moduleDesc}>{mod.description}</p>
            <div className={styles.moduleProgressBarBg}>
              <div className={styles.moduleProgressBarFill} style={{ width: `${progress * 100}%` }} />
            </div>
            <div className={styles.moduleFooter}>
              <span className={styles.modulePercent}>{Math.round(progress * 100)}%</span>
              <div className={styles.continueBtn}>
                <ArrowRight size={20} color="#FFFFFF" />
              </div>
            </div>
          </button>
        );
      })}
    </>
  );

  return (
    <div className={styles.container}>
      <div className={styles.scrollContent}>
        <div className={styles.topBar}>
          <button className={styles.mobileHamburger} onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))} aria-label="Menu">
            <MoreHorizontal size={24} color="var(--color-text-primary)" />
          </button>
          <div className={styles.logoWrap}>
            <img src="/assets/images/logo.png" className={styles.logoImage} alt="SkorPlus" />
          </div>
          <div className={styles.topBarActions}>
            <button className={styles.iconBtn} onClick={() => navigate('/notifications')} aria-label="Notifications">
              <Bell size={22} color="var(--color-text-primary)" />
            </button>
            <button className={styles.iconBtn} onClick={() => navigate('/settings')} aria-label="Settings">
              <Settings size={22} color="var(--color-text-primary)" />
            </button>
          </div>
        </div>

        <div className={styles.semesterCard}>
          <div className={styles.semesterTitleRow}>
            <span className={styles.semesterTitle}>
              {semesterStartDate
                ? semester.phase === 'teaching'
                  ? `Week ${semester.week}`
                  : semester.phase === 'study'
                    ? 'Study Week'
                    : semester.phase === 'exam'
                      ? 'Exam Week'
                      : 'Semester Break'
                : 'Get Started'}
            </span>
            <span className={styles.semesterBadge}>
              {semesterStartDate
                ? semester.phase === 'teaching'
                  ? `Week ${semester.week} of 14`
                  : semester.phase === 'study'
                    ? 'Study week'
                    : semester.phase === 'exam'
                      ? 'Exam week'
                      : 'Between semesters'
                : 'Pick your start date'}
            </span>
          </div>

          <span className={styles.semesterPulse}>SEMESTER PULSE</span>

          <div className={styles.semesterLabelRow}>
            <span className={styles.semesterLabel}>PROGRESS</span>
            <span className={styles.semesterLabelRight}>W14 FINAL</span>
          </div>

          <div className={styles.semesterBar}>
            <div
              className={styles.semesterBarFill}
              style={{ width: `${semesterStartDate ? semester.progress * 100 : 0}%` }}
            />
          </div>

          {!semesterStartDate && (
            <input
              type="date"
              className={styles.semesterDateInput}
              onChange={handleDateChange}
              disabled={savingDate}
            />
          )}
        </div>

        <div className={styles.statsRow}>
          {actionCards.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                className={styles.statCard}
                onClick={() => navigate(item.path)}
              >
                <Icon size={28} color="var(--color-primary)" />
                <span className={styles.statLabel}>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.countdownCompact}>
          {countdown ? (
            <div>
              <div className={styles.countdownDaysRow}>
                <span className={styles.countdownDays}>{daysLeft !== null ? daysLeft : '0'}</span>
                <span className={styles.countdownDaysLabel}>days left</span>
              </div>
              <p className={styles.countdownCompactTitle}>{countdown.title}</p>
              <div className={styles.countdownBottomRow}>
                <div className={styles.countdownDateRow}>
                  <Calendar size={13} color="var(--color-text-secondary)" />
                  <span className={styles.countdownDate}>
                    {new Date(countdown.exam_date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
                <button className={styles.countdownEditBtn} onClick={() => navigate('/set-exam', { state: { countdown } })}>Edit</button>
              </div>
            </div>
          ) : (
            <div className={styles.countdownEmpty}>
              <Calendar size={28} color="var(--color-text-secondary)" />
              <p className={styles.countdownEmptyText}>Set your final exam</p>
              <button className={styles.countdownSetBtn} onClick={() => navigate('/set-exam')}>Set Date &amp; Time</button>
            </div>
          )}
        </div>

        {modules.length > 0 && (
          <button className={styles.zepCard} onClick={() => window.open('https://quiz.zep.us/en/public', '_blank')}>
            <div className={styles.zepCardContent}>
              <div className={styles.zepIconWrap}><Brain size={26} color="#FFFFFF" /></div>
              <div className={styles.zepTextWrap}>
                <span className={styles.zepKicker}>QUICK PRACTICE</span>
                <span className={styles.zepTitle}>Zep Quiz</span>
                <span className={styles.zepDesc}>Test your knowledge with quick questions</span>
              </div>
            </div>
            <div className={styles.zepArrow}><ArrowRight size={20} color="#FFFFFF" /></div>
          </button>
        )}

        <div className={styles.sectionRow}>
          <h2 className={styles.sectionTitle}>Continue Learning..</h2>
          <button className={styles.showAllLink} onClick={() => navigate('/modules')}>Show All &rarr;</button>
        </div>

        {modules.length > 0 ? (
          <>
            <div className={styles.moduleGrid}>
              <ModuleCards />
            </div>
            <div className={styles.mobileCarousel}>
              <div className={styles.carousel} ref={carouselRef} onScroll={handleCarouselScroll}>
                <ModuleCards />
              </div>
              <div className={styles.dotsRow}>
                {modules.map((_, i) => (
                  <div key={i} className={`${styles.dot} ${i === carouselIndex ? styles.dotActive : ''}`} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyCard}><p className={styles.emptyText}>No modules available</p></div>
        )}
      </div>

      <button
        className={styles.aiFab}
        style={fabPos ? { left: fabPos.left, top: fabPos.top, bottom: 'auto', right: 'auto' } : undefined}
        onPointerDown={handleFabPointerDown}
        onPointerMove={handleFabPointerMove}
        onPointerUp={handleFabPointerUp}
        onClick={handleFabClick}
        aria-label="AI Study Buddy"
      >
        <Sparkles size={26} color="var(--color-primary)" />
      </button>
    </div>
  );
}
