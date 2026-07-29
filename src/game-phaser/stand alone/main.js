// Standalone boot — loads the SAME pure Phaser scenes as the Expo app.
//
// This module is what Phaser Editor / a plain web deploy runs. It builds the
// asset descriptor from the local ./assets copy of the packed spritesheets and
// the generated manifest, seeds the registry exactly like the Expo wrapper, and
// starts the game. Change MODE below to preview 'openworld' vs 'platformer'.
//
// Loaded as an ES module by index.html. Phaser is expected on window.Phaser
// (CDN script tag) so the scenes' bare `import Phaser from 'phaser'` is shimmed
// by the importmap in index.html.
import Phaser from 'phaser';
import BootScene from '../scenes/BootScene.js';
import OpenWorldScene from '../scenes/OpenWorldScene.js';
import PlatformerScene from '../scenes/PlatformerScene.js';
import UIScene from '../scenes/UIScene.js';
import { REGISTRY, makeControls } from '../events.js';

const MODE = new URLSearchParams(location.search).get('mode') || 'platformer';

// Mock question set for standalone play.
const QUESTIONS = [
  { prompt: 'Given a = (3, 4), what is |a|?', options: ['5', '7', '12', '25'], correctIndex: 0 },
  { prompt: 'Dot product of (1,2)·(3,4)?', options: ['11', '10', '14', '7'], correctIndex: 0 },
  { prompt: 'Vectors are perpendicular when dot product is…', options: ['0', '1', 'negative', '|a||b|'], correctIndex: 0 },
];

async function boot() {
  const manifest = await fetch('./assets/manifest.json').then((r) => r.json());

  // Build texture descriptor from the manifest, pointing every key at its local
  // PNG. Character defaults to knight; mobs to both plants — same as the app.
  const textures = {};
  const addSheet = (info) => {
    if (!info) return;
    textures[info.key] = {
      url: `./assets/${info.key}.png`,
      frameWidth: info.frameWidth,
      frameHeight: info.frameHeight,
      frameCount: info.frameCount,
    };
  };
  const addImage = (key) => { textures[key] = { url: `./assets/${key}.png` }; };

  const character = 'knight';
  const mobs = ['plant1', 'plant2'];

  for (const anim of Object.values(manifest.characters[character] || {})) addSheet(anim);
  for (const mk of mobs) for (const anim of Object.values(manifest.mobs[mk] || {})) addSheet(anim);
  for (const key of Object.values(manifest.level || {})) addImage(key);
  for (const key of Object.values(manifest.buttons || {})) addImage(key);

  const assets = {
    textures,
    character,
    mobs,
    level: manifest.level || {},
    buttons: manifest.buttons || {},
  };

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: MODE === 'openworld' ? 1280 : 960,
    height: MODE === 'openworld' ? 720 : 540,
    backgroundColor: MODE === 'openworld' ? '#6fb84a' : '#EAF6FF',
    physics: { default: 'arcade', arcade: { gravity: { y: 0 }, debug: false } },
    scale: { mode: Phaser.Scale.RESIZE },
    render: { pixelArt: true, antialias: false },
    scene: [BootScene, OpenWorldScene, PlatformerScene, UIScene],
  });

  game.registry.set(REGISTRY.ASSETS, assets);
  game.registry.set(REGISTRY.MODE, MODE);
  game.registry.set(REGISTRY.CONTROLS, makeControls());
  game.registry.set(REGISTRY.QUESTIONS, QUESTIONS);
  game.registry.set(REGISTRY.CHARACTER_NAME, 'Knight');
  game.registry.set(REGISTRY.PLAYER_NAME, 'Player');

  game.events.on('game:exit', () => location.reload());
  game.events.on('game:enter', (m) => console.log('enter module', m));
  game.events.on('game:over', (p) => console.log('game over', p));
}

boot();
