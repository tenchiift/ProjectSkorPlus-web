import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
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

  useEffect(() => {
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
