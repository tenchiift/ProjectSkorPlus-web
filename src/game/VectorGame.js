'use dom';

import React, { useRef, useEffect, useState, useCallback } from 'react';

// Logical world size — everything is drawn in these coords then scaled to fit.
const VW = 960;
const VH = 540;
const GROUND_Y = 430;
const GRAVITY = 2600;
const JUMP_V = -960;
const RUN_SPEED = 250;
const DASH_SPEED = 440;
const MAX_JUMPS = 2; // Gradient Jump: double jump baseline
const START_HP = 3;
const BOSS_TRIGGER_X = 3760;

// Ground segments [start, end]; gaps between them are pits.
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

const initialCoins = () => [
  { x: 540, y: 270 }, { x: 590, y: 270 },
  { x: 800, y: 380 }, { x: 860, y: 380 },
  { x: 1240, y: 250 }, { x: 1300, y: 250 },
  { x: 1600, y: 380 }, { x: 2140, y: 260 },
  { x: 2400, y: 380 }, { x: 2460, y: 380 },
  { x: 3040, y: 250 }, { x: 3300, y: 380 },
].map((c, i) => ({ ...c, id: i, taken: false }));

const initialEnemies = () => [
  { x: 780, min: 700, max: 880, dir: 1 },
  { x: 1500, min: 1400, max: 1700, dir: -1 },
  { x: 2350, min: 2250, max: 2560, dir: 1 },
  { x: 3200, min: 3080, max: 3400, dir: -1 },
].map((e, i) => ({ ...e, id: i, w: 34, h: 34, y: GROUND_Y - 34, alive: true }));

const initialPowerups = () => [
  { x: 1000, y: 360, type: 'dash', taken: false },
  { x: 2760, y: 360, type: 'shield', taken: false },
].map((p, i) => ({ ...p, id: i, w: 28, h: 28 }));

function onGround(x, bottom) {
  for (const [s, e] of GROUND_SEGS) {
    if (x >= s && x <= e && Math.abs(bottom - GROUND_Y) < 2) return true;
  }
  return false;
}
function segAt(x) {
  return GROUND_SEGS.find(([s, e]) => x >= s && x <= e);
}

export default function VectorGame({ sprites = {}, questions = [], onGameOver, onExit }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const spriteImgs = useRef({});

  const [phase, setPhase] = useState('run'); // run | question | won | lost
  const [hp, setHp] = useState(START_HP);
  const [score, setScore] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'right' | 'wrong' | null
  const [needRotate, setNeedRotate] = useState(false);
  const [activePowers, setActivePowers] = useState([]); // ['shield','dash']

  const g = useRef(null);
  const phaseRef = useRef(phase);
  const pausedRef = useRef(false);
  const movementRef = useRef({ left: false, right: false });
  phaseRef.current = phase;
  pausedRef.current = needRotate;

  const totalQ = questions.length;
  const bossHpLeft = Math.max(totalQ - qIndex, 0);

  const finish = useCallback((won) => {
    setPhase(won ? 'won' : 'lost');
  }, []);

  // Orientation guard for phones — ask to rotate to landscape.
  useEffect(() => {
    const check = () => {
      const coarse = typeof window !== 'undefined'
        && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const portrait = window.innerHeight > window.innerWidth;
      setNeedRotate(!!coarse && portrait);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  // Load sprite images from passed URIs.
  useEffect(() => {
    const imgs = {};
    const keys = ['idle', 'walk', 'run', 'attack', 'hurt', 'death'];
    let loaded = 0;
    keys.forEach((k) => {
      if (!sprites[k]) return;
      const img = new Image();
      img.src = sprites[k];
      img.onload = () => { loaded++; };
      img.onerror = () => {};
      imgs[k] = img;
    });
    spriteImgs.current = imgs;
  }, [sprites.idle, sprites.walk, sprites.run, sprites.attack, sprites.hurt, sprites.death]);

  const FRAME_W = 64;
  const SPRITE_H = 256;
  useEffect(() => {
    g.current = {
      player: { x: 120, y: GROUND_Y - 46, w: 32, h: 46, vx: 0, vy: 0, jumps: 0, invuln: 0 },
      enemies: initialEnemies(),
      coins: initialCoins(),
      powerups: initialPowerups(),
      camX: 0,
      shield: false,
      dashT: 0,
      lastSafeX: 120,
      time: 0,
      acc: 0,
      last: 0,
    };
  }, []);

  const doJump = useCallback(() => {
    if (phaseRef.current !== 'run' || pausedRef.current) return;
    const p = g.current?.player;
    if (!p) return;
    if (p.jumps < MAX_JUMPS) {
      p.vy = JUMP_V;
      p.jumps += 1;
    }
  }, []);

  const doDash = useCallback(() => {
    if (phaseRef.current !== 'run' || pausedRef.current) return;
    const st = g.current;
    if (!st) return;
    if (st.dashReady) {
      st.dashT = 1.2;
      st.dashReady = false;
      setActivePowers((a) => a.filter((x) => x !== 'dash'));
      st.player.invuln = Math.max(st.player.invuln, 1.2);
    }
  }, []);

  // Keyboard controls.
  useEffect(() => {
    const down = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        movementRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        movementRef.current.right = true;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        doJump();
      }
      if (e.code === 'ShiftLeft' || e.code === 'KeyE') doDash();
    };
    const up = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') movementRef.current.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') movementRef.current.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [doJump, doDash]);

  // Main loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let dpr = 1;

    const resize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = wrap.clientWidth;
      const ch = wrap.clientHeight;
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    const step = (dt) => {
      const st = g.current;
      const p = st.player;
      const mov = movementRef.current;
      const running = st.dashT > 0 ? DASH_SPEED : RUN_SPEED;
      let dir = 0;
      if (mov.left) dir -= 1;
      if (mov.right) dir += 1;
      p.vx = running * dir;

      if (st.dashT > 0) st.dashT -= dt;
      if (p.invuln > 0) p.invuln -= dt;

      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Clamp left edge
      if (p.x < -60) p.x = -60;

      // Ground + platform landing
      const bottom = p.y + p.h;
      let landed = false;
      const seg = segAt(p.x + p.w / 2);
      if (seg && p.vy >= 0 && bottom >= GROUND_Y && bottom - p.vy * dt <= GROUND_Y + 1) {
        p.y = GROUND_Y - p.h;
        p.vy = 0;
        p.jumps = 0;
        landed = true;
      }
      for (const pf of PLATFORMS) {
        const prevBottom = bottom - p.vy * dt;
        if (
          p.vy >= 0 &&
          p.x + p.w > pf.x && p.x < pf.x + pf.w &&
          bottom >= pf.y && prevBottom <= pf.y + 1
        ) {
          p.y = pf.y - p.h;
          p.vy = 0;
          p.jumps = 0;
          landed = true;
        }
      }
      if (landed && seg) st.lastSafeX = Math.max(seg[0] + 40, Math.min(p.x, seg[1] - 40));

      // Fell in a pit
      if (p.y > VH + 120) {
        hitPlayer(true);
        p.x = st.lastSafeX;
        p.y = GROUND_Y - p.h - 60;
        p.vy = 0;
      }

      // Coins
      for (const c of st.coins) {
        if (!c.taken && Math.abs(c.x - (p.x + p.w / 2)) < 26 && Math.abs(c.y - (p.y + p.h / 2)) < 32) {
          c.taken = true;
          setScore((s) => s + 10);
        }
      }

      // Powerups
      for (const pw of st.powerups) {
        if (!pw.taken && p.x + p.w > pw.x && p.x < pw.x + pw.w && p.y + p.h > pw.y && p.y < pw.y + pw.h) {
          pw.taken = true;
          if (pw.type === 'shield') {
            st.shield = true;
            setActivePowers((a) => (a.includes('shield') ? a : [...a, 'shield']));
          } else if (pw.type === 'dash') {
            st.dashReady = true;
            setActivePowers((a) => (a.includes('dash') ? a : [...a, 'dash']));
          }
        }
      }

      // Enemies
      for (const en of st.enemies) {
        if (!en.alive) continue;
        en.x += en.dir * 70 * dt;
        if (en.x < en.min) { en.x = en.min; en.dir = 1; }
        if (en.x > en.max) { en.x = en.max; en.dir = -1; }
        const hit = p.x + p.w > en.x && p.x < en.x + en.w && p.y + p.h > en.y && p.y < en.y + en.h;
        if (hit) {
          const stomping = p.vy > 0 && (p.y + p.h) - en.y < 24;
          if (stomping) {
            en.alive = false;
            p.vy = JUMP_V * 0.6;
            setScore((s) => s + 50);
          } else {
            hitPlayer(false);
          }
        }
      }

      // Camera — follow player, clamp to world bounds
      st.camX = Math.max(0, Math.min(p.x - 260, GROUND_SEGS[GROUND_SEGS.length - 1][1] - VW + 120));

      // Reached boss
      if (p.x >= BOSS_TRIGGER_X && phaseRef.current === 'run') {
        p.x = BOSS_TRIGGER_X;
        if (totalQ === 0) finish(true);
        else setPhase('question');
      }
    };

    const hitPlayer = (isPit) => {
      const st = g.current;
      const p = st.player;
      if (p.invuln > 0) return;
      if (st.shield && !isPit) {
        st.shield = false;
        setActivePowers((a) => a.filter((x) => x !== 'shield'));
        p.invuln = 1.0;
        return;
      }
      p.invuln = 1.2;
      setHp((h) => {
        const nh = h - 1;
        if (nh <= 0) finish(false);
        return Math.max(nh, 0);
      });
    };

    // ---- drawing ----
    const px = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

    const drawPlayer = (p, t) => {
      const imgs = spriteImgs.current;
      const st = g.current;
      if (!imgs.idle) {
        // Fallback: draw placeholder rectangle if sprites haven't loaded yet
        px(Math.round(p.x), Math.round(p.y), p.w, p.h, '#7C7BF0');
        px(Math.round(p.x + 4), Math.round(p.y - 12), p.w - 8, 14, '#8B8AF5');
        if (st.shield) {
          ctx.strokeStyle = 'rgba(120,200,255,0.9)';
          ctx.lineWidth = 3;
          ctx.strokeRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
        }
        return;
      }

      const isMoving = Math.abs(p.vx) > 10;
      const dashing = st.dashT > 0;
      const onGround = p.jumps === 0;

      let sheet, fps, frameCount;
      if (dashing) {
        sheet = imgs.run || imgs.walk || imgs.idle;
        fps = 14; frameCount = 8;
      } else if (isMoving) {
        sheet = imgs.walk || imgs.idle;
        fps = 10; frameCount = 6;
      } else {
        sheet = imgs.idle;
        fps = 5; frameCount = 12;
      }

      const SW = FRAME_W, SH = SPRITE_H;
      const totalFrames = Math.floor((sheet?.naturalWidth || SW * frameCount) / SW);
      const frame = Math.floor(t * fps) % totalFrames;

      const DW = 40, DH = 160;
      const dx = Math.round(p.x - 4);
      const dy = Math.round(p.y + p.h - DH + 18);

      const flash = p.invuln > 0 && Math.floor(t * 12) % 2 === 0;
      if (flash) ctx.globalAlpha = 0.5;

      ctx.save();
      if (p.vx < 0) {
        ctx.translate(dx + DW, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(sheet, frame * SW, 0, SW, SH, -DW, 0, DW, DH);
      } else {
        ctx.drawImage(sheet, frame * SW, 0, SW, SH, dx, dy, DW, DH);
      }
      ctx.restore();

      if (st.shield) {
        ctx.strokeStyle = 'rgba(120,200,255,0.9)';
        ctx.lineWidth = 3;
        ctx.strokeRect(Math.round(p.x - 4), Math.round(dy), DW, DH);
      }

      ctx.globalAlpha = 1;
    };

    const drawEnemy = (en, t) => {
      const bob = Math.sin(t * 8 + en.id) * 2;
      const x = en.x, y = en.y + bob;
      px(x + 2, y + 6, en.w - 4, en.h - 6, '#FF6B6B');
      px(x, y + 2, en.w, 8, '#FF8A8A'); // spiky top approximation
      px(x + 7, y + 14, 5, 6, '#FFFFFF');
      px(x + 20, y + 14, 5, 6, '#FFFFFF');
      px(x + 9, y + 16, 3, 3, '#1A1A2E');
      px(x + 22, y + 16, 3, 3, '#1A1A2E');
    };

    const drawCoin = (c, t) => {
      const s = 1 + Math.sin(t * 6 + c.id) * 0.08;
      const r = 9 * s;
      ctx.fillStyle = '#F5C542';
      ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFE9A8';
      ctx.beginPath(); ctx.arc(c.x - 2, c.y - 2, r * 0.4, 0, Math.PI * 2); ctx.fill();
    };

    const drawPow = (pw, t) => {
      const bob = Math.sin(t * 5 + pw.id) * 3;
      const x = pw.x, y = pw.y + bob;
      const col = pw.type === 'shield' ? '#67C8FF' : '#B78BFF';
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x + 14, y);
      ctx.lineTo(x + 28, y + 14);
      ctx.lineTo(x + 14, y + 28);
      ctx.lineTo(x, y + 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      px(x + 12, y + 8, 4, 12, 'rgba(255,255,255,0.8)');
    };

    const drawBoss = (t) => {
      const bx = 4020, by = GROUND_Y - 120;
      const bob = Math.sin(t * 3) * 6;
      const y = by + bob;
      px(bx, y, 120, 120, '#5A4FE0');
      px(bx, y, 120, 30, '#7C7BF0');
      px(bx + 20, y + 40, 26, 30, '#FFFFFF');
      px(bx + 74, y + 40, 26, 30, '#FFFFFF');
      px(bx + 28, y + 50, 12, 14, '#FF3B3B');
      px(bx + 82, y + 50, 12, 14, '#FF3B3B');
      px(bx + 30, y + 90, 60, 8, '#2A2050'); // frown
      // crown
      px(bx + 30, y - 18, 60, 18, '#F5C542');
    };

    const drawWorld = (t) => {
      const wrap = wrapRef.current;
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      // sky
      const grd = ctx.createLinearGradient(0, 0, 0, ch);
      grd.addColorStop(0, '#BFe0ff'.replace('e', 'E'));
      grd.addColorStop(1, '#EAF6FF');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, cw, ch);

      const scale = Math.min(cw / VW, ch / VH);
      const offY = (ch - VH * scale) / 2;
      ctx.save();
      ctx.translate(0, offY);
      ctx.scale(scale, scale);
      const st = g.current;
      ctx.translate(-st.camX, 0);

      // clouds (parallax)
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 700) - st.camX * 0.4) % (VW + 4600);
        const rx = cx < -200 ? cx + (VW + 4600) : cx;
        ctx.beginPath();
        ctx.arc(rx, 90 + (i % 3) * 30, 26, 0, Math.PI * 2);
        ctx.arc(rx + 30, 90 + (i % 3) * 30, 34, 0, Math.PI * 2);
        ctx.arc(rx + 66, 90 + (i % 3) * 30, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      // ground
      for (const [s, e] of GROUND_SEGS) {
        px(s, GROUND_Y, e - s, 12, '#6BBF59');
        px(s, GROUND_Y + 12, e - s, VH - GROUND_Y, '#8A5A3B');
        for (let x = s; x < e; x += 40) px(x + 6, GROUND_Y + 22, 6, 6, '#7A4A2B');
      }
      // platforms
      for (const pf of PLATFORMS) {
        px(pf.x, pf.y, pf.w, 8, '#6BBF59');
        px(pf.x, pf.y + 8, pf.w, pf.h - 8, '#8A5A3B');
      }

      for (const c of st.coins) if (!c.taken) drawCoin(c, t);
      for (const pw of st.powerups) if (!pw.taken) drawPow(pw, t);
      for (const en of st.enemies) if (en.alive) drawEnemy(en, t);
      drawBoss(t);
      drawPlayer(st.player, t);

      ctx.restore();
    };

    const frame = (now) => {
      const st = g.current;
      if (!st.last) st.last = now;
      let dt = (now - st.last) / 1000;
      st.last = now;
      if (dt > 0.05) dt = 0.05;
      st.time += dt;

      if (phaseRef.current === 'run' && !pausedRef.current) {
        st.acc += dt;
        const fixed = 1 / 120;
        let guard = 0;
        while (st.acc >= fixed && guard < 8) { step(fixed); st.acc -= fixed; guard++; }
      }
      drawWorld(st.time);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [finish, totalQ]);

  // Persist result once when terminal.
  useEffect(() => {
    if (phase === 'won' || phase === 'lost') {
      onGameOver && onGameOver({
        score,
        won: phase === 'won',
        questionsCorrect: correctCount,
        questionsTotal: totalQ,
      });
    }
  }, [phase]); // eslint-disable-line

  const answer = (idx) => {
    if (feedback) return;
    const q = questions[qIndex];
    if (idx === q.correctIndex) {
      setFeedback('right');
      setScore((s) => s + 100);
      setCorrectCount((c) => c + 1);
      setTimeout(() => {
        setFeedback(null);
        if (qIndex + 1 >= totalQ) finish(true);
        else { setQIndex((i) => i + 1); setPhase('question'); }
      }, 650);
    } else {
      setFeedback('wrong');
      setHp((h) => {
        const nh = Math.max(h - 1, 0);
        setTimeout(() => {
          setFeedback(null);
          if (nh <= 0) finish(false);
        }, 700);
        return nh;
      });
    }
  };

  const hearts = '❤'.repeat(hp) + '♡'.repeat(Math.max(START_HP - hp, 0));

  return (
    <div ref={wrapRef} style={S.wrap}>
      <canvas ref={canvasRef} style={S.canvas} />

      {/* HUD */}
      <div style={S.hud}>
        <span style={S.hudPill}>{hearts}</span>
        <span style={S.hudPill}>★ {score}</span>
        {phase === 'question' && <span style={S.hudPill}>Boss HP {bossHpLeft}</span>}
        {activePowers.includes('shield') && <span style={S.powPill}>🛡 Shield</span>}
        {activePowers.includes('dash') && <span style={S.powPill}>⚡ Dash (E)</span>}
      </div>

      {/* Touch controls */}
      {phase === 'run' && (
        <>
          {/* D-pad — left side */}
          <div style={S.dpad}>
            <button
              style={S.dpadBtn}
              onPointerDown={() => { movementRef.current.left = true; }}
              onPointerUp={() => { movementRef.current.left = false; }}
              onPointerLeave={() => { movementRef.current.left = false; }}
            >◀</button>
            <button
              style={S.dpadBtn}
              onPointerDown={() => { movementRef.current.right = true; }}
              onPointerUp={() => { movementRef.current.right = false; }}
              onPointerLeave={() => { movementRef.current.right = false; }}
            >▶</button>
          </div>
          {/* Action buttons — right side */}
          <div style={S.controls}>
            {activePowers.includes('dash') && (
              <button style={{ ...S.btn, background: '#B78BFF' }} onPointerDown={doDash}>⚡</button>
            )}
            <button style={S.btn} onPointerDown={doJump}>⤒ JUMP</button>
          </div>
        </>
      )}

      {/* Question overlay */}
      {phase === 'question' && questions[qIndex] && (
        <div style={S.overlay}>
          <div style={S.qcard}>
            <div style={S.qbadge}>Boss Question {qIndex + 1}/{totalQ}</div>
            <div style={S.qtext}>{questions[qIndex].prompt}</div>
            <div style={S.qgrid}>
              {questions[qIndex].options.map((opt, i) => {
                let bg = '#F2F2F5';
                if (feedback && i === questions[qIndex].correctIndex) bg = '#4CAF50';
                else if (feedback === 'wrong') bg = '#F2F2F5';
                return (
                  <button key={i} style={{ ...S.opt, background: bg }} onClick={() => answer(i)} disabled={!!feedback}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {feedback === 'right' && <div style={{ ...S.fb, color: '#4CAF50' }}>Correct! Boss takes damage 🗡</div>}
            {feedback === 'wrong' && <div style={{ ...S.fb, color: '#FF5252' }}>Wrong! You lost a heart 💔</div>}
          </div>
        </div>
      )}

      {/* Rotate prompt */}
      {needRotate && (
        <div style={S.rotate}>
          <div style={S.rotateIcon}>📱↻</div>
          <div style={S.rotateText}>Rotate your device to landscape for the best experience</div>
        </div>
      )}

      {/* Result */}
      {(phase === 'won' || phase === 'lost') && (
        <div style={S.overlay}>
          <div style={S.result}>
            <div style={S.resultTitle}>{phase === 'won' ? '🎉 Level Cleared!' : '💀 Game Over'}</div>
            <div style={S.resultLine}>Score: {score}</div>
            <div style={S.resultLine}>Questions: {correctCount}/{totalQ}</div>
            <button style={S.primary} onClick={() => onExit && onExit()}>Back to Module</button>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', background: '#EAF6FF', fontFamily: 'system-ui, sans-serif', touchAction: 'none', userSelect: 'none' },
  canvas: { display: 'block', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', imageRendering: 'pixelated' },
  hud: { position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, flexWrap: 'wrap' },
  hudPill: { background: 'rgba(26,26,46,0.72)', color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 16, fontWeight: 700 },
  powPill: { background: 'rgba(124,123,240,0.9)', color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 14, fontWeight: 700 },
  controls: { position: 'absolute', bottom: 24, right: 24, display: 'flex', gap: 12 },
  dpad: { position: 'absolute', bottom: 24, left: 24, display: 'flex', gap: 8 },
  dpadBtn: { background: 'rgba(124,123,240,0.85)', color: '#fff', border: 'none', borderRadius: 16, padding: '16px 22px', fontSize: 22, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer', minWidth: 60, textAlign: 'center' },
  btn: { background: 'rgba(124,123,240,0.95)', color: '#fff', border: 'none', borderRadius: 16, padding: '18px 24px', fontSize: 18, fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer' },
  overlay: { position: 'absolute', inset: 0, background: 'rgba(26,26,46,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  qcard: { background: '#fff', borderRadius: 24, padding: 24, width: 'min(680px, 92vw)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' },
  qbadge: { display: 'inline-block', background: '#7C7BF0', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700, marginBottom: 12 },
  qtext: { fontSize: 22, fontWeight: 800, color: '#1A1A1A', marginBottom: 20 },
  qgrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  opt: { border: 'none', borderRadius: 16, padding: '18px 16px', fontSize: 18, fontWeight: 700, color: '#1A1A1A', cursor: 'pointer', minHeight: 64 },
  fb: { marginTop: 16, fontSize: 16, fontWeight: 700, textAlign: 'center' },
  rotate: { position: 'absolute', inset: 0, background: 'rgba(26,26,46,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, color: '#fff', textAlign: 'center', padding: 30 },
  rotateIcon: { fontSize: 64 },
  rotateText: { fontSize: 20, fontWeight: 700, maxWidth: 360 },
  result: { background: '#fff', borderRadius: 24, padding: 32, textAlign: 'center', width: 'min(420px, 90vw)' },
  resultTitle: { fontSize: 28, fontWeight: 900, marginBottom: 16, color: '#1A1A1A' },
  resultLine: { fontSize: 18, fontWeight: 600, color: '#444', marginBottom: 8 },
  primary: { marginTop: 20, background: '#7C7BF0', color: '#fff', border: 'none', borderRadius: 16, padding: '16px 28px', fontSize: 18, fontWeight: 800, cursor: 'pointer', width: '100%' },
};
