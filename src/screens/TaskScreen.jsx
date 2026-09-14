import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Plus, Check, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../config/supabase';
import taskHeroImage from '../assets/images/task-hero.jpg';
import styles from './TaskScreen.module.css';

const PRIORITIES = [
  { value: 'high', label: 'High', rank: 0 },
  { value: 'medium', label: 'Med', rank: 1 },
  { value: 'low', label: 'Low', rank: 2 },
];

const priorityRank = (p) => PRIORITIES.find((x) => x.value === p)?.rank ?? 1;

export default function TaskScreen() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [saving, setSaving] = useState(false);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const rowProps = (i) =>
    reducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.25, ease: 'easeOut', delay: Math.min(i * 0.04, 0.4) },
        };

  const sheetSpring = {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 34 },
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setFormTitle('');
    setFormPriority('medium');
    setSheetOpen(true);
  };

  const openEdit = (task) => {
    setEditId(task.id);
    setFormTitle(task.title ?? '');
    setFormPriority(task.priority ?? 'medium');
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditId(null);
    setFormTitle('');
  };

  const handleSave = async () => {
    const title = formTitle.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editId) {
        setTasks((prev) => prev.map((t) => t.id === editId ? { ...t, title, priority: formPriority } : t));
        await supabase.from('tasks').update({ title, priority: formPriority }).eq('id', editId);
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .insert({ user_id: user.id, title, priority: formPriority })
          .select()
          .single();
        if (error) throw error;
        if (data) setTasks((prev) => [data, ...prev]);
      }
      closeSheet();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (task) => {
    const newCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: newCompleted } : t));
    await supabase.from('tasks').update({ completed: newCompleted }).eq('id', task.id);
  };

  const deleteTask = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

  const ordered = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return priorityRank(a.priority) - priorityRank(b.priority);
  });

  const priorityBarClass = (p) =>
    p === 'high' ? styles.barHigh : p === 'low' ? styles.barLow : styles.barMedium;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <img src={taskHeroImage} className={styles.heroBg} alt="" />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </button>
          <h1 className={styles.heroTitle}>Today</h1>
          <p className={styles.heroDate}>{today}</p>
          <span className={styles.heroCount}>
            {tasks.filter((t) => !t.completed).length} task
            {tasks.filter((t) => !t.completed).length === 1 ? '' : 's'} left
          </span>
        </div>
      </div>

      <div className={styles.scroll}>
        {tasks.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <Calendar size={34} color="var(--color-primary)" />
            </div>
            <h2 className={styles.emptyTitle}>No Tasks Scheduled</h2>
            <p className={styles.emptyText}>Create a new task to get started.</p>
            <button className={styles.emptyCta} onClick={openAdd}>
              <Plus size={18} color="#FFFFFF" />
              <span>Add your first task</span>
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {ordered.map((task, i) => (
              <motion.div
                key={task.id}
                className={styles.taskCard}
                {...rowProps(i)}
              >
                <span className={`${styles.priorityBar} ${priorityBarClass(task.priority)}`} />
                <button
                  className={`${styles.radio} ${task.completed ? styles.radioChecked : ''}`}
                  onClick={() => toggleTask(task)}
                  aria-label={task.completed ? 'Mark as pending' : 'Mark as done'}
                >
                  {task.completed && <Check size={12} color="#FFFFFF" />}
                </button>
                <button className={styles.taskBody} onClick={() => openEdit(task)}>
                  <span className={`${styles.taskText} ${task.completed ? styles.taskDone : ''}`}>
                    {task.title}
                  </span>
                  <span className={styles.taskMeta}>
                    {task.priority === 'high' ? 'High' : task.priority === 'low' ? 'Low' : 'Medium'} priority
                  </span>
                </button>
                <button className={styles.deleteBtn} onClick={() => deleteTask(task.id)} aria-label="Delete task">
                  <Trash2 size={16} color="var(--color-error)" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <button className={styles.fab} onClick={openAdd} aria-label="Add task">
        <Plus size={26} color="#FFFFFF" />
      </button>

      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              className={styles.sheetBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
            />
            <motion.div className={styles.sheet} {...sheetSpring}>
              <div className={styles.sheetHandle} />
              <div className={styles.sheetHeader}>
                <button className={styles.sheetClose} onClick={closeSheet} aria-label="Close">
                  ✕
                </button>
                <span className={styles.sheetTitle}>{editId ? 'Edit Task' : 'New Task'}</span>
                <button className={styles.sheetSave} onClick={handleSave} disabled={saving || !formTitle.trim()}>
                  {editId ? 'Save' : 'Add'}
                </button>
              </div>

              <input
                className={styles.sheetInput}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Task title..."
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />

              <span className={styles.sheetLabel}>PRIORITY</span>
              <div className={styles.priorityPicker}>
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    className={`${styles.priorityBtn} ${formPriority === p.value ? styles.priorityBtnActive : ''}`}
                    onClick={() => setFormPriority(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
