import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText } from 'lucide-react';
import styles from './PdfThumbnail.module.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export default function PdfThumbnail({ url, className }) {
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setLoading(false);
      setFailed(true);
      return;
    }

    (async () => {
      try {
        const doc = await pdfjsLib.getDocument(url).promise;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        if (!cancelled) {
          setImg(canvas.toDataURL());
          setLoading(false);
        }
      } catch (err) {
        console.error('PDF thumbnail error:', err);
        if (!cancelled) {
          setFailed(true);
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  if (loading) {
    return <div className={`${styles.wrap} ${className ?? ''}`}><div className={styles.skeleton} /></div>;
  }

  if (failed || !img) {
    return (
      <div className={`${styles.wrap} ${styles.fallback} ${className ?? ''}`}>
        <FileText size={24} color="var(--color-text-secondary)" />
      </div>
    );
  }

  return (
    <div className={`${styles.wrap} ${className ?? ''}`}>
      <img src={img} alt="" className={styles.img} />
    </div>
  );
}
