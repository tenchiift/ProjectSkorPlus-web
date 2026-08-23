import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Bell, FileText, Layers } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { getLecturerSubmissions, getSubmissionCounts } from '../services/submissionService';
import { getModules } from '../services/moduleService';
import { getExamCount } from '../services/examService';
import styles from './LecturerDashboardScreen.module.css';

export default function LecturerDashboardScreen({ unreadNotif = 0 }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('Lecturer');
  const [stats, setStats] = useState({ students: 0, total: 0, pending: 0, modules: 0, exams: 0 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [{ data: profile }, { count: students }, counts, modules, exams, submissions] = await Promise.all([
          supabase.from('profiles').select('name, role').eq('id', user.id).single(),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          getSubmissionCounts(user.id),
          getModules(),
          getExamCount(),
          getLecturerSubmissions(user.id),
        ]);
        if (profile?.name) setName(profile.name);
        setStats({
          students: students ?? 0,
          total: counts.total,
          pending: counts.pending,
          modules: modules.length,
          exams,
        });
        setRecent(submissions.slice(0, 5));
      } catch (err) {
        console.error('Lecturer dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const reviewedCount = stats.total - stats.pending;

  return (
    <div className={styles.container}>
      <div className={styles.scrollContent}>
        <div className={styles.topBar}>
          <button
            className={styles.iconBtn}
            onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            aria-label="Menu"
          >
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

        <div className={styles.scroll}>
          <h2 className={styles.pageTitle}>Welcome, {name}</h2>

          {/* #1 priority: submissions to review — always a tall card */}
          <div className={styles.inboxHero}>
            <div className={styles.inboxHeroHead}>
              <span className={styles.inboxHeroLabel}>Inbox</span>
              {stats.pending > 0 ? (
                <span className={styles.inboxPendingBadge}>{stats.pending} pending</span>
              ) : (
                <span className={styles.inboxCaughtUp}>All caught up</span>
              )}
            </div>

            <div className={`${styles.inboxBody} ${loading || recent.length === 0 ? styles.inboxBodyCenter : ''}`}>
              {loading ? (
                <div className={styles.heroCenter}><div className={styles.spinner} /></div>
              ) : recent.length === 0 ? (
                <p className={styles.inboxEmpty}>
                  No submissions yet — students can send work to you from Send Work.
                </p>
              ) : (
                <div className={styles.inboxRows}>
                  {recent.map((sub) => {
                    const fileNames = (sub.files ?? []).map((f) => f.file_name).filter(Boolean);
                    const title = fileNames[0] ?? sub.message ?? 'Submission';
                    return (
                      <button
                        key={sub.id}
                        className={styles.inboxRow}
                        onClick={() => navigate(`/submission/${sub.id}`)}
                      >
                        <span className={styles.inboxRowTitle}>
                          <FileText size={14} color="var(--color-text-secondary)" />
                          {title}
                        </span>
                        <span className={styles.inboxRowMeta}>
                          {sub.student?.name ?? 'Student'} · {sub.status === 'reviewed' ? 'Reviewed' : 'New'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button className={styles.inboxViewAll} onClick={() => navigate('/inbox')}>
              View All Submissions
            </button>
          </div>

          {/* #2 & #3: content management */}
          <div className={styles.actionGrid}>
            <button className={styles.actionCard} onClick={() => navigate('/manage-modules')}>
              <div className={styles.actionCardHead}>
                <Layers size={22} color="var(--color-primary)" />
                <span className={styles.actionCount}>{stats.modules}</span>
              </div>
              <span className={styles.actionCardTitle}>Modules</span>
              <span className={styles.actionCardSub}>Manage topics & notes</span>
            </button>
            <button className={styles.actionCard} onClick={() => navigate('/manage-exams')}>
              <div className={styles.actionCardHead}>
                <FileText size={22} color="var(--color-primary)" />
                <span className={styles.actionCount}>{stats.exams}</span>
              </div>
              <span className={styles.actionCardTitle}>Past Papers</span>
              <span className={styles.actionCardSub}>Add & manage PDFs</span>
            </button>
          </div>

          {/* Numbers — six stat cards, 2 per row */}
          <div className={styles.statsRow}>
            {[
              { label: 'Students', value: stats.students, to: '/students' },
              { label: 'Submissions', value: stats.total },
              { label: 'Pending', value: stats.pending },
              { label: 'Reviewed', value: reviewedCount },

            ].map((s) => {
              const content = (
                <>
                  <span className={styles.miniStatLabel}>{s.label}</span>
                  <span className={styles.miniStatValue}>{s.value}</span>
                </>
              );
              return s.to ? (
                <button key={s.label} className={styles.miniStat} onClick={() => navigate(s.to)}>
                  {content}
                </button>
              ) : (
                <div key={s.label} className={styles.miniStat}>{content}</div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
