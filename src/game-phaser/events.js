// Shared event + registry key constants. Pure JS, no dependencies — imported by
// both the Phaser scenes and the Expo wrapper so the two agree on names.
//
// Continuous input (held buttons/keys) lives in a mutable object stored in the
// game registry under REGISTRY.CONTROLS. Edge-triggered actions (jump, dash,
// interact, answering a question) and lifecycle signals are emitted on the
// shared game event bus (`game.events`).

export const EVENTS = {
  // Lifecycle — the wrapper forwards these to React Native callbacks.
  GAME_OVER: 'game:over',       // payload: { score, won, questionsCorrect, questionsTotal }
  EXIT: 'game:exit',            // player asked to quit
  ENTER_MODULE: 'game:enter',   // payload: moduleKey (open world door)

  // HUD — UIScene listens and redraws.
  HUD_UPDATE: 'hud:update',     // payload: { hp, score, bossHp, powers }
  NEAR_BUILDING: 'hud:near',    // payload: building | null (open world)

  // Question flow (platformer boss).
  QUESTION_SHOW: 'q:show',      // payload: { question, index, total }
  QUESTION_HIDE: 'q:hide',

  // Edge-triggered gameplay input (touch buttons + keyboard both emit these).
  ACT_JUMP: 'act:jump',
  ACT_DASH: 'act:dash',
  ACT_INTERACT: 'act:interact',
  ACT_EXIT: 'act:exit',
};

export const REGISTRY = {
  ASSETS: 'assets',       // full asset descriptor (see PhaserGame / main.js)
  META: 'meta',           // { textureKey: { frameWidth, frameHeight, frameCount } }
  CONTROLS: 'controls',   // mutable held-input flags
  MODE: 'mode',           // 'platformer' | 'openworld'
  QUESTIONS: 'questions',
  PLAYER_NAME: 'playerName',
  CHARACTER_NAME: 'characterName',
};

// Fresh held-input state. Both keyboard handlers and touch zones mutate this
// same object each frame; gameplay scenes read it.
export function makeControls() {
  return { left: false, right: false, up: false, down: false };
}
