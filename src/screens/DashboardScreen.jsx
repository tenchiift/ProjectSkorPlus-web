import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, MoreHorizontal, Calendar, Brain, ScanLine, Send, Bell, Sparkles, NotebookPen } from 'lucide-react';
import { supabase } from '../config/supabase';
import { getModules, getModulesForStudent, getUserModuleProgress } from '../services/moduleService';
import { setWeekAnchor, setSemesterPaused, claimDailyStreak } from '../services/userService';
import { ensureDailyNotifications, subscribeToNotifications, getUnreadCount } from '../services/notificationService';
import LecturerDashboardScreen from './LecturerDashboardScreen';
import examImage from '../assets/images/exam.jpeg';
import zepImage from '../assets/images/zep.avif';
import styles from './DashboardScreen.module.css';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const reducedMotion = useReducedMotion();

  // Entrance-only motion for dashboard cards (module cards stay static).
  const riseProps = (delay = 0) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, ease: 'easeOut', delay },
        };

  // Spring expand/collapse for the week picker.
  const pickerSpring = {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 26 },
    style: { overflow: 'hidden' },
  };

  // Card resize: smooth height tween when the controls/break rows mount,
  // unmount or swap (update week, start/end mid-sem break). Same
  // ease + duration as the Transitions.dev resize recipe.
  const cardRowAnim = {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: reducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    style: { overflow: 'hidden' },
  };
  const cardLayoutProps = reducedMotion
    ? {}
    : { layout: true, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } };

  const [userData, setUserData] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [daysLeft, setDaysLeft] = useState(null);
  const [anchor, setAnchor] = useState(null); // { date, week, day }
  const [paused, setPaused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState('week'); // 'week' | 'day'
  const [pendingWeek, setPendingWeek] = useState(null);
  const [saving, setSaving] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [role, setRole] = useState(null);

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
        setRole(profile.role ?? 'student');
        setPaused(profile.semester_paused ?? false);
        if (profile.week_anchor_date && profile.week_anchor_week && profile.week_anchor_day) {
          setAnchor({
            date: profile.week_anchor_date,
            week: profile.week_anchor_week,
            day: profile.week_anchor_day,
          });
        }
      }

      // Daily login streak (+EXP). Needs streak_migration.sql; degrades quietly.
      // The sidebar header shows the streak — nudge AppLayout to refresh it.
      try {
        const result = await claimDailyStreak(user.id);
        if (result?.claimed) window.dispatchEvent(new CustomEvent('skorplus-profile-refresh'));
      } catch { /* ignore */ }

      const isStudent = (profile?.role ?? 'student') === 'student';

      const [modulesData, progress, countdownData] = await Promise.all([
        isStudent ? getModulesForStudent(user.id) : getModules(),
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

      // Seed daily quote/reminder notifications (idempotent) and load unread count.
      try {
        await ensureDailyNotifications(user.id, profile, countdownData.data?.[0] ?? null);
      } catch (e) {
        console.error('Seed notifications error:', e);
      }
      try {
        const c = await getUnreadCount(user.id);
        setUnreadNotif(c);
      } catch (e) {
        console.error('Unread count error:', e);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let sub;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      sub = subscribeToNotifications(user.id, (n) => {
        if (!n.read) setUnreadNotif((c) => c + 1);
      });
    })();
    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, []);

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    setCarouselIndex(Math.round(carouselRef.current.scrollLeft / carouselRef.current.clientWidth));
  };

  const computeSemester = () => {
    if (!anchor) return null;
    const anchorDate = new Date(anchor.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let elapsedDays = Math.max(0, Math.floor((today - anchorDate) / (1000 * 60 * 60 * 24)));
    if (paused) elapsedDays = 0;

    const totalDays = (anchor.week - 1) * 7 + (anchor.day - 1) + elapsedDays;
    const week = Math.floor(totalDays / 7) + 1;
    const day = (totalDays % 7) + 1;

    let phase = 'teaching';
    if (week > 14) phase = week === 15 ? 'study' : 'exam';

    return { phase, week: Math.min(week, 14), day, progress: Math.min(week, 14) / 14 };
  };

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  };

  const handlePickWeek = (week) => {
    setPendingWeek(week);
    setPickerStep('day');
  };

  const handlePickDay = async (day) => {
    const userId = await getUserId();
    if (!userId || pendingWeek == null) return;
    setSaving(true);
    try {
      await setWeekAnchor(userId, { week: pendingWeek, day });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setAnchor({ date: today.toISOString().slice(0, 10), week: pendingWeek, day });
      setPaused(false);
      setPickerOpen(false);
      setPickerStep('week');
      setPendingWeek(null);
    } catch (err) {
      console.error('Save week anchor error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStartBreak = async () => {
    const userId = await getUserId();
    if (!userId) return;
    setSaving(true);
    try {
      await setSemesterPaused(userId, true);
      setPaused(true);
    } catch (err) {
      console.error('Pause error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEndBreak = async () => {
    const userId = await getUserId();
    if (!userId) return;
    setSaving(true);
    try {
      await setSemesterPaused(userId, false);
      setPaused(false);
    } catch (err) {
      console.error('Resume error:', err);
    } finally {
      setSaving(false);
    }
  };

  const openUpdate = () => {
    setPickerStep('week');
    setPendingWeek(null);
    setPickerOpen(true);
  };

  const semester = computeSemester();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  // Lecturers get their own dashboard (stats, content management, submissions).
  if (role === 'lecturer') {
    return <LecturerDashboardScreen unreadNotif={unreadNotif} />;
  }

  const actionCards = [
    { icon: ScanLine, label: 'Scan Solve', path: '/scan-solve' },
    { icon: Sparkles, label: <>AI Study<br />Buddy</>, path: '/ai-chat' },
    { icon: Send, label: 'Send Work', path: '/submit-work' },
  ];

  const ModuleCards = () => (
    <>
      {modules.map((mod) => {
        const progress = moduleProgress[mod.id]?.progress ?? 0;
        return (
          <button
            key={mod.id}
            className={styles.moduleCardWrapper}
            onClick={() => navigate('/module/' + mod.id, { state: { module: mod } })}
          >
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
              {unreadNotif > 0 && <span className={styles.notifBadge}>{unreadNotif > 9 ? '9+' : unreadNotif}</span>}
            </button>
          </div>
        </div>

        <motion.div className={styles.semesterCard} {...cardLayoutProps}>
          <div className={styles.semesterTitleRow}>
            <span className={styles.semesterTitle}>
              {paused && semester
                ? 'Mid-Sem Break'
                : semester
                  ? semester.phase === 'teaching'
                    ? `Week ${semester.week} · Day ${semester.day}`
                    : semester.phase === 'study'
                      ? 'Study Week'
                      : 'Exam Week'
                  : 'Get Started'}
            </span>
            <span className={styles.semesterBadge}>
              {paused && semester
                ? 'On break'
                : semester
                  ? semester.phase === 'teaching'
                    ? `Week ${semester.week} of 12`
                    : semester.phase === 'study'
                      ? 'Study week'
                      : 'Exam week'
                  : 'Set your week'}
            </span>
          </div>

          <div className={styles.semesterMetaRow}>
            <span className={styles.semesterPulse}>SEMESTER PULSE</span>
            {userData?.semester && (
              <span className={styles.semesterYouOn}>You're on {userData.semester}</span>
            )}
          </div>

          <div className={styles.semesterLabelRow}>
            <span className={styles.semesterLabel}>PROGRESS</span>
            <span className={styles.semesterLabelRight}>W12 FINAL</span>
          </div>

          <div className={styles.semesterBar}>
            <div
              className={styles.semesterBarFill}
              style={{ width: `${semester ? semester.progress * 100 : 0}%` }}
            />
          </div>

          <AnimatePresence initial={false}>
          {paused && semester && (
            <motion.div key="break-controls" {...cardRowAnim}>
            <div className={styles.semesterControls}>
              <span className={styles.semesterHint}>Break active — progress is paused.</span>
              <button className={`${styles.semesterActionBtn} ${styles.semesterActionBtnSmall}`} onClick={handleEndBreak} disabled={saving}>
                End mid-sem break
              </button>
            </div>
            </motion.div>
          )}

          {!paused && semester && !pickerOpen && (
            <motion.div key="week-controls" {...cardRowAnim}>
            <div className={styles.semesterControls}>
              <button className={styles.semesterActionBtn} onClick={openUpdate}>Update week</button>
              <button className={styles.semesterActionBtnSecondary} onClick={handleStartBreak} disabled={saving}>
                Start mid-sem break
              </button>
            </div>
            </motion.div>
          )}

          {!semester && !pickerOpen && (
            <motion.div key="setup-controls" {...cardRowAnim}>
            <button className={styles.semesterActionBtn} onClick={openUpdate}>
              Set your week
            </button>
            </motion.div>
          )}
          </AnimatePresence>}

          {pickerOpen && (
            <AnimatePresence initial={false}>
              <motion.div key="picker" {...pickerSpring}>
                <div className={styles.pickerWrap}>
                  {pickerStep === 'week' ? (
                    <>
                      <span className={styles.semesterHint}>What week are you on?</span>
                      <div className={styles.semesterWeekPicker}>
                        {Array.from({ length: 12 }, (_, i) => {
                          const week = i + 1;
                          return (
                            <button
                              key={week}
                              type="button"
                              className={styles.semesterWeekDot}
                              onClick={() => handlePickWeek(week)}
                            >
                              {week}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <span className={styles.semesterHint}>Which day?</span>
                      <div className={styles.semesterWeekPicker}>
                        {Array.from({ length: 7 }, (_, i) => {
                          const day = i + 1;
                          return (
                            <button
                              key={day}
                              type="button"
                              className={styles.semesterWeekDot}
                              onClick={() => handlePickDay(day)}
                              disabled={saving}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        className={styles.semesterActionBtnSecondary}
                        onClick={() => { setPickerStep('week'); setPendingWeek(null); }}
                      >
                        Back
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </motion.div>

        <div className={styles.statsRow}>
          {actionCards.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={i}
                className={styles.statCard}
                onClick={() => navigate(item.path)}
                {...riseProps(i * 0.08 + 0.05)}
              >
                <Icon size={28} color="var(--color-primary)" />
                <span className={styles.statLabel}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>

        <motion.div className={styles.countdownCompact} {...riseProps(0.2)}>
          {countdown ? (
            <>
              <img src={examImage} className={styles.countdownBg} alt="" />
              <div className={styles.countdownOverlay} />
              <div className={styles.countdownContent}>
                <div className={styles.countdownIconWrap}>
                  <NotebookPen size={26} color="#FFFFFF" />
                </div>
                <div className={styles.countdownTextCol}>
                  <div className={styles.countdownDaysRow}>
                    <span className={styles.countdownDays}>{daysLeft !== null ? daysLeft : '0'}</span>
                    <span className={styles.countdownDaysLabel}>days left</span>
                  </div>
                  <p className={styles.countdownCompactTitle}>{countdown.title}</p>
                  <div className={styles.countdownBottomRow}>
                    <div className={styles.countdownDateRow}>
                      <Calendar size={13} color="rgba(255, 255, 255, 0.85)" />
                      <span className={styles.countdownDate}>
                        {new Date(countdown.exam_date).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <button className={styles.countdownEditBtn} onClick={() => navigate('/set-exam', { state: { countdown } })}>Edit</button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.countdownEmpty}>
              <Calendar size={28} color="var(--color-text-secondary)" />
              <p className={styles.countdownEmptyText}>Set your final exam</p>
              <button className={styles.countdownSetBtn} onClick={() => navigate('/set-exam')}>Set Date &amp; Time</button>
            </div>
          )}
        </motion.div>

        {modules.length > 0 && (
          <motion.button className={styles.zepCard} onClick={() => window.open('https://quiz.zep.us/en/public', '_blank')} {...riseProps(0.28)}>
            <img src={zepImage} className={styles.zepBg} alt="" />
            <div className={styles.zepOverlay} />
            <div className={styles.zepContent}>
              <div className={styles.zepCardContent}>
                <div className={styles.zepIconWrap}><Brain size={26} color="#FFFFFF" /></div>
                <div className={styles.zepTextWrap}>
                  <span className={styles.zepKicker}>QUICK PRACTICE</span>
                  <span className={styles.zepTitle}>Zep Quiz</span>
                  <span className={styles.zepDesc}>Test your knowledge with quick questions</span>
                </div>
              </div>
              <div className={styles.zepArrow}><ArrowRight size={20} color="#FFFFFF" /></div>
            </div>
          </motion.button>
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
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>
              {role === 'student'
                ? 'No modules yet. Select your lecturers to see your subjects.'
                : 'No modules available'}
            </p>
            {role === 'student' && (
              <button className={styles.emptyCta} onClick={() => navigate('/select-lecturers')}>
                Choose Lecturers
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
