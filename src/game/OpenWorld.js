'use dom';

import React, { useRef, useEffect, useState, useCallback } from 'react';

// Logical world (top-down). Map is larger than the viewport; camera follows player.
// Reference viewport used to derive the camera zoom. Larger values show more
// of the world (more zoomed out). Tuned so the scene isn't cramped/zoomed-in.
const VIEW_W = 1280;
const VIEW_H = 720;
const MAP_W = 2400;
const MAP_H = 1600;
const SPEED = 220;          // px/sec walking
const PLAYER_W = 44;
const PLAYER_H = 60;        // collision box (feet-ish); sprite drawn larger
// Every character is normalized to this on-screen CONTENT height (measured
// from opaque pixels), so all sprites look the same size regardless of the
// source frame dimensions. FEET_LIFT nudges the planted position vs. the
// collision baseline. Tune CONTENT_H to make characters bigger/smaller.
const CONTENT_H = 78;       // on-screen height of the character's visible body
const FEET_LIFT = -2;       // + lifts sprite off ground, - sinks it slightly
const INTERACT_DIST = 90;

// Buildings on the map. `module` marks the one that launches a lesson.
const BUILDINGS = [
  { id: 'vector',  x: 360,  y: 300, w: 260, h: 220, color: '#7C7BF0', roof: '#5A4FE0', label: 'Vector', module: 'vector' },
  { id: 'algebra', x: 1500, y: 260, w: 240, h: 210, color: '#F5A623', roof: '#E8951A', label: 'Algebra', locked: true },
  { id: 'geometry',x: 1000, y: 1050,w: 250, h: 210, color: '#4CAF50', roof: '#3B9142', label: 'Geometry', locked: true },
  { id: 'stats',   x: 1850, y: 1080,w: 240, h: 210, color: '#5B8DEF', roof: '#3E6FD1', label: 'Stats', locked: true },
];

// Decorative trees (also act as soft obstacles).
const TREES = [
  { x: 200, y: 800 }, { x: 780, y: 620 }, { x: 1200, y: 500 },
  { x: 1700, y: 760 }, { x: 620, y: 1150 }, { x: 1450, y: 1250 },
  { x: 2050, y: 500 }, { x: 300, y: 500 }, { x: 900, y: 900 },
  { x: 1950, y: 900 }, { x: 500, y: 1350 }, { x: 1650, y: 480 },
];

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export default function OpenWorld({
  character = {},
  characterName = 'Hero',
  playerName = 'Player',
  buttons = {},
  onEnterModule,
  onExit,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const nameTagRef = useRef(null);
  const imgs = useRef({ idle: [], walk: [], run: [], jump: [], attack: [] });

  const [nearBuilding, setNearBuilding] = useState(null); // building object or null
  const [ready, setReady] = useState(false);

  const state = useRef(null);
  const move = useRef({ up: false, down: false, left: false, right: false });
  const nearRef = useRef(null);

  // Reset the host document so the canvas fills the WebView with no offset.
  // Without this, default body margin / scrolling shifts the UI and makes
  // portrait vs landscape look inconsistent.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const html = document.documentElement;
    const { body } = document;
    const prev = {
      bodyMargin: body.style.margin,
      bodyPadding: body.style.padding,
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyHeight: body.style.height,
    };
    html.style.height = '100%';
    html.style.overflow = 'hidden';
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.height = '100%';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';

    // Lock the viewport so holding a button never triggers pinch / double-tap
    // zoom or the iOS text/image magnifier. Also disables the callout menu.
    let meta = document.querySelector('meta[name="viewport"]');
    let created = false;
    const prevContent = meta ? meta.getAttribute('content') : null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
      created = true;
    }
    meta.setAttribute(
      'content',
      'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover'
    );
    body.style.webkitTouchCallout = 'none';
    body.style.webkitUserSelect = 'none';
    body.style.touchAction = 'none';

    // Belt-and-suspenders: swallow gesture / multi-touch zoom events.
    const stop = (e) => e.preventDefault();
    document.addEventListener('gesturestart', stop, { passive: false });
    document.addEventListener('gesturechange', stop, { passive: false });

    return () => {
      body.style.margin = prev.bodyMargin;
      body.style.padding = prev.bodyPadding;
      body.style.overflow = prev.bodyOverflow;
      body.style.height = prev.bodyHeight;
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      document.removeEventListener('gesturestart', stop);
      document.removeEventListener('gesturechange', stop);
      if (created && meta.parentNode) meta.parentNode.removeChild(meta);
      else if (meta && prevContent != null) meta.setAttribute('content', prevContent);
    };
  }, []);

  // Load all frame images for the chosen character.
  //
  // Different sprite packs ship at wildly different frame sizes (e.g. the
  // human classes are 128x128, the monster packs are 1080x1350 with lots of
  // transparent padding). To make every character render at the SAME on-screen
  // size and sit flat on the ground, we measure each frame's real content
  // bounding box (opaque pixels) once, right after it loads. drawPlayer() then
  // scales/aligns using these metrics instead of the raw frame box.
  useEffect(() => {
    const groups = ['idle', 'walk', 'run', 'jump', 'attack'];
    const store = { idle: [], walk: [], run: [], jump: [], attack: [] };
    let total = 0, done = 0;

    // Offscreen canvas reused to read pixel alpha for trim measurement.
    const off = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    const octx = off ? off.getContext('2d', { willReadFrequently: true }) : null;

    const measure = (im) => {
      const nw = im.naturalWidth || 0;
      const nh = im.naturalHeight || 0;
      const whole = { top: 0, bottom: nh || 1, left: 0, right: nw || 1, h: nh || 1, w: nw || 1 };
      if (!octx || !nw || !nh) return whole;
      off.width = nw; off.height = nh;
      octx.clearRect(0, 0, nw, nh);
      octx.drawImage(im, 0, 0);
      let data;
      try {
        data = octx.getImageData(0, 0, nw, nh).data;
      } catch (e) {
        return whole; // tainted canvas — fall back to full frame
      }
      const thr = 16;
      let top = nh, bottom = 0, left = nw, right = 0;
      for (let y = 0; y < nh; y++) {
        const row = y * nw;
        for (let x = 0; x < nw; x++) {
          if (data[(row + x) * 4 + 3] > thr) {
            if (y < top) top = y;
            if (y + 1 > bottom) bottom = y + 1;
            if (x < left) left = x;
            if (x + 1 > right) right = x + 1;
          }
        }
      }
      if (bottom <= top || right <= left) return whole; // fully transparent
      return { top, bottom, left, right, h: bottom - top, w: right - left };
    };

    groups.forEach((g) => {
      const list = character[g] || [];
      list.forEach((src) => {
        total++;
        const im = new Image();
        im.onload = () => {
          im._trim = measure(im);
          done++;
          if (done >= total) setReady(true);
        };
        im.onerror = () => { done++; if (done >= total) setReady(true); };
        im.src = src;
        store[g].push(im);
      });
    });
    imgs.current = store;
    if (total === 0) setReady(true);
  }, [character]);

  useEffect(() => {
    state.current = {
      x: 480, y: 620,
      px: 480, py: 620, // camera-follow target (mirrors x/y each step)
      facing: 1,       // 1 right, -1 left
      moving: false,
      animT: 0,
      camX: 0, camY: 0,
      last: 0, time: 0,
    };
  }, []);

  const doInteract = useCallback(() => {
    const b = nearRef.current;
    if (!b) return;
    if (b.module && onEnterModule) onEnterModule(b.module);
  }, [onEnterModule]);

  // Keyboard controls.
  useEffect(() => {
    const down = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': e.preventDefault(); move.current.up = true; break;
        case 'ArrowDown': case 'KeyS': e.preventDefault(); move.current.down = true; break;
        case 'ArrowLeft': case 'KeyA': e.preventDefault(); move.current.left = true; break;
        case 'ArrowRight': case 'KeyD': e.preventDefault(); move.current.right = true; break;
        case 'Space': case 'Enter': e.preventDefault(); doInteract(); break;
        default: break;
      }
    };
    const up = (e) => {
      switch (e.code) {
        case 'ArrowUp': case 'KeyW': move.current.up = false; break;
        case 'ArrowDown': case 'KeyS': move.current.down = false; break;
        case 'ArrowLeft': case 'KeyA': move.current.left = false; break;
        case 'ArrowRight': case 'KeyD': move.current.right = false; break;
        default: break;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [doInteract]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf;
    let dpr = 1;

    const resize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      if (cw === 0 || ch === 0) return;
      const nw = Math.floor(cw * dpr);
      const nh = Math.floor(ch * dpr);
      if (canvas.width !== nw) canvas.width = nw;
      if (canvas.height !== nh) canvas.height = nh;
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
    };
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    // Orientation changes can settle a frame or two later — re-measure.
    const onOrient = () => {
      setTimeout(resize, 60);
      setTimeout(resize, 300);
    };
    window.addEventListener('orientationchange', onOrient);
    // Observe the container itself so any layout change keeps the canvas synced.
    let ro;
    if (typeof ResizeObserver !== 'undefined' && wrapRef.current) {
      ro = new ResizeObserver(() => resize());
      ro.observe(wrapRef.current);
    }

    const step = (dt) => {
      const s = state.current;
      const m = move.current;
      let dx = 0, dy = 0;
      if (m.left) dx -= 1;
      if (m.right) dx += 1;
      if (m.up) dy -= 1;
      if (m.down) dy += 1;
      const mag = Math.hypot(dx, dy) || 1;
      dx /= mag; dy /= mag;

      s.moving = (dx !== 0 || dy !== 0);
      if (dx !== 0) s.facing = dx > 0 ? 1 : -1;

      const nx = s.x + dx * SPEED * dt;
      const ny = s.y + dy * SPEED * dt;

      // Collision box is at feet: player box is PLAYER_W x PLAYER_H centered on x, bottom at y.
      const boxX = (v) => v - PLAYER_W / 2;
      const boxY = (v) => v - PLAYER_H;

      const blocked = (tx, ty) => {
        // world bounds
        if (tx - PLAYER_W / 2 < 20 || tx + PLAYER_W / 2 > MAP_W - 20) return true;
        if (ty - PLAYER_H < 20 || ty > MAP_H - 20) return true;
        // buildings — collide with lower solid footprint only
        for (const b of BUILDINGS) {
          const fy = b.y + b.h * 0.45;
          const fh = b.h * 0.55;
          if (rectsOverlap(boxX(tx), boxY(ty), PLAYER_W, PLAYER_H, b.x, fy, b.w, fh)) return true;
        }
        // trees trunk
        for (const t of TREES) {
          if (rectsOverlap(boxX(tx), boxY(ty), PLAYER_W, PLAYER_H, t.x - 12, t.y - 14, 24, 28)) return true;
        }
        return false;
      };

      // axis-separated movement so we can slide along walls
      if (!blocked(nx, s.y)) s.x = nx;
      if (!blocked(s.x, ny)) s.y = ny;

      if (s.moving) s.animT += dt; else s.animT = 0;

      // Camera follows the player; clamped to map bounds inside render(),
      // where the on-screen visible size (which depends on orientation) is known.
      s.px = s.x;
      s.py = s.y;

      // nearest interactable building (door center)
      let found = null;
      let best = INTERACT_DIST;
      for (const b of BUILDINGS) {
        const doorX = b.x + b.w / 2;
        const doorY = b.y + b.h;
        const d = Math.hypot(s.x - doorX, s.y - doorY);
        if (d < best) { best = d; found = b; }
      }
      if (found !== nearRef.current) {
        nearRef.current = found;
        setNearBuilding(found);
      }
    };

    // ---------- drawing ----------
    const drawGround = (s) => {
      // grass base
      ctx.fillStyle = '#8FD16A';
      ctx.fillRect(-s.camX, -s.camY, MAP_W, MAP_H);
      // subtle checker
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      const tile = 80;
      for (let gx = 0; gx < MAP_W; gx += tile) {
        for (let gy = 0; gy < MAP_H; gy += tile) {
          if (((gx / tile) + (gy / tile)) % 2 === 0) {
            ctx.fillRect(gx - s.camX, gy - s.camY, tile, tile);
          }
        }
      }
      // dirt paths connecting buildings to a central plaza
      ctx.strokeStyle = '#C8A06A';
      ctx.lineWidth = 46;
      ctx.lineCap = 'round';
      const plaza = { x: 1200, y: 800 };
      ctx.beginPath();
      for (const b of BUILDINGS) {
        const doorX = b.x + b.w / 2;
        const doorY = b.y + b.h + 10;
        ctx.moveTo(plaza.x - s.camX, plaza.y - s.camY);
        ctx.lineTo(doorX - s.camX, doorY - s.camY);
      }
      ctx.stroke();
      // plaza circle
      ctx.fillStyle = '#D9B57E';
      ctx.beginPath();
      ctx.arc(plaza.x - s.camX, plaza.y - s.camY, 70, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBuilding = (b, s) => {
      const bx = b.x - s.camX, by = b.y - s.camY;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(bx + 10, by + b.h - 6, b.w, 18);
      // body
      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by + b.h * 0.32, b.w, b.h * 0.68);
      // roof
      ctx.fillStyle = b.roof;
      ctx.beginPath();
      ctx.moveTo(bx - 14, by + b.h * 0.34);
      ctx.lineTo(bx + b.w / 2, by - 10);
      ctx.lineTo(bx + b.w + 14, by + b.h * 0.34);
      ctx.closePath();
      ctx.fill();
      // door
      const dw = b.w * 0.26, dh = b.h * 0.4;
      ctx.fillStyle = '#3A2B1A';
      ctx.fillRect(bx + b.w / 2 - dw / 2, by + b.h - dh, dw, dh);
      ctx.fillStyle = '#F5C542';
      ctx.beginPath();
      ctx.arc(bx + b.w / 2 + dw / 2 - 8, by + b.h - dh / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      // windows
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(bx + 22, by + b.h * 0.45, 34, 30);
      ctx.fillRect(bx + b.w - 56, by + b.h * 0.45, 34, 30);
      // sign
      ctx.fillStyle = '#1A1A2E';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, bx + b.w / 2, by + b.h * 0.24);
      if (b.locked) {
        ctx.fillStyle = 'rgba(26,26,46,0.55)';
        ctx.fillRect(bx, by + b.h * 0.32, b.w, b.h * 0.68);
        ctx.fillStyle = '#fff';
        ctx.font = '28px system-ui';
        ctx.fillText('🔒', bx + b.w / 2, by + b.h * 0.7);
      }
      ctx.textAlign = 'left';
    };

    const drawTree = (t, s) => {
      const tx = t.x - s.camX, ty = t.y - s.camY;
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.beginPath(); ctx.ellipse(tx, ty + 16, 22, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7A4A2B';
      ctx.fillRect(tx - 6, ty - 6, 12, 24);
      ctx.fillStyle = '#3E8E41';
      ctx.beginPath(); ctx.arc(tx, ty - 24, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath(); ctx.arc(tx - 14, ty - 14, 20, 0, Math.PI * 2);
      ctx.arc(tx + 14, ty - 14, 20, 0, Math.PI * 2); ctx.fill();
    };

    const pickFrames = (s) => {
      const set = imgs.current;
      if (s.moving && set.walk.length) return { list: set.walk, fps: 10 };
      if (set.idle.length) return { list: set.idle, fps: 6 };
      if (set.walk.length) return { list: set.walk, fps: 8 };
      return { list: [], fps: 6 };
    };

    const drawPlayer = (s) => {
      const { list, fps } = pickFrames(s);
      const cx = Math.round(s.x - s.camX);
      const feetY = Math.round(s.y - s.camY);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(cx, feetY - 4, 22, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (!list.length) {
        ctx.fillStyle = '#7C7BF0';
        ctx.fillRect(cx - PLAYER_W / 2, feetY - PLAYER_H, PLAYER_W, PLAYER_H);
        return;
      }
      const frame = Math.floor(s.animT * fps) % list.length;
      const im = list[frame] || list[0];

      // Normalize by the frame's measured content box so every character —
      // regardless of source frame size or padding — renders at the same
      // on-screen height with feet planted on the ground.
      const t = im._trim || { top: 0, left: 0, w: im.naturalWidth || 1, h: im.naturalHeight || 1 };
      const scale = CONTENT_H / t.h;                 // content height -> fixed on-screen height
      const dw = t.w * scale;                        // drawn width of the content
      const dh = t.h * scale;                        // == CONTENT_H
      const dx = Math.round(cx - dw / 2);            // horizontally centered
      const dy = Math.round(feetY - dh - FEET_LIFT); // bottom of content at feet

      ctx.save();
      if (s.facing < 0) {
        ctx.translate(dx + dw, dy);
        ctx.scale(-1, 1);
        // Draw only the content region of the source into the target box.
        ctx.drawImage(im, t.left, t.top, t.w, t.h, 0, 0, dw, dh);
      } else {
        ctx.drawImage(im, t.left, t.top, t.w, t.h, dx, dy, dw, dh);
      }
      ctx.restore();

      // The name tag is a real DOM overlay (crisp at device resolution),
      // not drawn on the pixelated canvas. Its screen anchor is computed in
      // render() and written to the overlay element there.
    };

    const render = () => {
      const s = state.current;
      const wrap = wrapRef.current;
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      // sky/void behind map edges
      ctx.fillStyle = '#6FB84A';
      ctx.fillRect(0, 0, cw, ch);

      // "Cover" camera: keep a consistent zoom that fills the screen in BOTH
      // portrait and landscape (no letterbox bands, no floating controls).
      // We pick a scale from the reference view width so the world always
      // looks the same size, then show as many world pixels as the screen fits.
      const scale = Math.max(cw / VIEW_W, ch / VIEW_H);
      // Visible world size in world units at this scale.
      const viewW = cw / scale;
      const viewH = ch / scale;

      // Follow the player, clamped so we never scroll past the map edges.
      // If the map is smaller than the view on an axis, center it.
      const maxCamX = Math.max(0, MAP_W - viewW);
      const maxCamY = Math.max(0, MAP_H - viewH);
      let camX = s.px - viewW / 2;
      let camY = s.py - viewH / 2;
      camX = Math.max(0, Math.min(camX, maxCamX));
      camY = Math.max(0, Math.min(camY, maxCamY));
      // Round to device pixels to avoid sub-pixel shimmer on the pixelated canvas.
      s.camX = Math.round(camX * scale) / scale;
      s.camY = Math.round(camY * scale) / scale;

      ctx.save();
      ctx.scale(scale, scale);

      drawGround(s);

      // depth sort: things with larger baseline y drawn later
      const drawables = [];
      for (const b of BUILDINGS) drawables.push({ y: b.y + b.h, kind: 'b', ref: b });
      for (const t of TREES) drawables.push({ y: t.y, kind: 't', ref: t });
      drawables.push({ y: s.y, kind: 'p' });
      drawables.sort((a, b2) => a.y - b2.y);
      for (const d of drawables) {
        if (d.kind === 'b') drawBuilding(d.ref, s);
        else if (d.kind === 't') drawTree(d.ref, s);
        else drawPlayer(s);
      }

      ctx.restore();

      // Position the DOM name-tag overlay above the player's head. This lives
      // in CSS pixels (device resolution), so text stays crisp at any zoom.
      const tag = nameTagRef.current;
      if (tag) {
        const headWorldY = s.y - CONTENT_H - FEET_LIFT - 4; // just above the head
        const screenX = (s.x - s.camX) * scale;         // canvas is full-bleed, no offset
        const screenY = (headWorldY - s.camY) * scale - 6;
        tag.style.transform = `translate(-50%, -100%) translate(${Math.round(screenX)}px, ${Math.round(screenY)}px)`;
        // Hide the tag if the player is (somehow) off-screen.
        const vis = screenX > -80 && screenX < cw + 80 && screenY > -40 && screenY < ch + 40;
        tag.style.opacity = vis ? '1' : '0';
      }
    };

    const loop = (now) => {
      const s = state.current;
      if (!s.last) s.last = now;
      let dt = (now - s.last) / 1000;
      s.last = now;
      if (dt > 0.05) dt = 0.05;
      s.time += dt;
      step(dt);
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener('orientationchange', onOrient);
      window.removeEventListener('orientationchange', resize);
      window.removeEventListener('resize', resize);
    };
  }, [ready, playerName]);

  const press = (dir, val) => () => { move.current[dir] = val; };

  return (
    <div ref={wrapRef} style={ST.wrap}>
      <canvas ref={canvasRef} style={ST.canvas} />

      {/* Player name tag — DOM overlay tracked to the player each frame.
          Rendered at device resolution so text is always crisp. */}
      <div ref={nameTagRef} style={ST.nameTag}>
        <span style={ST.nameTagText}>{playerName}</span>
        <span style={ST.nameTagArrow} />
      </div>

      {/* Top bar */}
      <div style={ST.topbar}>
        <button style={ST.exitBtn} onClick={() => onExit && onExit()}>✕</button>
        <span style={ST.pill}>{characterName}</span>
        <span style={ST.hint}>Open World</span>
      </div>

      {/* D-pad — image buttons (left / right / up only for now) */}
      <div style={ST.dpad}>
        <button
          style={{ ...ST.dBtn, ...ST.dUp }}
          onPointerDown={press('up', true)}
          onPointerUp={press('up', false)}
          onPointerLeave={press('up', false)}
          aria-label="Up"
        >
          {buttons.up
            ? <img src={buttons.up} alt="Up" draggable={false} style={ST.dImg} />
            : '▲'}
        </button>
        <button
          style={{ ...ST.dBtn, ...ST.dLeft }}
          onPointerDown={press('left', true)}
          onPointerUp={press('left', false)}
          onPointerLeave={press('left', false)}
          aria-label="Left"
        >
          {buttons.left
            ? <img src={buttons.left} alt="Left" draggable={false} style={ST.dImg} />
            : '◀'}
        </button>
        <button
          style={{ ...ST.dBtn, ...ST.dRight }}
          onPointerDown={press('right', true)}
          onPointerUp={press('right', false)}
          onPointerLeave={press('right', false)}
          aria-label="Right"
        >
          {buttons.right
            ? <img src={buttons.right} alt="Right" draggable={false} style={ST.dImg} />
            : '▶'}
        </button>
        <button
          style={{ ...ST.dBtn, ...ST.dDown }}
          onPointerDown={press('down', true)}
          onPointerUp={press('down', false)}
          onPointerLeave={press('down', false)}
          aria-label="Down"
        >
          {buttons.down
            ? <img src={buttons.down} alt="Down" draggable={false} style={ST.dImg} />
            : '▼'}
        </button>
      </div>

      {/* Interact prompt / button */}
      {nearBuilding && (
        <div style={ST.interactWrap}>
          <div style={ST.interactLabel}>
            {nearBuilding.locked
              ? `${nearBuilding.label} — Locked 🔒`
              : `Enter ${nearBuilding.label}?`}
          </div>
          {!nearBuilding.locked && nearBuilding.module && (
            <button style={ST.interactBtn} onClick={doInteract}>
              Enter ▶
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Safe-area helpers so controls never hide under a notch / home indicator,
// in either portrait or landscape.
const SA_T = 'env(safe-area-inset-top, 0px)';
const SA_B = 'env(safe-area-inset-bottom, 0px)';
const SA_L = 'env(safe-area-inset-left, 0px)';
const SA_R = 'env(safe-area-inset-right, 0px)';

const ST = {
  wrap: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%',
    overflow: 'hidden', background: '#6FB84A', fontFamily: 'system-ui, sans-serif',
    touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent',
  },
  canvas: { display: 'block', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', imageRendering: 'pixelated' },
  nameTag: {
    position: 'absolute', top: 0, left: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    pointerEvents: 'none', willChange: 'transform', transform: 'translate(-50%,-100%)',
    opacity: 0, // hidden until the first frame positions it (avoids corner flash)
    // transition only opacity — position is set per-frame and must not lag.
    transition: 'opacity 120ms ease',
  },
  nameTagText: {
    background: 'rgba(26,26,46,0.82)', color: '#fff',
    padding: '3px 10px', borderRadius: 999,
    fontSize: 13, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap',
    letterSpacing: 0.2, boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  nameTagArrow: {
    width: 0, height: 0, marginTop: -1,
    borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
    borderTop: '6px solid rgba(26,26,46,0.82)',
  },
  topbar: {
    position: 'absolute', top: `calc(12px + ${SA_T})`, left: `calc(12px + ${SA_L})`, right: `calc(12px + ${SA_R})`,
    display: 'flex', alignItems: 'center', gap: 10,
  },
  exitBtn: { background: 'rgba(26,26,46,0.72)', color: '#fff', border: 'none', borderRadius: 999, width: 40, height: 40, fontSize: 18, fontWeight: 800, cursor: 'pointer' },
  pill: { background: 'rgba(124,123,240,0.92)', color: '#fff', padding: '8px 14px', borderRadius: 999, fontSize: 15, fontWeight: 800 },
  hint: { marginLeft: 'auto', background: 'rgba(26,26,46,0.55)', color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700 },
  dpad: { position: 'absolute', bottom: `calc(28px + ${SA_B})`, left: `calc(24px + ${SA_L})`, width: 192, height: 192 },
  dBtn: {
    position: 'absolute', width: 64, height: 64, background: 'transparent', color: '#fff',
    border: 'none', padding: 0, fontSize: 20, fontWeight: 800, cursor: 'pointer',
    touchAction: 'none', WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  dImg: {
    width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none',
    userSelect: 'none', WebkitUserSelect: 'none', WebkitUserDrag: 'none', WebkitTouchCallout: 'none',
    filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))',
  },
  dUp: { top: 0, left: 64 },
  dDown: { bottom: 0, left: 64 },
  dLeft: { top: 64, left: 0 },
  dRight: { top: 64, right: 0 },
  interactWrap: { position: 'absolute', bottom: `calc(36px + ${SA_B})`, right: `calc(28px + ${SA_R})`, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 },
  interactLabel: { background: 'rgba(26,26,46,0.8)', color: '#fff', padding: '8px 14px', borderRadius: 12, fontSize: 15, fontWeight: 700 },
  interactBtn: { background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 16, padding: '18px 30px', fontSize: 18, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', touchAction: 'none' },
};
