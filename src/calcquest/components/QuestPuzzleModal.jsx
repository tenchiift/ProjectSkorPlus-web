import { useState, useEffect, useRef } from 'react';
import { QUESTION_BY_ID } from '../data/questionsData';
import { validateQuestionAnswer } from '../math/mathEngine';
import { RichMathText, InteractiveMathVisualizer } from '../math/MathRenderer';
import { drawNPCSprite } from '../engine/pixelArtGenerator';
import { soundEngine } from '../engine/soundEngine';
import PixelIcon from './PixelIcon';
import styles from '../CalcQuest.module.css';

export default function QuestPuzzleModal({
  npc,
  quest,
  world,
  onClose,
  onQuestionAttempt,
  onQuestComplete,
}) {
  // Jump straight into the puzzle so players don't have to read walls of text first!
  const [mode, setMode] = useState('puzzle');
  const [qIndex, setQIndex] = useState(0);
  const [attemptNum, setAttemptNum] = useState(1);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showConcept, setShowConcept] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [selectedOption, setSelectedOption] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [orderedSteps, setOrderedSteps] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState({});
  const portraitCanvasRef = useRef(null);

  const questionIds = quest?.questionIds || [];
  const currentQuestion = QUESTION_BY_ID[questionIds[qIndex]] || null;
  const totalStages = questionIds.length;
  const isBoss = !!quest?.isBossQuest;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const canvas = portraitCanvasRef.current;
    if (!canvas || !npc) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNPCSprite(ctx, npc, 2, 2, 36, 0, false);
  }, [npc, mode, qIndex]);

  useEffect(() => {
    setSelectedOption(null);
    setTextInput('');
    setAttemptNum(1);
    setHintsUsed(0);
    setShowHint(false);
    setShowConcept(false);
    setFeedback(null);

    if (currentQuestion?.question_type === 'order_steps') {
      const rawSteps = [...(currentQuestion.answer_data.steps || [])];
      if (rawSteps.length > 1) {
        const first = rawSteps.shift();
        rawSteps.push(first);
      }
      setOrderedSteps(rawSteps);
    } else if (currentQuestion?.question_type === 'matching') {
      setMatchedPairs({});
    }
  }, [qIndex, currentQuestion?.id, currentQuestion]);

  if (!npc || !quest) return null;

  const moveStep = (idx, dir) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= orderedSteps.length) return;
    const copy = [...orderedSteps];
    const [item] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, item);
    setOrderedSteps(copy);
  };

  const insertMathSymbol = (sym) => {
    setTextInput((prev) => `${prev}${sym}`);
  };

  const handleSubmitAnswer = async (e) => {
    e?.preventDefault();
    if (!currentQuestion) return;

    let submitted;
    const qType = currentQuestion.question_type;
    if (['multiple_choice', 'missing_step', 'spot_error', 'graph_interpretation'].includes(qType)) {
      if (selectedOption === null) return;
      submitted = selectedOption;
    } else if (['numerical', 'expression', 'interactive_puzzle'].includes(qType)) {
      if (!textInput.trim()) return;
      submitted = textInput.trim();
    } else if (qType === 'order_steps') {
      submitted = orderedSteps.map((s) => s.id);
    } else if (qType === 'matching') {
      submitted = matchedPairs;
    }

    const result = validateQuestionAnswer(currentQuestion, submitted);

    await onQuestionAttempt?.({
      question: currentQuestion,
      submittedAnswer: typeof submitted === 'object' ? JSON.stringify(submitted) : submitted,
      correct: result.correct,
      attemptNumber: attemptNum,
      hintsUsed,
      detectedMisconception: result.detectedMisconception,
    });

    if (result.correct) {
      if (isBoss) {
        soundEngine.playBossStageClear();
      } else {
        soundEngine.playCorrectAnswer();
      }
      setFeedback({
        type: 'success',
        text: result.feedback,
      });
    } else {
      soundEngine.playWrongAnswer();
      setAttemptNum((n) => n + 1);
      setFeedback({
        type: 'error',
        text: result.feedback,
        misconception: result.detectedMisconception,
      });
    }
  };

  const handleNextStage = async () => {
    if (qIndex + 1 < totalStages) {
      setQIndex((i) => i + 1);
    } else {
      soundEngine.playWorldRestored();
      await onQuestComplete?.({ worldId: world.id, quest });
      setMode('victory');
    }
  };

  const bossEnergyPercent = Math.max(
    0,
    Math.round(((totalStages - qIndex - (feedback?.type === 'success' ? 1 : 0)) / totalStages) * 100)
  );

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label={quest.title}>
      <div className={styles.rpgDialogBox}>
        {/* Compact Top Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '6px',
            borderBottom: '1.5px solid #6E4726',
            paddingBottom: '6px',
            marginBottom: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
            <canvas
              ref={portraitCanvasRef}
              width={40}
              height={40}
              className={styles.npcPortraitCanvas}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: '#5C4938',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {npc.name} • Step {qIndex + 1}/{totalStages}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#231A12',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {quest.title}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowConcept((v) => !v)}
              className={styles.secondaryBtn}
              style={{ minHeight: '26px', padding: '2px 7px', fontSize: '0.66rem' }}
            >
              {showConcept ? 'Hide Tip' : '💡 Tip'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.secondaryBtn}
              style={{ minHeight: '26px', padding: '2px 7px', fontSize: '0.66rem' }}
              aria-label="Close Quest"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Optional Collapsible Concept Tip */}
        {showConcept && (
          <div
            style={{
              marginBottom: '6px',
              background: '#EDE3CE',
              border: '1.5px solid #6E4726',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '0.74rem',
              color: '#231A12',
              lineHeight: 1.35,
            }}
          >
            <RichMathText text={npc.conceptExplanation} />
          </div>
        )}

        {/* INTERACTIVE PUZZLE / BOSS TRIAL */}
        {mode === 'puzzle' && currentQuestion && (
          <div>
            {isBoss && (
              <div
                style={{
                  background: '#EDE3CE',
                  border: '1.5px solid #6E4726',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  marginBottom: '6px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#231A12',
                    marginBottom: '3px',
                  }}
                >
                  <span>🛡️ {quest.bossName}</span>
                  <span>{bossEnergyPercent}% HP</span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '6px',
                    background: '#D8C8AE',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${bossEnergyPercent}%`,
                      height: '100%',
                      background: '#B83B2A',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            <div
              style={{
                background: '#FFFDF8',
                border: '1.5px solid #6E4726',
                borderRadius: '6px',
                padding: '8px 10px',
                color: '#231A12',
                minWidth: 0,
                overflowWrap: 'break-word',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#231A12', lineHeight: 1.35 }}>
                <RichMathText text={currentQuestion.prompt} />
              </div>
              {currentQuestion.visualizer && (
                <InteractiveMathVisualizer config={currentQuestion.visualizer} />
              )}
            </div>

            <form onSubmit={handleSubmitAnswer} style={{ marginTop: '6px' }}>
              {['multiple_choice', 'missing_step', 'spot_error', 'graph_interpretation'].includes(
                currentQuestion.question_type
              ) && (
                <div style={{ display: 'grid', gap: '5px' }}>
                  {currentQuestion.answer_data.options.map((opt, idx) => {
                    const active = selectedOption === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedOption(idx)}
                        disabled={feedback?.type === 'success'}
                        className={`${styles.optionBtn} ${active ? styles.optionBtnSelected : ''}`}
                      >
                        <strong style={{ color: '#6E4726', marginRight: '6px' }}>
                          {String.fromCharCode(65 + idx)}.
                        </strong>
                        <RichMathText text={opt} />
                      </button>
                    );
                  })}
                </div>
              )}

              {['numerical', 'expression', 'interactive_puzzle'].includes(currentQuestion.question_type) && (
                <div>
                  {currentQuestion.question_type === 'expression' && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '5px' }}>
                      {['x^2', 'x^3', 'x^4', '+ C', '(', ')', '/'].map((sym) => (
                        <button
                          key={sym}
                          type="button"
                          onClick={() => insertMathSymbol(sym)}
                          className={styles.secondaryBtn}
                          style={{ minHeight: '26px', padding: '2px 7px', fontFamily: 'monospace' }}
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    id="calcquest-math-input"
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    disabled={feedback?.type === 'success'}
                    placeholder={
                      currentQuestion.question_type === 'expression'
                        ? 'e.g. 12x^3 - 10x + 7'
                        : 'Enter answer...'
                    }
                    className={styles.mathInput}
                  />
                </div>
              )}

              {currentQuestion.question_type === 'order_steps' && (
                <div style={{ display: 'grid', gap: '5px' }}>
                  {orderedSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        padding: '6px 8px',
                        background: '#FFFDF8',
                        border: '1.5px solid #6E4726',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ fontSize: '0.76rem', color: '#231A12', flex: 1, minWidth: 0 }}>
                        <strong style={{ color: '#6E4726', marginRight: '5px' }}>#{idx + 1}</strong>
                        <RichMathText text={step.text} />
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => moveStep(idx, -1)}
                          disabled={idx === 0 || feedback?.type === 'success'}
                          className={styles.secondaryBtn}
                          style={{ minHeight: '26px', padding: '2px 6px' }}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStep(idx, 1)}
                          disabled={idx === orderedSteps.length - 1 || feedback?.type === 'success'}
                          className={styles.secondaryBtn}
                          style={{ minHeight: '26px', padding: '2px 6px' }}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.question_type === 'matching' && (
                <div style={{ display: 'grid', gap: '5px' }}>
                  {currentQuestion.answer_data.pairs.map((pair) => (
                    <div
                      key={pair.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '6px',
                        padding: '6px 8px',
                        background: '#FFFDF8',
                        border: '1.5px solid #6E4726',
                        borderRadius: '6px',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.76rem', color: '#231A12', flex: '1 1 110px', minWidth: 0 }}>
                        <RichMathText text={pair.left} />
                      </div>
                      <select
                        value={matchedPairs[pair.id] || ''}
                        onChange={(e) =>
                          setMatchedPairs((prev) => ({ ...prev, [pair.id]: e.target.value }))
                        }
                        disabled={feedback?.type === 'success'}
                        style={{
                          minHeight: '30px',
                          maxWidth: '100%',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          background: '#EDE3CE',
                          color: '#231A12',
                          border: '1.5px solid #6E4726',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                        }}
                      >
                        <option value="">Match...</option>
                        {currentQuestion.answer_data.pairs.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.right.replace(/\$/g, '')}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {showHint && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '6px 8px',
                    background: '#EDE3CE',
                    border: '1.5px solid #B87314',
                    borderRadius: '6px',
                    color: '#231A12',
                    fontSize: '0.74rem',
                  }}
                >
                  <strong>Hint:</strong> <RichMathText text={currentQuestion.hint} />
                </div>
              )}

              {feedback && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    background: feedback.type === 'success' ? '#E3F2E7' : '#FBEAE8',
                    border: `1.5px solid ${feedback.type === 'success' ? '#266B3E' : '#B83B2A'}`,
                    color: '#231A12',
                    fontSize: '0.76rem',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: feedback.type === 'success' ? '#194A2A' : '#8C2518',
                      marginBottom: '2px',
                    }}
                  >
                    {feedback.type === 'success' ? '✓ Correct!' : 'Try Again'}
                  </div>
                  <RichMathText text={feedback.text} />
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                  gap: '6px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!showHint) setHintsUsed((h) => h + 1);
                    setShowHint((v) => !v);
                  }}
                  className={styles.secondaryBtn}
                >
                  <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                </button>

                {feedback?.type === 'success' ? (
                  <button type="button" onClick={handleNextStage} className={styles.actionBtn}>
                    {qIndex + 1 < totalStages ? 'Next Step →' : 'Finish Quest'}
                  </button>
                ) : (
                  <button type="submit" className={styles.actionBtn}>
                    Check Answer
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* VICTORY SUMMARY */}
        {mode === 'victory' && (
          <div style={{ textAlign: 'center', padding: '12px 6px' }}>
            <div style={{ marginBottom: '6px' }}>
              <PixelIcon name="crown" size={28} />
            </div>
            <h3 className={styles.sectionTitle}>
              {isBoss ? `${world.coreName} Restored!` : 'Quest Complete!'}
            </h3>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                margin: '10px 0 12px',
              }}
            >
              <span className={styles.secondaryBtn} style={{ cursor: 'default' }}>
                <PixelIcon name="xp" size={14} /> +{quest.xpReward} XP
              </span>
              <span className={styles.secondaryBtn} style={{ cursor: 'default' }}>
                <PixelIcon name="coin" size={14} /> +{quest.coinReward} Coins
              </span>
            </div>
            <button type="button" onClick={onClose} className={styles.actionBtn}>
              Continue Adventure
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
