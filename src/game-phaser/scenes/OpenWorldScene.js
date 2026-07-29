// OpenWorldScene — pure Phaser top-down overworld. Zero Expo dependency.
//
// Port of the old OpenWorld.js canvas engine. Buildings and trees are drawn
// procedurally with a Graphics layer (depth-sorted with the player), ground is a
// green checker with dirt paths to a central plaza. The player is a normalized
// sprite (packed spritesheets from BootScene) with a soft shadow. Camera follows
// with map-bounds clamping. Movement: WASD/arrows + the UIScene touch d-pad
// (shared registry CONTROLS). Interact emits ENTER_MODULE for the near building.
import Phaser from 'phaser';
import { EVENTS, REGISTRY } from '../events.js';

const VIEW_W = 1280;
const VIEW_H = 720;
const MAP_W = 2400;
const MAP_H = 1600;
const SPEED = 220;
const PLAYER_W = 44;
const PLAYER_H = 60;
const CONTENT_H = 78;
const INTERACT_DIST = 90;

const BUILDINGS = [
  { id: 'vector',  x: 360,  y: 300, w: 260, h: 220, color: 0x7c7bf0, roof: 0x5a4fe0, label: 'Vector', module: 'vector' },
  { id: 'algebra', x: 1500, y: 260, w: 240, h: 210, color: 0xf5a623, roof: 0xe8951a, label: 'Algebra', locked: true },
  { id: 'geometry',x: 1000, y: 1050,w: 250, h: 210, color: 0x4caf50, roof: 0x3b9142, label: 'Geometry', locked: true },
  { id: 'stats',   x: 1850, y: 1080,w: 240, h: 210, color: 0x5b8def, roof: 0x3e6fd1, label: 'Stats', locked: true },
];

const TREES = [
  { x: 200, y: 800 }, { x: 780, y: 620 }, { x: 1200, y: 500 },
  { x: 1700, y: 760 }, { x: 620, y: 1150 }, { x: 1450, y: 1250 },
  { x: 2050, y: 500 }, { x: 300, y: 500 }, { x: 900, y: 900 },
  { x: 1950, y: 900 }, { x: 500, y: 1350 }, { x: 1650, y: 480 },
];

const PLAZA = { x: 1200, y: 800 };

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export default class OpenWorldScene extends Phaser.Scene {
  constructor() { super('OpenWorld'); }

  create() {
    this.controls = this.registry.get(REGISTRY.CONTROLS);
    this.assets = this.registry.get(REGISTRY.ASSETS) || {};
    this.charKey = this.assets.character;
    this.bus = this.game.events;

    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setBackgroundColor('#6fb84a');
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    this.drawGround();

    // Depth-sorted procedural layer for buildings + trees (drawn every frame
    // because they interleave with the player by baseline Y).
    this.sceneGfx = this.add.graphics().setDepth(5);
    this.labels = [];
    for (const b of BUILDINGS) {
      const t = this.add.text(b.x + b.w / 2, b.y + b.h * 0.24, b.label, {
        fontFamily: 'system-ui', fontSize: '20px', color: '#1a1a2e', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6);
      this.labels.push({ b, t });
      if (b.locked) {
        const lock = this.add.text(b.x + b.w / 2, b.y + b.h * 0.7, '🔒', {
          fontFamily: 'system-ui', fontSize: '28px', color: '#ffffff',
        }).setOrigin(0.5).setDepth(6);
        b._lockText = lock;
      }
    }

    // Player: physics sprite with a normalized display size + shadow.
    this.shadow = this.add.ellipse(480, 620, 44, 16, 0x000000, 0.18).setDepth(4);
    this.player = this.physics.add.sprite(480, 620, `${this.charKey}_idle`);
    this.player.setDepth(10);
    this.player.body.setSize(PLAYER_W, PLAYER_H).setOffset(0, 0);
    this.normalizeSprite(this.player, CONTENT_H);
    this.player.setOrigin(0.5, 1); // feet at y
    this.playAnim('idle');

    // Name tag DOM-like text above head.
    const playerName = this.registry.get(REGISTRY.PLAYER_NAME) || 'Player';
    this.nameTag = this.add.text(480, 620, playerName, {
      fontFamily: 'system-ui', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#1a1a2ed0', padding: { x: 8, y: 3 },
    }).setOrigin(0.5, 1).setDepth(11);

    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);

    this.facing = 1;
    this.near = null;

    // Keyboard.
    this.keys = this.input.keyboard.addKeys({
      up: 'W', down: 'S', left: 'A', right: 'D',
      up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT',
      interact: 'SPACE', enter: 'ENTER',
    });
    this.input.keyboard.on('keydown-SPACE', () => this.interact());
    this.input.keyboard.on('keydown-ENTER', () => this.interact());

    this.bus.on(EVENTS.ACT_INTERACT, this.interact, this);
    this.bus.on(EVENTS.ACT_EXIT, this.exit, this);
    this.events.once('shutdown', () => {
      this.bus.off(EVENTS.ACT_INTERACT, this.interact, this);
      this.bus.off(EVENTS.ACT_EXIT, this.exit, this);
      this.scale.off('resize', this.applyZoom, this);
    });
  }

  // Keep a consistent zoom that fills the screen in any orientation, like the
  // old "cover" camera derived from the reference view size.
  applyZoom() {
    const w = this.scale.width, h = this.scale.height;
    const zoom = Math.max(w / VIEW_W, h / VIEW_H);
    this.cameras.main.setViewport(0, 0, w, h);
    this.cameras.main.setZoom(zoom);
  }

  // Scale the sprite so its (already trimmed) frame renders at CONTENT_H tall.
  normalizeSprite(sprite, contentH) {
    const fh = sprite.frame.height || contentH;
    const scale = contentH / fh;
    sprite.setScale(scale);
  }

  playAnim(name) {
    const key = `${this.charKey}_${name}`;
    if (this.anims.exists(key) && this.player.anims.currentAnim?.key !== key) {
      this.player.play(key);
    }
  }

  interact() {
    const b = this.near;
    if (!b) return;
    if (b.module && !b.locked) this.bus.emit(EVENTS.ENTER_MODULE, b.module);
  }

  exit() { this.bus.emit(EVENTS.EXIT); }

  update(_t, dtMs) {
    const dt = Math.min(dtMs / 1000, 0.05);
    const c = this.controls;
    const k = this.keys;
    let dx = 0, dy = 0;
    if (c.left || k.left.isDown || k.left2.isDown) dx -= 1;
    if (c.right || k.right.isDown || k.right2.isDown) dx += 1;
    if (c.up || k.up.isDown || k.up2.isDown) dy -= 1;
    if (c.down || k.down.isDown || k.down2.isDown) dy += 1;

    const mag = Math.hypot(dx, dy) || 1;
    dx /= mag; dy /= mag;
    const moving = dx !== 0 || dy !== 0;
    if (dx !== 0) this.facing = dx > 0 ? 1 : -1;

    const nx = this.player.x + dx * SPEED * dt;
    const ny = this.player.y + dy * SPEED * dt;
    if (!this.blocked(nx, this.player.y)) this.player.x = nx;
    if (!this.blocked(this.player.x, ny)) this.player.y = ny;

    this.player.setFlipX(this.facing < 0);
    this.playAnim(moving ? 'walk' : 'idle');

    // shadow + name tag track the player
    this.shadow.setPosition(this.player.x, this.player.y - 4);
    this.nameTag.setPosition(this.player.x, this.player.y - CONTENT_H - 6);

    // nearest interactable
    let found = null, best = INTERACT_DIST;
    for (const b of BUILDINGS) {
      const doorX = b.x + b.w / 2, doorY = b.y + b.h;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, doorX, doorY);
      if (d < best) { best = d; found = b; }
    }
    if (found !== this.near) {
      this.near = found;
      this.bus.emit(EVENTS.NEAR_BUILDING, found);
    }

    this.redrawScene();
  }

  blocked(tx, ty) {
    const bx = tx - PLAYER_W / 2, by = ty - PLAYER_H;
    if (tx - PLAYER_W / 2 < 20 || tx + PLAYER_W / 2 > MAP_W - 20) return true;
    if (ty - PLAYER_H < 20 || ty > MAP_H - 20) return true;
    for (const b of BUILDINGS) {
      const fy = b.y + b.h * 0.45, fh = b.h * 0.55;
      if (rectsOverlap(bx, by, PLAYER_W, PLAYER_H, b.x, fy, b.w, fh)) return true;
    }
    for (const t of TREES) {
      if (rectsOverlap(bx, by, PLAYER_W, PLAYER_H, t.x - 12, t.y - 14, 24, 28)) return true;
    }
    return false;
  }

  // ---- procedural drawing ----------------------------------------------
  drawGround() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x8fd16a, 1).fillRect(0, 0, MAP_W, MAP_H);
    g.fillStyle(0xffffff, 0.05);
    const tile = 80;
    for (let gx = 0; gx < MAP_W; gx += tile) {
      for (let gy = 0; gy < MAP_H; gy += tile) {
        if (((gx / tile) + (gy / tile)) % 2 === 0) g.fillRect(gx, gy, tile, tile);
      }
    }
    // dirt paths to central plaza
    g.lineStyle(46, 0xc8a06a, 1);
    for (const b of BUILDINGS) {
      const doorX = b.x + b.w / 2, doorY = b.y + b.h + 10;
      g.beginPath();
      g.moveTo(PLAZA.x, PLAZA.y);
      g.lineTo(doorX, doorY);
      g.strokePath();
    }
    g.fillStyle(0xd9b57e, 1).fillCircle(PLAZA.x, PLAZA.y, 70);
  }

  redrawScene() {
    const g = this.sceneGfx;
    g.clear();

    const drawables = [];
    for (const b of BUILDINGS) drawables.push({ y: b.y + b.h, kind: 'b', ref: b });
    for (const t of TREES) drawables.push({ y: t.y, kind: 't', ref: t });
    drawables.push({ y: this.player.y, kind: 'p' });
    drawables.sort((a, b) => a.y - b.y);

    // Player uses its own display object; when it's the top of a stack of
    // drawables at the same baseline we set its depth so procedural art behind
    // it draws first. Simplest correct approach: draw all building/tree art,
    // then rely on player depth(10) > sceneGfx depth(5). To keep the old
    // depth-sort feel, bump player depth relative to trees it's below/above.
    let playerBehind = false;
    for (const d of drawables) {
      if (d.kind === 'p') { playerBehind = true; continue; }
      if (d.kind === 'b') this.drawBuilding(g, d.ref);
      else this.drawTree(g, d.ref, playerBehind);
    }

    // Reposition labels (they're static world-space, so only needed once, but
    // cheap). Update lock overlays too.
    for (const { b, t } of this.labels) t.setDepth(6);
  }

  drawBuilding(g, b) {
    // shadow
    g.fillStyle(0x000000, 0.12).fillRect(b.x + 10, b.y + b.h - 6, b.w, 18);
    // body
    g.fillStyle(b.color, 1).fillRect(b.x, b.y + b.h * 0.32, b.w, b.h * 0.68);
    // roof
    g.fillStyle(b.roof, 1);
    g.beginPath();
    g.moveTo(b.x - 14, b.y + b.h * 0.34);
    g.lineTo(b.x + b.w / 2, b.y - 10);
    g.lineTo(b.x + b.w + 14, b.y + b.h * 0.34);
    g.closePath();
    g.fillPath();
    // door
    const dw = b.w * 0.26, dh = b.h * 0.4;
    g.fillStyle(0x3a2b1a, 1).fillRect(b.x + b.w / 2 - dw / 2, b.y + b.h - dh, dw, dh);
    g.fillStyle(0xf5c542, 1).fillCircle(b.x + b.w / 2 + dw / 2 - 8, b.y + b.h - dh / 2, 3);
    // windows
    g.fillStyle(0xffffff, 0.85);
    g.fillRect(b.x + 22, b.y + b.h * 0.45, 34, 30);
    g.fillRect(b.x + b.w - 56, b.y + b.h * 0.45, 34, 30);
    if (b.locked) {
      g.fillStyle(0x1a1a2e, 0.55).fillRect(b.x, b.y + b.h * 0.32, b.w, b.h * 0.68);
    }
  }

  drawTree(g, t) {
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(t.x, t.y + 16, 44, 16);
    g.fillStyle(0x7a4a2b, 1).fillRect(t.x - 6, t.y - 6, 12, 24);
    g.fillStyle(0x3e8e41, 1).fillCircle(t.x, t.y - 24, 30);
    g.fillStyle(0x4caf50, 1);
    g.fillCircle(t.x - 14, t.y - 14, 20);
    g.fillCircle(t.x + 14, t.y - 14, 20);
  }
}
