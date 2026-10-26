import { useState, useEffect, useRef } from 'react';
import {
  WORLD_LIST,
  AVATAR_OPTIONS,
  ACHIEVEMENTS_CATALOG,
  DAILY_QUESTS_POOL,
  MULTIPLAYER_MISSIONS,
} from '../data/worldsData';
import { DIAGNOSTIC_QUESTION_IDS, QUESTION_BY_ID } from '../data/questionsData';
import {
  CALCULUS_SKILLS,
  MISCONCEPTION_CATALOG,
  validateQuestionAnswer,
} from '../math/mathEngine';
import { RichMathText } from '../math/MathRenderer';
import { drawLayeredAvatar } from '../engine/pixelArtGenerator';
import { connectStudyPartyChannel } from '../../services/calcQuestService';
import { soundEngine } from '../engine/soundEngine';
import PixelIcon from './PixelIcon';
import styles from '../CalcQuest.module.css';

// ============================================================================
// 1. WORLD MAP (Clean, visual region cards — zero walls of text)
// ============================================================================
export function OverworldMapPanel({ gameState, onSelectWorld, onStartDiagnostic }) {
  const coreIcons = ['core_green', 'core_blue', 'core_amber', 'core_violet', 'crown'];

  return (
    <div className={styles.journalSheet}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#5C4938' }}>
          Select a Region to Explore
        </span>
        <button type="button" onClick={onStartDiagnostic} className={styles.secondaryBtn}>
          <PixelIcon name="compass" size={14} />
          <span>{gameState.profile.diagnostic_completed ? 'Retake Quiz' : 'Placement Quiz'}</span>
        </button>
      </div>

      <div>
        {WORLD_LIST.map((w, idx) => {
          const wProg = gameState.worlds?.[w.id] || {};
          const unlocked = !!wProg.unlocked || idx === 0;
          const coreRestored = !!wProg.knowledge_core_restored;
          const isCurrent = gameState.profile.current_world === w.id;
          const doneCount = w.quests.filter((q) => gameState.quests?.[q.id]?.status === 'completed').length;
          const pct = Math.round((doneCount / Math.max(1, w.quests.length)) * 100);

          return (
            <div
              key={w.id}
              className={`${styles.routeStopRow} ${!unlocked ? styles.routeStopLocked : ''}`}
            >
              <div className={styles.routeNumberBox}>
                <PixelIcon name={unlocked ? coreIcons[idx] : 'lock'} size={18} />
                <span>#{w.order}</span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#231A12' }}>
                    {w.name}
                  </span>
                  {isCurrent && (
                    <span
                      style={{
                        background: '#266B3E',
                        color: '#FFFFFF',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                      }}
                    >
                      HERE
                    </span>
                  )}
                  {coreRestored && (
                    <span
                      style={{
                        background: '#E3F2E7',
                        border: '1px solid #266B3E',
                        color: '#194A2A',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                      }}
                    >
                      CLEARED
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '0.68rem',
                    color: '#5C4938',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '1px',
                  }}
                >
                  {w.subtitle} • {doneCount}/{w.quests.length} Quests
                </div>

                <div
                  style={{
                    width: '100%',
                    maxWidth: '160px',
                    height: '5px',
                    background: '#D8C8AE',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    marginTop: '4px',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: '#266B3E',
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!unlocked}
                onClick={() => onSelectWorld(w.id)}
                className={unlocked ? styles.actionBtn : styles.secondaryBtn}
              >
                {unlocked ? (isCurrent ? 'Play' : 'Go') : 'Locked'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 2. AVATAR STUDIO (Pinned character preview + clean category tabs)
// ============================================================================
const DIRS = ['down', 'left', 'right', 'up'];

export function AvatarStudioPanel({ gameState, onSaveAvatar }) {
  const [draft, setDraft] = useState(gameState.avatar);
  const [dirIdx, setDirIdx] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [category, setCategory] = useState('skin'); // 'skin' | 'hair' | 'outfit' | 'gear'
  const canvasRef = useRef(null);
  const unlocked = new Set(gameState.avatar.unlocked_cosmetics || ['default', 'none']);
  const dir = DIRS[dirIdx];

  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => {
      frame = (frame + 1) % 3;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawLayeredAvatar(ctx, draft, 8, 6, 56, dir, frame, celebrate);
    }, 220);
    return () => clearInterval(id);
  }, [draft, dir, celebrate]);

  const isCosmeticUnlocked = (item) =>
    !item.unlockId || item.unlockId === 'default' || unlocked.has(item.id) || unlocked.has(item.unlockId);

  return (
    <div className={styles.journalSheet}>
      {/* Sticky Character Bar: Always stays visible at the top! */}
      <div className={styles.avatarStickyBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <canvas
            ref={canvasRef}
            width={72}
            height={72}
            style={{
              width: '60px',
              height: '60px',
              imageRendering: 'pixelated',
              background: '#EDE3CE',
              border: '1.5px solid #6E4726',
              borderRadius: '6px',
              flexShrink: 0,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setDirIdx((i) => (i + 1) % DIRS.length)}
                className={styles.secondaryBtn}
                style={{ minHeight: '26px', padding: '2px 7px', fontSize: '0.66rem' }}
              >
                ↻ Turn
              </button>
              <button
                type="button"
                onClick={() => setCelebrate((c) => !c)}
                className={celebrate ? styles.actionBtn : styles.secondaryBtn}
                style={{ minHeight: '26px', padding: '2px 7px', fontSize: '0.66rem' }}
              >
                Pose
              </button>
            </div>
            <span style={{ fontSize: '0.64rem', color: '#5C4938', fontWeight: 700 }}>
              Facing: {dir.toUpperCase()}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playCorrectAnswer();
            onSaveAvatar(draft);
          }}
          className={styles.actionBtn}
        >
          Save Look
        </button>
      </div>

      {/* Category Tabs — Zero endless scrolling */}
      <div className={styles.avatarTabRow}>
        {[
          { id: 'skin', label: 'Skin' },
          { id: 'hair', label: 'Hair' },
          { id: 'outfit', label: 'Outfit' },
          { id: 'gear', label: 'Gear' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategory(tab.id)}
            className={`${styles.avatarTabBtn} ${category === tab.id ? styles.avatarTabBtnActive : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        style={{
          background: '#FFFDF8',
          border: '1.5px solid #6E4726',
          borderRadius: '6px',
          padding: '8px',
        }}
      >
        {category === 'skin' && (
          <div>
            <div style={fieldLabelStyle}>Skin Tone</div>
            <div style={chipGroupStyle}>
              {AVATAR_OPTIONS.baseCharacters.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDraft({ ...draft, base_character: c.id })}
                  className={draft.base_character === c.id ? styles.actionBtn : styles.secondaryBtn}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '3px',
                      background: c.skin,
                      border: '1px solid #231A12',
                    }}
                  />
                  <span>{c.name.replace('Tone ', '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {category === 'hair' && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <div>
              <div style={fieldLabelStyle}>Style</div>
              <div style={chipGroupStyle}>
                {AVATAR_OPTIONS.hairstyles.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setDraft({ ...draft, selected_hair: h.id })}
                    className={draft.selected_hair === h.id ? styles.actionBtn : styles.secondaryBtn}
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={fieldLabelStyle}>Color</div>
              <div style={chipGroupStyle}>
                {AVATAR_OPTIONS.hairColors.map((hc) => (
                  <button
                    key={hc.id}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        selected_colors: { ...draft.selected_colors, hair: hc.id },
                      })
                    }
                    className={draft.selected_colors?.hair === hc.id ? styles.actionBtn : styles.secondaryBtn}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        borderRadius: '3px',
                        background: hc.id,
                        border: '1px solid #231A12',
                      }}
                    />
                    <span>{hc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {category === 'outfit' && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <div>
              <div style={fieldLabelStyle}>Attire</div>
              <div style={chipGroupStyle}>
                {AVATAR_OPTIONS.outfits.map((o) => {
                  const ok = isCosmeticUnlocked(o);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      disabled={!ok}
                      onClick={() => setDraft({ ...draft, selected_outfit: o.id })}
                      className={draft.selected_outfit === o.id ? styles.actionBtn : styles.secondaryBtn}
                    >
                      {!ok && <PixelIcon name="lock" size={12} />}
                      <span>{o.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={fieldLabelStyle}>Dye</div>
              <div style={chipGroupStyle}>
                {AVATAR_OPTIONS.outfitColors.map((oc) => (
                  <button
                    key={oc.id}
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        selected_colors: { ...draft.selected_colors, outfit: oc.id },
                      })
                    }
                    className={draft.selected_colors?.outfit === oc.id ? styles.actionBtn : styles.secondaryBtn}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        borderRadius: '3px',
                        background: oc.id,
                        border: '1px solid #231A12',
                      }}
                    />
                    <span>{oc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {category === 'gear' && (
          <div style={{ display: 'grid', gap: '8px' }}>
            <div>
              <div style={fieldLabelStyle}>Headgear</div>
              <div style={chipGroupStyle}>
                {AVATAR_OPTIONS.headAccessories.map((ha) => {
                  const ok = isCosmeticUnlocked(ha);
                  return (
                    <button
                      key={ha.id}
                      type="button"
                      disabled={!ok}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          selected_accessories: { ...draft.selected_accessories, head: ha.id },
                        })
                      }
                      className={draft.selected_accessories?.head === ha.id ? styles.actionBtn : styles.secondaryBtn}
                    >
                      {!ok && <PixelIcon name="lock" size={12} />}
                      <span>{ha.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={fieldLabelStyle}>Back Gear</div>
              <div style={chipGroupStyle}>
                {AVATAR_OPTIONS.backAccessories.map((ba) => {
                  const ok = isCosmeticUnlocked(ba);
                  return (
                    <button
                      key={ba.id}
                      type="button"
                      disabled={!ok}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          selected_accessories: { ...draft.selected_accessories, back: ba.id },
                        })
                      }
                      className={draft.selected_accessories?.back === ba.id ? styles.actionBtn : styles.secondaryBtn}
                    >
                      {!ok && <PixelIcon name="lock" size={12} />}
                      <span>{ba.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. SKILL LEDGER (Compact progress bars + quick placement & drill)
// ============================================================================
export function SkillInsightsPanel({ gameState, onCompleteRemedialMission, onCompleteDiagnostic }) {
  const [activeRemedial, setActiveRemedial] = useState(null);
  const [remedialStep, setRemedialStep] = useState(0);
  const [remedialInput, setRemedialInput] = useState('');
  const [remedialFeedback, setRemedialFeedback] = useState(null);

  const [diagActive, setDiagActive] = useState(false);
  const [diagIdx, setDiagIdx] = useState(0);
  const [diagScore, setDiagScore] = useState(0);
  const [diagInput, setDiagInput] = useState('');
  const [diagError, setDiagError] = useState('');

  const detectedGaps = [];
  Object.values(gameState.skills || {}).forEach((sk) => {
    Object.entries(sk.misconception_counts || {}).forEach(([mId, count]) => {
      if (MISCONCEPTION_CATALOG[mId]) {
        detectedGaps.push({
          ...MISCONCEPTION_CATALOG[mId],
          count,
          confirmedGap: count >= 2,
        });
      }
    });
  });

  const handleDiagSubmit = (e) => {
    e.preventDefault();
    if (!diagInput.trim()) {
      setDiagError('Enter an answer first.');
      return;
    }
    setDiagError('');
    const qId = DIAGNOSTIC_QUESTION_IDS[diagIdx];
    const q = QUESTION_BY_ID[qId];
    const res = validateQuestionAnswer(q, diagInput);
    const nextScore = diagScore + (res.correct ? 1 : 0);
    setDiagInput('');
    if (diagIdx + 1 < DIAGNOSTIC_QUESTION_IDS.length) {
      setDiagScore(nextScore);
      setDiagIdx((i) => i + 1);
    } else {
      setDiagActive(false);
      const recommendedWorld =
        nextScore >= 5 ? 'world_4' : nextScore >= 4 ? 'world_3' : nextScore >= 2 ? 'world_2' : 'world_1';
      onCompleteDiagnostic?.({ score: nextScore, total: DIAGNOSTIC_QUESTION_IDS.length, recommendedWorld });
    }
  };

  return (
    <div className={styles.journalSheet}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#5C4938' }}>
          Skill Mastery ({CALCULUS_SKILLS.length} Topics)
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => {
              setActiveRemedial(MISCONCEPTION_CATALOG.missing_inner_derivative);
              setRemedialStep(0);
              setRemedialInput('');
              setRemedialFeedback(null);
            }}
            className={styles.secondaryBtn}
          >
            <span>Chain Drill</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDiagIdx(0);
              setDiagScore(0);
              setDiagError('');
              setDiagActive((v) => !v);
            }}
            className={styles.actionBtn}
          >
            <PixelIcon name="compass" size={13} />
            <span>{diagActive ? 'Close Quiz' : 'Placement'}</span>
          </button>
        </div>
      </div>

      {diagActive && (
        <div
          style={{
            background: '#FFFDF8',
            border: '2px solid #6E4726',
            borderRadius: '6px',
            padding: '8px',
            marginBottom: '8px',
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#5C4938', fontWeight: 800 }}>
            QUESTION {diagIdx + 1} / {DIAGNOSTIC_QUESTION_IDS.length}
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#231A12' }}>
            <RichMathText text={QUESTION_BY_ID[DIAGNOSTIC_QUESTION_IDS[diagIdx]]?.prompt} />
          </div>
          <form onSubmit={handleDiagSubmit} style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            <input
              type="text"
              value={diagInput}
              onChange={(e) => setDiagInput(e.target.value)}
              placeholder="Answer..."
              className={styles.mathInput}
              style={{ flex: 1 }}
              aria-label="Diagnostic answer"
            />
            <button type="submit" className={styles.actionBtn}>
              Next
            </button>
          </form>
          {diagError && (
            <div style={{ marginTop: '4px', color: '#8C2518', fontSize: '0.72rem', fontWeight: 700 }}>
              {diagError}
            </div>
          )}
        </div>
      )}

      {activeRemedial && (
        <div
          style={{
            marginBottom: '8px',
            background: '#EDE3CE',
            border: '2px solid #6E4726',
            borderRadius: '6px',
            padding: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', color: '#5C4938', fontWeight: 800 }}>
              DRILL STEP {remedialStep + 1}/6
            </span>
            <button
              type="button"
              onClick={() => setActiveRemedial(null)}
              className={styles.secondaryBtn}
              style={{ minHeight: '22px', padding: '1px 6px', fontSize: '0.64rem' }}
            >
              ✕
            </button>
          </div>
          {remedialStep === 0 && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ color: '#231A12', fontSize: '0.76rem', margin: '0 0 6px' }}>
                {activeRemedial.description}
              </p>
              <button type="button" onClick={() => setRemedialStep(1)} className={styles.actionBtn}>
                Start Drill
              </button>
            </div>
          )}
          {remedialStep === 1 && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ color: '#231A12', fontSize: '0.76rem', margin: '0 0 6px' }}>
                For $y = (5x^{2} + 2)^{3}$, what is the inner derivative $\\frac{du}{dx}$ of $u = 5x^{2} + 2$?
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  value={remedialInput}
                  onChange={(e) => setRemedialInput(e.target.value)}
                  placeholder="e.g. 10x"
                  className={styles.mathInput}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (remedialInput.replace(/\s+/g, '').toLowerCase() === '10x') {
                      setRemedialInput('');
                      setRemedialFeedback(null);
                      setRemedialStep(2);
                    } else {
                      setRemedialFeedback('Hint: 5(2x) = 10x');
                    }
                  }}
                  className={styles.actionBtn}
                >
                  Check
                </button>
              </div>
            </div>
          )}
          {remedialStep === 2 && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ color: '#231A12', fontSize: '0.76rem', margin: '0 0 6px' }}>
                Multiply outer $3(5x^{2} + 2)^{2}$ by inner $10x$. What is the front coefficient?
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  value={remedialInput}
                  onChange={(e) => setRemedialInput(e.target.value)}
                  placeholder="3 * 10"
                  className={styles.mathInput}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (Number(remedialInput) === 30) {
                      setRemedialInput('');
                      setRemedialFeedback(null);
                      setRemedialStep(3);
                    } else {
                      setRemedialFeedback('Multiply 3 by 10 = 30.');
                    }
                  }}
                  className={styles.actionBtn}
                >
                  Check
                </button>
              </div>
            </div>
          )}
          {remedialStep === 3 && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ color: '#231A12', fontSize: '0.76rem', margin: '0 0 6px' }}>
                In $\\frac{d}{dx}[(2x + 1)^{4}] = 4(2x + 1)^{3}$, what missing factor was forgotten?
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  value={remedialInput}
                  onChange={(e) => setRemedialInput(e.target.value)}
                  placeholder="Missing number"
                  className={styles.mathInput}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (Number(remedialInput) === 2) {
                      setRemedialInput('');
                      setRemedialFeedback(null);
                      setRemedialStep(4);
                    } else {
                      setRemedialFeedback('Inner derivative of (2x + 1) is 2.');
                    }
                  }}
                  className={styles.actionBtn}
                >
                  Check
                </button>
              </div>
            </div>
          )}
          {remedialStep === 4 && (
            <div style={{ marginTop: '4px' }}>
              <p style={{ color: '#231A12', fontSize: '0.76rem', margin: '0 0 6px' }}>
                Evaluate $\\frac{dy}{dx}$ at $x = 1$ for $y = (x^{2} + 1)^{3}$.
              </p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  value={remedialInput}
                  onChange={(e) => setRemedialInput(e.target.value)}
                  placeholder="Value"
                  className={styles.mathInput}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (Number(remedialInput) === 24) {
                      setRemedialInput('');
                      setRemedialFeedback(null);
                      setRemedialStep(5);
                    } else {
                      setRemedialFeedback('6x(x^2 + 1)^2 at x=1 is 6(1)(4) = 24.');
                    }
                  }}
                  className={styles.actionBtn}
                >
                  Check
                </button>
              </div>
            </div>
          )}
          {remedialStep === 5 && (
            <div style={{ marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playWorldRestored();
                  onCompleteRemedialMission?.(activeRemedial.skillId);
                  setActiveRemedial(null);
                }}
                className={styles.actionBtn}
              >
                Claim +60 XP &amp; +50 Coins
              </button>
            </div>
          )}
          {remedialFeedback && (
            <div style={{ marginTop: '4px', color: '#8C2518', fontSize: '0.72rem', fontWeight: 700 }}>
              {remedialFeedback}
            </div>
          )}
        </div>
      )}

      {detectedGaps.length > 0 && (
        <div style={{ display: 'grid', gap: '6px', marginBottom: '8px' }}>
          {detectedGaps.map((m) => (
            <div
              key={m.id}
              style={{
                background: '#FFFDF8',
                border: '1.5px solid #B83B2A',
                borderRadius: '6px',
                padding: '6px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '0.74rem', color: '#8C2518' }}>
                ⚡ {m.missionTitle}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveRemedial(m);
                  setRemedialStep(0);
                  setRemedialInput('');
                  setRemedialFeedback(null);
                }}
                className={styles.actionBtn}
              >
                Fix (+60 XP)
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Compact 2-Column Skill Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
          gap: '6px',
        }}
      >
        {CALCULUS_SKILLS.map((sk) => {
          const data = gameState.skills?.[sk.id] || {
            evidence_count: 0,
            observed_accuracy: 0,
            mastery_estimate: 0,
          };
          const masteryPct = Math.round((data.mastery_estimate || 0) * 100);
          const accuracyPct = Math.round((data.observed_accuracy || 0) * 100);

          return (
            <div
              key={sk.id}
              style={{
                background: '#FFFDF8',
                border: '1.5px solid #6E4726',
                borderRadius: '6px',
                padding: '6px 8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sk.name}
                </span>
                <span style={{ color: '#194A2A', flexShrink: 0 }}>
                  {data.evidence_count > 0 ? `${accuracyPct}%` : '—'}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '5px',
                  background: '#D8C8AE',
                  borderRadius: '999px',
                  overflow: 'hidden',
                  marginTop: '4px',
                }}
              >
                <div
                  style={{
                    width: `${masteryPct}%`,
                    height: '100%',
                    background: '#266B3E',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.62rem', color: '#5C4938', marginTop: '2px', fontWeight: 700 }}>
                {data.evidence_count} tries • {masteryPct}% mastery
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 4. MULTIPLAYER STUDY PARTY (Compact Room + Role Cards)
// ============================================================================
export function StudyPartyPanel({ user, gameState, onCompletePartyMission }) {
  const [roomCode, setRoomCode] = useState('CALC101');
  const [connected, setConnected] = useState(false);
  const [soloMode, setSoloMode] = useState(false);
  const [missionIdx, setMissionIdx] = useState(0);
  const [myRole, setMyRole] = useState('solver');
  const [players, setPlayers] = useState([]);
  const [roleProgress, setRoleProgress] = useState({ solver: false, analyst: false, verifier: false });
  const [roleInputs, setRoleInputs] = useState({ solver: '', analyst: null, verifier: '' });
  const [roleFeedback, setRoleFeedback] = useState({});
  const channelRef = useRef(null);

  const mission = MULTIPLAYER_MISSIONS[missionIdx] || MULTIPLAYER_MISSIONS[0];

  const joinRoom = (codeToJoin) => {
    channelRef.current?.disconnect();
    const cleanCode = (codeToJoin || 'CALC101').trim().toUpperCase();
    setRoomCode(cleanCode);
    setConnected(true);
    setRoleProgress({ solver: false, analyst: false, verifier: false });

    const conn = connectStudyPartyChannel({
      roomCode: cleanCode,
      user,
      displayName: gameState.profile.display_name,
      avatar: gameState.avatar,
      onStateSync: (event) => {
        if (event.type === 'PRESENCE_SYNC') {
          setPlayers(event.players);
        } else if (event.type === 'ROLE_SOLVED') {
          setRoleProgress((prev) => ({ ...prev, [event.role]: true }));
        } else if (event.type === 'PLAYER_PATCH') {
          setPlayers((prev) => {
            const filtered = prev.filter((p) => p.userId !== event.player.userId);
            return [...filtered, event.player];
          });
        }
      },
      onChatEvent: () => {},
    });
    channelRef.current = conn;
  };

  useEffect(() => {
    return () => channelRef.current?.disconnect();
  }, []);

  const checkRoleTask = (roleKey) => {
    const rData = mission.roles[roleKey];
    let ok = false;
    if (rData.type === 'numerical') {
      ok = Math.abs(Number(roleInputs[roleKey]) - Number(rData.answer)) <= (rData.tolerance || 0.01);
    } else if (rData.type === 'multiple_choice') {
      ok = roleInputs[roleKey] === rData.correctIndex;
    }

    if (ok) {
      soundEngine.playCorrectAnswer();
      setRoleProgress((prev) => ({ ...prev, [roleKey]: true }));
      setRoleFeedback((prev) => ({ ...prev, [roleKey]: 'Solved!' }));
      channelRef.current?.broadcastState({ type: 'ROLE_SOLVED', role: roleKey });
    } else {
      soundEngine.playWrongAnswer();
      setRoleFeedback((prev) => ({ ...prev, [roleKey]: 'Try again.' }));
    }
  };

  const allRolesComplete = roleProgress.solver && roleProgress.analyst && roleProgress.verifier;

  return (
    <div className={styles.journalSheet}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFDF8',
          border: '1.5px solid #6E4726',
          borderRadius: '6px',
          padding: '6px 8px',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1 }}>
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={10}
            className={styles.mathInput}
            style={{ width: '92px', minHeight: '28px', padding: '2px 6px', fontSize: '0.74rem' }}
            aria-label="Room Code"
          />
          <button type="button" onClick={() => joinRoom(roomCode)} className={styles.actionBtn}>
            {connected ? 'Reconnect' : 'Join Room'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSoloMode((s) => !s)}
          className={soloMode ? styles.actionBtn : styles.secondaryBtn}
        >
          {soloMode ? 'Solo: ON' : 'Solo Co-Op'}
        </button>
      </div>

      {/* Mission Switcher */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {MULTIPLAYER_MISSIONS.map((m, idx) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMissionIdx(idx);
              setRoleProgress({ solver: false, analyst: false, verifier: false });
              setRoleFeedback({});
            }}
            className={missionIdx === idx ? styles.actionBtn : styles.secondaryBtn}
          >
            #{idx + 1}: {m.title}
          </button>
        ))}
        {players.length > 0 && (
          <span style={{ fontSize: '0.68rem', color: '#5C4938', fontWeight: 700, alignSelf: 'center' }}>
            • {players.length} Online
          </span>
        )}
      </div>

      {/* 3 Role Cards */}
      <div style={{ display: 'grid', gap: '6px' }}>
        {['solver', 'analyst', 'verifier'].map((rk) => {
          const r = mission.roles[rk];
          const solved = roleProgress[rk];
          const canEdit = soloMode || myRole === rk;

          return (
            <div
              key={rk}
              onClick={() => setMyRole(rk)}
              style={{
                background: solved ? '#E3F2E7' : '#FFFDF8',
                border: `1.5px solid ${solved ? '#266B3E' : myRole === rk ? '#231A12' : '#8C6D4E'}`,
                borderRadius: '6px',
                padding: '7px 8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#231A12' }}>
                  {r.label}
                </span>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, color: solved ? '#194A2A' : '#5C4938' }}>
                  {solved ? '✓ SOLVED' : myRole === rk ? 'ACTIVE' : 'TAP TO SELECT'}
                </span>
              </div>

              <div style={{ margin: '4px 0 6px', fontSize: '0.76rem', color: '#231A12' }}>
                <RichMathText text={r.prompt} />
              </div>

              {r.type === 'numerical' && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    disabled={!canEdit || solved}
                    value={roleInputs[rk]}
                    onChange={(e) => setRoleInputs({ ...roleInputs, [rk]: e.target.value })}
                    placeholder="Value..."
                    className={styles.mathInput}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    disabled={!canEdit || solved}
                    onClick={() => checkRoleTask(rk)}
                    className={styles.actionBtn}
                  >
                    Verify
                  </button>
                </div>
              )}

              {r.type === 'multiple_choice' && (
                <div style={{ display: 'grid', gap: '4px' }}>
                  {r.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!canEdit || solved}
                      onClick={() => setRoleInputs({ ...roleInputs, [rk]: idx })}
                      className={`${styles.optionBtn} ${roleInputs[rk] === idx ? styles.optionBtnSelected : ''}`}
                    >
                      <RichMathText text={opt} />
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={!canEdit || solved || roleInputs[rk] === null}
                    onClick={() => checkRoleTask(rk)}
                    className={styles.actionBtn}
                  >
                    Verify
                  </button>
                </div>
              )}

              {roleFeedback[rk] && (
                <div style={{ marginTop: '4px', fontSize: '0.68rem', fontWeight: 700, color: '#5C4938' }}>
                  {roleFeedback[rk]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allRolesComplete && (
        <div
          style={{
            marginTop: '8px',
            background: '#E3F2E7',
            border: '2px solid #266B3E',
            borderRadius: '6px',
            padding: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: '0.78rem', color: '#194A2A' }}>
            Mission Complete!
          </span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playWorldRestored();
              onCompletePartyMission?.(mission);
              setRoleProgress({ solver: false, analyst: false, verifier: false });
            }}
            className={styles.actionBtn}
          >
            Claim +{mission.xpReward} XP
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. DAILY TASKS & ACHIEVEMENT BADGES (Compact rows + badge grid)
// ============================================================================
export function DailyQuestsAndAchievementsPanel({ gameState, onClaimDaily }) {
  const unlockedSet = new Set(gameState.achievements || []);

  return (
    <div className={styles.journalSheet} style={{ marginTop: '8px' }}>
      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#5C4938', marginBottom: '6px' }}>
        Daily Bounties
      </div>

      <div style={{ display: 'grid', gap: '6px', marginBottom: '10px' }}>
        {DAILY_QUESTS_POOL.map((dq) => {
          const st = (gameState.dailyQuests || []).find((x) => x.quest_id === dq.id) || {
            progress: 0,
            target: dq.target,
            completed: false,
            claimed: false,
          };
          return (
            <div
              key={dq.id}
              style={{
                background: '#FFFDF8',
                border: '1.5px solid #6E4726',
                borderRadius: '6px',
                padding: '6px 8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.76rem', color: '#231A12' }}>
                  {dq.title}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#5C4938', fontWeight: 700 }}>
                  {st.progress}/{dq.target} • +{dq.xpReward} XP, +{dq.coinReward} Coins
                </div>
              </div>
              <button
                type="button"
                disabled={!st.completed || st.claimed}
                onClick={() => onClaimDaily(dq)}
                className={st.completed && !st.claimed ? styles.actionBtn : styles.secondaryBtn}
              >
                {st.claimed ? 'Claimed' : st.completed ? 'Claim' : `${st.progress}/${dq.target}`}
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#5C4938', marginBottom: '6px' }}>
        Badges ({unlockedSet.size}/{ACHIEVEMENTS_CATALOG.length})
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '6px',
        }}
      >
        {ACHIEVEMENTS_CATALOG.map((ach) => {
          const has = unlockedSet.has(ach.id);
          return (
            <div
              key={ach.id}
              style={{
                background: has ? '#FFFDF8' : '#EDE3CE',
                border: `1.5px solid ${has ? '#266B3E' : '#9C8870'}`,
                borderRadius: '6px',
                padding: '6px 8px',
                opacity: has ? 1 : 0.72,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <PixelIcon name={has ? 'crown' : 'lock'} size={14} />
                <span style={{ fontWeight: 800, fontSize: '0.72rem', color: '#231A12' }}>
                  {ach.title}
                </span>
              </div>
              <div style={{ fontSize: '0.64rem', color: '#5C4938', marginTop: '2px', lineHeight: 1.25 }}>
                {ach.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const fieldLabelStyle = {
  fontSize: '0.68rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#5C4938',
  marginBottom: '5px',
};

const chipGroupStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '5px',
};
