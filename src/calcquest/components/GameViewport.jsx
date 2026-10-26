import { useEffect, useRef, useState, useCallback } from 'react';
import { drawWorldTile, drawLayeredAvatar, drawNPCSprite } from '../engine/pixelArtGenerator';
import { soundEngine } from '../engine/soundEngine';
import PixelIcon from './PixelIcon';
import styles from '../CalcQuest.module.css';

const TILE_SIZE = 48;
const MOVE_SPEED = 0.11;

export default function GameViewport({
  world,
  gameState,
  isPaused = false,
  onOpenPauseMenu,
  onPressB,
  onNavigateMenuCursor,
  onConfirmMenuCursor,
  onSelectTab,
  onSelectNPC,
  onUsePortal,
  onPositionSave,
  onOpenModal,
  onToggleMute,
  activeBanner,
  inScreenContent = null,
}) {
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const playerRef = useRef({
    x: world.spawn.x,
    y: world.spawn.y,
    dir: 'down',
    frame: 0,
    moving: false,
    celebratingUntil: 0,
  });
  const tickRef = useRef(0);
  const particlesRef = useRef([]);
  const [nearbyTarget, setNearbyTarget] = useState(null);

  const [isLandscape, setIsLandscape] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : false
  );
  const [skinOverride, setSkinOverride] = useState(null);

  const stickRef = useRef(null);
  const [stickOffset, setStickOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  const effectiveMode = skinOverride || (isLandscape ? 'landscape' : 'portrait');

  const worldState = gameState.profile.world_states?.[world.id] || {};
  const bridgeRepaired = !!worldState.bridge_repaired || !!worldState.w2_continuity_bridge;
  const bossDefeated = !!worldState.boss_defeated || !!gameState.worlds?.[world.id]?.boss_defeated;

  useEffect(() => {
    if (isPaused) {
      keysRef.current = {};
      setStickOffset({ x: 0, y: 0 });
    }
  }, [isPaused]);

  useEffect(() => {
    const savedPos = gameState.profile.last_position;
    if (savedPos && savedPos.worldId === world.id) {
      playerRef.current.x = savedPos.x;
      playerRef.current.y = savedPos.y;
    } else {
      playerRef.current.x = world.spawn.x;
      playerRef.current.y = world.spawn.y;
    }
  }, [world.id, world.spawn.x, world.spawn.y, gameState.profile.last_position]);

  useEffect(() => {
    if (!activeBanner) return;
    playerRef.current.celebratingUntil = Date.now() + 2000;
    const newParticles = Array.from({ length: 24 }, () => ({
      x: playerRef.current.x * TILE_SIZE + TILE_SIZE / 2,
      y: playerRef.current.y * TILE_SIZE + TILE_SIZE / 2,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 3.5 - 1,
      color: ['#F5B82E', '#2E8B57', '#B87314'][Math.floor(Math.random() * 3)],
      life: 40 + Math.random() * 20,
    }));
    particlesRef.current.push(...newParticles);
  }, [activeBanner]);

  const isTileWalkable = useCallback(
    (gx, gy) => {
      if (gx < 0 || gy < 0 || gx >= world.mapSize.width || gy >= world.mapSize.height) return false;
      const code = world.tiles[gy]?.[gx] ?? 1;
      if (code === 1 || code === 2 || code === 4) return false;
      if (code === 5 && !bridgeRepaired) return false;
      return true;
    },
    [world, bridgeRepaired]
  );

  // Physical A Button: Confirms Pause Menu selection when paused, or interacts with NPC in world
  const triggerActionA = useCallback(() => {
    if (isPaused) {
      onConfirmMenuCursor?.();
      return;
    }
    if (nearbyTarget) {
      soundEngine.playInteract();
      if (nearbyTarget.kind === 'npc') {
        onSelectNPC(nearbyTarget.entity);
      } else if (nearbyTarget.kind === 'portal') {
        onUsePortal(nearbyTarget.entity);
      } else if (nearbyTarget.kind === 'object') {
        const linkedNpc = world.npcs.find((n) => n.questId === nearbyTarget.entity.questId);
        if (linkedNpc) onSelectNPC(linkedNpc);
      }
    } else {
      soundEngine.playInteract();
      onOpenModal?.('journal');
    }
  }, [nearbyTarget, isPaused, onConfirmMenuCursor, onSelectNPC, onUsePortal, onOpenModal, world.npcs]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      const key = e.key.toLowerCase();
      if (key === 'p') {
        e.preventDefault();
        onOpenPauseMenu?.();
        return;
      }
      if (isPaused) {
        if (key === 'w' || key === 'arrowup') {
          e.preventDefault();
          onNavigateMenuCursor?.(-2);
        } else if (key === 's' || key === 'arrowdown') {
          e.preventDefault();
          onNavigateMenuCursor?.(2);
        } else if (key === 'a' || key === 'arrowleft') {
          e.preventDefault();
          onNavigateMenuCursor?.(-1);
        } else if (key === 'd' || key === 'arrowright') {
          e.preventDefault();
          onNavigateMenuCursor?.(1);
        } else if (key === 'e' || key === 'enter' || key === ' ') {
          e.preventDefault();
          onConfirmMenuCursor?.();
        }
        return;
      }
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        keysRef.current[key] = true;
      }
      if (key === 'e' || key === 'enter' || key === ' ') {
        e.preventDefault();
        triggerActionA();
      }
    };
    const onKeyUp = (e) => {
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isPaused, triggerActionA, onOpenPauseMenu, onNavigateMenuCursor, onConfirmMenuCursor]);

  useEffect(() => {
    let animId;
    let lastSaveTime = Date.now();

    const renderLoop = () => {
      const p = playerRef.current;

      if (!isPaused) {
        tickRef.current += 1;
        const keys = keysRef.current;

        let dx = 0;
        let dy = 0;
        if (keys.w || keys.arrowup) {
          dy -= MOVE_SPEED;
          p.dir = 'up';
        }
        if (keys.s || keys.arrowdown) {
          dy += MOVE_SPEED;
          p.dir = 'down';
        }
        if (keys.a || keys.arrowleft) {
          dx -= MOVE_SPEED;
          p.dir = 'left';
        }
        if (keys.d || keys.arrowright) {
          dx += MOVE_SPEED;
          p.dir = 'right';
        }

        if (dx !== 0 && dy !== 0) {
          dx *= 0.7071;
          dy *= 0.7071;
        }

        const canStayAt = (nx, ny) => {
          const margin = 0.25;
          const corners = [
            [Math.floor(nx + margin), Math.floor(ny + margin)],
            [Math.floor(nx + 1 - margin), Math.floor(ny + margin)],
            [Math.floor(nx + margin), Math.floor(ny + 1 - margin)],
            [Math.floor(nx + 1 - margin), Math.floor(ny + 1 - margin)],
          ];
          return corners.every(([cx, cy]) => isTileWalkable(cx, cy));
        };

        let moved = false;
        if (dx !== 0 && canStayAt(p.x + dx, p.y)) {
          p.x += dx;
          moved = true;
        }
        if (dy !== 0 && canStayAt(p.x, p.y + dy)) {
          p.y += dy;
          moved = true;
        }

        p.moving = moved;
        if (moved) {
          soundEngine.playFootstep();
          if (tickRef.current % 8 === 0) {
            p.frame = p.frame === 1 ? 2 : 1;
          }
          if (Date.now() - lastSaveTime > 2500) {
            lastSaveTime = Date.now();
            onPositionSave?.({ worldId: world.id, x: Number(p.x.toFixed(2)), y: Number(p.y.toFixed(2)) });
          }
        } else {
          p.frame = 0;
        }
      }

      const tick = tickRef.current;

      let closest = null;
      let minDist = 1.85;

      for (const npc of world.npcs) {
        const dist = Math.hypot(p.x - npc.x, p.y - npc.y);
        if (dist < minDist) {
          minDist = dist;
          closest = { kind: 'npc', entity: npc, distance: dist };
        }
      }

      for (const obj of world.interactiveObjects || []) {
        const dist = Math.hypot(p.x - obj.x, p.y - obj.y);
        if (dist < minDist) {
          minDist = dist;
          closest = {
            kind: obj.type === 'portal' ? 'portal' : 'object',
            entity: obj,
            distance: dist,
          };
        }
      }

      setNearbyTarget((prev) => {
        if (prev?.entity?.id === closest?.entity?.id && prev?.kind === closest?.kind) return prev;
        return closest;
      });

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const viewW = canvas.width;
        const viewH = canvas.height;
        const mapPixelW = world.mapSize.width * TILE_SIZE;
        const mapPixelH = world.mapSize.height * TILE_SIZE;

        const camX = Math.max(0, Math.min(mapPixelW - viewW, p.x * TILE_SIZE + TILE_SIZE / 2 - viewW / 2));
        const camY = Math.max(0, Math.min(mapPixelH - viewH, p.y * TILE_SIZE + TILE_SIZE / 2 - viewH / 2));

        ctx.clearRect(0, 0, viewW, viewH);
        ctx.save();
        ctx.translate(-Math.floor(camX), -Math.floor(camY));

        const startCol = Math.max(0, Math.floor(camX / TILE_SIZE));
        const endCol = Math.min(world.mapSize.width - 1, Math.ceil((camX + viewW) / TILE_SIZE));
        const startRow = Math.max(0, Math.floor(camY / TILE_SIZE));
        const endRow = Math.min(world.mapSize.height - 1, Math.ceil((camY + viewH) / TILE_SIZE));

        for (let gy = startRow; gy <= endRow; gy++) {
          for (let gx = startCol; gx <= endCol; gx++) {
            const code = world.tiles[gy][gx];
            drawWorldTile(
              ctx,
              world.id,
              code,
              gx,
              gy,
              gx * TILE_SIZE,
              gy * TILE_SIZE,
              TILE_SIZE,
              tick,
              worldState
            );
          }
        }

        for (const obj of world.interactiveObjects || []) {
          const ox = obj.x * TILE_SIZE;
          const oy = obj.y * TILE_SIZE;
          if (obj.type === 'chest') {
            const opened = !!worldState[obj.stateKey];
            ctx.fillStyle = '#1E1610';
            ctx.fillRect(ox + 8, oy + 12, 32, 24);
            ctx.fillStyle = opened ? '#D99B26' : '#8C5A2B';
            ctx.fillRect(ox + 10, oy + 14, 28, 20);
            ctx.fillStyle = '#F5B82E';
            ctx.fillRect(ox + 21, oy + 20, 6, 6);
          } else if (obj.type === 'portal') {
            const portalActive = !obj.requiresBoss || bossDefeated;
            ctx.fillStyle = '#1E1610';
            ctx.fillRect(ox + 8, oy + 6, 32, 38);
            ctx.fillStyle = '#6E7885';
            ctx.fillRect(ox + 10, oy + 8, 28, 34);
            ctx.fillStyle = portalActive ? '#3696BF' : '#334155';
            ctx.fillRect(ox + 14, oy + 12, 20, 26);
          }
        }

        for (const npc of world.npcs) {
          const nx = npc.x * TILE_SIZE;
          const ny = npc.y * TILE_SIZE;
          const qStatus = gameState.quests[npc.questId]?.status;
          const isDone = qStatus === 'completed';

          drawNPCSprite(ctx, npc, nx, ny, TILE_SIZE, tick, isDone);

          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          const nameW = ctx.measureText(npc.name).width + 12;
          ctx.fillStyle = '#231A12';
          ctx.fillRect(nx + TILE_SIZE / 2 - nameW / 2 - 1, ny + TILE_SIZE - 3, nameW + 2, 16);
          ctx.fillStyle = '#F7F1E3';
          ctx.fillRect(nx + TILE_SIZE / 2 - nameW / 2, ny + TILE_SIZE - 2, nameW, 14);
          ctx.fillStyle = '#231A12';
          ctx.fillText(npc.name, nx + TILE_SIZE / 2, ny + TILE_SIZE + 8);

          const markerBob = Math.round(Math.sin(tick * 0.08 + npc.x) * 2);
          const mx = nx + TILE_SIZE / 2 - 9;
          const my = ny - 18 + markerBob;
          ctx.fillStyle = '#231A12';
          ctx.fillRect(mx - 1, my - 1, 20, 18);
          ctx.fillStyle = isDone ? '#266B3E' : npc.isBoss ? '#B83B2A' : '#F5B82E';
          ctx.fillRect(mx, my, 18, 16);
          ctx.fillStyle = isDone || npc.isBoss ? '#FFFFFF' : '#231A12';
          ctx.font = 'bold 11px monospace';
          ctx.fillText(isDone ? 'OK' : npc.isBoss ? 'BOSS' : '!', nx + TILE_SIZE / 2, my + 12);
        }

        const isCelebrating = Date.now() < p.celebratingUntil;
        drawLayeredAvatar(
          ctx,
          gameState.avatar,
          p.x * TILE_SIZE,
          p.y * TILE_SIZE,
          TILE_SIZE,
          p.dir,
          p.frame,
          isCelebrating
        );

        particlesRef.current = particlesRef.current.filter((pt) => pt.life > 0);
        for (const pt of particlesRef.current) {
          if (!isPaused) {
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.vy += 0.12;
            pt.life -= 1;
          }
          ctx.fillStyle = pt.color;
          ctx.fillRect(pt.x, pt.y, 4, 4);
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [world, worldState, gameState.avatar, gameState.quests, isTileWalkable, bossDefeated, isPaused, onPositionSave, effectiveMode]);

  const handleDpadPress = (key, menuStep, pressed) => {
    if (isPaused) {
      if (pressed) onNavigateMenuCursor?.(menuStep);
      return;
    }
    keysRef.current[key] = pressed;
  };

  const handleStickMove = (clientX, clientY) => {
    if (isPaused || !stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = 24;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setStickOffset({ x: dx, y: dy });
    keysRef.current.w = dy < -8;
    keysRef.current.s = dy > 8;
    keysRef.current.a = dx < -8;
    keysRef.current.d = dx > 8;
  };

  const resetStick = () => {
    setStickOffset({ x: 0, y: 0 });
    keysRef.current.w = false;
    keysRef.current.s = false;
    keysRef.current.a = false;
    keysRef.current.d = false;
  };

  const activeQuest =
    world.quests.find((q) => gameState.quests[q.id]?.status !== 'completed') || world.quests[0];

  const completedQuestsInWorld = world.quests.filter(
    (q) => gameState.quests[q.id]?.status === 'completed'
  ).length;

  const renderCrossDpad = (darkVariant = false) => (
    <div className={`${styles.crossDpad} ${darkVariant ? styles.crossDpadDark : ''}`} aria-label="Directional Pad">
      <button
        type="button"
        className={styles.dpadArmUp}
        onMouseDown={() => handleDpadPress('w', -2, true)}
        onMouseUp={() => handleDpadPress('w', -2, false)}
        onMouseLeave={() => handleDpadPress('w', -2, false)}
        onTouchStart={(e) => { e.preventDefault(); handleDpadPress('w', -2, true); }}
        onTouchEnd={() => handleDpadPress('w', -2, false)}
        aria-label="Up"
      >
        ▲
      </button>
      <button
        type="button"
        className={styles.dpadArmDown}
        onMouseDown={() => handleDpadPress('s', 2, true)}
        onMouseUp={() => handleDpadPress('s', 2, false)}
        onMouseLeave={() => handleDpadPress('s', 2, false)}
        onTouchStart={(e) => { e.preventDefault(); handleDpadPress('s', 2, true); }}
        onTouchEnd={() => handleDpadPress('s', 2, false)}
        aria-label="Down"
      >
        ▼
      </button>
      <button
        type="button"
        className={styles.dpadArmLeft}
        onMouseDown={() => handleDpadPress('a', -1, true)}
        onMouseUp={() => handleDpadPress('a', -1, false)}
        onMouseLeave={() => handleDpadPress('a', -1, false)}
        onTouchStart={(e) => { e.preventDefault(); handleDpadPress('a', -1, true); }}
        onTouchEnd={() => handleDpadPress('a', -1, false)}
        aria-label="Left"
      >
        ◀
      </button>
      <button
        type="button"
        className={styles.dpadArmRight}
        onMouseDown={() => handleDpadPress('d', 1, true)}
        onMouseUp={() => handleDpadPress('d', 1, false)}
        onMouseLeave={() => handleDpadPress('d', 1, false)}
        onTouchStart={(e) => { e.preventDefault(); handleDpadPress('d', 1, true); }}
        onTouchEnd={() => handleDpadPress('d', 1, false)}
        aria-label="Right"
      >
        ▶
      </button>
      <div className={styles.dpadCenterPatch}>
        <div className={styles.dpadCenterCircle} />
      </div>
    </div>
  );

  // ==========================================================================
  // LAYOUT A: PORTRAIT HANDHELD EMULATOR SKIN (Matches Reference Image 1)
  // ==========================================================================
  if (effectiveMode === 'portrait') {
    return (
      <div className={styles.emulatorRoot}>
        <div className={styles.portraitScreenBezel}>
          <div className={styles.portraitScreenInner}>
            <div className={styles.portraitUpperCanvasWrap}>
              <canvas
                ref={canvasRef}
                width={640}
                height={420}
                className={styles.gameCanvas}
                onClick={() => {
                  if (nearbyTarget && !isPaused) triggerActionA();
                }}
              />

              {/* Top In-Screen Status (hidden when an in-screen panel/menu is open) */}
              {!isPaused && (
                <div className={styles.inScreenStatusStrip}>
                  <div className={styles.statusBadge}>
                    <span>Lv.{gameState.profile.level}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <PixelIcon name="xp" size={13} /> {gameState.profile.total_xp}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <PixelIcon name="coin" size={13} /> {gameState.profile.calc_coins}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSkinOverride('landscape')}
                    className={styles.statusBadge}
                    style={{ cursor: 'pointer' }}
                    title="Switch to Landscape Console Skin"
                  >
                    <span>Landscape</span>
                  </button>
                </div>
              )}

              {activeBanner && !isPaused && (
                <div
                  style={{
                    position: 'absolute',
                    top: '34px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#F7F1E3',
                    border: '2px solid #266B3E',
                    borderRadius: '4px',
                    padding: '3px 10px',
                    color: '#231A12',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    zIndex: 20,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activeBanner.title}
                </div>
              )}

              {nearbyTarget && !isPaused && (
                <div className={styles.inScreenPrompt}>
                  <button
                    type="button"
                    onClick={triggerActionA}
                    className={styles.actionBtn}
                    style={{ minHeight: '30px', padding: '4px 10px', fontSize: '0.72rem' }}
                  >
                    Press A: {nearbyTarget.entity.name}
                  </button>
                </div>
              )}

              {/* IN-SCREEN RETRO PAUSE MENU / SUB-PANEL / PUZZLE OVERLAY */}
              {inScreenContent}
            </div>

            {/* Lower Sub-Screen Strip inside Bezel */}
            <div className={styles.portraitLowerDeck}>
              <div className={styles.deckQuestInfo}>
                <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#5C4938' }}>
                  {world.name.toUpperCase()} ({completedQuestsInWorld}/{world.quests.length})
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeQuest ? activeQuest.title : 'Region Complete'}
                </div>
              </div>
              <div className={styles.deckQuickTabs}>
                <button type="button" onClick={() => onSelectTab?.('avatar')} className={styles.deckTabBtn}>
                  Gear
                </button>
                <button type="button" onClick={() => onOpenModal?.('inventory')} className={styles.deckTabBtn}>
                  Items
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Matte-Grey Handheld Controller Deck */}
        <div className={styles.portraitControlsDeck}>
          <div>
            <div className={styles.emuWordmark}>SKOR+ CalcQuest</div>
            <div className={styles.shoulderRowPortrait}>
              <button type="button" onClick={() => onSelectTab?.('map')} className={styles.emuPillBtn} title="World Map">
                L
              </button>
              <button type="button" onClick={() => onSelectTab?.('avatar')} className={styles.emuPillBtn} title="Outfitters">
                ZL
              </button>
              <button
                type="button"
                onClick={onOpenPauseMenu}
                className={styles.emuCircleSmallBtn}
                aria-label="Open Pause Menu"
                title="Pause Menu"
              >
                ≡
              </button>
              <button
                type="button"
                onClick={() => onSelectTab?.('insights')}
                className={styles.emuCircleSmallBtn}
                aria-label="Open Skill Ledger"
                title="Skill Ledger"
              >
                S
              </button>
              <button
                type="button"
                onClick={() => onSelectTab?.('party')}
                className={styles.emuCircleSmallBtn}
                aria-label="Open Study Party"
                title="Study Party"
              >
                P
              </button>
              <button type="button" onClick={() => onSelectTab?.('daily')} className={styles.emuPillBtn} title="Daily Tasks">
                ZR
              </button>
              <button type="button" onClick={onToggleMute} className={styles.emuPillBtn} title="Toggle Audio">
                R
              </button>
            </div>
          </div>

          <div className={styles.portraitMainControls}>
            <div className={styles.portraitLeftColumn}>
              <div
                ref={stickRef}
                className={styles.analogOuter}
                onTouchStart={(e) => {
                  const t = e.touches[0];
                  handleStickMove(t.clientX, t.clientY);
                }}
                onTouchMove={(e) => {
                  const t = e.touches[0];
                  handleStickMove(t.clientX, t.clientY);
                }}
                onTouchEnd={resetStick}
                onMouseMove={(e) => {
                  if (e.buttons === 1) handleStickMove(e.clientX, e.clientY);
                }}
                onMouseUp={resetStick}
                onMouseLeave={resetStick}
                aria-label="Analog Thumbstick"
              >
                <div
                  className={styles.analogCap}
                  style={{ transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)` }}
                />
              </div>

              {renderCrossDpad(false)}
            </div>

            <div className={styles.portraitRightColumn}>
              <div className={styles.abxyDiamond}>
                <button
                  type="button"
                  onClick={() => onOpenModal?.('journal')}
                  className={`${styles.abxyBtnPortrait} ${styles.btnXPos}`}
                  title="Quest Journal (X)"
                >
                  X
                </button>
                <button
                  type="button"
                  onClick={() => onOpenModal?.('inventory')}
                  className={`${styles.abxyBtnPortrait} ${styles.btnYPos}`}
                  title="Satchel Inventory (Y)"
                >
                  Y
                </button>
                <button
                  type="button"
                  onClick={triggerActionA}
                  className={`${styles.abxyBtnPortrait} ${styles.btnAPos}`}
                  title="Interact / Confirm (A)"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={onPressB}
                  className={`${styles.abxyBtnPortrait} ${styles.btnBPos}`}
                  title="Back / Pause (B)"
                >
                  B
                </button>
              </div>

              <div className={styles.startSelectRow}>
                <div className={styles.startSelectItem}>
                  <button
                    type="button"
                    onClick={() => onSelectTab?.('map')}
                    className={styles.startSelectPill}
                    aria-label="Select: World Map"
                  />
                  <span className={styles.startSelectLabel}>SELECT</span>
                </div>
                <div className={styles.startSelectItem}>
                  <button
                    type="button"
                    onClick={onOpenPauseMenu}
                    className={styles.startSelectPill}
                    aria-label="Start: Pause Menu"
                  />
                  <span className={styles.startSelectLabel}>START</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // LAYOUT B: LANDSCAPE CONSOLE SKIN (Matches Reference Image 2: Slate-Navy Wings)
  // ==========================================================================
  return (
    <div className={styles.landscapeConsoleRoot}>
      <div className={styles.consoleWingLeft}>
        <button
          type="button"
          onClick={() => onSelectTab?.('map')}
          className={styles.wingShoulderL}
          title="World Map (L)"
        >
          L
        </button>

        <div className={styles.embossedBadge}>SKOR+</div>

        {renderCrossDpad(true)}

        <div className={styles.angledPillsRow}>
          <button
            type="button"
            onClick={() => onOpenModal?.('journal')}
            className={styles.angledPillBtn}
            title="Select: Quest Journal"
            aria-label="Select: Quest Journal"
          />
          <button
            type="button"
            onClick={onOpenPauseMenu}
            className={styles.angledPillBtn}
            title="Start: Pause Menu"
            aria-label="Start: Pause Menu"
          />
        </div>
      </div>

      <div className={styles.landscapeCenterScreen}>
        <div className={styles.landscapeCanvasBezel}>
          <canvas
            ref={canvasRef}
            width={960}
            height={576}
            className={styles.gameCanvas}
            onClick={() => {
              if (nearbyTarget && !isPaused) triggerActionA();
            }}
          />

          {!isPaused && (
            <div className={styles.inScreenStatusStrip}>
              <div className={styles.statusBadge}>
                <span>{world.name}</span>
                <span>Lv.{gameState.profile.level}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <PixelIcon name="xp" size={13} /> {gameState.profile.total_xp}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <PixelIcon name="coin" size={13} /> {gameState.profile.calc_coins}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSkinOverride('portrait')}
                  className={styles.statusBadge}
                  style={{ cursor: 'pointer' }}
                  title="Switch to Portrait Emulator Skin"
                >
                  <span>Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenPauseMenu}
                  className={styles.statusBadge}
                  style={{ cursor: 'pointer', background: '#266B3E', color: '#FFFFFF', borderColor: '#194A2A' }}
                >
                  <PixelIcon name="pause" size={13} />
                  <span>Pause</span>
                </button>
              </div>
            </div>
          )}

          {activeBanner && !isPaused && (
            <div
              style={{
                position: 'absolute',
                top: '34px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#F7F1E3',
                border: '2px solid #266B3E',
                borderRadius: '4px',
                padding: '3px 10px',
                color: '#231A12',
                fontSize: '0.72rem',
                fontWeight: 800,
                zIndex: 20,
                whiteSpace: 'nowrap',
              }}
            >
              {activeBanner.title}
            </div>
          )}

          {nearbyTarget && !isPaused && (
            <div className={styles.inScreenPrompt}>
              <button
                type="button"
                onClick={triggerActionA}
                className={styles.actionBtn}
                style={{ minHeight: '32px', padding: '4px 12px', fontSize: '0.76rem' }}
              >
                Press A: {nearbyTarget.entity.name}
              </button>
            </div>
          )}

          {/* IN-SCREEN RETRO PAUSE MENU / SUB-PANEL / PUZZLE OVERLAY */}
          {inScreenContent}
        </div>
      </div>

      <div className={styles.consoleWingRight}>
        <button
          type="button"
          onClick={onToggleMute}
          className={styles.wingShoulderR}
          title="Toggle Audio (R)"
        >
          R
        </button>

        <div style={{ height: '14px' }} />

        <div className={styles.abxyDiamond}>
          <button
            type="button"
            onClick={() => onOpenModal?.('journal')}
            className={`${styles.abxyBtnLandscape} ${styles.btnXSolid}`}
            title="Quest Journal (X)"
          >
            x
          </button>
          <button
            type="button"
            onClick={() => onOpenModal?.('inventory')}
            className={`${styles.abxyBtnLandscape} ${styles.btnYSolid}`}
            title="Satchel Inventory (Y)"
          >
            y
          </button>
          <button
            type="button"
            onClick={triggerActionA}
            className={`${styles.abxyBtnLandscape} ${styles.btnASolid}`}
            title="Interact / Confirm (A)"
          >
            a
          </button>
          <button
            type="button"
            onClick={onPressB}
            className={`${styles.abxyBtnLandscape} ${styles.btnBSolid}`}
            title="Back / Pause (B)"
          >
            b
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenPauseMenu}
          className={styles.cornerDeltaBtn}
          title="Open Pause Menu"
          aria-label="Open Pause Menu"
        >
          Δ
        </button>
      </div>
    </div>
  );
}
