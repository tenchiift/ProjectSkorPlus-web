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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className={styles.headerTitle}>All Modules</h1>
        <div className={styles.headerSpacer} />
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
