import { useState } from 'react';
import { Download, FileText, Users, Calendar } from 'lucide-react';
import { Card, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const formatDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const Exports = () => {
  const [busy, setBusy] = useState(null);

  const dl = async (kind, format) => {
    setBusy(`${kind}-${format}`);
    try {
      const res = await api.get(`/exports/${kind}?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `skillnova-${kind}-${formatDate()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      notify.success(`Exported ${kind}`);
    } catch (err) { notify.error(err.response?.data?.error || 'Export failed'); }
    setBusy(null);
  };

  const items = [
    { id: 'reports',    label: 'Reports',      desc: 'Your weekly progress reports', icon: FileText, color: '#ff6d34', adminOnly: false },
    { id: 'attendance', label: 'Attendance',   desc: 'Your attendance records',       icon: Calendar, color: '#00bea3', adminOnly: false },
    { id: 'users',      label: 'Users',        desc: 'All users (admin only)',        icon: Users,    color: '#7C3AED', adminOnly: true },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader title="Data Export" subtitle="Download your data as CSV or JSON" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((it) => (
          <Card key={it.id} className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-lg" style={{ background: `${it.color}22` }}>
                <it.icon size={20} style={{ color: it.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{it.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{it.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['csv', 'json'].map((fmt) => (
                <button key={fmt}
                  onClick={() => dl(it.id, fmt)}
                  disabled={busy === `${it.id}-${fmt}` || (it.adminOnly && false)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition"
                  style={{
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    opacity: busy && busy !== `${it.id}-${fmt}` ? 0.5 : 1,
                  }}>
                  {busy === `${it.id}-${fmt}` ? <span className="sn-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : <Download size={12} />}
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Exports;
