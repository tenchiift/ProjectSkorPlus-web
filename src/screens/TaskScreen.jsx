import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Trash2 } from 'lucide-react';
import { supabase } from '../config/supabase';
import styles from './TaskScreen.module.css';

export default function TaskScreen() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');

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

  const handleAdd = async () => {
    const title = newTask.trim();
    if (!title) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: user.id, title })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setTasks((prev) => [data, ...prev]);
        setNewTask('');
      }
    } catch (err) {
      console.error(err);
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

  const incomplete = tasks.filter((t) => !t.completed);
  const complete = tasks.filter((t) => t.completed);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>Tasks</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a new task..."
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        />
        <button className={styles.addBtn} onClick={handleAdd}>
          <Plus size={20} color="#FFFFFF" />
        </button>
      </div>

      <div className={styles.scroll}>
        {tasks.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyText}>No tasks yet. Add one above!</span>
          </div>
        ) : (
          <>
            {incomplete.length > 0 && (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>PENDING ({incomplete.length})</span>
                {incomplete.map((task) => (
                  <div key={task.id} className={styles.taskRow}>
                    <button className={styles.checkbox} onClick={() => toggleTask(task)} />
                    <span className={styles.taskText}>{task.title}</span>
                    <button className={styles.deleteBtn} onClick={() => deleteTask(task.id)}>
                      <Trash2 size={16} color="var(--color-error)" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {complete.length > 0 && (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>COMPLETED ({complete.length})</span>
                {complete.map((task) => (
                  <div key={task.id} className={styles.taskRow}>
                    <button className={`${styles.checkbox} ${styles.checkboxChecked}`} onClick={() => toggleTask(task)}>
                      <Check size={12} color="#FFFFFF" />
                    </button>
                    <span className={`${styles.taskText} ${styles.taskDone}`}>{task.title}</span>
                    <button className={styles.deleteBtn} onClick={() => deleteTask(task.id)}>
                      <Trash2 size={16} color="var(--color-error)" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
