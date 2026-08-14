import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus, Users, Trophy, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getUserByUsername,
  sendFriendRequest,
  getFriendshipBetween,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  getPendingRequests,
  getLeaderboard,
} from '../services/friendService';
import styles from './FriendsScreen.module.css';

const TABS = [
  { key: 'friends', label: 'My Friends', icon: Users },
  { key: 'requests', label: 'Requests', icon: UserPlus },
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function FriendsScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tab, setTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState('');
  const [searchState, setSearchState] = useState('idle'); // idle | notfound | self | friends | pending | requestable | incoming

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [friendsData, pendingData, board] = await Promise.all([
        getFriends(user.id),
        getPendingRequests(user.id),
        getLeaderboard(user.id),
      ]);
      setFriends(friendsData);
      setIncoming(pendingData.incoming);
      setOutgoing(pendingData.outgoing);
      setLeaderboard(board);
    } catch (err) {
      console.error('Load friends error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchMsg('');
    setSearchResult(null);
    try {
      const profile = await getUserByUsername(q);
      if (!profile) {
        setSearchState('notfound');
        setSearchMsg('User not found');
      } else if (profile.id === user.id) {
        setSearchState('self');
        setSearchMsg("That's you!");
      } else {
        const existing = await getFriendshipBetween(user.id, profile.id);
        if (existing) {
          if (existing.status === 'accepted') {
            setSearchState('friends');
            setSearchMsg('Already friends');
          } else if (existing.requester_id === user.id) {
            setSearchState('pending');
            setSearchMsg('Request pending');
          } else {
            setSearchState('incoming');
          }
        } else {
          setSearchState('requestable');
        }
        setSearchResult(profile);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchMsg('Something went wrong');
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async () => {
    if (!searchResult) return;
    try {
      await sendFriendRequest(user.id, searchResult.id);
      setSearchState('pending');
      setSearchMsg('Request sent!');
      loadAll();
    } catch (err) {
      console.error('Add friend error:', err);
      setSearchMsg('Something went wrong');
    }
  };

  const handleAccept = async (friendshipId) => {
    await acceptFriendRequest(friendshipId);
    loadAll();
  };

  const handleDecline = async (friendshipId) => {
    await declineFriendRequest(friendshipId);
    loadAll();
  };

  const renderAvatar = (friend, size = 44) => {
    if (friend?.photo_url) {
      return <img src={friend.photo_url} alt="" className={styles.avatar} style={{ width: size, height: size }} />;
    }
    return (
      <div className={styles.avatarPlaceholder} style={{ width: size, height: size }}>
        <User size={size * 0.5} color="#FFFFFF" />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h2 className={styles.headerTitle}>Friends</h2>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.searchRow}>
        <div className={styles.searchBox}>
          <Search size={18} color="var(--color-text-secondary)" />
          <input
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by username"
            autoCapitalize="none"
          />
          <button className={styles.searchBtn} onClick={handleSearch} disabled={searching}>
            {searching ? <div className={styles.smallSpinner} /> : 'Search'}
          </button>
        </div>

        {searchResult && (searchState === 'requestable' || searchState === 'incoming') && (
          <div className={styles.searchResultCard}>
            {renderAvatar(searchResult)}
            <div className={styles.searchResultInfo}>
              <span className={styles.searchResultName}>{searchResult.name}</span>
              <span className={styles.searchResultUsername}>@{searchResult.username}</span>
            </div>
            {searchState === 'requestable' && (
              <button className={styles.addBtn} onClick={handleAddFriend}>Add</button>
            )}
            {searchState === 'incoming' && (
              <button className={styles.addBtn} onClick={() => { setSearchState('pending'); setSearchMsg('Request pending'); }}>Accept</button>
            )}
          </div>
        )}
        {searchMsg && (
          <p className={styles.searchMsg} style={{ color: searchState === 'requestable' ? 'var(--color-success)' : 'var(--color-text-secondary)' }}>
            {searchMsg}
          </p>
        )}
      </div>

      <div className={styles.tabs}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
              onClick={() => setTab(t.key)}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.scroll}>
        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : tab === 'friends' ? (
          friends.length === 0 ? (
            <div className={styles.center}><p className={styles.emptyText}>No friends yet. Search above to add one.</p></div>
          ) : (
            friends.map(({ friendshipId, friend }) => (
              <button
                key={friendshipId}
                className={styles.friendCard}
                onClick={() => navigate(`/friend/${friend.id}`, { state: { friend } })}
              >
                {renderAvatar(friend)}
                <div className={styles.friendInfo}>
                  <span className={styles.friendName}>{friend.name}</span>
                  <span className={styles.friendUsername}>@{friend.username ?? 'unknown'}</span>
                </div>
              </button>
            ))
          )
        ) : tab === 'requests' ? (
          <div>
            {incoming.length > 0 && <h3 className={styles.sectionLabel}>Incoming</h3>}
            {incoming.map(({ friendshipId, friend }) => (
              <div key={friendshipId} className={styles.friendCard}>
                {renderAvatar(friend)}
                <div className={styles.friendInfo}>
                  <span className={styles.friendName}>{friend.name}</span>
                  <span className={styles.friendUsername}>@{friend.username ?? 'unknown'}</span>
                </div>
                <div className={styles.requestActions}>
                  <button className={styles.acceptBtn} onClick={() => handleAccept(friendshipId)}>Accept</button>
                  <button className={styles.declineBtn} onClick={() => handleDecline(friendshipId)}>Decline</button>
                </div>
              </div>
            ))}
            {outgoing.length > 0 && <h3 className={styles.sectionLabel}>Sent</h3>}
            {outgoing.map(({ friendshipId, friend }) => (
              <div key={friendshipId} className={styles.friendCard}>
                {renderAvatar(friend)}
                <div className={styles.friendInfo}>
                  <span className={styles.friendName}>{friend.name}</span>
                  <span className={styles.friendUsername}>@{friend.username ?? 'unknown'}</span>
                </div>
                <span className={styles.pendingLabel}>Pending</span>
              </div>
            ))}
            {incoming.length === 0 && outgoing.length === 0 && (
              <div className={styles.center}><p className={styles.emptyText}>No friend requests.</p></div>
            )}
          </div>
        ) : (
          leaderboard.length === 0 ? (
            <div className={styles.center}><p className={styles.emptyText}>Add friends to see the leaderboard.</p></div>
          ) : (
            leaderboard.map((friend, i) => (
              <div key={friend.id} className={styles.leaderCard}>
                <span className={styles.rank}>{i + 1}</span>
                {renderAvatar(friend)}
                <div className={styles.friendInfo}>
                  <span className={styles.friendName}>{friend.name}</span>
                  <span className={styles.friendUsername}>{friend.total_exp ?? 0} EXP</span>
                </div>
                <Trophy size={18} color={i === 0 ? 'var(--color-streak-orange)' : 'var(--color-text-secondary)'} />
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}
