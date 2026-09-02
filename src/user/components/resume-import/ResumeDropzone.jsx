// ════════════════════════════════════════════════════════════
//  Resume Import — drag & drop zone
// ════════════════════════════════════════════════════════════
import { useRef, useState } from 'react';
import { UploadCloud, FileText, Loader2 } from 'lucide-react';
import { RESUME_MAX_BYTES } from './resumeImport.api';

function validateFile(file) {
  if (!file) return 'No file selected.';
  if (file.type !== 'application/pdf') return 'Only PDF files are supported.';
  if (file.size > RESUME_MAX_BYTES) {
    return `File is too large (max ${Math.round(RESUME_MAX_BYTES / (1024 * 1024))} MB).`;
  }
  return '';
}

const ResumeDropzone = ({ onFileAccepted, busy }) => {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    const file = fileList?.[0];
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    onFileAccepted(file);
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => { if (!busy && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy) handleFiles(e.dataTransfer.files);
        }}
        style={{
          border: `2px dashed ${dragging ? '#2563EB' : 'var(--border)'}`,
          borderRadius: 12,
          padding: '28px 16px',
          textAlign: 'center',
          cursor: busy ? 'not-allowed' : 'pointer',
          background: dragging ? 'rgba(37,99,235,0.06)' : 'var(--input-bg)',
          transition: 'all 0.15s ease',
          opacity: busy ? 0.7 : 1,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          disabled={busy}
          onChange={(e) => handleFiles(e.target.files)}
        />
        {busy ? (
          <>
            <Loader2 className="animate-spin mx-auto" size={26} style={{ color: '#2563EB' }} />
            <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text)' }}>Reading your resume…</p>
          </>
        ) : (
          <>
            <UploadCloud className="mx-auto" size={26} style={{ color: 'var(--muted)' }} />
            <p className="mt-2 text-sm font-medium" style={{ color: 'var(--text)' }}>
              Drag & drop your resume PDF here
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              or click to browse · PDF only · up to {Math.round(RESUME_MAX_BYTES / (1024 * 1024))} MB
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: '#ef4444' }}>
          <FileText size={12} /> {error}
        </p>
      )}
    </div>
  );
};

export default ResumeDropzone;
