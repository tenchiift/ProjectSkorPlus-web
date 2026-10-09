import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react';
import { ArrowLeft, Plus, Check, Trash2, Calendar, X } from 'lucide-react';
import { supabase } from '../config/supabase';
import { layoutSpring, sheetSpring, motionEase, motionTiming, pressFeedback } from '../utils/motion';
import taskHeroImage from '../assets/images/task-hero.jpg';
import styles from './TaskScreen.module.css';

const PRIORITIES = [
  { value: 'high', label: 'High', rank: 0 },
  { value: 'medium', label: 'Med', rank: 1 },
  { value: 'low', label: 'Low', rank: 2 },
];
const priorityRank = (p) => PRIORITIES.find((x) => x.value === p)?.rank ?? 1;

function TaskSheet({ editId, title, setTitle, priority, setPriority, saving, error, onSave, onClose, reducedMotion }) {
  const dialogRef = useRef(null);
  const present = useIsPresent();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return (
    <motion.dialog
      ref={dialogRef}
      className={styles.sheet}
      aria-labelledby="task-sheet-title"
      data-exiting={!present || undefined}
      initial={reducedMotion ? { opacity: 0 } : { y: '100%', opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { y: '100%', opacity: 0, transition: { duration: motionTiming.exit, ease: motionEase } }}
      transition={reducedMotion ? { duration: motionTiming.feedback } : { ...sheetSpring, opacity: { duration: motionTiming.exit } }}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <form className={styles.sheetForm} inert={!present} onSubmit={(event) => { event.preventDefault(); if (present) onSave(); }}>
        <div className={styles.sheetHandle} aria-hidden="true" />
        <div className={styles.sheetHeader}>
          <motion.button type="button" className={styles.sheetClose} onClick={onClose} disabled={saving} aria-label="Close task editor" {...pressFeedback(reducedMotion)}>
            <X size={18} aria-hidden="true" />
          </motion.button>
          <h2 id="task-sheet-title" className={styles.sheetTitle}>{editId ? 'Edit Task' : 'New Task'}</h2>
          <motion.button type="submit" className={styles.sheetSave} disabled={saving || !title.trim()} {...pressFeedback(reducedMotion)}>
            {saving ? 'Saving…' : editId ? 'Save' : 'Add'}
          </motion.button>
        </div>
        <label className={styles.sheetLabel} htmlFor="task-title">TASK TITLE</label>
        <input id="task-title" className={styles.sheetInput} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What will you work on?" disabled={saving} autoFocus />
        <span className={styles.sheetLabel} id="task-priority-label">PRIORITY</span>
        <div className={styles.priorityPicker} role="group" aria-labelledby="task-priority-label">
          {PRIORITIES.map((p) => (
            <button type="button" key={p.value} className={`${styles.priorityBtn} ${priority === p.value ? styles.priorityBtnActive : ''}`} aria-pressed={priority === p.value} onClick={() => setPriority(p.value)} disabled={saving}>
              {p.label}
            </button>
          ))}
        </div>
        {error && <p className={styles.errorText} role="alert">{error}</p>}
      </form>
    </motion.dialog>
  );
}

export default function TaskScreen() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingIds, setPendingIds] = useState(new Set());
  const pending = useRef(new Set());
  const savingRef = useRef(false);
  const loadRequest = useRef(0);

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const completed = tasks.filter((task) => task.completed).length;
  const remaining = tasks.length - completed;
  const fade = { duration: motionTiming.enter, ease: motionEase };
  const rowMotion = {
    layout: reducedMotion ? false : 'position',
    initial: { opacity: 0, y: reducedMotion ? 0 : 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, x: reducedMotion ? 0 : 12, transition: { duration: motionTiming.exit } },
    transition: { ...fade, layout: reducedMotion ? { duration: 0 } : layoutSpring },
  };

  const fetchTasks = async () => {
    const request = ++loadRequest.current;
    setLoading(true);
    setLoadError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active session');
      const { data, error } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      if (request === loadRequest.current) setTasks(data || []);
    } catch {
      if (request === loadRequest.current) setLoadError('Your tasks couldn’t be loaded. Please try again.');
    } finally {
      if (request === loadRequest.current) setLoading(false);
    }
  };
  useEffect(() => {
    fetchTasks();
    return () => { loadRequest.current += 1; };
  }, []);

  const openAdd = () => {
    setEditId(null);
    setFormTitle('');
    setFormPriority('medium');
    setFormError('');
    setSheetOpen(true);
  };
  const openEdit = (task) => {
    if (pending.current.has(task.id)) return;
    setEditId(task.id);
    setFormTitle(task.title ?? '');
    setFormPriority(task.priority ?? 'medium');
    setFormError('');
    setSheetOpen(true);
  };
  const closeSheet = () => {
    if (!savingRef.current) setSheetOpen(false);
    // Preserve the form during its exit; reset it when the next editor opens.
  };
  const handleSave = async () => {
    const title = formTitle.trim();
    if (!title || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setFormError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active session');
      if (editId) {
        const { error } = await supabase.from('tasks').update({ title, priority: formPriority }).eq('id', editId);
        if (error) throw error;
        setTasks((prev) => prev.map((task) => task.id === editId ? { ...task, title, priority: formPriority } : task));
      } else {
        const { data, error } = await supabase.from('tasks').insert({ user_id: user.id, title, priority: formPriority }).select().single();
        if (error || !data) throw error || new Error('Task was not returned');
        setTasks((prev) => [data, ...prev]);
      }
      setSheetOpen(false);
    } catch {
      setFormError('Your task couldn’t be saved. Your changes are still here—please try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const startAction = (id) => {
    if (pending.current.has(id)) return false;
    pending.current.add(id);
    setPendingIds(new Set(pending.current));
    setActionError('');
    return true;
  };
  const finishAction = (id) => {
    pending.current.delete(id);
    setPendingIds(new Set(pending.current));
  };
  const toggleTask = async (task) => {
    if (!startAction(task.id)) return;
    const completed = !task.completed;
    setTasks((prev) => prev.map((item) => item.id === task.id ? { ...item, completed } : item));
    try {
      const { error } = await supabase.from('tasks').update({ completed }).eq('id', task.id);
      if (error) throw error;
    } catch {
      setTasks((prev) => prev.map((item) => item.id === task.id ? { ...item, completed: task.completed } : item));
      setActionError('That change couldn’t be saved. The task has been restored—please try again.');
    } finally { finishAction(task.id); }
  };
  const deleteTask = async (task) => {
    if (!startAction(task.id)) return;
    const index = tasks.findIndex((item) => item.id === task.id);
    setTasks((prev) => prev.filter((item) => item.id !== task.id));
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
    } catch {
      setTasks((prev) => {
        if (prev.some((item) => item.id === task.id)) return prev;
        const restored = [...prev];
        restored.splice(Math.min(index, restored.length), 0, task);
        return restored;
      });
      setActionError('That task couldn’t be deleted. It has been restored—please try again.');
    } finally { finishAction(task.id); }
  };
  const ordered = [...tasks].sort((a, b) => Number(!!a.completed) - Number(!!b.completed) || priorityRank(a.priority) - priorityRank(b.priority));
  const priorityBarClass = (p) => p === 'high' ? styles.barHigh : p === 'low' ? styles.barLow : styles.barMedium;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <img src={taskHeroImage} className={styles.heroBg} alt="" />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Go back" {...pressFeedback(reducedMotion)}><ArrowLeft size={24} color="#FFFFFF" /></motion.button>
          <h1 className={styles.heroTitle}>Today</h1>
          <p className={styles.heroDate}>{today}</p>
          <span className={styles.heroCount} aria-live="polite" aria-atomic="true">
            {loading ? 'Loading tasks…' : loadError ? 'Tasks unavailable' : <><AnimatePresence mode="wait" initial={false}><motion.span key={remaining} className={styles.countNumber} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: motionTiming.feedback }}>{remaining}</motion.span></AnimatePresence> {remaining === 1 ? 'task' : 'tasks'} left</>}
          </span>
        </div>
      </div>

      <div className={styles.scroll}>
        {!loadError && <div className={styles.progressSection}>
          <div className={styles.progressLabels}><span>Task progress</span><span>{loading ? '—' : `${completed} of ${tasks.length} completed`}</span></div>
          <div className={styles.progressTrack} role="progressbar" aria-label="Task progress" aria-valuemin={0} aria-valuemax={Math.max(1, tasks.length)} aria-valuenow={completed} aria-valuetext={loading ? 'Loading' : `${completed} of ${tasks.length} tasks completed`}>
            <motion.div className={styles.progressFill} initial={false} animate={{ scaleX: tasks.length ? completed / tasks.length : 0 }} transition={{ duration: reducedMotion ? 0 : motionTiming.progress, ease: motionEase }} />
          </div>
        </div>}
        {actionError && <p className={styles.actionError} role="alert">{actionError}</p>}
        <div className={styles.list} aria-busy={loading}>
          <AnimatePresence initial={false} mode="popLayout">
            {loading ? <motion.div key="loading" role="status" aria-label="Loading your tasks" exit={{ opacity: 0 }} transition={{ duration: motionTiming.feedback }}>
              {[0, 1, 2].map((key) => <div key={key} className={styles.skeletonCard} aria-hidden="true"><span className={styles.skeletonCircle} /><span className={styles.skeletonLines} /></div>)}
            </motion.div> : loadError ? <motion.div key="load-error" className={styles.empty} {...rowMotion}>
              <p className={styles.errorText} role="alert">{loadError}</p><button className={styles.emptyCta} onClick={fetchTasks}>Try again</button>
            </motion.div> : tasks.length === 0 ? <motion.div key="empty" className={styles.empty} {...rowMotion}>
              <div className={styles.emptyIcon}><Calendar size={34} color="var(--color-primary)" /></div>
              <h2 className={styles.emptyTitle}>No Tasks Scheduled</h2>
              <p className={styles.emptyText}>Create a new task to get started.</p>
              <motion.button className={styles.emptyCta} onClick={openAdd} {...pressFeedback(reducedMotion)}><Plus size={18} /><span>Add your first task</span></motion.button>
            </motion.div> : ordered.map((task) => (
              <motion.div key={task.id} className={styles.taskCard} {...rowMotion} aria-busy={pendingIds.has(task.id)}>
                <span className={`${styles.priorityBar} ${priorityBarClass(task.priority)}`} />
                <button className={`${styles.radio} ${task.completed ? styles.radioChecked : ''}`} onClick={() => toggleTask(task)} disabled={pendingIds.has(task.id)} aria-label={`${task.completed ? 'Mark as pending' : 'Mark as done'}: ${task.title}`} aria-pressed={!!task.completed}>
                  <span className={styles.radioMark}><AnimatePresence initial={false}>{task.completed && <motion.span key="check" className={styles.checkIcon} initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.7 }} transition={{ duration: motionTiming.feedback }}><Check size={14} aria-hidden="true" /></motion.span>}</AnimatePresence></span>
                </button>
                <button className={styles.taskBody} onClick={() => openEdit(task)} disabled={pendingIds.has(task.id)} aria-label={`Edit task: ${task.title}`}>
                  <span className={`${styles.taskText} ${task.completed ? styles.taskDone : ''}`}>{task.title}</span>
                  <span className={styles.taskMeta}>{task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Medium'} priority</span>
                </button>
                <button className={styles.deleteBtn} onClick={() => deleteTask(task)} disabled={pendingIds.has(task.id)} aria-label={`Delete task: ${task.title}`}><Trash2 size={16} color="var(--color-error)" /></button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <motion.button className={styles.fab} onClick={openAdd} disabled={loading || !!loadError} aria-label="Add task" {...pressFeedback(reducedMotion)}><Plus size={26} color="#FFFFFF" /></motion.button>
      <AnimatePresence>{sheetOpen && <TaskSheet key="task-editor" editId={editId} title={formTitle} setTitle={setFormTitle} priority={formPriority} setPriority={setFormPriority} saving={saving} error={formError} onSave={handleSave} onClose={closeSheet} reducedMotion={reducedMotion} />}</AnimatePresence>
    </div>
  );
}
