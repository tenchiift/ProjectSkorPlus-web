import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateModuleProgress } from '../services/moduleService';
import { updateUserStats } from '../services/userService';
import { vectorQuestions } from '../data/vectorQuestions';
import styles from './QuestionScreen.module.css';

export default function QuestionScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const moduleData = location.state?.module ?? {};
  const questions = vectorQuestions;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[index];
  const total = questions.length;

  const persist = async (finalScore) => {
    try {
      if (user && moduleData.id) {
        await updateModuleProgress(user.id, moduleData.id, finalScore);
        await updateUserStats(user.id, { expGained: 10, completed: 1 });
      }
    } catch (e) {
      // best-effort
    }
  };

  const choose = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const isRight = i === q.correctIndex;
    const nextCorrect = correct + (isRight ? 1 : 0);
    if (isRight) setCorrect(nextCorrect);
    setTimeout(() => {
      if (index + 1 >= total) {
        persist(nextCorrect * 100);
        setDone(true);
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, 750);
  };

  const optionClass = (i) => {
    if (selected === null) return styles.option;
    if (i === q.correctIndex) return `${styles.option} ${styles.optionCorrect}`;
    if (i === selected) return `${styles.option} ${styles.optionWrong}`;
    return styles.option;
  };

  const optionTextClass = (i) => {
    if (selected === null) return styles.optionText;
    if (i === q.correctIndex || i === selected) return `${styles.optionText} ${styles.optionTextHighlight}`;
    return styles.optionText;
  };

  if (done) {
    return (
      <div className={styles.container}>
        <div className={styles.doneWrap}>
          <span className={styles.doneEmoji}>🎉</span>
          <h1 className={styles.doneTitle}>Quiz Complete!</h1>
          <p className={styles.doneScore}>
            You got {correct} / {total} correct
          </p>
          <p className={styles.doneExp}>+10 EXP earned 🔥</p>
          <button
            className={styles.doneBtn}
            onClick={() => navigate(-1)}
          >
            Back to Module
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <span className={styles.headerTitle}>
          Question {index + 1}/{total}
        </span>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>

      <div className={styles.body}>
        <div className={styles.questionCard}>
          {q.questionImage ? (
            <img src={q.questionImage} className={styles.questionImage} alt="" />
          ) : (
            <p className={styles.questionText}>{q.prompt}</p>
          )}
        </div>

        <div className={styles.grid}>
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={optionClass(i)}
              onClick={() => choose(i)}
              disabled={selected !== null}
            >
              {opt.image ? (
                <img src={opt.image} className={styles.optionImage} alt="" />
              ) : (
                <span className={optionTextClass(i)}>{opt.text}</span>
              )}
              {selected !== null && i === q.correctIndex && (
                <Check size={20} color="#FFFFFF" className={styles.optionMark} />
              )}
              {selected !== null && i === selected && i !== q.correctIndex && (
                <X size={20} color="#FFFFFF" className={styles.optionMark} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
