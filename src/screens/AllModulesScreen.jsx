import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import { getModules, getModulesForStudent, getUserModuleProgress } from '../services/moduleService';
import styles from './AllModulesScreen.module.css';

export default function AllModulesScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [moduleProgress, setModuleProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      const isStudent = (profile?.role ?? 'student') === 'student';

      const modulesData = isStudent
        ? await getModulesForStudent(user.id)
        : await getModules();
      setModules(modulesData);

      const progress = await getUserModuleProgress(user.id);
      setModuleProgress(progress);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  const inProgress = modules.filter((m) => {
    const p = moduleProgress[m.id]?.progress ?? 0;
    return p > 0 && p < 1;
  }).length;
  const completed = modules.filter((m) => (moduleProgress[m.id]?.progress ?? 0) >= 1).length;

  return (
    <div className={styles.container}>
      <div className={`${styles.banner} bg-graph-purple`}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </button>
        <div className={styles.bannerContent}>
          <div className={styles.bannerPill} />
          <h1 className={styles.bannerTitle}>All Modules</h1>
          <p className={styles.bannerDesc}>{modules.length} {modules.length === 1 ? 'module' : 'modules'} available</p>
          <div className={styles.bannerStats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{modules.length}</span>
              <span className={styles.statLabel}>Modules</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>{inProgress}</span>
              <span className={styles.statLabel}>In Progress</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>{completed}</span>
              <span className={styles.statLabel}>Completed</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.scroll}>
        {modules.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>No modules available yet.</p>
          </div>
        ) : (
          modules.map((mod) => {
            const progress = moduleProgress[mod.id]?.progress ?? 0;
            const percent = Math.round(progress * 100);
            return (
              <div
                key={mod.id}
                className={styles.moduleCard}
              >
                <h2 className={styles.moduleTitle}>{mod.title}</h2>
                <p className={styles.moduleDesc}>{mod.description}</p>
                <div className={styles.moduleProgressBarBg}>
                  <div
                    className={styles.moduleProgressBarFill}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className={styles.modulePercent}>{percent}% Complete</p>
                <div className={styles.moduleFooter}>
                  <span className={styles.continueText}>Continue Learning</span>
                  <button
                    className={styles.continueBtn}
                    onClick={() => navigate(`/module/${mod.id}`, { state: { module: mod } })}
                  >
                    <ArrowRight size={20} color="#FFFFFF" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
