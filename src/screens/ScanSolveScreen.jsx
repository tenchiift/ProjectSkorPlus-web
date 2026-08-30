import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, ImageIcon, ChevronDown, Sparkles, X } from 'lucide-react';
import { supabase } from '../config/supabase';
import { solveQuestion } from '../services/aiService';
import styles from './ScanSolveScreen.module.css';

function resizeImage(file, maxWidth = 1024) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(URL.createObjectURL(blob)), 'image/jpeg', 0.6);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function ScanSolveScreen() {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [problemDesc, setProblemDesc] = useState('');
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const { data } = await supabase
        .from('exams')
        .select('id, title, subject, semester')
        .order('created_at', { ascending: false });
      if (data) setPapers(data);
    } catch (err) {
      console.error('Fetch papers error:', err);
    }
  };

  const handleCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      alert('Camera permission is required. Please allow camera access in your browser settings.');
      return;
    }
    cameraRef.current?.click();
  };

  const handleGallery = () => {
    galleryRef.current?.click();
  };

  const handleFilePicked = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    try {
      const resized = await resizeImage(file);
      setImage(resized);
    } catch {
      setImage(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const handleSolve = async () => {
    if (!image) return;
    setLoading(true);
    setResult('loading');
    try {
      const paperContext = selectedPaper
        ? `${selectedPaper.title}${selectedPaper.subject ? ` - ${selectedPaper.subject}` : ''}${selectedPaper.semester ? ` (${selectedPaper.semester})` : ''}`
        : '';
      const context = [paperContext, problemDesc.trim()].filter(Boolean).join('\n\n');
      const aiResponse = await solveQuestion(image, context || undefined);
      setResult(aiResponse);
    } catch (err) {
      setResult('Error: ' + (err.message || 'Failed to solve. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const getPaperLabel = () => {
    if (!selectedPaper) return 'Pick a paper (optional)';
    return selectedPaper.title.substring(0, 28) + (selectedPaper.title.length > 28 ? '...' : '');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>Scan & Solve</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.scrollContent}>
        <button className={styles.dropdown} onClick={() => setDropdownVisible(true)}>
          <span className={`${styles.dropdownText} ${!selectedPaper ? styles.dropdownPlaceholder : ''}`}>
            {getPaperLabel()}
          </span>
          <ChevronDown size={18} color="var(--color-text-secondary)" />
        </button>

        {dropdownVisible && (
          <div className={styles.modalOverlay} onClick={() => setDropdownVisible(false)}>
            <div className={styles.dropdownModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.dropdownHeader}>
                <h3 className={styles.dropdownTitle}>Select Exam Paper</h3>
                <button className={styles.modalClose} onClick={() => setDropdownVisible(false)}>
                  <X size={20} color="var(--color-text-primary)" />
                </button>
              </div>
              <button
                className={styles.dropdownItem}
                onClick={() => { setSelectedPaper(null); setDropdownVisible(false); }}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>None (general solve)</span>
              </button>
              {papers.map((item) => (
                <button
                  key={item.id}
                  className={styles.dropdownItem}
                  onClick={() => { setSelectedPaper(item); setDropdownVisible(false); }}
                >
                  <span className={styles.dropdownItemText}>{item.title}</span>
                  {item.subject && (
                    <span className={styles.dropdownItemSub}>{item.subject}{item.semester ? ` — ${item.semester}` : ''}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.imageArea}>
          {image ? (
            <div className={styles.imagePreview}>
              <img src={image} className={styles.imagePreviewImg} alt="Question" />
              <button
                className={styles.clearImage}
                onClick={() => { setImage(null); setResult(null); }}
              >
                <X size={18} color="#FFFFFF" />
              </button>
            </div>
          ) : (
            <div className={styles.imagePlaceholder}>
              <Camera size={48} color="var(--color-text-secondary)" />
              <span className={styles.imagePlaceholderText}>Snap a photo of your question</span>
              <span className={styles.imagePlaceholderHint}>or choose from gallery</span>
            </div>
          )}
        </div>

        <div className={styles.problemBox}>
          <span className={styles.problemLabel}>Describe your problem</span>
          <textarea
            className={styles.problemInput}
            value={problemDesc}
            onChange={(e) => setProblemDesc(e.target.value)}
            placeholder="What are you trying to solve? Add context so the AI can help better..."
            rows={3}
          />
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFilePicked}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFilePicked}
        />

        <div className={styles.actionRow}>
          <button className={styles.actionBtn} onClick={handleCamera}>
            <Camera size={20} color="var(--color-primary)" />
            <span className={styles.actionBtnText}>Camera</span>
          </button>
          <button className={styles.actionBtn} onClick={handleGallery}>
            <ImageIcon size={20} color="var(--color-primary)" />
            <span className={styles.actionBtnText}>Gallery</span>
          </button>
        </div>

        <button
          className={`${styles.solveBtn} ${!image ? styles.solveBtnDisabled : ''}`}
          onClick={handleSolve}
          disabled={!image || loading}
        >
          {loading ? (
            <div className={styles.spinner} />
          ) : (
            <>
              <Sparkles size={20} color="#FFFFFF" />
              <span className={styles.solveBtnText}>Solve</span>
            </>
          )}
        </button>

        {result && result !== 'loading' && (
          <div className={styles.resultCard}>
            <h3 className={styles.resultTitle}>AI Solution</h3>
            <p className={styles.resultText}>{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
