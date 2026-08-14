import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Zap, Flame, CheckCircle2, User } from 'lucide-react';
import styles from './FriendProfileScreen.module.css';

export default function FriendProfileScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const friend = location.state?.friend;

  if (!friend) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
            <ArrowLeft size={24} color="var(--color-text-primary)" />
          </button>
          <h2 className={styles.headerTitle}>Friend</h2>
          <div className={styles.headerSpacer} />
        </div>
        <div className={styles.center}>
          <p className={styles.emptyText}>Friend not found.</p>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Zap, color: 'var(--color-exp-blue)', value: String(friend.total_exp ?? 0), label: 'Total Exp' },
    { icon: Flame, color: 'var(--color-streak-orange)', value: String(friend.days_streak ?? 0), label: 'Days Streak' },
    { icon: CheckCircle2, color: 'var(--color-completed-red)', value: String(friend.completed ?? 0), label: 'Completed' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h2 className={styles.headerTitle}>Friend</h2>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>
        <div className={styles.avatarContainer}>
          {friend.photo_url ? (
            <img src={friend.photo_url} alt="" className={styles.avatarImage} />
          ) : (
            <div className={styles.avatar}>
              <User size={48} color="#FFFFFF" />
            </div>
          )}
          <h1 className={styles.name}>{friend.name ?? 'Student'}</h1>
          <p className={styles.username}>@{friend.username ?? 'unknown'}</p>
        </div>

        <div className={styles.statsRow}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className={styles.statCard}>
                <Icon size={26} color={stat.color} />
                <span className={styles.statValue}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
            );
          })}
        </div>

        {friend.semester && (
          <div className={styles.infoBlock}>
            <span className={styles.infoLabel}>Semester / Year</span>
            <span className={styles.infoValue}>{friend.semester}</span>
          </div>
        )}

        {friend.bio && (
          <div className={styles.infoBlock}>
            <span className={styles.infoLabel}>Bio</span>
            <span className={styles.infoValue}>{friend.bio}</span>
          </div>
        )}
      </div>
    </div>
  );
}
