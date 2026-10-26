import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WORLDS_DATA, WORLD_LIST } from '../calcquest/data/worldsData';
import {
  loadCalcQuestState,
  saveCalcQuestState,
  recordQuestionAttempt,
  claimQuestCompletion,
} from '../services/calcQuestService';
import GameViewport from '../calcquest/components/GameViewport';
import QuestPuzzleModal from '../calcquest/components/QuestPuzzleModal';
import {
  OverworldMapPanel,
  AvatarStudioPanel,
  SkillInsightsPanel,
  StudyPartyPanel,
  DailyQuestsAndAchievementsPanel,
} from '../calcquest/components/Panels';
import PixelIcon from '../calcquest/components/PixelIcon';
import StudentFeedbackPanel from '../calcquest/components/StudentFeedbackPanel';
import DailyQuizPanel from '../calcquest/components/DailyQuizPanel';
import { soundEngine } from '../calcquest/engine/soundEngine';
import styles from '../calcquest/CalcQuest.module.css';

const PAUSE_MENU_ITEMS = [
  { id: 'play', label: 'Resume Game', icon: 'compass' },
  { id: 'map', label: 'World Map (5)', icon: 'scroll' },
  { id: 'avatar', label: 'Outfitters', icon: 'bag' },
  { id: 'insights', label: 'Skill Ledger', icon: 'core_green' },
  { id: 'party', label: 'Study Party', icon: 'shield' },
  { id: 'daily', label: 'Daily Tasks', icon: 'crown' },
  { id: 'feedback', label: 'Student Feedback', icon: 'scroll' },
  { id: 'audio', label: 'Toggle Audio', icon: 'sound_on' },
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
];

export default function CalcQuestScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gameState, setGameState] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState('play'); // 'play' | 'map' | 'avatar' | 'insights' | 'party' | 'daily'
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false);
  const [menuCursor, setMenuCursor] = useState(0);
  const [activeNPC, setActiveNPC] = useState(null);
  const [hudModal, setHudModal] = useState(null); // 'journal' | 'inventory' | null
  const [activeBanner, setActiveBanner] = useState(null);

  const fetchGameState = useCallback(async () => {
    setLoadError(null);
    try {
      const uid = user?.id || 'guest_explorer';
      const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Explorer';
      const loaded = await loadCalcQuestState(uid, displayName);
      setGameState(loaded);
      soundEngine.setSettings(loaded.profile.settings || {});
    } catch (err) {
      setLoadError(err?.message || 'Unable to load your Explorer Field Journal.');
    }
  }, [user]);

  useEffect(() => {
    fetchGameState();
  }, [fetchGameState]);

  const showCelebrationBanner = useCallback((title, subtitle) => {
    setActiveBanner({ title, subtitle });
    setTimeout(() => setActiveBanner(null), 4000);
  }, []);

  if (loadError) {
    return (
      <div className={styles.pageShellFullscreen} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div className={styles.journalSheet} style={{ maxWidth: '420px' }}>
          <h2 className={styles.sectionTitle}>Could Not Open CalcQuest Journal</h2>
          <p className={styles.sectionLead}>{loadError}</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={fetchGameState} className={styles.actionBtn}>
              Retry Loading
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className={styles.secondaryBtn}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className={styles.pageShellFullscreen} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div className={styles.journalSheet} style={{ maxWidth: '420px' }}>
          <h2 className={styles.sectionTitle}>Starting Handheld Console...</h2>
          <p className={styles.sectionLead}>Loading your world map, quest log, and skill records.</p>
        </div>
      </div>
    );
  }

  const uid = user?.id || 'guest_explorer';
  const currentWorld = WORLDS_DATA[gameState.profile.current_world] || WORLDS_DATA.world_1;
  const activeQuestForNPC = activeNPC
    ? currentWorld.quests.find((q) => q.id === activeNPC.questId)
    : null;

  const restoredCoresCount = Object.values(gameState.worlds || {}).filter(
    (w) => w.knowledge_core_restored
  ).length;

  const handleSelectWorld = async (worldId) => {
    const targetWorld = WORLDS_DATA[worldId];
    if (!targetWorld) return;
    const next = structuredClone(gameState);
    next.profile.current_world = worldId;
    next.profile.last_position = {
      worldId,
      x: targetWorld.spawn.x,
      y: targetWorld.spawn.y,
    };
    setGameState(next);
    setActiveTab('play');
    setPauseMenuOpen(false);
    setHudModal(null);
    await saveCalcQuestState(uid, next);
  };

  const handleUsePortal = async (portalObj) => {
    const bossDone =
      !!gameState.profile.world_states?.[currentWorld.id]?.boss_defeated ||
      !!gameState.worlds?.[currentWorld.id]?.boss_defeated;
    if (portalObj.requiresBoss && !bossDone) {
      showCelebrationBanner(
        'Portal Sealed by Region Guardian',
        `Complete ${currentWorld.name}'s Guardian Trial to open the passage to the next region.`
      );
      return;
    }
    if (portalObj.targetWorld) {
      soundEngine.playWorldRestored();
      await handleSelectWorld(portalObj.targetWorld);
      showCelebrationBanner(
        `Arrived at ${WORLDS_DATA[portalObj.targetWorld]?.name}`,
        WORLDS_DATA[portalObj.targetWorld]?.subtitle
      );
    }
  };

  const handlePositionSave = (pos) => {
    setGameState((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        profile: { ...prev.profile, last_position: pos },
      };
      saveCalcQuestState(uid, next);
      return next;
    });
  };

  const handleToggleMute = async () => {
    const nextMuted = !gameState.profile.settings?.muted;
    soundEngine.setSettings({ muted: nextMuted });
    const next = structuredClone(gameState);
    next.profile.settings = { ...next.profile.settings, muted: nextMuted };
    setGameState(next);
    await saveCalcQuestState(uid, next);
  };

  const handleQuestionAttempt = async (attemptPayload) => {
    const updated = await recordQuestionAttempt(uid, gameState, attemptPayload);
    setGameState(updated);
  };

  const handleDailyAnswer = async ({ date, answers, question, index, result }) => {
    const updated = await recordQuestionAttempt(uid, gameState, {
      question, submittedAnswer: index, correct: result.correct,
      attemptNumber: 1, hintsUsed: 0, detectedMisconception: result.detectedMisconception,
    });
    updated.profile.settings = { ...updated.profile.settings, dailyQuiz: { date, answers } };
    await saveCalcQuestState(uid, updated);
    setGameState(updated);
  };

  const handleQuestComplete = async ({ worldId, quest }) => {
    if (quest.unlocksState === 'bridge_repaired') {
      soundEngine.playBridgeRepair();
    }
    const { nextState, xpGained, coinsGained } = await claimQuestCompletion(uid, gameState, {
      worldId,
      quest,
    });
    setGameState(nextState);
    showCelebrationBanner(
      `${quest.title} Completed`,
      `+${xpGained} XP, +${coinsGained} CalcCoins${
        quest.unlocksState === 'bridge_repaired' ? '. Bridge repaired and open for crossing.' : ''
      }`
    );
  };

  const handleSaveAvatar = async (newAvatar) => {
    const next = structuredClone(gameState);
    next.avatar = newAvatar;
    setGameState(next);
    await saveCalcQuestState(uid, next);
    showCelebrationBanner('Appearance Updated', 'Your Explorer sprite has been saved.');
  };

  const handleCompleteDiagnostic = async ({ score, total, recommendedWorld }) => {
    const next = structuredClone(gameState);
    next.profile.diagnostic_completed = true;
    next.profile.diagnostic_recommended_world = recommendedWorld;
    const recOrder = WORLDS_DATA[recommendedWorld]?.order || 1;
    WORLD_LIST.forEach((w) => {
      if (w.order <= recOrder) {
        next.worlds[w.id].unlocked = true;
      }
    });
    setGameState(next);
    await saveCalcQuestState(uid, next);
    showCelebrationBanner(
      `Placement Check Complete (${score}/${total})`,
      `Recommended starting region: ${WORLDS_DATA[recommendedWorld]?.name}`
    );
  };

  const handleCompleteRemedialMission = async (skillId) => {
    const next = structuredClone(gameState);
    next.profile.total_xp += 60;
    next.profile.calc_coins += 50;
    next.profile.level = Math.floor(next.profile.total_xp / 150) + 1;
    if (!next.achievements.includes('mistake_to_mastery')) {
      next.achievements.push('mistake_to_mastery');
    }
    if (next.skills[skillId]) {
      next.skills[skillId].mastery_estimate = Math.min(
        1,
        Number((next.skills[skillId].mastery_estimate + 0.25).toFixed(3))
      );
      next.skills[skillId].misconception_counts = {};
    }
    setGameState(next);
    await saveCalcQuestState(uid, next);
    showCelebrationBanner('Mistake-to-Mastery Completed', '+60 XP, +50 CalcCoins');
  };

  const handleCompletePartyMission = async (mission) => {
    const next = structuredClone(gameState);
    next.profile.total_xp += mission.xpReward;
    next.profile.calc_coins += mission.coinReward;
    next.profile.level = Math.floor(next.profile.total_xp / 150) + 1;
    if (!next.achievements.includes('team_synergy')) {
      next.achievements.push('team_synergy');
    }
    setGameState(next);
    await saveCalcQuestState(uid, next);
    showCelebrationBanner('Study Party Mission Complete', `+${mission.xpReward} XP, +${mission.coinReward} CalcCoins`);
  };

  const handleClaimDaily = async (dq) => {
    const next = structuredClone(gameState);
    next.dailyQuests = next.dailyQuests.map((item) =>
      item.quest_id === dq.id ? { ...item, claimed: true } : item
    );
    next.profile.total_xp += dq.xpReward;
    next.profile.calc_coins += dq.coinReward;
    next.profile.level = Math.floor(next.profile.total_xp / 150) + 1;
    soundEngine.playCorrectAnswer();
    setGameState(next);
    await saveCalcQuestState(uid, next);
    showCelebrationBanner(`${dq.title} Claimed`, `+${dq.xpReward} XP, +${dq.coinReward} CalcCoins`);
  };

  // Trigger a Pause Menu item by ID
  const executePauseMenuItem = (itemId) => {
    soundEngine.playInteract();
    setActiveNPC(null);
    setHudModal(null);
    if (itemId === 'play') {
      setActiveTab('play');
      setPauseMenuOpen(false);
    } else if (itemId === 'audio') {
      handleToggleMute();
    } else if (itemId === 'dashboard') {
      navigate('/dashboard');
    } else {
      setActiveTab(itemId);
      setPauseMenuOpen(false);
    }
  };

  // D-Pad moves the Pause Menu cursor when paused
  const handleNavigateMenuCursor = (step) => {
    if (!pauseMenuOpen) return;
    soundEngine.playFootstep();
    setMenuCursor((prev) => {
      const len = PAUSE_MENU_ITEMS.length;
      return (prev + step + len) % len;
    });
  };

  const handleConfirmMenuCursor = () => {
    if (pauseMenuOpen) {
      const selected = PAUSE_MENU_ITEMS[menuCursor];
      if (selected) executePauseMenuItem(selected.id);
    }
  };

  // B Button closes whatever in-screen overlay is open, or opens Pause Menu if in world
  const handlePressB = () => {
    soundEngine.playInteract();
    if (activeNPC) {
      setActiveNPC(null);
    } else if (hudModal) {
      setHudModal(null);
    } else if (pauseMenuOpen) {
      setPauseMenuOpen(false);
    } else if (activeTab !== 'play') {
      setActiveTab('play');
    } else {
      setPauseMenuOpen(true);
    }
  };

  const handleTogglePauseMenu = () => {
    soundEngine.playInteract();
    setPauseMenuOpen((prev) => !prev);
  };

  const isAnyOverlayOpen =
    pauseMenuOpen || activeTab !== 'play' || !!hudModal || !!activeNPC;

  const TAB_TITLES = {
    map: 'World Map',
    avatar: 'Outfitters',
    insights: 'Skill Ledger',
    party: 'Study Party',
    daily: 'Daily Tasks',
    feedback: 'Feedback',
  };

  // Build the In-Screen Overlay that renders strictly INSIDE the Emulator's LCD Game Screen!
  const inScreenOverlayContent = (
    <>
      {/* 1. In-Screen Sub-Panel (World Map, Outfitters, Skill Ledger, Study Party, Daily Tasks) */}
      {activeTab !== 'play' && (
        <div className={styles.inScreenPanelContainer} role="region" aria-label={TAB_TITLES[activeTab]}>
          <div className={styles.inScreenPanelTopBar}>
            <span className={styles.inScreenPanelTitle}>{TAB_TITLES[activeTab]}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setPauseMenuOpen(true)}
                className={styles.inScreenBackBtn}
                style={{ background: '#5C3A18' }}
              >
                Menu
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('play')}
                className={styles.inScreenBackBtn}
              >
                [B] Back
              </button>
            </div>
          </div>

          <div className={styles.inScreenPanelBody}>
            {activeTab === 'map' && (
              <OverworldMapPanel
                gameState={gameState}
                onSelectWorld={handleSelectWorld}
                onStartDiagnostic={() => setActiveTab('insights')}
              />
            )}
            {activeTab === 'avatar' && (
              <AvatarStudioPanel gameState={gameState} onSaveAvatar={handleSaveAvatar} />
            )}
            {activeTab === 'insights' && (
              <SkillInsightsPanel
                gameState={gameState}
                onCompleteRemedialMission={handleCompleteRemedialMission}
                onCompleteDiagnostic={handleCompleteDiagnostic}
              />
            )}
            {activeTab === 'party' && (
              <StudyPartyPanel
                user={user}
                gameState={gameState}
                onCompletePartyMission={handleCompletePartyMission}
              />
            )}
            {activeTab === 'daily' && (
              <>
                <DailyQuizPanel gameState={gameState} onAnswer={handleDailyAnswer} />
                <DailyQuestsAndAchievementsPanel
                  gameState={gameState}
                  onClaimDaily={handleClaimDaily}
                />
              </>
            )}
            {activeTab === 'feedback' && <StudentFeedbackPanel />}
          </div>
        </div>
      )}

      {/* 2. In-Screen Quest Journal or Satchel Inventory */}
      {hudModal && (
        <div className={styles.inScreenPanelContainer} role="dialog" aria-modal="true">
          <div className={styles.inScreenPanelTopBar}>
            <span className={styles.inScreenPanelTitle}>
              {hudModal === 'journal' ? `Quests: ${currentWorld.name}` : 'Satchel & Cores'}
            </span>
            <button
              type="button"
              onClick={() => setHudModal(null)}
              className={styles.inScreenBackBtn}
            >
              [B] Close
            </button>
          </div>

          <div className={styles.inScreenPanelBody}>
            {hudModal === 'journal' && (
              <div style={{ display: 'grid', gap: '6px' }}>
                {currentWorld.quests.map((q) => {
                  const done = gameState.quests[q.id]?.status === 'completed';
                  const npc = currentWorld.npcs.find((n) => n.questId === q.id);
                  return (
                    <div
                      key={q.id}
                      style={{
                        background: '#FFFDF8',
                        border: `1.5px solid ${done ? '#266B3E' : '#6E4726'}`,
                        borderRadius: '6px',
                        padding: '6px 8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.64rem', color: done ? '#194A2A' : '#5C4938', fontWeight: 800 }}>
                          {done ? '✓ COMPLETED' : q.topic}
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#231A12' }}>
                          {q.title}
                        </div>
                      </div>
                      {npc && (
                        <button
                          type="button"
                          onClick={() => {
                            setHudModal(null);
                            setActiveTab('play');
                            setActiveNPC(npc);
                          }}
                          className={done ? styles.secondaryBtn : styles.actionBtn}
                        >
                          {done ? 'Replay' : 'Play'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {hudModal === 'inventory' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(125px, 1fr))', gap: '6px' }}>
                {(gameState.profile.inventory || []).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: '#FFFDF8',
                      border: '1.5px solid #6E4726',
                      borderRadius: '6px',
                      padding: '6px 8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <PixelIcon name={item.type === 'core' ? 'core_green' : 'scroll'} size={14} />
                      <span style={{ fontWeight: 800, fontSize: '0.74rem', color: '#231A12' }}>
                        {item.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. In-Screen NPC Dialogue & Math Puzzle Modal */}
      {activeNPC && activeQuestForNPC && (
        <QuestPuzzleModal
          npc={activeNPC}
          quest={activeQuestForNPC}
          world={currentWorld}
          onClose={() => setActiveNPC(null)}
          onQuestionAttempt={handleQuestionAttempt}
          onQuestComplete={handleQuestComplete}
        />
      )}

      {/* 4. In-Screen Classic Retro RPG Pause Menu Popup (Always Inside the LCD Screen!) */}
      {pauseMenuOpen && (
        <div className={styles.inScreenOverlay} role="dialog" aria-modal="true" aria-label="In-Game Pause Menu">
          <div className={styles.retroPauseWindow}>
            <div className={styles.retroPauseHeader}>
              <span>PAUSE MENU ({currentWorld.name})</span>
              <span>CORES: {restoredCoresCount}/5</span>
            </div>

            <div className={styles.retroPauseList} role="menu">
              {PAUSE_MENU_ITEMS.map((item, idx) => {
                const selected = menuCursor === idx;
                const iconName =
                  item.id === 'audio'
                    ? gameState.profile.settings?.muted
                      ? 'sound_off'
                      : 'sound_on'
                    : item.icon;
                const labelText =
                  item.id === 'audio'
                    ? gameState.profile.settings?.muted
                      ? 'Audio: Muted'
                      : 'Audio: On'
                    : item.label;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuCursor(idx);
                      executePauseMenuItem(item.id);
                    }}
                    className={`${styles.retroMenuItem} ${selected ? styles.retroMenuItemSelected : ''}`}
                  >
                    <span className={styles.retroCursor}>{selected ? '▶' : ''}</span>
                    <PixelIcon name={iconName} size={14} />
                    <span>{labelText}</span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                marginTop: '6px',
                paddingTop: '5px',
                borderTop: '1px solid #6E4726',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.66rem',
                color: '#D8C8AE',
                fontWeight: 700,
              }}
            >
              <span>D-Pad: Move Cursor</span>
              <span>A: Confirm / B: Resume</span>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.pageShellFullscreen}>
      <GameViewport
        world={currentWorld}
        gameState={gameState}
        isPaused={isAnyOverlayOpen}
        onOpenPauseMenu={handleTogglePauseMenu}
        onPressB={handlePressB}
        onNavigateMenuCursor={handleNavigateMenuCursor}
        onConfirmMenuCursor={handleConfirmMenuCursor}
        onSelectTab={(tabId) => {
          soundEngine.playInteract();
          setActiveNPC(null);
          setHudModal(null);
          setActiveTab(tabId);
          setPauseMenuOpen(false);
        }}
        onSelectNPC={(npc) => {
          setHudModal(null);
          setPauseMenuOpen(false);
          setActiveTab('play');
          setActiveNPC(npc);
        }}
        onUsePortal={handleUsePortal}
        onPositionSave={handlePositionSave}
        onOpenModal={(m) => {
          setActiveNPC(null);
          setPauseMenuOpen(false);
          setActiveTab('play');
          setHudModal(m);
        }}
        onToggleMute={handleToggleMute}
        activeBanner={activeBanner}
        inScreenContent={inScreenOverlayContent}
      />
    </div>
  );
}
