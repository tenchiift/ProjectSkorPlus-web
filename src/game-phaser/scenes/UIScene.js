// UIScene — pure Phaser HUD overlay shared by both gameplay modes.
//
// Runs in parallel (scene.launch) above the active gameplay scene. Owns:
//   - HP hearts + score + boss-HP pills (platformer)
//   - character/module labels
//   - touch control zones (d-pad + interact for open world; left/right/jump/dash
//     for platformer) that mutate the shared registry CONTROLS object and emit
//     edge-triggered ACT_* events on game.events
//   - the boss question overlay
//   - pause + result overlays
//
// It reads the mode from the registry and listens on game.events for HUD_UPDATE,
// QUESTION_SHOW/HIDE, NEAR_BUILDING, GAME_OVER. It never imports Expo.
import Phaser from 'phaser';
import { EVENTS, REGISTRY } from '../events.js';

const DARK = 0x1a1a2e;
const ACCENT = 0x7c7bf0;

export default class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UI', active: false }); }

  create() {
    this.mode = this.registry.get(REGISTRY.MODE) || 'platformer';
    this.controls = this.registry.get(REGISTRY.CONTROLS);
    this.assets = this.registry.get(REGISTRY.ASSETS) || {};
    this.bus = this.game.events;

    this.buildTopHud();
    if (this.mode === 'platformer') this.buildPlatformerControls();
    else this.buildOpenWorldControls();

    // Event wiring.
    this.bus.on(EVENTS.HUD_UPDATE, this.onHud, this);
    this.bus.on(EVENTS.QUESTION_SHOW, this.showQuestion, this);
    this.bus.on(EVENTS.QUESTION_HIDE, this.hideQuestion, this);
    this.bus.on(EVENTS.NEAR_BUILDING, this.onNear, this);
    this.bus.on(EVENTS.GAME_OVER, this.showResult, this);

    this.events.once('shutdown', () => {
      this.bus.off(EVENTS.HUD_UPDATE, this.onHud, this);
      this.bus.off(EVENTS.QUESTION_SHOW, this.showQuestion, this);
      this.bus.off(EVENTS.QUESTION_HIDE, this.hideQuestion, this);
      this.bus.off(EVENTS.NEAR_BUILDING, this.onNear, this);
      this.bus.off(EVENTS.GAME_OVER, this.showResult, this);
    });

    this.scale.on('resize', this.layout, this);
  }

  // ---- top HUD ----------------------------------------------------------
  buildTopHud() {
    const charName = this.registry.get(REGISTRY.CHARACTER_NAME) || '';
    const playerName = this.registry.get(REGISTRY.PLAYER_NAME) || '';

    this.hpText = this.add.text(14, 12, '', pill()).setDepth(10);
    this.scoreText = this.add.text(14, 44, '★ 0', pill()).setDepth(10);
    this.bossText = this.add.text(14, 76, '', pill(ACCENT)).setDepth(10).setVisible(false);
    this.powerText = this.add.text(0, 12, '', pill(ACCENT)).setDepth(10).setOrigin(1, 0);

    if (this.mode === 'openworld') {
      this.hpText.setVisible(false);
      this.scoreText.setVisible(false);
      this.nameText = this.add.text(0, 12, charName || playerName, pill(ACCENT))
        .setOrigin(0.5, 0).setDepth(10);
    }

    // Exit / pause button (top-right corner).
    this.exitBtn = this.add.text(0, 0, '✕', {
      fontFamily: 'system-ui', fontSize: '22px', color: '#ffffff',
      backgroundColor: '#1a1a2eb0', padding: { x: 12, y: 6 },
    }).setDepth(11).setInteractive({ useHandCursor: true });
    this.exitBtn.on('pointerdown', () => {
      if (this.mode === 'openworld') this.bus.emit(EVENTS.ACT_EXIT);
      else this.togglePause();
    });

    this.layout();
  }

  onHud(d) {
    if (this.hpText) this.hpText.setText('♡'.repeat(Math.max(d.hp ?? 0, 0)) || '—');
    if (this.scoreText) this.scoreText.setText('★ ' + (d.score ?? 0));
    if (this.bossText) {
      const show = d.bossHp != null && d.bossHp >= 0 && this.currentQuestion;
      this.bossText.setVisible(!!show);
      if (show) this.bossText.setText('Boss HP ' + d.bossHp);
    }
    if (this.powerText) {
      const p = d.powers || [];
      this.powerText.setText(p.map((x) => (x === 'shield' ? '🛡 Shield' : '⚡ Dash')).join('  '));
    }
  }

  onNear(building) {
    if (!this.nearText) {
      this.nearText = this.add.text(this.scale.width / 2, this.scale.height - 120, '', {
        fontFamily: 'system-ui', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
        backgroundColor: '#1a1a2ecc', padding: { x: 14, y: 8 },
      }).setOrigin(0.5).setDepth(12);
    }
    if (!building) { this.nearText.setVisible(false); return; }
    this.nearText.setVisible(true);
    this.nearText.setText(
      building.locked ? `${building.label} — Locked 🔒`
        : building.module ? `Enter ${building.label}?  (tap ⭘)`
          : building.label
    );
  }

  // ---- touch controls ---------------------------------------------------
  makeButton(x, y, r, glyph, tint) {
    const bg = tint ?? DARK;
    const circle = this.add.circle(x, y, r, 0x000000, 0).setStrokeStyle(2, 0xffffff, 0.7).setDepth(10);
    circle.setInteractive(new Phaser.Geom.Circle(0, 0, r), Phaser.Geom.Circle.Contains, { useHandCursor: true });
    const label = this.add.text(x, y, glyph, {
      fontFamily: 'system-ui', fontSize: `${Math.round(r * 0.9)}px`, color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
    circle.on('pointerover', () => {
      circle.setStrokeStyle(3, 0xffffff, 1);
    });
    circle.on('pointerout', () => {
      circle.setStrokeStyle(2, 0xffffff, 0.7);
    });
    return { circle, label, r, bg };
  }

  pressOnce(btn, cb) {
    const { circle } = btn;
    circle.on('pointerdown', () => { circle.setStrokeStyle(3.5, ACCENT, 1); cb(); });
    circle.on('pointerup', () => circle.setStrokeStyle(3, 0xffffff, 1));
    circle.on('pointerout', () => circle.setStrokeStyle(2, 0xffffff, 0.7));
    circle.on('pointerupoutside', () => circle.setStrokeStyle(2, 0xffffff, 0.7));
  }

  hold(btn, on, off) {
    const { circle } = btn;
    circle.on('pointerdown', () => { on(); circle.setStrokeStyle(3.5, ACCENT, 1); });
    circle.on('pointerup', () => { off(); circle.setStrokeStyle(3, 0xffffff, 1); });
    circle.on('pointerout', () => { off(); circle.setStrokeStyle(2, 0xffffff, 0.7); });
    circle.on('pointerupoutside', () => { off(); circle.setStrokeStyle(2, 0xffffff, 0.7); });
  }

  buildPlatformerControls() {
    const c = this.controls;
    this.btnLeft = this.makeButton(0, 40, 40, '◀');
    this.btnRight = this.makeButton(0, 40, 40, '▶');
    this.btnJump = this.makeButton(0, 0, 44, '⤒', ACCENT);
    this.btnDash = this.makeButton(0, 0, 40, '⚡');

    this.hold(this.btnLeft, () => { c.left = true; }, () => { c.left = false; });
    this.hold(this.btnRight, () => { c.right = true; }, () => { c.right = false; });
    this.pressOnce(this.btnJump, () => this.bus.emit(EVENTS.ACT_JUMP));
    this.pressOnce(this.btnDash, () => this.bus.emit(EVENTS.ACT_DASH));

    this.touchButtons = [this.btnLeft, this.btnRight, this.btnJump, this.btnDash];
    this.layout();
  }

  buildOpenWorldControls() {
    const c = this.controls;
    this.btnUp = this.makeButton(0, 0, 36, '▲');
    this.btnDown = this.makeButton(0, 0, 36, '▼');
    this.btnLeft = this.makeButton(0, 0, 36, '◀');
    this.btnRight = this.makeButton(0, 0, 36, '▶');
    this.btnInteract = this.makeButton(0, 0, 42, '⭘', 0x4caf50);

    this.hold(this.btnUp, () => { c.up = true; }, () => { c.up = false; });
    this.hold(this.btnDown, () => { c.down = true; }, () => { c.down = false; });
    this.hold(this.btnLeft, () => { c.left = true; }, () => { c.left = false; });
    this.hold(this.btnRight, () => { c.right = true; }, () => { c.right = false; });
    this.pressOnce(this.btnInteract, () => this.bus.emit(EVENTS.ACT_INTERACT));

    this.touchButtons = [this.btnUp, this.btnDown, this.btnLeft, this.btnRight, this.btnInteract];
    this.layout();
  }

  // ---- responsive layout ------------------------------------------------
  layout() {
    const w = this.scale.width, h = this.scale.height;
    if (this.exitBtn) this.exitBtn.setPosition(w - this.exitBtn.width - 12, 12);
    if (this.powerText) this.powerText.setPosition(w - 12, 44);
    if (this.nameText) this.nameText.setPosition(w / 2, 12);
    if (this.nearText) this.nearText.setPosition(w / 2, h - 120);

    if (this.mode === 'platformer' && this.btnLeft) {
      this.posBtn(this.btnLeft, 70, h - 70);
      this.posBtn(this.btnRight, 170, h - 70);
      this.posBtn(this.btnJump, w - 70, h - 70);
      this.posBtn(this.btnDash, w - 165, h - 70);
    } else if (this.btnUp) {
      const bx = 90, by = h - 90;
      this.posBtn(this.btnUp, bx, by - 60);
      this.posBtn(this.btnDown, bx, by + 60);
      this.posBtn(this.btnLeft, bx - 60, by);
      this.posBtn(this.btnRight, bx + 60, by);
      this.posBtn(this.btnInteract, w - 80, h - 80);
    }
    if (this.overlay) this.layoutOverlay();
  }

  posBtn(btn, x, y) {
    btn.circle.setPosition(x, y);
    btn.label.setPosition(x, y);
  }

  // ---- question overlay -------------------------------------------------
  showQuestion({ question, index, total }) {
    this.currentQuestion = question;
    this.setTouchVisible(false);
    const w = this.scale.width, h = this.scale.height;

    this.overlay = this.add.container(0, 0).setDepth(50);
    const dim = this.add.rectangle(0, 0, w, h, DARK, 0.55).setOrigin(0).setInteractive();
    const cardW = Math.min(680, w * 0.9);
    const cardH = Math.min(420, h * 0.85);
    const cx = w / 2, cy = h / 2;
    const card = this.add.rectangle(cx, cy, cardW, cardH, 0xffffff, 1).setStrokeStyle(0);

    const badge = this.add.text(cx, cy - cardH / 2 + 24, `Boss Question ${index + 1}/${total}`, {
      fontFamily: 'system-ui', fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#7c7bf0', padding: { x: 12, y: 4 },
    }).setOrigin(0.5, 0);

    const prompt = this.add.text(cx, cy - cardH / 2 + 66, question.prompt, {
      fontFamily: 'system-ui', fontSize: '22px', color: '#1a1a1a', fontStyle: 'bold',
      align: 'center', wordWrap: { width: cardW - 48 },
    }).setOrigin(0.5, 0);

    this.overlay.add([dim, card, badge, prompt]);
    this.optionObjs = [];
    const cols = 2;
    const ow = (cardW - 48 - 12) / cols;
    const oh = 64;
    const startY = cy + 10;
    question.options.forEach((opt, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const ox = cx - cardW / 2 + 24 + col * (ow + 12) + ow / 2;
      const oy = startY + row * (oh + 12);
      const box = this.add.rectangle(ox, oy, ow, oh, 0xf2f2f5, 1).setInteractive({ useHandCursor: true });
      const txt = this.add.text(ox, oy, opt, {
        fontFamily: 'system-ui', fontSize: '18px', color: '#1a1a1a', fontStyle: 'bold',
        align: 'center', wordWrap: { width: ow - 16 },
      }).setOrigin(0.5);
      box.on('pointerdown', () => this.answer(i, box));
      this.overlay.add([box, txt]);
      this.optionObjs.push({ box, txt, index: i });
    });

    this.fbText = this.add.text(cx, cy + cardH / 2 - 30, '', {
      fontFamily: 'system-ui', fontSize: '16px', fontStyle: 'bold', color: '#4caf50',
    }).setOrigin(0.5);
    this.overlay.add(this.fbText);
    this.overlayMeta = { card, badge, prompt, cardW, cardH };
    this.answered = false;
  }

  answer(idx, box) {
    if (this.answered) return;
    this.answered = true;
    const correct = idx === this.currentQuestion.correctIndex;
    const good = this.optionObjs.find((o) => o.index === this.currentQuestion.correctIndex);
    if (good) good.box.setFillStyle(0x4caf50, 1);
    if (!correct) box.setFillStyle(0xff5252, 1);
    this.fbText.setColor(correct ? '#4caf50' : '#ff5252');
    this.fbText.setText(correct ? 'Correct! Boss takes damage 🗡' : 'Wrong! You lost a heart 💔');

    // Report the answer back to the gameplay scene, which owns score/hp/flow.
    this.time.delayedCall(correct ? 650 : 700, () => {
      this.hideQuestion();
      this.bus.emit('q:answered', { correct });
    });
  }

  hideQuestion() {
    this.currentQuestion = null;
    if (this.overlay) { this.overlay.destroy(); this.overlay = null; }
    this.setTouchVisible(true);
  }

  layoutOverlay() {
    // Simple approach: rebuild on resize by hiding; overlays are short-lived.
  }

  setTouchVisible(v) {
    (this.touchButtons || []).forEach((b) => {
      b.circle.setVisible(v);
      b.label.setVisible(v);
    });
  }

  // ---- pause + result ---------------------------------------------------
  togglePause() {
    if (this.pauseBox) { this.resume(); return; }
    const gp = this.mode === 'openworld' ? 'OpenWorld' : 'Platformer';
    this.scene.pause(gp);
    const w = this.scale.width, h = this.scale.height;
    this.pauseBox = this.add.container(0, 0).setDepth(60);
    const dim = this.add.rectangle(0, 0, w, h, DARK, 0.6).setOrigin(0).setInteractive();
    const title = this.add.text(w / 2, h / 2 - 60, '⏸ Paused', {
      fontFamily: 'system-ui', fontSize: '30px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const resume = this.button(w / 2, h / 2, 'Resume', ACCENT, () => this.resume());
    const quit = this.button(w / 2, h / 2 + 64, 'Quit', DARK, () => this.bus.emit(EVENTS.ACT_EXIT));
    this.pauseBox.add([dim, title, ...resume, ...quit]);
    this.setTouchVisible(false);
  }

  resume() {
    if (this.pauseBox) { this.pauseBox.destroy(); this.pauseBox = null; }
    const gp = this.mode === 'openworld' ? 'OpenWorld' : 'Platformer';
    this.scene.resume(gp);
    this.setTouchVisible(true);
  }

  showResult(payload) {
    const w = this.scale.width, h = this.scale.height;
    this.setTouchVisible(false);
    const box = this.add.container(0, 0).setDepth(70);
    const dim = this.add.rectangle(0, 0, w, h, DARK, 0.6).setOrigin(0).setInteractive();
    const title = this.add.text(w / 2, h / 2 - 80, payload.won ? '🎉 Level Cleared!' : '💀 Game Over', {
      fontFamily: 'system-ui', fontSize: '30px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    const s = this.add.text(w / 2, h / 2 - 28, `Score: ${payload.score}`, {
      fontFamily: 'system-ui', fontSize: '20px', color: '#ffffff',
    }).setOrigin(0.5);
    const q = this.add.text(w / 2, h / 2 + 2, `Questions: ${payload.questionsCorrect}/${payload.questionsTotal}`, {
      fontFamily: 'system-ui', fontSize: '18px', color: '#dddddd',
    }).setOrigin(0.5);
    const back = this.button(w / 2, h / 2 + 64, 'Back to Module', ACCENT, () => this.bus.emit(EVENTS.ACT_EXIT));
    box.add([dim, title, s, q, ...back]);
  }

  button(x, y, label, tint, cb) {
    const bg = this.add.rectangle(x, y, 240, 52, tint, 1).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontFamily: 'system-ui', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    bg.on('pointerdown', cb);
    return [bg, txt];
  }
}

// Shared pill text style.
function pill(bg = DARK) {
  const hex = '#' + bg.toString(16).padStart(6, '0') + 'b8';
  return {
    fontFamily: 'system-ui', fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
    backgroundColor: hex, padding: { x: 10, y: 4 },
  };
}
