// PlatformerScene — pure Phaser 2D side-scroller. Zero Expo dependency.
//
// Port of the old VectorGame.js canvas engine to Arcade Physics. Same tuning:
// gravity 2600, double jump, dash + shield powerups, patrolling enemies you can
// stomp, coins, pit death → respawn at lastSafeX with HP-1, and a boss phase at
// x=3760 that pauses movement and shows a question overlay (handled by UIScene).
//
// Ground/platform collision uses invisible static bodies matching GROUND_SEGS
// and PLATFORMS. The parallax background image scrolls slower than the world.
import Phaser from 'phaser';
import { EVENTS, REGISTRY } from '../events.js';

const VW = 960;
const VH = 540;
const GROUND_Y = 430;
const GRAVITY = 2600;
const JUMP_V = -960;
const RUN_SPEED = 250;
const DASH_SPEED = 440;
const MAX_JUMPS = 2;
const START_HP = 3;
const BOSS_TRIGGER_X = 3760;

const GROUND_SEGS = [
  [-200, 900],
  [1050, 1800],
  [1950, 2700],
  [2850, 4400],
];

const PLATFORMS = [
  { x: 500, y: 320, w: 140, h: 20 },
  { x: 1200, y: 300, w: 160, h: 20 },
  { x: 2100, y: 310, w: 150, h: 20 },
  { x: 3000, y: 300, w: 160, h: 20 },
];

const COINS = [
  { x: 540, y: 270 }, { x: 590, y: 270 },
  { x: 800, y: 380 }, { x: 860, y: 380 },
  { x: 1240, y: 250 }, { x: 1300, y: 250 },
  { x: 1600, y: 380 }, { x: 2140, y: 260 },
  { x: 2400, y: 380 }, { x: 2460, y: 380 },
  { x: 3040, y: 250 }, { x: 3300, y: 380 },
];

const ENEMIES = [
  { x: 780, min: 700, max: 880, dir: 1, mob: 0 },
  { x: 1500, min: 1400, max: 1700, dir: -1, mob: 1 },
  { x: 2350, min: 2250, max: 2560, dir: 1, mob: 0 },
  { x: 3200, min: 3080, max: 3400, dir: -1, mob: 1 },
];

const POWERUPS = [
  { x: 1000, y: 360, type: 'dash' },
  { x: 2760, y: 360, type: 'shield' },
];

const PLAYER_DRAW_H = 96;
const MOB_DRAW_H = 56;
const WORLD_END = GROUND_SEGS[GROUND_SEGS.length - 1][1];

export default class PlatformerScene extends Phaser.Scene {
  constructor() { super('Platformer'); }

  create() {
    this.controls = this.registry.get(REGISTRY.CONTROLS);
    this.assets = this.registry.get(REGISTRY.ASSETS) || {};
    this.charKey = this.assets.character;
    this.mobKeys = this.assets.mobs || [];
    this.questions = this.registry.get(REGISTRY.QUESTIONS) || [];
    this.bus = this.game.events;

    this.hp = START_HP;
    this.score = 0;
    this.qIndex = 0;
    this.correctCount = 0;
    this.totalQ = this.questions.length;
    this.shield = false;
    this.dashReady = false;
    this.dashT = 0;
    this.invuln = 0;
    this.jumps = 0;
    this.lastSafeX = 120;
    this.phase = 'run';
    this.powers = [];

    this.physics.world.gravity.y = GRAVITY;
    this.physics.world.setBounds(-200, -400, WORLD_END + 400, VH + 900);
    this.cameras.main.setBounds(0, 0, WORLD_END + 200, VH);
    this.cameras.main.setBackgroundColor('#EAF6FF');

    this.buildBackground();
    this.buildStatics();
    this.buildPlayer();
    this.buildCoins();
    this.buildPowerups();
    this.buildEnemies();
    this.buildBoss();

    this.applyLayout();
    this.scale.on('resize', this.applyLayout, this);

    // Keyboard.
    this.keys = this.input.keyboard.addKeys({
      left: 'A', right: 'D', left2: 'LEFT', right2: 'RIGHT',
      jump: 'W', jump2: 'UP', jump3: 'SPACE', dash: 'SHIFT', dash2: 'E',
    });
    this.input.keyboard.on('keydown-SPACE', () => this.doJump());
    this.input.keyboard.on('keydown-W', () => this.doJump());
    this.input.keyboard.on('keydown-UP', () => this.doJump());
    this.input.keyboard.on('keydown-SHIFT', () => this.doDash());
    this.input.keyboard.on('keydown-E', () => this.doDash());

    // Touch + overlay events.
    this.bus.on(EVENTS.ACT_JUMP, this.doJump, this);
    this.bus.on(EVENTS.ACT_DASH, this.doDash, this);
    this.bus.on(EVENTS.ACT_EXIT, this.exit, this);
    this.bus.on('q:answered', this.onAnswer, this);
    this.events.once('shutdown', () => {
      this.bus.off(EVENTS.ACT_JUMP, this.doJump, this);
      this.bus.off(EVENTS.ACT_DASH, this.doDash, this);
      this.bus.off(EVENTS.ACT_EXIT, this.exit, this);
      this.bus.off('q:answered', this.onAnswer, this);
      this.scale.off('resize', this.applyLayout, this);
    });

    this.pushHud();
  }

  // The world is authored at VW x VH; the camera RESIZE-scales to fill the
  // screen uniformly, letterboxing any extra space with the background colour.
  applyLayout() {
    const w = this.scale.width;
    const h = this.scale.height;
    const zoom = Math.min(w / VW, h / VH);
    this.cameras.main.setZoom(zoom);
    // Keep camera viewing window at logical VW x VH so the game is always
    // the same size regardless of physical screen aspect ratio.
    this.cameras.main.setViewport(
      Math.round((w - VW * zoom) / 2),
      Math.round((h - VH * zoom) / 2),
      Math.round(VW * zoom),
      Math.round(VH * zoom),
    );
  }

  buildBackground() {
    const key = this.assets.level?.background;
    if (key && this.textures.exists(key)) {
      const src = this.textures.get(key).getSourceImage();
      const bh = VH;
      const bw = src.width * (bh / src.height);
      this.bg = this.add.tileSprite(0, 0, WORLD_END + VW, bh, key)
        .setOrigin(0, 0).setDepth(-10);
      this.bg.setScale(1);
      this.bgScaleY = bh / src.height;
      this.bgTileW = bw;
    }
  }

  buildStatics() {
    // Invisible static bodies for ground segments and platforms.
    this.ground = this.physics.add.staticGroup();
    for (const [s, e] of GROUND_SEGS) {
      const w = e - s;
      const body = this.add.rectangle(s + w / 2, GROUND_Y + 40, w, 80, 0x000000, 0);
      this.physics.add.existing(body, true);
      this.ground.add(body);
    }
    for (const p of PLATFORMS) {
      const body = this.add.rectangle(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, 0x000000, 0);
      this.physics.add.existing(body, true);
      this.ground.add(body);
    }
  }

  buildPlayer() {
    this.player = this.physics.add.sprite(120, GROUND_Y - 60, `${this.charKey}_idle`);
    this.player.setOrigin(0.5, 1);
    const fw = this.player.frame.width || PLAYER_DRAW_H;
    const fh = this.player.frame.height || PLAYER_DRAW_H;
    this.player.setScale(PLAYER_DRAW_H / fh);
    // Collision box ~32x46 world px at the feet. Body size/offset are in source
    // frame pixels (unscaled), so divide by the display scale. Frames are packed
    // bottom-aligned, so the frame bottom is the feet — offset the body there.
    const invScale = fh / PLAYER_DRAW_H;
    const bw = 32 * invScale, bh = 46 * invScale;
    this.player.body.setSize(bw, bh);
    this.player.body.setOffset((fw - bw) / 2, fh - bh);
    this.player.setCollideWorldBounds(false);
    this.playerCollider = this.physics.add.collider(this.player, this.ground, () => {
      if (this.player.body.blocked.down || this.player.body.touching.down) {
        this.jumps = 0;
      }
    });
    this.playAnim('idle');

    this.shieldRing = this.add.graphics().setDepth(11);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setFollowOffset(-140, 60);
  }

  buildCoins() {
    this.coins = COINS.map((c) => {
      const g = this.add.circle(c.x, c.y, 9, 0xf5c542, 1).setDepth(2);
      g.taken = false;
      g.baseY = c.y;
      return g;
    });
  }

  buildPowerups() {
    this.powerups = POWERUPS.map((p) => {
      const col = p.type === 'shield' ? 0x67c8ff : 0xb78bff;
      const g = this.add.rectangle(p.x + 14, p.y + 14, 24, 24, col, 1).setAngle(45).setDepth(2);
      g.type = p.type; g.taken = false; g.baseY = p.y + 14;
      return g;
    });
  }

  buildEnemies() {
    this.enemies = ENEMIES.map((e) => {
      const mobKey = this.mobKeys[e.mob] || this.mobKeys[0];
      const idleKey = `${mobKey}_idle`;
      const spr = this.physics.add.sprite(e.x, GROUND_Y, this.textures.exists(idleKey) ? idleKey : undefined);
      spr.setOrigin(0.5, 1);
      const fh = spr.frame?.height || MOB_DRAW_H;
      spr.setScale(MOB_DRAW_H / fh);
      spr.body.setAllowGravity(false);
      spr.mobKey = mobKey;
      spr.min = e.min; spr.max = e.max; spr.dir = e.dir; spr.alive = true;
      const walkKey = `${mobKey}_walk`;
      if (this.anims.exists(walkKey)) spr.play(walkKey);
      else if (this.anims.exists(idleKey)) spr.play(idleKey);
      spr.setDepth(3);
      return spr;
    });
  }

  buildBoss() {
    // Simple procedural boss marker near the end.
    const bx = 4020, by = GROUND_Y - 120;
    this.boss = this.add.container(bx + 60, by + 60).setDepth(3);
    const body = this.add.rectangle(0, 0, 120, 120, 0x5a4fe0);
    const crown = this.add.rectangle(0, -78, 60, 18, 0xf5c542);
    const eyeL = this.add.rectangle(-27, -20, 26, 30, 0xffffff);
    const eyeR = this.add.rectangle(27, -20, 26, 30, 0xffffff);
    const pupL = this.add.rectangle(-27, -14, 12, 14, 0xff3b3b);
    const pupR = this.add.rectangle(27, -14, 12, 14, 0xff3b3b);
    this.boss.add([body, crown, eyeL, eyeR, pupL, pupR]);
    this.tweens.add({ targets: this.boss, y: this.boss.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  playAnim(name) {
    const key = `${this.charKey}_${name}`;
    if (this.anims.exists(key) && this.player.anims.currentAnim?.key !== key) {
      this.player.play(key);
    }
  }

  // ---- actions ----------------------------------------------------------
  doJump() {
    if (this.phase !== 'run') return;
    if (this.jumps < MAX_JUMPS) {
      this.player.setVelocityY(JUMP_V);
      this.jumps += 1;
    }
  }

  doDash() {
    if (this.phase !== 'run') return;
    if (this.dashReady) {
      this.dashT = 1.2;
      this.dashReady = false;
      this.invuln = Math.max(this.invuln, 1.2);
      this.powers = this.powers.filter((p) => p !== 'dash');
      this.pushHud();
    }
  }

  exit() { this.bus.emit(EVENTS.EXIT); }

  // ---- main loop --------------------------------------------------------
  update(_t, dtMs) {
    if (this.phase !== 'run') return;
    const dt = Math.min(dtMs / 1000, 0.05);
    const p = this.player;
    const c = this.controls;
    const k = this.keys;

    let dir = 0;
    if (c.left || k.left.isDown || k.left2.isDown) dir -= 1;
    if (c.right || k.right.isDown || k.right2.isDown) dir += 1;

    const speed = this.dashT > 0 ? DASH_SPEED : RUN_SPEED;
    p.setVelocityX(speed * dir);
    if (dir !== 0) p.setFlipX(dir < 0);

    if (this.dashT > 0) this.dashT -= dt;
    if (this.invuln > 0) this.invuln -= dt;

    if (p.x < -60) { p.x = -60; }

    // animation state
    const onGround = p.body.blocked.down || p.body.touching.down;
    if (!onGround) this.playAnim('jump');
    else if (this.dashT > 0) this.playAnim('run');
    else if (Math.abs(p.body.velocity.x) > 10) this.playAnim('walk');
    else this.playAnim('idle');

    // track last safe ground x
    if (onGround) {
      const seg = segAt(p.x);
      if (seg) this.lastSafeX = Phaser.Math.Clamp(p.x, seg[0] + 40, seg[1] - 40);
    }

    // pit fall
    if (p.y > VH + 120) {
      this.hitPlayer(true);
      p.setVelocity(0, 0);
      p.x = this.lastSafeX;
      p.y = GROUND_Y - 60;
    }

    // coins
    for (const coin of this.coins) {
      if (coin.taken) continue;
      coin.y = coin.baseY + Math.sin(this.time.now / 160 + coin.x) * 2;
      if (Math.abs(coin.x - p.x) < 26 && Math.abs(coin.y - (p.y - 48)) < 40) {
        coin.taken = true; coin.setVisible(false);
        this.score += 10; this.pushHud();
      }
    }

    // powerups
    for (const pw of this.powerups) {
      if (pw.taken) continue;
      pw.y = pw.baseY + Math.sin(this.time.now / 200 + pw.x) * 3;
      if (Math.abs(pw.x - p.x) < 30 && Math.abs(pw.y - (p.y - 48)) < 44) {
        pw.taken = true; pw.setVisible(false);
        if (pw.type === 'shield') { this.shield = true; if (!this.powers.includes('shield')) this.powers.push('shield'); }
        else { this.dashReady = true; if (!this.powers.includes('dash')) this.powers.push('dash'); }
        this.pushHud();
      }
    }

    // enemies
    for (const en of this.enemies) {
      if (!en.alive) continue;
      en.x += en.dir * 70 * dt;
      if (en.x < en.min) { en.x = en.min; en.dir = 1; }
      if (en.x > en.max) { en.x = en.max; en.dir = -1; }
      en.setFlipX(en.dir < 0);
      // overlap check (feet-based boxes)
      const pex = Math.abs(en.x - p.x) < 30;
      const pey = Math.abs((en.y) - (p.y)) < 50;
      if (pex && pey) {
        const stomping = p.body.velocity.y > 0 && (p.y - 40) < en.y - 20;
        if (stomping) {
          en.alive = false;
          const dk = `${en.mobKey}_death`;
          if (this.anims.exists(dk)) { en.play(dk); en.once('animationcomplete', () => en.setVisible(false)); }
          else en.setVisible(false);
          p.setVelocityY(JUMP_V * 0.6);
          this.score += 50; this.pushHud();
        } else {
          this.hitPlayer(false);
        }
      }
    }

    // shield ring
    this.shieldRing.clear();
    if (this.shield) {
      this.shieldRing.lineStyle(3, 0x78c8ff, 0.9);
      this.shieldRing.strokeRect(p.x - 22, p.y - PLAYER_DRAW_H, 44, PLAYER_DRAW_H);
    }
    // invuln flash
    p.setAlpha(this.invuln > 0 && Math.floor(this.time.now / 80) % 2 === 0 ? 0.5 : 1);

    // parallax background
    if (this.bg) {
      this.bg.tilePositionX = this.cameras.main.scrollX * 0.35 / (this.bgScaleY || 1);
    }

    // boss trigger
    if (p.x >= BOSS_TRIGGER_X) {
      p.x = BOSS_TRIGGER_X;
      p.setVelocity(0, 0);
      if (this.totalQ === 0) this.finish(true);
      else this.enterQuestion();
    }
  }

  hitPlayer(isPit) {
    if (this.invuln > 0) return;
    if (this.shield && !isPit) {
      this.shield = false;
      this.powers = this.powers.filter((p) => p !== 'shield');
      this.invuln = 1.0;
      this.pushHud();
      return;
    }
    this.invuln = 1.2;
    this.hp -= 1;
    this.pushHud();
    if (this.hp <= 0) this.finish(false);
  }

  // ---- boss question flow ----------------------------------------------
  enterQuestion() {
    this.phase = 'question';
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.bus.emit(EVENTS.QUESTION_SHOW, {
      question: this.questions[this.qIndex],
      index: this.qIndex,
      total: this.totalQ,
    });
    this.pushHud();
  }

  onAnswer({ correct }) {
    if (this.phase !== 'question') return;
    if (correct) {
      this.score += 100;
      this.correctCount += 1;
      this.qIndex += 1;
      this.pushHud();
      if (this.qIndex >= this.totalQ) { this.finish(true); return; }
      // next question immediately
      this.enterQuestion();
    } else {
      this.hp -= 1;
      this.pushHud();
      if (this.hp <= 0) { this.finish(false); return; }
      this.enterQuestion();
    }
  }

  finish(won) {
    if (this.phase === 'won' || this.phase === 'lost') return;
    this.phase = won ? 'won' : 'lost';
    this.physics.pause();
    this.bus.emit(EVENTS.QUESTION_HIDE);
    const payload = {
      score: this.score,
      won,
      questionsCorrect: this.correctCount,
      questionsTotal: this.totalQ,
    };
    this.bus.emit(EVENTS.GAME_OVER, payload);
  }

  pushHud() {
    this.bus.emit(EVENTS.HUD_UPDATE, {
      hp: this.hp,
      score: this.score,
      bossHp: Math.max(this.totalQ - this.qIndex, 0),
      powers: this.powers.slice(),
    });
  }
}

function segAt(x) {
  return GROUND_SEGS.find(([s, e]) => x >= s && x <= e);
}
