'use dom';

// PhaserGame — Expo DOM component that boots the PURE Phaser scenes.
//
// This is the ONLY file in src/game-phaser that knows about React/Expo. It:
//   1. builds the asset descriptor the scenes expect (texture key -> URL + frame
//      metadata) from the props passed by the React Native screens,
//   2. seeds the Phaser game registry (mode, controls, questions, names),
//   3. creates the Phaser.Game with the shared BootScene/OpenWorld/Platformer/UI,
//   4. bridges scene lifecycle events (game over / exit / enter module) back to
//      the RN callbacks, and forwards keyboard already handled inside scenes.
//
// The scenes themselves import nothing from here — the same scene files boot
// unchanged from `stand alone/main.js`.
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import OpenWorldScene from './scenes/OpenWorldScene.js';
import PlatformerScene from './scenes/PlatformerScene.js';
import UIScene from './scenes/UIScene.js';
import { EVENTS, REGISTRY, makeControls } from './events.js';
import { MANIFEST } from './phaserAssets.js';

// Build the { textures, character, mobs, level, buttons } descriptor from props.
// `textures` maps every texture key to a URL plus (for spritesheets) the frame
// dimensions taken from the build-time manifest.
function buildAssets({ character, mobs, level, buttons, textures }) {
  const out = { textures: {}, character: null, mobs: [], level: {}, buttons: {} };

  const addSheet = (key) => {
    const meta = findMeta(key);
    const url = textures[key];
    if (!url) return;
    out.textures[key] = meta
      ? { url, frameWidth: meta.frameWidth, frameHeight: meta.frameHeight, frameCount: meta.frameCount }
      : { url };
  };

  // Character: prop.character.key names the pack; pull its five sheets.
  const charKey = character?.key;
  if (charKey && MANIFEST.characters[charKey]) {
    out.character = charKey;
    for (const anim of ['idle', 'walk', 'run', 'jump', 'attack']) {
      const info = MANIFEST.characters[charKey][anim];
      if (info) addSheet(info.key);
    }
  }

  // Mobs: prop.mobs is an array of resolved packs with a `key`.
  for (const m of mobs || []) {
    const mk = m.key;
    if (!mk || !MANIFEST.mobs[mk]) continue;
    out.mobs.push(mk);
    for (const anim of ['idle', 'walk', 'attack', 'death']) {
      const info = MANIFEST.mobs[mk][anim];
      if (info) addSheet(info.key);
    }
  }

  // Level art (background, ability, hearts, settings) — plain images.
  const lv = MANIFEST.level || {};
  for (const [k, key] of Object.entries(lv)) {
    if (textures[key]) { addSheet(key); out.level[k === 'background' ? 'background' : k] = key; }
  }

  // Buttons (unused by scenes' art but exposed for parity).
  const bt = MANIFEST.buttons || {};
  for (const [k, key] of Object.entries(bt)) {
    if (textures[key]) { addSheet(key); out.buttons[k] = key; }
  }

  return out;
}

function findMeta(key) {
  for (const anims of Object.values(MANIFEST.characters)) {
    for (const a of Object.values(anims)) if (a.key === key) return a;
  }
  for (const anims of Object.values(MANIFEST.mobs)) {
    for (const a of Object.values(anims)) if (a.key === key) return a;
  }
  return null; // plain image, no frame data
}

export default function PhaserGame({
  mode = 'platformer',
  character = {},
  mobs = [],
  level = {},
  buttons = {},
  questions = [],
  textures = {},          // { key: uri } from resolvePhaserTextures()
  characterName = '',
  playerName = 'Player',
  onGameOver,
  onExit,
  onEnterModule,
}) {
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const cbRef = useRef({});
  cbRef.current = { onGameOver, onExit, onEnterModule };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    // Reset body so the Phaser canvas fills the screen edge-to-edge.
    if (typeof document !== 'undefined') {
      const { body, documentElement: html } = document;
      const prev = { margin: body.style.margin, padding: body.style.padding, overflow: body.style.overflow, hOverflow: html.style.overflow, hHeight: html.style.height, bHeight: body.style.height };
      html.style.height = '100%'; html.style.overflow = 'hidden';
      body.style.margin = '0'; body.style.padding = '0'; body.style.overflow = 'hidden';
      body.style.height = '100%'; body.style.touchAction = 'none';
      Object.assign(body.style, { webkitTouchCallout: 'none', webkitUserSelect: 'none' });
      window.dispatchEvent(new Event('resize'));
      // Restore on cleanup.
      host._bodyPrev = prev;
    }

    const assets = buildAssets({ character, mobs, level, buttons, textures });
    const controls = makeControls();

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      width: mode === 'openworld' ? 1280 : 960,
      height: mode === 'openworld' ? 720 : 540,
      backgroundColor: mode === 'openworld' ? '#6fb84a' : '#EAF6FF',
      physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
      scale: { mode: Phaser.Scale.RESIZE },
      render: { pixelArt: true, antialias: false },
      scene: [BootScene, OpenWorldScene, PlatformerScene, UIScene],
    });
    gameRef.current = game;

    // Seed registry BEFORE scenes boot.
    game.registry.set(REGISTRY.ASSETS, assets);
    game.registry.set(REGISTRY.MODE, mode);
    game.registry.set(REGISTRY.CONTROLS, controls);
    game.registry.set(REGISTRY.QUESTIONS, questions);
    game.registry.set(REGISTRY.CHARACTER_NAME, characterName || character?.name || '');
    game.registry.set(REGISTRY.PLAYER_NAME, playerName);

    // Bridge scene events -> RN callbacks.
    const onOver = (p) => cbRef.current.onGameOver && cbRef.current.onGameOver(p);
    const onExitEv = () => cbRef.current.onExit && cbRef.current.onExit();
    const onEnter = (m) => cbRef.current.onEnterModule && cbRef.current.onEnterModule(m);
    game.events.on(EVENTS.GAME_OVER, onOver);
    game.events.on(EVENTS.EXIT, onExitEv);
    game.events.on(EVENTS.ENTER_MODULE, onEnter);

    const onResize = () => game.scale.refresh();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      game.events.off(EVENTS.GAME_OVER, onOver);
      game.events.off(EVENTS.EXIT, onExitEv);
      game.events.off(EVENTS.ENTER_MODULE, onEnter);
      game.destroy(true);
      gameRef.current = null;
      // Restore body styles.
      const prev = host._bodyPrev;
      if (typeof document !== 'undefined' && prev) {
        const { body, documentElement: html } = document;
        body.style.margin = prev.margin; body.style.padding = prev.padding;
        body.style.overflow = prev.overflow; body.style.height = prev.bHeight;
        html.style.overflow = prev.hOverflow; html.style.height = prev.hHeight;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div
      ref={hostRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        overflow: 'hidden', background: mode === 'openworld' ? '#6fb84a' : '#EAF6FF',
        touchAction: 'none', userSelect: 'none',
      }}
    />
  );
}
