// BootScene — pure Phaser, zero Expo dependency.
//
// Reads an asset descriptor from the game registry (populated identically by the
// Expo wrapper and by the standalone main.js), loads every spritesheet/image
// with a progress bar, builds the shared animations, then starts the gameplay
// scene named by REGISTRY.MODE.
//
// Asset descriptor shape (registry key REGISTRY.ASSETS):
//   {
//     textures: { <key>: { url, frameWidth?, frameHeight?, frameCount? } },
//     character: <charKey>,          // e.g. 'knight' -> uses '<key>_idle' etc.
//     mobs: [<mobKey>, ...],         // e.g. ['plant1','plant2']
//     level: { background, ability, settings, hearts:[k1..k5] },
//     buttons: { left, right, up, down },
//   }
// A texture entry WITH frame* is loaded as a spritesheet; without, as an image.
import Phaser from 'phaser';
import { REGISTRY } from '../events.js';

const CHAR_ANIMS = ['idle', 'walk', 'run', 'jump', 'attack'];
const MOB_ANIMS = ['idle', 'walk', 'attack', 'death'];
const CHAR_FPS = { idle: 6, walk: 10, run: 14, jump: 10, attack: 12 };
const MOB_FPS = { idle: 6, walk: 8, attack: 10, death: 8 };

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const assets = this.registry.get(REGISTRY.ASSETS) || {};
    this.assets = assets;
    this.drawLoadingBar();

    const textures = assets.textures || {};
    for (const [key, info] of Object.entries(textures)) {
      if (!info || !info.url) continue;
      if (info.frameWidth && info.frameHeight) {
        this.load.spritesheet(key, info.url, {
          frameWidth: info.frameWidth,
          frameHeight: info.frameHeight,
        });
      } else {
        this.load.image(key, info.url);
      }
    }
  }

  drawLoadingBar() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1A1A2E');
    const bw = Math.min(420, width * 0.7);
    const bx = (width - bw) / 2;
    const by = height / 2;

    const box = this.add.graphics();
    box.fillStyle(0x000000, 0.35).fillRoundedRect(bx - 4, by - 4, bw + 8, 28, 8);
    const bar = this.add.graphics();
    const label = this.add.text(width / 2, by - 30, 'Loading…', {
      fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (p) => {
      bar.clear();
      bar.fillStyle(0x7c7bf0, 1).fillRoundedRect(bx, by, bw * p, 20, 6);
    });
    this.load.on('complete', () => { bar.destroy(); box.destroy(); label.destroy(); });
  }

  create() {
    const assets = this.assets || {};
    const textures = assets.textures || {};

    // Character animations for the selected class.
    const charKey = assets.character;
    if (charKey) {
      for (const anim of CHAR_ANIMS) {
        const texKey = `${charKey}_${anim}`;
        this.makeAnim(texKey, textures[texKey], CHAR_FPS[anim], anim !== 'jump' && anim !== 'attack');
      }
    }

    // Mob animations for every mob pack in play.
    for (const mobKey of assets.mobs || []) {
      for (const anim of MOB_ANIMS) {
        const texKey = `${mobKey}_${anim}`;
        this.makeAnim(texKey, textures[texKey], MOB_FPS[anim], anim === 'idle' || anim === 'walk');
      }
    }

    const mode = this.registry.get(REGISTRY.MODE) || 'platformer';
    const target = mode === 'openworld' ? 'OpenWorld' : 'Platformer';
    this.scene.start(target);
    this.scene.launch('UI');
  }

  // Register a looping/one-shot animation from a spritesheet texture. Safe to
  // call when the texture is missing (skips) or already defined (skips).
  makeAnim(texKey, info, fps, loop) {
    if (!info || !this.textures.exists(texKey)) return;
    const animKey = texKey; // animation key mirrors the texture key
    if (this.anims.exists(animKey)) return;
    const count = info.frameCount
      || this.textures.get(texKey).frameTotal - 1
      || 1;
    this.anims.create({
      key: animKey,
      frames: this.anims.generateFrameNumbers(texKey, { start: 0, end: Math.max(count - 1, 0) }),
      frameRate: fps,
      repeat: loop ? -1 : 0,
    });
  }
}
