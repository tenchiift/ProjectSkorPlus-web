import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { notifyEvent } from '../services/notificationService';
import Sidebar from './Sidebar';
import styles from './AppLayout.module.css';

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

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
    const channel = supabase.channel('online-users');
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
      }
    });
    return () => {
      channel.untrack();
      channel.unsubscribe();
    };
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

  if (isDesktop) {
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
          {children}
        </main>
      </div>
    );
  }

  return (
    <>
      {children}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNavigate={handleSidebarNavigate}
        userData={userData}
      />
    </>
  );
}
