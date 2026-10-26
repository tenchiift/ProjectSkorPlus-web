// ============================================================================
// SKOR+ CalcQuest: Persistence, Adaptive Learning & Multiplayer Service
// Syncs with Supabase tables & Realtime channels + per-user localStorage backup
// so progress survives refresh, logout/login, and works even before SQL migration.
// ============================================================================

import { supabase } from '../config/supabase';
import { updateUserStats, localDateStr } from './userService';
import {
  WORLDS_DATA,
  ACHIEVEMENTS_CATALOG,
  DAILY_QUESTS_POOL,
} from '../calcquest/data/worldsData';
import { CALCULUS_SKILLS } from '../calcquest/math/mathEngine';

const STORAGE_PREFIX = 'skorplus_calcquest_v1_';

function getDefaultState(userId, displayName = 'Explorer') {
  const today = localDateStr(new Date());
  const defaultSkills = {};
  CALCULUS_SKILLS.forEach((sk) => {
    defaultSkills[sk.id] = {
      skill_id: sk.id,
      mastery_estimate: 0,
      observed_accuracy: 0,
      evidence_count: 0,
      correct_count: 0,
      misconception_counts: {},
      last_practiced: null,
    };
  });

  const defaultWorlds = {};
  Object.keys(WORLDS_DATA).forEach((wId, idx) => {
    defaultWorlds[wId] = {
      world_id: wId,
      unlocked: idx === 0,
      completed: false,
      knowledge_core_restored: false,
      boss_defeated: false,
    };
  });

  const defaultDaily = DAILY_QUESTS_POOL.map((dq) => ({
    quest_id: dq.id,
    quest_date: today,
    progress: 0,
    target: dq.target,
    completed: false,
    claimed: false,
  }));

  return {
    profile: {
      user_id: userId,
      display_name: displayName || 'Explorer',
      level: 1,
      total_xp: 0,
      calc_coins: 50,
      current_world: 'world_1',
      last_position: { worldId: 'world_1', x: 3, y: 9 },
      diagnostic_completed: false,
      diagnostic_recommended_world: 'world_1',
      world_states: {
        world_1: {},
        world_2: {},
        world_3: {},
        world_4: {},
        world_5: {},
      },
      inventory: [
        { id: 'starter_journal', name: 'Explorer Field Journal', icon: 'scroll', type: 'quest' },
      ],
      claimed_rewards: [],
      completed_remedial_missions: [],
      settings: {
        sfxVolume: 0.5,
        musicVolume: 0.25,
        muted: false,
        reducedMotion: false,
      },
    },
    avatar: {
      base_character: 'tone_2',
      selected_hair: 'spiky',
      selected_outfit: 'tunic',
      selected_colors: { hair: '#2C1B12', outfit: '#3E7BD6', trim: '#FACC15' },
      selected_accessories: { head: 'none', back: 'none', effect: 'none' },
      unlocked_cosmetics: ['default', 'none', 'tunic', 'robe', 'jacket', 'bandana', 'satchel'],
    },
    worlds: defaultWorlds,
    quests: {},
    skills: defaultSkills,
    achievements: [],
    dailyQuests: defaultDaily,
    attempts: [],
  };
}

function readLocalState(userId, displayName) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return getDefaultState(userId, displayName);
    const parsed = JSON.parse(raw);
    const def = getDefaultState(userId, displayName);
    const today = localDateStr(new Date());

    // Refresh daily quests if date changed
    const savedDaily =
      parsed.dailyQuests?.[0]?.quest_date === today ? parsed.dailyQuests : def.dailyQuests;

    return {
      ...def,
      ...parsed,
      profile: { ...def.profile, ...(parsed.profile || {}) },
      avatar: { ...def.avatar, ...(parsed.avatar || {}) },
      worlds: { ...def.worlds, ...(parsed.worlds || {}) },
      skills: { ...def.skills, ...(parsed.skills || {}) },
      dailyQuests: savedDaily,
    };
  } catch {
    return getDefaultState(userId, displayName);
  }
}

function writeLocalState(userId, state) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(state));
  } catch {
    // Ignore storage quota issues
  }
}

/**
 * Loads the player's complete CalcQuest state (merging Supabase records with local state).
 */
export async function loadCalcQuestState(userId, displayName = 'Explorer') {
  const state = readLocalState(userId, displayName);
  if (!userId) return state;

  try {
    const [profRes, avRes, worldRes, questRes, skillRes, achRes] = await Promise.all([
      supabase.from('player_game_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('player_avatars').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('world_progress').select('*').eq('user_id', userId),
      supabase.from('quest_progress').select('*').eq('user_id', userId),
      supabase.from('student_skill_progress').select('*').eq('user_id', userId),
      supabase.from('player_achievements').select('*').eq('user_id', userId),
    ]);

    if (profRes.data) {
      state.profile = { ...state.profile, ...profRes.data };
    }
    if (avRes.data) {
      state.avatar = { ...state.avatar, ...avRes.data };
    }
    if (worldRes.data?.length) {
      worldRes.data.forEach((w) => {
        state.worlds[w.world_id] = { ...state.worlds[w.world_id], ...w };
      });
    }
    if (questRes.data?.length) {
      questRes.data.forEach((q) => {
        state.quests[q.quest_id] = q;
      });
    }
    if (skillRes.data?.length) {
      skillRes.data.forEach((sk) => {
        state.skills[sk.skill_id] = {
          ...state.skills[sk.skill_id],
          ...sk,
          mastery_estimate: Number(sk.mastery_estimate ?? 0),
          observed_accuracy: Number(sk.observed_accuracy ?? 0),
        };
      });
    }
    if (achRes.data?.length) {
      state.achievements = achRes.data.map((a) => a.achievement_id);
    }
  } catch {
    // Gracefully fall back to local state when Supabase tables are not yet migrated
  }

  writeLocalState(userId, state);
  return state;
}

/**
 * Persists updated CalcQuest state to localStorage and best-effort syncs to Supabase.
 */
export async function saveCalcQuestState(userId, nextState) {
  if (!userId) return nextState;
  writeLocalState(userId, nextState);

  try {
    await Promise.all([
      supabase.from('player_game_profiles').upsert(
        {
          user_id: userId,
          display_name: nextState.profile.display_name,
          level: nextState.profile.level,
          total_xp: nextState.profile.total_xp,
          calc_coins: nextState.profile.calc_coins,
          current_world: nextState.profile.current_world,
          last_position: nextState.profile.last_position,
          diagnostic_completed: nextState.profile.diagnostic_completed,
          diagnostic_recommended_world: nextState.profile.diagnostic_recommended_world,
          world_states: nextState.profile.world_states,
          inventory: nextState.profile.inventory,
          claimed_rewards: nextState.profile.claimed_rewards,
          settings: nextState.profile.settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      ),
      supabase.from('player_avatars').upsert(
        {
          user_id: userId,
          base_character: nextState.avatar.base_character,
          selected_hair: nextState.avatar.selected_hair,
          selected_outfit: nextState.avatar.selected_outfit,
          selected_colors: nextState.avatar.selected_colors,
          selected_accessories: nextState.avatar.selected_accessories,
          unlocked_cosmetics: nextState.avatar.unlocked_cosmetics,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      ),
    ]);
  } catch {
    // Local backup already saved
  }

  return nextState;
}

/**
 * Records a question attempt, updates the Student Skill Profile (mastery & misconceptions),
 * advances matching Daily Quests, and logs to Supabase.
 */
export async function recordQuestionAttempt(userId, currentState, { question, submittedAnswer, correct, attemptNumber, hintsUsed, detectedMisconception }) {
  const next = structuredClone(currentState);
  const skillId = question.topic || 'algebra';
  const prevSkill = next.skills[skillId] || {
    skill_id: skillId,
    mastery_estimate: 0,
    observed_accuracy: 0,
    evidence_count: 0,
    correct_count: 0,
    misconception_counts: {},
  };

  const newEvidence = prevSkill.evidence_count + 1;
  const newCorrect = prevSkill.correct_count + (correct ? 1 : 0);
  const observedAcc = newCorrect / newEvidence;

  // Bayesian-inspired weighted mastery update considering difficulty, hints, and attempt count
  const diffWeight = (question.difficulty || 1) * 0.15 + 0.7;
  const hintPenalty = hintsUsed > 0 ? 0.8 : 1.0;
  const attemptFactor = attemptNumber === 1 ? 1.0 : 0.75;
  const evidenceConfidence = Math.min(1, newEvidence / 4); // Needs >=4 attempts for full confidence
  const performanceSignal = correct ? Math.min(1, diffWeight * hintPenalty * attemptFactor) : 0.15;
  const rawMastery = prevSkill.mastery_estimate === 0
    ? performanceSignal * 0.65
    : prevSkill.mastery_estimate * 0.65 + performanceSignal * 0.35;

  const miscCounts = { ...(prevSkill.misconception_counts || {}) };
  if (!correct && detectedMisconception && detectedMisconception !== 'unclassified') {
    miscCounts[detectedMisconception] = (miscCounts[detectedMisconception] || 0) + 1;
  }

  next.skills[skillId] = {
    ...prevSkill,
    evidence_count: newEvidence,
    correct_count: newCorrect,
    observed_accuracy: Number(observedAcc.toFixed(3)),
    mastery_estimate: Number((rawMastery * (0.5 + 0.5 * evidenceConfidence)).toFixed(3)),
    misconception_counts: miscCounts,
    last_practiced: new Date().toISOString(),
  };

  // Update Daily Quests on correct answer
  if (correct) {
    next.dailyQuests = next.dailyQuests.map((dq) => {
      const def = DAILY_QUESTS_POOL.find((p) => p.id === dq.quest_id);
      if (!def || dq.completed) return dq;
      if (def.topicFilter.includes(skillId)) {
        const nextProg = Math.min(dq.target, dq.progress + 1);
        return {
          ...dq,
          progress: nextProg,
          completed: nextProg >= dq.target,
        };
      }
      return dq;
    });
  }

  // Keep recent 50 attempts
  next.attempts = [
    {
      question_id: question.id,
      topic: skillId,
      submitted_answer: String(submittedAnswer),
      correct,
      attempt_number: attemptNumber,
      hints_used: hintsUsed,
      detected_misconception: detectedMisconception,
      timestamp: new Date().toISOString(),
    },
    ...(next.attempts || []).slice(0, 49),
  ];

  writeLocalState(userId, next);

  // Best-effort sync to Supabase
  if (userId) {
    try {
      await Promise.all([
        supabase.from('quiz_attempts').insert({
          user_id: userId,
          question_id: question.id,
          submitted_answer: String(submittedAnswer),
          correct,
          attempt_number: attemptNumber,
          hints_used: hintsUsed,
          detected_misconception: detectedMisconception,
        }),
        supabase.from('student_skill_progress').upsert(
          {
            user_id: userId,
            skill_id: skillId,
            mastery_estimate: next.skills[skillId].mastery_estimate,
            observed_accuracy: next.skills[skillId].observed_accuracy,
            evidence_count: next.skills[skillId].evidence_count,
            correct_count: next.skills[skillId].correct_count,
            misconception_counts: next.skills[skillId].misconception_counts,
            last_practiced: next.skills[skillId].last_practiced,
          },
          { onConflict: 'user_id,skill_id' }
        ),
      ]);
    } catch {
      // Ignore if table not migrated yet
    }
  }

  return next;
}

/**
 * Awards XP, CalcCoins, items, cosmetics, and world unlocks idempotently
 * (preventing duplicate reward claims via `claimed_rewards`).
 */
export async function claimQuestCompletion(userId, currentState, { worldId, quest }) {
  const next = structuredClone(currentState);
  const claimKey = `quest_${quest.id}`;
  const alreadyClaimed = next.profile.claimed_rewards.includes(claimKey);

  // Mark quest completed
  next.quests[quest.id] = {
    quest_id: quest.id,
    world_id: worldId,
    status: 'completed',
    current_objective: quest.questionIds.length,
    completion_time: new Date().toISOString(),
  };

  // Apply environmental world state change (e.g. bridge_repaired, w1_garden_bloomed, boss_defeated)
  if (!next.profile.world_states[worldId]) {
    next.profile.world_states[worldId] = {};
  }
  if (quest.unlocksState) {
    next.profile.world_states[worldId][quest.unlocksState] = true;
  }

  let xpGained = 0;
  let coinsGained = 0;
  const newlyEarnedAchievements = [];

  if (!alreadyClaimed) {
    xpGained = quest.xpReward || 50;
    coinsGained = quest.coinReward || 30;
    next.profile.claimed_rewards.push(claimKey);

    if (quest.rewardItem && !next.profile.inventory.some((i) => i.id === quest.rewardItem.id)) {
      next.profile.inventory.push(quest.rewardItem);
    }
  }

  // Check specific achievements
  const grantAchievement = (achId) => {
    if (!next.achievements.includes(achId)) {
      next.achievements.push(achId);
      const achDef = ACHIEVEMENTS_CATALOG.find((a) => a.id === achId);
      if (achDef) {
        xpGained += achDef.xpReward;
        coinsGained += achDef.coinReward;
        newlyEarnedAchievements.push(achDef);
      }
    }
  };

  if (quest.id === 'w1_quest_1') grantAchievement('first_equation');
  if (quest.id === 'w1_quest_4') grantAchievement('bridge_builder');

  // If this was a Boss Quest, restore the World's Knowledge Core and unlock the next World!
  if (quest.isBossQuest) {
    const worldDef = WORLDS_DATA[worldId];
    next.worlds[worldId] = {
      ...next.worlds[worldId],
      unlocked: true,
      completed: true,
      knowledge_core_restored: true,
      boss_defeated: true,
    };

    if (worldDef?.coreItem && !next.profile.inventory.some((i) => i.id === worldDef.coreItem.id)) {
      next.profile.inventory.push(worldDef.coreItem);
    }
    if (worldDef?.cosmeticReward && !next.avatar.unlocked_cosmetics.includes(worldDef.cosmeticReward)) {
      next.avatar.unlocked_cosmetics.push(worldDef.cosmeticReward);
    }
    if (worldDef?.achievementReward) {
      grantAchievement(worldDef.achievementReward);
    }

    // Unlock the next sequential world
    const nextWorldOrder = (worldDef?.order || 1) + 1;
    const nextWorldEntry = Object.values(WORLDS_DATA).find((w) => w.order === nextWorldOrder);
    if (nextWorldEntry && next.worlds[nextWorldEntry.id]) {
      next.worlds[nextWorldEntry.id].unlocked = true;
    }
  }

  next.profile.total_xp += xpGained;
  next.profile.calc_coins += coinsGained;
  next.profile.level = Math.floor(next.profile.total_xp / 150) + 1;

  await saveCalcQuestState(userId, next);

  // Sync XP gain to the main SKOR+ profile so the Sidebar XP bar updates live!
  if (userId && xpGained > 0) {
    try {
      await updateUserStats(userId, { expGained: Math.round(xpGained / 5), completed: 1 });
      window.dispatchEvent(new CustomEvent('skorplus-profile-refresh'));
    } catch {
      // Ignore if offline
    }
  }

  return {
    nextState: next,
    xpGained,
    coinsGained,
    newlyEarnedAchievements,
  };
}

/**
 * Real-time Multiplayer Study Party Channel Manager
 * Uses Supabase Realtime Broadcast & Presence + BroadcastChannel cross-tab sync
 * so real players across devices or tabs synchronize positions, roles, ready states,
 * and shared puzzle progress without any fabricated fake bots.
 */
export function connectStudyPartyChannel({ roomCode, user, displayName, avatar, onStateSync, onChatEvent }) {
  const topic = `calcquest-party-${roomCode.toUpperCase()}`;
  const sbChannel = supabase.channel(topic, {
    config: { broadcast: { self: true }, presence: { key: user?.id || displayName } },
  });

  // Also support local BroadcastChannel for instant multi-tab testing on the same laptop
  const localBus = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(topic) : null;

  const participantPayload = {
    userId: user?.id || `local_${displayName}`,
    displayName,
    avatar,
    role: 'solver',
    ready: false,
    x: 6,
    y: 9,
    updatedAt: Date.now(),
  };

  sbChannel
    .on('presence', { event: 'sync' }, () => {
      const presenceState = sbChannel.presenceState();
      const players = Object.values(presenceState)
        .flatMap((arr) => arr)
        .filter(Boolean);
      onStateSync?.({ type: 'PRESENCE_SYNC', players });
    })
    .on('broadcast', { event: 'PARTY_UPDATE' }, ({ payload }) => {
      onStateSync?.(payload);
    })
    .on('broadcast', { event: 'PARTY_CHAT' }, ({ payload }) => {
      onChatEvent?.(payload);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await sbChannel.track(participantPayload);
      }
    });

  if (localBus) {
    localBus.onmessage = (ev) => {
      if (ev.data?.kind === 'PARTY_UPDATE') onStateSync?.(ev.data.payload);
      if (ev.data?.kind === 'PARTY_CHAT') onChatEvent?.(ev.data.payload);
    };
  }

  const broadcastUpdate = (payload) => {
    sbChannel.send({ type: 'broadcast', event: 'PARTY_UPDATE', payload }).catch(() => {});
    localBus?.postMessage({ kind: 'PARTY_UPDATE', payload });
  };

  const broadcastChat = (payload) => {
    sbChannel.send({ type: 'broadcast', event: 'PARTY_CHAT', payload }).catch(() => {});
    localBus?.postMessage({ kind: 'PARTY_CHAT', payload });
  };

  const updateMyPresence = (patch) => {
    Object.assign(participantPayload, patch, { updatedAt: Date.now() });
    sbChannel.track(participantPayload).catch(() => {});
    broadcastUpdate({ type: 'PLAYER_PATCH', player: { ...participantPayload } });
  };

  const disconnect = () => {
    sbChannel.untrack().catch(() => {});
    sbChannel.unsubscribe();
    localBus?.close();
  };

  return {
    broadcastUpdate,
    broadcastChat,
    updateMyPresence,
    disconnect,
  };
}
