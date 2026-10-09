import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, MoreHorizontal, Calendar, Brain, ScanLine, Send, Bell, NotebookPen } from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';
import { BorderBeam } from 'border-beam';
import { supabase } from '../config/supabase';
import { getModules, getModulesForStudent, getUserModuleProgress } from '../services/moduleService';
import { setWeekAnchor, setSemesterPaused, claimDailyStreak, localDateStr } from '../services/userService';
import { ensureDailyNotifications, subscribeToNotifications, getUnreadCount } from '../services/notificationService';
import LecturerDashboardScreen from './LecturerDashboardScreen';
import ClassPrompt from '../components/ClassPrompt';
import { parseClassCode } from '../utils/parseClass';
import { motionEase, motionTiming, sheetSpring, pressFeedback } from '../utils/motion';
import examImage from '../assets/images/exam.jpeg';
import zepImage from '../assets/images/zep.avif';
import styles from './DashboardScreen.module.css';

const dashboardReveal = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: motionTiming.enter, ease: motionEase } },
};

function DashboardSkeleton() {
  return (
    <div className={styles.container} role="status" aria-label="Loading your dashboard" aria-busy="true">
      <div className={styles.scrollContent} aria-hidden="true">
        <div className={styles.topBar}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonLogo}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonIcon}`} />
        </div>
        <div className={`${styles.semesterCard} ${styles.skeletonSemester}`}>
          <div className={styles.semesterTitleRow}>
            <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
            <div className={`${styles.skeletonBlock} ${styles.skeletonBadge}`} />
          </div>
          <div className={`${styles.skeletonBlock} ${styles.skeletonMeta}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonProgress}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonButton}`} />
        </div>
        <div className={styles.statsRow}>
          {[0, 1, 2].map((card) => (
            <div key={card} className={`${styles.statCard} ${styles.skeletonAction}`}>
              <div className={`${styles.skeletonBlock} ${styles.skeletonIcon}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonLabel}`} />
            </div>
          ))}
        </div>
        <div className={`${styles.countdownCompact} ${styles.skeletonCountdown}`}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonIcon}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonButton}`} />
        </div>
        <div className={`${styles.skeletonBlock} ${styles.skeletonZep}`} />
        <div className={styles.sectionRow}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
        </div>
        <div className={styles.skeletonModuleGrid}>
          {[0, 1, 2].map((card) => (
            <div key={card} className={styles.skeletonModule}>
              <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonMeta}`} />
              <div className={`${styles.skeletonBlock} ${styles.skeletonProgress}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModuleCards({ modules, moduleProgress, navigate, reducedMotion }) {
  return modules.map((mod) => {
    const progress = moduleProgress[mod.id]?.progress ?? 0;
    return (
      <motion.button
        key={mod.id}
        className={styles.moduleCardWrapper}
        onClick={() => navigate('/module/' + mod.id, { state: { module: mod } })}
        {...pressFeedback(reducedMotion)}
      >
        <h3 className={styles.moduleTitle}>{mod.title}</h3>
        <p className={styles.moduleDesc}>{mod.description}</p>
        <div className={styles.moduleProgressBarBg}>
          <motion.div
            className={styles.moduleProgressBarFill}
            initial={reducedMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: Math.min(1, Math.max(0, progress)) }}
            transition={{ duration: reducedMotion ? 0 : motionTiming.progress, ease: motionEase }}
          />
        </div>
        <div className={styles.moduleFooter}>
          <span className={styles.modulePercent}>{Math.round(progress * 100)}%</span>
          <div className={styles.continueBtn}>
            <ArrowRight size={20} color="#FFFFFF" />
          </div>
        </div>
      </motion.button>
    );
  });
}

export default function DashboardScreen() {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const sectionReveal = reducedMotion ? undefined : dashboardReveal;

  // Spring expand/collapse for the week picker.
  const pickerSpring = {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: reducedMotion ? { duration: 0 } : sheetSpring,
    style: { overflow: 'hidden' },
  };

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

  // One-time class prompt for students whose profile predates class codes.
  const [classPrompt, setClassPrompt] = useState(false);
  const [promptClass, setPromptClass] = useState('');
  const [promptConfirming, setPromptConfirming] = useState(null);
  const [promptSaving, setPromptSaving] = useState(false);
  const [promptError, setPromptError] = useState('');

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
        try {
          if (
            (profile.role ?? 'student') === 'student' &&
            !profile.class_code &&
            !sessionStorage.getItem('skorplus-class-asked')
          ) {
            setClassPrompt(true);
          }
        } catch { /* ignore */ }
        if (profile.week_anchor_date && profile.week_anchor_week && profile.week_anchor_day) {
          setAnchor({
            date: profile.week_anchor_date,
            week: profile.week_anchor_week,
            day: profile.week_anchor_day,
          });
        }
      }

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

      // Primary content is ready; notification writes should not hold up the dashboard.
      setLoading(false);

      // Streak rewards can refresh the persistent sidebar in the background.
      claimDailyStreak(user.id).then((result) => {
        if (result?.claimed) window.dispatchEvent(new CustomEvent('skorplus-profile-refresh'));
      }).catch(() => {});

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

  const dismissClassPrompt = () => {
    try { sessionStorage.setItem('skorplus-class-asked', '1'); } catch { /* ignore */ }
    setClassPrompt(false);
    setPromptClass('');
    setPromptConfirming(null);
    setPromptError('');
  };

  const continueClassPrompt = () => {
    const parsed = parseClassCode(promptClass);
    if (!parsed) {
      setPromptError('Use your class code, e.g. DCS 4B');
      return;
    }
    setPromptError('');
    setPromptConfirming(parsed);
  };

  const confirmClassPrompt = async () => {
    const parsed = promptConfirming;
    setPromptConfirming(null);
    setPromptSaving(true);
    setPromptError('');
    try {
      const userId = await getUserId();
      if (!userId) return;
      const { error } = await supabase
        .from('profiles')
        .update({ class_code: parsed.canonical, semester: parsed.semesterLabel })
        .eq('id', userId);
      if (error) throw error;
      setUserData((prev) => (prev ? { ...prev, class_code: parsed.canonical, semester: parsed.semesterLabel } : prev));
      dismissClassPrompt();
    } catch (err) {
      console.error('Save class error:', err);
      // Dismiss for this session so a missing migration never nag-loops.
      dismissClassPrompt();
    } finally {
      setPromptSaving(false);
    }
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
      setAnchor({ date: localDateStr(today), week: pendingWeek, day });
      setPaused(false);
      setPickerOpen(false);
      // Keep the current step visible through its closing animation.
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
    return <DashboardSkeleton />;
  }

  // Lecturers get their own dashboard (stats, content management, submissions).
  if (role === 'lecturer') {
    return <LecturerDashboardScreen unreadNotif={unreadNotif} />;
  }

  const actionCards = [
    { icon: ScanLine, label: 'Scan Solve', path: '/scan-solve' },
    { orb: true, label: <>AI Study<br />Buddy</>, path: '/ai-chat' },
    { icon: Send, label: 'Send Work', path: '/submit-work' },
  ];

  return (
    <div className={styles.container}>
      {classPrompt && (
        <ClassPrompt
          value={promptClass}
          onChange={(v) => { setPromptClass(v); setPromptConfirming(null); }}
          confirming={promptConfirming}
          onContinue={continueClassPrompt}
          onConfirm={confirmClassPrompt}
          onCancel={dismissClassPrompt}
          saving={promptSaving}
          error={promptError}
        />
      )}
      <motion.div
        className={styles.scrollContent}
        initial={reducedMotion ? false : 'hidden'}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.04 } } }}
      >
        <div className={styles.topBar}>
          <motion.button {...pressFeedback(reducedMotion)} className={styles.mobileHamburger} onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))} aria-label="Menu">
            <MoreHorizontal size={24} color="var(--color-text-primary)" />
          </motion.button>
          <div className={styles.logoWrap}>
            <img src="/assets/images/logo.png" className={styles.logoImage} alt="SkorPlus" />
          </div>
          <div className={styles.topBarActions}>
            <motion.button {...pressFeedback(reducedMotion)} className={styles.iconBtn} onClick={() => navigate('/notifications')} aria-label="Notifications">
              <Bell size={22} color="var(--color-text-primary)" />
              {unreadNotif > 0 && <span className={styles.notifBadge}>{unreadNotif > 9 ? '9+' : unreadNotif}</span>}
            </motion.button>
          </div>
        </div>

        <motion.div className={styles.semesterCard} variants={sectionReveal}>
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
            <motion.div
              className={styles.semesterBarFill}
              initial={reducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: semester?.progress ?? 0 }}
              transition={{ duration: reducedMotion ? 0 : motionTiming.progress, ease: motionEase }}
            />
          </div>

          {paused && semester && (
            <div className={styles.semesterControls}>
              <span className={styles.semesterHint}>Break active — progress is paused.</span>
              <motion.button {...pressFeedback(reducedMotion)} className={`${styles.semesterActionBtn} ${styles.semesterActionBtnSmall}`} onClick={handleEndBreak} disabled={saving}>
                End mid-sem break
              </motion.button>
            </div>
          )}

          {!paused && semester && !pickerOpen && (
            <div className={styles.semesterControls}>
              <motion.button {...pressFeedback(reducedMotion)} className={styles.semesterActionBtn} onClick={openUpdate}>Update week</motion.button>
              <motion.button {...pressFeedback(reducedMotion)} className={styles.semesterActionBtnSecondary} onClick={handleStartBreak} disabled={saving}>
                Start mid-sem break
              </motion.button>
            </div>
          )}

          {!semester && !pickerOpen && (
            <motion.button {...pressFeedback(reducedMotion)} className={styles.semesterActionBtn} onClick={openUpdate}>
              Set your week
            </motion.button>
          )}

          <AnimatePresence initial={false}>
            {pickerOpen && (
              <motion.div key="picker" {...pickerSpring}>
                <div className={styles.pickerWrap}>
                  {pickerStep === 'week' ? (
                    <>
                      <span className={styles.semesterHint}>What week are you on?</span>
                      <div className={styles.semesterWeekPicker}>
                        {Array.from({ length: 12 }, (_, i) => {
                          const week = i + 1;
                          return (
                            <motion.button {...pressFeedback(reducedMotion)}
                              key={week}
                              type="button"
                              className={styles.semesterWeekDot}
                              onClick={() => handlePickWeek(week)}
                            >
                              {week}
                            </motion.button>
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
                            <motion.button {...pressFeedback(reducedMotion)}
                              key={day}
                              type="button"
                              className={styles.semesterWeekDot}
                              onClick={() => handlePickDay(day)}
                              disabled={saving}
                            >
                              {day}
                            </motion.button>
                          );
                        })}
                      </div>
                      <motion.button {...pressFeedback(reducedMotion)}
                        className={styles.semesterActionBtnSecondary}
                        onClick={() => { setPickerStep('week'); setPendingWeek(null); }}
                      >
                        Back
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div className={styles.statsRow} variants={sectionReveal}>
          {actionCards.map((item, i) => {
            const Icon = item.icon;
            if (item.orb && reducedMotion) {
              return (
                <motion.button
                  key={i}
                  className={styles.statCard}
                  onClick={() => navigate(item.path)}
                >
                  <span className={styles.orbIcon}><Brain size={32} color="var(--color-primary)" /></span>
                  <span className={styles.statLabel}>{item.label}</span>
                </motion.button>
              );
            }
            if (item.orb) {
              return (
                <BorderBeam
                  key={i}
                  size="pulse-outside"
                  colorVariant="colorful"
                  theme="dark"
                  duration={2}
                  brightness={2}
                  saturation={1.8}
                  hueRange={90}
                  strength={1}
                  className={styles.orbCardBeam}
                >
                  <motion.button {...pressFeedback(reducedMotion)}
                    className={styles.statCard}
                    onClick={() => navigate(item.path)}
                  >
                    <span className={styles.orbIcon}>
                      <ThinkingOrb state="composing" size={64} />
                    </span>
                    <span className={styles.statLabel}>{item.label}</span>
                  </motion.button>
                </BorderBeam>
              );
            }
            return (
              <motion.button {...pressFeedback(reducedMotion)}
                key={i}
                className={styles.statCard}
                onClick={() => navigate(item.path)}
              >
                <Icon size={28} color="var(--color-primary)" />
                <span className={styles.statLabel}>{item.label}</span>
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div className={styles.countdownCompact} variants={sectionReveal}>
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
                    <motion.button {...pressFeedback(reducedMotion)} className={styles.countdownEditBtn} onClick={() => navigate('/set-exam', { state: { countdown } })}>Edit</motion.button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.countdownEmpty}>
              <Calendar size={28} color="var(--color-text-secondary)" />
              <p className={styles.countdownEmptyText}>Set your final exam</p>
              <motion.button {...pressFeedback(reducedMotion)} className={styles.countdownSetBtn} onClick={() => navigate('/set-exam')}>Set Date &amp; Time</motion.button>
            </div>
          )}
        </motion.div>

        {modules.length > 0 && (
          <motion.button {...pressFeedback(reducedMotion)} variants={sectionReveal} className={styles.zepCard} onClick={() => window.open('https://quiz.zep.us/en/public', '_blank')}>
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

        <motion.section variants={sectionReveal} aria-labelledby="dashboard-learning-title">
          <div className={styles.sectionRow}>
            <h2 id="dashboard-learning-title" className={styles.sectionTitle}>Continue Learning..</h2>
            <motion.button {...pressFeedback(reducedMotion)} className={styles.showAllLink} onClick={() => navigate('/modules')}>Show All &rarr;</motion.button>
          </div>

          {modules.length > 0 ? (
            <>
              <div className={styles.moduleGrid}>
                <ModuleCards modules={modules} moduleProgress={moduleProgress} navigate={navigate} reducedMotion={reducedMotion} />
              </div>
              <div className={styles.mobileCarousel}>
                <div className={styles.carousel} ref={carouselRef} onScroll={handleCarouselScroll}>
                  <ModuleCards modules={modules} moduleProgress={moduleProgress} navigate={navigate} reducedMotion={reducedMotion} />
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
                <motion.button {...pressFeedback(reducedMotion)} className={styles.emptyCta} onClick={() => navigate('/select-lecturers')}>
                  Choose Lecturers
                </motion.button>
              )}
            </div>
          )}
        </motion.section>
      </motion.div>
    </div>
  );
}
