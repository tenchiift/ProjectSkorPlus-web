import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Flame, CheckCircle2, ArrowRight, MoreHorizontal, Settings, Calendar, RefreshCw, Brain } from 'lucide-react';
import { supabase } from '../config/supabase';
import { getModules, getUserModuleProgress } from '../services/moduleService';
import Sidebar from '../components/Sidebar';
import styles from './DashboardScreen.module.css';

export default function DashboardScreen() {
  const navigate = useNavigate();
  const carouselRef = useRef(null);

  const [userData, setUserData] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [daysLeft, setDaysLeft] = useState(null);

  const handleLogout = async () => {
    setSidebarVisible(false);
    try {
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSidebarNavigate = useCallback(
    (route) => {
      if (route === 'logout') {
        handleLogout();
      } else {
        setSidebarVisible(false);
        navigate(route);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) setUserData(profile);

      const [modulesData, progress, countdownData] = await Promise.all([
        getModules(),
        getUserModuleProgress(user.id),
        supabase
          .from('exam_countdowns')
          .select('*')
          .eq('user_id', user.id)
          .order('exam_date', { ascending: true })
          .limit(1),
      ]);

      setModules(modulesData);
      setModuleProgress(progress);

      if (countdownData.data?.length > 0) {
        const cd = countdownData.data[0];
        setCountdown(cd);
        const examDate = new Date(cd.exam_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.ceil(
          (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        setDaysLeft(diff);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  const handleCarouselScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const el = carouselRef.current;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setCarouselIndex(idx);
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const stats = [
    { icon: Zap, color: 'var(--color-exp-blue)', value: String(userData?.total_exp ?? 0), label: 'Totals Exp' },
    { icon: Flame, color: 'var(--color-streak-orange)', value: String(userData?.days_streak ?? 0), label: 'Days Streak' },
    { icon: CheckCircle2, color: 'var(--color-completed-red)', value: String(userData?.completed ?? 0), label: 'Completed' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.scrollContent}>
        <div className={styles.topBar}>
          <button className={styles.iconBtn} onClick={() => setSidebarVisible(true)} aria-label="Menu">
            <MoreHorizontal size={24} color="var(--color-text-primary)" />
          </button>
          <div className={styles.logoWrap}>
            <img src="/assets/images/logo.png" className={styles.logoImage} alt="SkorPlus" />
          </div>
          <div className={styles.topBarActions}>
            <button className={styles.iconBtn} onClick={() => navigate('/settings')} aria-label="Settings">
              <Settings size={22} color="var(--color-text-primary)" />
            </button>
            <button className={styles.iconBtn} onClick={handleRefresh} disabled={refreshing} aria-label="Refresh">
              <RefreshCw size={20} color="var(--color-text-primary)" className={refreshing ? styles.spinIcon : ''} />
            </button>
          </div>
        </div>

        <div className={styles.statsRow}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={styles.statCard}>
                <Icon size={28} color={stat.color} />
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.countdownCompact}>
          {countdown ? (
            <div>
              <div className={styles.countdownDaysRow}>
                <span className={styles.countdownDays}>
                  {daysLeft !== null ? daysLeft : '0'}
                </span>
                <span className={styles.countdownDaysLabel}>days left</span>
              </div>
              <p className={styles.countdownCompactTitle}>{countdown.title}</p>
              <div className={styles.countdownBottomRow}>
                <div className={styles.countdownDateRow}>
                  <Calendar size={13} color="var(--color-text-secondary)" />
                  <span className={styles.countdownDate}>
                    {new Date(countdown.exam_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <button
                  className={styles.countdownEditBtn}
                  onClick={() => navigate('/set-exam', { state: { countdown } })}
                >
                  Edit
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.countdownEmpty}>
              <Calendar size={28} color="var(--color-text-secondary)" />
              <p className={styles.countdownEmptyText}>Set your final exam</p>
              <button
                className={styles.countdownSetBtn}
                onClick={() => navigate('/set-exam')}
              >
                Set Date &amp; Time
              </button>
            </div>
          )}
        </div>

        {modules.length > 0 && (
          <button
            className={styles.zepCard}
            onClick={() => {
              window.open('https://quiz.zep.us/en/public', '_blank');
            }}
          >
            <div className={styles.zepCardContent}>
              <div className={styles.zepIconWrap}>
                <Brain size={28} color="#FFFFFF" />
              </div>
              <div className={styles.zepTextWrap}>
                <span className={styles.zepKicker}>QUICK PRACTICE</span>
                <span className={styles.zepTitle}>Zep Quiz</span>
                <span className={styles.zepDesc}>Test your knowledge with quick questions</span>
              </div>
            </div>
            <div className={styles.zepArrow}>
              <ArrowRight size={22} color="#FFFFFF" />
            </div>
          </button>
        )}

        <div className={styles.sectionRow}>
          <h2 className={styles.sectionTitle}>Continue Learning..</h2>
          <button className={styles.showAllLink} onClick={() => navigate('/modules')}>
            Show All &rarr;
          </button>
        </div>

        {modules.length > 0 ? (
          <div className={styles.carouselSection}>
            <div
              className={styles.carousel}
              ref={carouselRef}
              onScroll={handleCarouselScroll}
            >
              {modules.map((mod) => {
                const progress = moduleProgress[mod.id]?.progress ?? 0;
                const gradientClass =
                  mod.color === 'amber' ? styles.moduleCardAmber : styles.moduleCardPurple;

                return (
                  <button
                    key={mod.id}
                    className={styles.moduleCardWrapper}
                    onClick={() =>
                      navigate('/module/' + mod.id, { state: { module: mod } })
                    }
                  >
                    <div className={`${styles.moduleCard} ${gradientClass}`}>
                      <div className={styles.moduleTopPill} />
                      <h3 className={styles.moduleTitle}>{mod.title}</h3>
                      <p className={styles.moduleDesc}>{mod.description}</p>
                      <div className={styles.moduleProgressBarBg}>
                        <div
                          className={styles.moduleProgressBarFill}
                          style={{ width: `${progress * 100}%` }}
                        />
                      </div>
                      <div className={styles.moduleFooter}>
                        <span className={styles.modulePercent}>
                          {Math.round(progress * 100)}%
                        </span>
                        <div className={styles.continueBtn}>
                          <ArrowRight size={20} color="#FFFFFF" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className={styles.dotsRow}>
              {modules.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.dot} ${i === carouselIndex ? styles.dotActive : ''}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <p className={styles.emptyText}>No modules available</p>
          </div>
        )}
      </div>

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
        userData={userData}
      />
    </div>
  );
}
