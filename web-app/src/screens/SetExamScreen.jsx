import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../config/supabase';
import styles from './SetExamScreen.module.css';

const defaultDate = () => new Date();
const defaultTime = () => { const d = new Date(); d.setHours(9, 0, 0, 0); return d; };

export default function SetExamScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const existing = location.state?.countdown;

  const getInitialDate = () => (existing ? new Date(existing.exam_date) : defaultDate());
  const getInitialTime = () => (existing ? new Date(existing.exam_date) : defaultTime());

  const [examTitle, setExamTitle] = useState(existing?.title ?? '');
  const [examDate, setExamDate] = useState(getInitialDate);
  const [examTime, setExamTime] = useState(getInitialTime);
  const [saving, setSaving] = useState(false);

  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);

  const formatDateValue = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatTimeValue = (d) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleDateChange = (e) => {
    if (e.target.value) {
      setExamDate(new Date(e.target.value + 'T00:00:00'));
    }
  };

  const handleTimeChange = (e) => {
    if (e.target.value) {
      const [h, m] = e.target.value.split(':');
      const d = new Date(examTime);
      d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      setExamTime(d);
    }
  };

  const handleSave = async () => {
    if (!examTitle.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const d = examDate;
      const t = examTime;
      const datetime = new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.getHours(), t.getMinutes());
      const dateStr = datetime.toISOString();

      if (existing?.id) {
        await supabase.from('exam_countdowns').update({ title: examTitle.trim(), exam_date: dateStr }).eq('id', existing.id);
      } else {
        await supabase.from('exam_countdowns').insert({ user_id: user.id, title: examTitle.trim(), exam_date: dateStr });
      }

      navigate(-1);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    const confirmed = window.confirm('Are you sure you want to remove this exam countdown?');
    if (!confirmed) return;
    (async () => {
      await supabase.from('exam_countdowns').delete().eq('id', existing.id);
      navigate(-1);
    })();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>
          {existing ? 'Edit Exam' : 'Set Exam'}
        </h1>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>
        <label className={styles.label}>EXAM TITLE</label>
        <input
          className={styles.input}
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
          placeholder="e.g. Calculus I Final Exam"
        />

        <label className={styles.label}>DATE &amp; TIME</label>

        <button
          className={styles.pickerBtn}
          onClick={() => dateInputRef.current?.showPicker()}
          type="button"
        >
          <Calendar size={18} color="var(--color-primary)" />
          <span className={styles.pickerBtnText}>
            {examDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </button>
        <input
          ref={dateInputRef}
          type="date"
          className={styles.hiddenInput}
          value={formatDateValue(examDate)}
          onChange={handleDateChange}
          min={formatDateValue(defaultDate())}
        />

        <button
          className={styles.pickerBtn}
          onClick={() => timeInputRef.current?.showPicker()}
          type="button"
        >
          <Clock size={18} color="var(--color-primary)" />
          <span className={styles.pickerBtnText}>
            {examTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </button>
        <input
          ref={timeInputRef}
          type="time"
          className={styles.hiddenInput}
          value={formatTimeValue(examTime)}
          onChange={handleTimeChange}
        />

        {existing && (
          <button
            className={styles.deleteBtn}
            onClick={handleDelete}
            type="button"
          >
            <Trash2 size={16} color="var(--color-error)" />
            <span className={styles.deleteBtnText}>Delete Exam</span>
          </button>
        )}

        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!examTitle.trim() || saving}
          type="button"
        >
          <span className={styles.saveBtnText}>
            {saving ? 'Saving...' : existing ? 'Save Changes' : 'Set Exam Date'}
          </span>
        </button>
      </div>
    </div>
  );
}
