import { useState, useEffect, useCallback, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { notifyEvent } from '../services/notificationService';
import { startPresenceTracking, stopPresenceTracking } from '../services/friendChatService';
import Sidebar from './Sidebar';
import LoadingScreen from './LoadingScreen';
import styles from './AppLayout.module.css';

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const reducedMotion = useReducedMotion();
  const [userData, setUserData] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Entrance animation on every route change (Outlet remounts per path).
  const pageMotion = {
    initial: reducedMotion ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.22, ease: 'easeOut' },
  };

  // Pre-app routes (profile setup, intro pages) render chrome-free — the
  // sidebar only exists once the introduction flow is finished.
  const isPreAppRoute = ['/setup-profile', '/onboarding'].includes(location.pathname);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const toggle = () => setSidebarVisible((v) => !v);
    document.addEventListener('toggle-sidebar', toggle);
    return () => document.removeEventListener('toggle-sidebar', toggle);
  }, []);

  const fetchProfile = useCallback(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => { if (data) setUserData(data); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    fetchProfile();
    window.addEventListener('skorplus-profile-refresh', fetchProfile);
    return () => window.removeEventListener('skorplus-profile-refresh', fetchProfile);
  }, [fetchProfile]);

  // App-wide submission notifications: lecturers hear about new work,
  // students hear when their work is reviewed. Lives here (not in the
  // inbox screen) so it works on every screen.
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
    return () => { channel.unsubscribe(); };
  }, [user, userData?.role]);

  useEffect(() => {
    if (!user) return;
    // Single shared presence channel (owned by friendChatService) — screens
    // like Messages/FriendChat subscribe to the same channel's sync events.
    startPresenceTracking(user.id);
    return () => { stopPresenceTracking(); };
  }, [user]);

  const handleLogout = useCallback(async () => {
    setSidebarVisible(false);
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  }, [navigate]);

  const handleSidebarNavigate = useCallback((route) => {
    if (route === 'logout') {
      handleLogout();
    } else {
      setSidebarVisible(false);
      navigate(route);
    }
  }, [navigate, handleLogout]);

  // Inner Suspense boundary: lazy screen chunks load inside the content area
  // only, so the sidebar/chrome never flashes a full-page loading screen.
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
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        {/* definite height so pages' min-height:100% backgrounds resolve */}
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
    </>
  );
}
