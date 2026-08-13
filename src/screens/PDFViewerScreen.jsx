import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import styles from './PDFViewerScreen.module.css';

export default function PDFViewerScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const exam = location.state?.exam ?? {};
  const pdfUrl = exam.pdf_url;
  const [iframeLoading, setIframeLoading] = useState(true);

  if (!pdfUrl) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="var(--color-text-primary)" />
          </button>
          <h1 className={styles.headerTitle}>{exam.title ?? 'PDF Viewer'}</h1>
          <div className={styles.headerSpacer} />
        </div>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>No PDF available for this exam paper.</p>
        </div>
      </div>
    );
  }

  const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={24} color="var(--color-text-primary)" />
        </button>
        <h1 className={styles.headerTitle}>{exam.title ?? 'PDF Viewer'}</h1>
        <a
          href={pdfUrl}
          download
          className={styles.downloadBtn}
          title="Download PDF"
        >
          <Download size={20} color="var(--color-primary)" />
        </a>
      </div>

      <div className={styles.iframeWrapper}>
        {iframeLoading && (
          <div className={styles.iframeLoading}>
            <div className={styles.spinner} />
          </div>
        )}
        <iframe
          src={googleDocsUrl}
          className={styles.iframe}
          title="PDF Viewer"
          onLoad={() => setIframeLoading(false)}
        />
      </div>
    </div>
  );
}
