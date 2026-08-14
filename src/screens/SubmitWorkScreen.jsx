import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Camera, ImageIcon, FileText, X, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { searchLecturers, createSubmission } from '../services/submissionService';
import styles from './SubmitWorkScreen.module.css';

export default function SubmitWorkScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchLecturers(query);
        setResults(data);
      } catch (err) {
        console.error('Search lecturers error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const addFiles = (fileList) => {
    const arr = Array.from(fileList || []);
    setFiles((prev) => [...prev, ...arr]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedLecturer) return;
    setSubmitting(true);
    try {
      await createSubmission(user.id, selectedLecturer.id, message.trim() || null, files);
      navigate('/my-submissions');
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>Send Work</h1>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.scroll}>
        <label className={styles.label}>TO LECTURER</label>
        {selectedLecturer ? (
          <div className={styles.selectedCard}>
            <span className={styles.selectedName}>{selectedLecturer.name}</span>
            <span className={styles.selectedUsername}>@{selectedLecturer.username}</span>
            <button className={styles.clearBtn} onClick={() => setSelectedLecturer(null)}>
              <X size={16} color="var(--color-text-secondary)" />
            </button>
          </div>
        ) : (
          <div className={styles.searchBox}>
            <Search size={18} color="var(--color-text-secondary)" />
            <input
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lecturer by username"
              autoCapitalize="none"
            />
          </div>
        )}

        {!selectedLecturer && results.length > 0 && (
          <div className={styles.resultList}>
            {results.map((lecturer) => (
              <button
                key={lecturer.id}
                className={styles.resultItem}
                onClick={() => setSelectedLecturer(lecturer)}
              >
                <span className={styles.resultName}>{lecturer.name}</span>
                <span className={styles.resultUsername}>@{lecturer.username}</span>
              </button>
            ))}
          </div>
        )}

        <label className={styles.label}>YOUR WORK</label>
        <div className={styles.fileRow}>
          <button className={styles.fileBtn} onClick={() => cameraRef.current?.click()}>
            <Camera size={20} color="var(--color-primary)" />
            <span>Camera</span>
          </button>
          <button className={styles.fileBtn} onClick={() => galleryRef.current?.click()}>
            <ImageIcon size={20} color="var(--color-primary)" />
            <span>Gallery</span>
          </button>
          <button className={styles.fileBtn} onClick={() => pdfRef.current?.click()}>
            <FileText size={20} color="var(--color-primary)" />
            <span>PDF</span>
          </button>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <input ref={pdfRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />

        {files.length > 0 && (
          <div className={styles.fileList}>
            {files.map((file, i) => (
              <div key={i} className={styles.fileItem}>
                {file.type?.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt="" className={styles.fileThumb} />
                ) : (
                  <FileText size={20} color="var(--color-primary)" />
                )}
                <span className={styles.fileName}>{file.name}</span>
                <button className={styles.removeBtn} onClick={() => removeFile(i)}>
                  <X size={16} color="var(--color-error)" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className={styles.label}>MESSAGE</label>
        <textarea
          className={styles.textarea}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write a message to your lecturer..."
          rows={4}
        />

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!selectedLecturer || submitting}
        >
          {submitting ? (
            <div className={styles.spinner} />
          ) : (
            <>
              <Send size={18} color="#FFFFFF" />
              <span>Send Work</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
