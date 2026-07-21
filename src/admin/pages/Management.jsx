// ════════════════════════════════════════════════════════════
//  ADMIN — pages/Management.jsx (Interns API)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Search, Loader2, ClipboardList, Star, CheckCircle, XCircle } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal, Input } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const Management = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', role: 'INTERN' });

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/analytics/interns');
      setInterns(data.items);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const filtered = interns.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.department || '').toLowerCase().includes(search.toLowerCase())
  );

  const addIntern = async () => {
    if (!form.name || !form.email) return notify.error('Fill required fields.');
    if (!window.confirm(`Add intern "${form.name}"?`)) return;
    try {
      await api.post('/users', { ...form, skills: '' });
      notify.success('Intern added.');
      setModal(false);
      setForm({ name: '', email: '', password: '', department: '', role: 'INTERN' });
      fetch();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed.');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Intern Management" subtitle="Track intern performance, tasks and attendance"
        action={
          <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium" style={{ background: '#ff6d34' }}>
            <ClipboardList size={14} /> Add Intern
          </button>
        } />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Interns', value: interns.length, bg: '#EFF6FF', color: '#1D4ED8' },
          { label: 'Avg Score', value: interns.length ? (interns.reduce((s, i) => s + (i.avgScore || 0), 0) / interns.length).toFixed(1) : 0, bg: '#E6FAF8', color: '#00bea3' },
          { label: 'Tasks Done', value: interns.reduce((s, i) => s + (i.completedTasks || 0), 0), bg: '#F5F3FF', color: '#7C3AED' },
          { label: 'Avg Attendance', value: `${interns.length ? Math.round(interns.reduce((s, i) => s + (i.attendanceRate || 0), 0) / interns.length) : 0}%`, bg: '#FFF3EE', color: '#ff6d34' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: s.bg }}>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search interns…"
          className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[44rem]">
            <thead><tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Department', 'Avg Score', 'Tasks Done', 'Attendance', 'Status'].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>{i.name}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--muted)' }}>{i.department || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: (i.avgScore || 0) >= 7 ? 'rgba(0,190,163,0.12)' : 'rgba(245,158,11,0.12)', color: (i.avgScore || 0) >= 7 ? '#00bea3' : '#d97706' }}>
                      ⭐ {i.avgScore || '—'}/10
                    </span>
                  </td>
                  <td className="px-5 py-4" style={{ color: 'var(--text)' }}>{i.completedTasks}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: (i.attendanceRate || 0) >= 90 ? 'rgba(0,190,163,0.12)' : 'rgba(245,158,11,0.12)', color: (i.attendanceRate || 0) >= 90 ? '#00bea3' : '#d97706' }}>
                      {i.attendanceRate || 0}%
                    </span>
                  </td>
                  <td className="px-5 py-4"><Badge variant={i.attendanceRate >= 75 ? 'success' : 'warning'}>{i.attendanceRate >= 75 ? 'On Track' : 'At Risk'}</Badge></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>No interns match your search.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Intern"
        footer={
          <>
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={addIntern} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ background: '#00bea3' }}>Create</button>
          </>
        }>
        <div className="space-y-4">
          <Input label="Full name" placeholder="e.g. Rahul Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" placeholder="rahul@skillnova.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Department" placeholder="e.g. AI / ML" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Input label="Initial password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
};

export default Management;
