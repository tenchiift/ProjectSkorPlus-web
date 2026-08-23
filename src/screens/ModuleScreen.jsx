import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Zap } from 'lucide-react';
import { getTopics } from '../services/moduleService';
import styles from './ModuleScreen.module.css';

export default function ModuleScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const moduleData = location.state?.module ?? {};
  const moduleId = moduleData.id ?? id;

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zepCode, setZepCode] = useState('');

  useEffect(() => {
    if (!moduleId) return;
    getTopics(moduleId)
      .then((list) => setTopics(list.filter((t) => t.pdf_url)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [moduleId]);

  const zepReady = /^\d{7}$/.test(zepCode.trim());
  const joinZep = () => {
    if (!zepReady) return;
    window.open(`https://quiz.zep.us/en/join?code=${zepCode.trim()}`, '_blank', 'noopener');
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.banner} bg-graph-purple`}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </button>

        <div className={styles.bannerContent}>
          <div className={styles.bannerPill} />
          <h1 className={styles.bannerTitle}>{moduleData.title ?? 'Module'}</h1>
          <p className={styles.bannerDesc}>{moduleData.description ?? ''}</p>

          <div className={styles.zepBannerRow}>
            <Zap size={18} color="#FFFFFF" />
            <input
              className={styles.zepBannerInput}
              value={zepCode}
              onChange={(e) => setZepCode(e.target.value.replace(/\D/g, '').slice(0, 7))}
              onKeyDown={(e) => e.key === 'Enter' && joinZep()}
              placeholder="Zep quiz code"
              inputMode="numeric"
              autoComplete="off"
            />
            <button className={styles.zepBannerJoin} onClick={joinZep} disabled={!zepReady}>
              Join
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <span className={styles.sectionLabel}>NOTES</span>

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : topics.length === 0 ? (
          <div className={styles.emptyCard}>
            <FileText size={28} color="var(--color-text-secondary)" />
            <span className={styles.emptyText}>No notes yet — your lecturer will add them.</span>
          </div>
        ) : (
          <div className={styles.topicList}>
            {topics.map((topic) => (
              <div key={topic.id} className={styles.topicRow}>
                <span className={styles.topicTitle}>{topic.title}</span>
                <button
                  className={styles.pdfBtn}
                  onClick={() =>
                    navigate('/pdf-viewer', {
                      state: { exam: { title: topic.title, pdf_url: topic.pdf_url } },
                    })
                  }
                >
                  <FileText size={15} color="var(--color-primary)" />
                  <span>PDF</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
