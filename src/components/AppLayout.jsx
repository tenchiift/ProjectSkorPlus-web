import { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { notifyEvent } from '../services/notificationService';
import { startPresenceTracking, stopPresenceTracking } from '../services/friendChatService';
import Sidebar from './Sidebar';
import LoadingScreen from './LoadingScreen';
import ReportBugModal from './ReportBugModal';
import styles from './AppLayout.module.css';

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [userData, setUserData] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  const pageMotion = {
    initial: reducedMotion ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.22, ease: 'easeOut' },
  };

  const isPreAppRoute =
    ['/setup-profile', '/onboarding'].includes(location.pathname) ||
    location.pathname.startsWith('/calcquest');

  useEffect(() => {
    const checkViewport = () => {
      const wideEnough = window.matchMedia('(min-width: 768px)').matches;
      const mobileLandscape = window.matchMedia(
        '(max-height: 560px) and (orientation: landscape)'
      ).matches;
      setIsDesktop(wideEnough && !mobileLandscape);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    window.addEventListener('orientationchange', checkViewport);
    return () => {
      window.removeEventListener('resize', checkViewport);
      window.removeEventListener('orientationchange', checkViewport);
    };
  }, []);

  useEffect(() => {
    const toggle = () => setSidebarVisible((v) => !v);
    document.addEventListener('toggle-sidebar', toggle);
    return () => document.removeEventListener('toggle-sidebar', toggle);
  }, []);

  useEffect(() => {
    const openReport = () => setReportOpen(true);
    document.addEventListener('open-report-bug', openReport);
    return () => document.removeEventListener('open-report-bug', openReport);
  }, []);

  useEffect(() => {
    const openSuggest = () => setSuggestOpen(true);
    document.addEventListener('open-suggest-idea', openSuggest);
    return () => document.removeEventListener('open-suggest-idea', openSuggest);
  }, []);

  const fetchProfile = useCallback(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setUserData(data);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetchProfile();
    window.addEventListener('skorplus-profile-refresh', fetchProfile);
    return () => window.removeEventListener('skorplus-profile-refresh', fetchProfile);
  }, [fetchProfile]);

  useEffect(() => {
    if (!user) return;
    const isLecturer = userData?.role === 'lecturer';
    const channel = supabase.channel(`submission-notify-${user.id}`);

    if (isLecturer) {
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions', filter: `lecturer_id=eq.${user.id}` },
        () => {
          notifyEvent(user.id, 'submission', 'Kerja baru masuk 📄', 'Ada student hantar kerja. Jom check!');
        }
      );
    } else {
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'submissions', filter: `student_id=eq.${user.id}` },
        (payload) => {
          if (payload.new?.status === 'reviewed' && payload.old?.status !== 'reviewed') {
            notifyEvent(user.id, 'submission', 'Kerja dah direview ✅', 'Lecturer dah check kerja kamu!');
          }
        }
      );
    }

    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [user, userData?.role]);

  useEffect(() => {
    if (!user) return;
    startPresenceTracking(user.id);
    return () => {
      stopPresenceTracking();
    };
  }, [user]);

  const handleLogout = useCallback(async () => {
    setSidebarVisible(false);
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  }, [navigate]);

  const handleSidebarNavigate = useCallback(
    (route) => {
      if (route === 'logout') {
        handleLogout();
      } else {
        setSidebarVisible(false);
        navigate(route);
      }
    },
    [navigate, handleLogout]
  );

  if (isDesktop && !isPreAppRoute) {
    return (
      <div className={styles.desktopLayout}>
        <Sidebar
          persistent
          visible={false}
          onClose={() => {}}
          onNavigate={handleSidebarNavigate}
          userData={userData}
        />
        <main className={styles.desktopContent}>
          <Suspense fallback={<LoadingScreen />}>
            <motion.div key={location.pathname} {...pageMotion} style={{ height: '100%' }}>
              {children}
            </motion.div>
          </Suspense>
        </main>
        <ReportBugModal open={reportOpen} onClose={() => setReportOpen(false)} />
        <ReportBugModal mode="idea" open={suggestOpen} onClose={() => setSuggestOpen(false)} />
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <motion.div key={location.pathname} {...pageMotion} style={{ height: '100%' }}>
          {children}
        </motion.div>
      </Suspense>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
        userData={userData}
      />
      <ReportBugModal open={reportOpen} onClose={() => setReportOpen(false)} />
      <ReportBugModal mode="idea" open={suggestOpen} onClose={() => setSuggestOpen(false)} />
    </>
  );
}
