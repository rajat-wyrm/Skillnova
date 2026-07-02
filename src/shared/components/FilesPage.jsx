// ════════════════════════════════════════════════════════════
//  Files Manager — upload, list, download, copy signed URL
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from 'react';
import { Upload, FileText, Loader2, Download, Trash2, Copy, Check, X } from 'lucide-react';
import { Card, SectionHeader } from './UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatRelative } from '../../lib/utils';
import { APP_CONSTANTS } from '../config/constants';

const humanSize = (b) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
};

const FilesPage = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const fetch = async () => {
    setLoading(true);
    try { const { data } = await api.get('/files'); setFiles(data.items); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const upload = async (f) => {
    if (!f) return;
    if (f.size > APP_CONSTANTS.MAX_FILE_SIZE_MB * 1024 * 1024) return notify.error(`File too large (max ${APP_CONSTANTS.MAX_FILE_SIZE_MB} MB)`);
    setUploading(true);
    setProgress(0);
    const form = new FormData();
    form.append('file', f);
    try {
      await api.post('/files', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      notify.success('File uploaded');
      fetch();
    } catch { notify.error('Upload failed'); }
    setUploading(false);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = async (f) => {
    if (!window.confirm(`Delete ${f.originalName}?`)) return;
    try { await api.delete(`/files/${f.id}`); notify.success('Deleted'); fetch(); }
    catch { notify.error('Failed'); }
  };

  const copyUrl = async (f) => {
    try {
      const { data } = await api.get(`/files/${f.id}/url?ttl=${APP_CONSTANTS.SIGNED_URL_TTL}`);
      const full = window.location.origin + data.url;
      await navigator.clipboard.writeText(full);
      setCopiedId(f.id);
      notify.success('Signed URL copied (valid 1h)');
      setTimeout(() => setCopiedId(null), 1500);
    } catch { notify.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Files" subtitle="Upload, manage, and share files with signed URLs" />

      <Card
        className="p-8 text-center transition cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files[0]); }}
        style={{
          borderColor: dragOver ? '#ff6d34' : 'var(--border)',
          background: dragOver ? 'rgba(255,109,52,0.05)' : 'var(--card)',
          borderStyle: 'dashed',
          borderWidth: 2,
        }}
      >
        <input ref={inputRef} type="file" hidden onChange={(e) => upload(e.target.files?.[0])} />
        {uploading ? (
          <div className="space-y-3">
            <Loader2 className="animate-spin mx-auto" size={28} style={{ color: '#ff6d34' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Uploading… {progress}%</p>
            <div className="w-64 mx-auto h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
              <div className="h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #ff6d34, #00bea3)' }} />
            </div>
            {progress > 0 && progress < 100 && (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {progress < 30 ? 'Preparing upload…' : progress < 70 ? 'Uploading data…' : 'Almost done…'}
              </p>
            )}
          </div>
        ) : (
          <>
            <Upload className="mx-auto" size={32} style={{ color: 'var(--muted)' }} />
            <p className="text-sm font-semibold mt-3" style={{ color: 'var(--text)' }}>Click or drop a file to upload</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>PDF, DOCX, images, archives up to {APP_CONSTANTS.MAX_FILE_SIZE_MB} MB</p>
          </>
        )}
      </Card>

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="animate-spin inline" size={20} style={{ color: 'var(--muted)' }} /></div>
      ) : files.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText size={32} className="mx-auto opacity-30" style={{ color: 'var(--muted)' }} />
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>No files uploaded yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {files.map((f) => (
            <Card key={f.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,109,52,0.15)' }}>
                  <FileText size={18} style={{ color: '#ff6d34' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{f.originalName}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{humanSize(f.size)} · {formatRelative(f.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-1 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <a href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}/api/v1/files/${f.id}/download`}
                  target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition flex-1 justify-center"
                  style={{ background: 'var(--bg)', color: 'var(--text)' }}>
                  <Download size={12} /> Download
                </a>
                <button onClick={() => copyUrl(f)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded transition"
                  style={{ background: 'var(--bg)', color: 'var(--muted)' }}>
                  {copiedId === f.id ? <Check size={12} style={{ color: '#00bea3' }} /> : <Copy size={12} />}
                </button>
                <button onClick={() => remove(f)} className="px-2 py-1.5 rounded transition" style={{ color: '#dc2626' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilesPage;
