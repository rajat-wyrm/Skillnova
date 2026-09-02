// ════════════════════════════════════════════════════════════
//  ADMIN — pages/LearningBadges.jsx
//  Badge management (CRUD, criteria rules) + internship
//  completion leaderboard / learning analytics
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2, Award, RefreshCw, Trophy } from 'lucide-react';
import { Card, SectionHeader, Badge, PrimaryButton, Modal, Input, StatCard } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const BADGE_TYPES = ['ATTENDANCE', 'PROJECT_COMPLETION', 'SKILL_MASTERY', 'TOP_PERFORMER', 'CUSTOM'];
const METRICS = ['attendancePct', 'taskPct', 'learningPct', 'overallPct'];
const STATUS_VARIANT = { NOT_STARTED: 'gray', IN_PROGRESS: 'warning', COMPLETED: 'success' };

const LearningBadges = () => {
  const [badges, setBadges] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'CUSTOM', metric: '', gte: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [b, p] = await Promise.all([
        api.get('/badges'),
        api.get('/progress/list', { params: { limit: 50, sort: 'overallPct' } }),
      ]);
      setBadges(b.data.items || []);
      setProgressList(p.data.items || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const createBadge = async () => {
    if (!form.name.trim()) { notify.error('Name is required.'); return; }
    setSaving(true);
    try {
      const criteria = form.metric && form.gte ? { metric: form.metric, gte: Number(form.gte) } : undefined;
      await api.post('/badges', {
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        criteria,
      });
      notify.success('Badge created.');
      setShowCreate(false);
      setForm({ name: '', description: '', type: 'CUSTOM', metric: '', gte: '' });
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not create badge.');
    } finally {
      setSaving(false);
    }
  };

  const deleteBadge = async (id) => {
    try {
      await api.delete(`/badges/${id}`);
      notify.success('Badge deleted.');
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not delete badge.');
    }
  };

  const recomputeAll = async () => {
    setRecomputing(true);
    try {
      const r = await api.post('/progress/recompute-all');
      notify.success(`Recomputed progress for ${r.data.count} interns.`);
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Recompute failed.');
    } finally {
      setRecomputing(false);
    }
  };

  const evaluateTopPerformers = async () => {
    try {
      const r = await api.post('/badges/evaluate', {});
      notify.success(`Top performer badges awarded: ${r.data.topPerformers?.length ?? 0}`);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Evaluation failed.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  const avgOverall = progressList.length
    ? Math.round((progressList.reduce((s, p) => s + p.overallPct, 0) / progressList.length) * 10) / 10
    : 0;
  const completedCount = progressList.filter((p) => p.finalStatus === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Badges & Learning Analytics"
        subtitle="Manage achievement badges and monitor internship completion across all interns"
        action={<PrimaryButton icon={Plus} onClick={() => setShowCreate(true)}>New Badge</PrimaryButton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Badges" value={badges.length} icon={Award} color="#ff6d34" />
        <StatCard title="Interns Tracked" value={progressList.length} icon={Trophy} color="#00bea3" />
        <StatCard title="Avg. Completion" value={`${avgOverall}%`} icon={Trophy} color="#3b82f6" />
        <StatCard title="Fully Completed" value={completedCount} icon={Trophy} color="#a855f7" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={recomputeAll} disabled={recomputing} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <RefreshCw size={14} className={recomputing ? 'animate-spin' : ''} /> Recompute all progress
        </button>
        <button onClick={evaluateTopPerformers} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <Trophy size={14} /> Evaluate top performers
        </button>
      </div>

      {/* Badge list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((b) => (
          <Card key={b.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#ff6d3420' }}>
                <Award size={18} style={{ color: '#ff6d34' }} />
              </div>
              <button onClick={() => deleteBadge(b.id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}><Trash2 size={15} /></button>
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{b.name}</h3>
            {b.description && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{b.description}</p>}
            <div className="flex items-center justify-between mt-3">
              <Badge variant="gray">{b.type.replace('_', ' ')}</Badge>
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{b._count?.awards ?? 0} awarded</span>
            </div>
            {b.criteria?.metric && (
              <p className="text-[11px] mt-2" style={{ color: 'var(--muted)' }}>Auto-awards when {b.criteria.metric} ≥ {b.criteria.gte}%</p>
            )}
          </Card>
        ))}
      </div>

      {/* Completion leaderboard */}
      <Card className="overflow-hidden p-0">
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Completion leaderboard</h3>
        </div>
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[40rem]">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Intern', 'Department', 'Overall', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {progressList.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>{row.user?.name}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{row.user?.department ?? '—'}</td>
                  <td className="px-5 py-4 text-xs font-semibold" style={{ color: 'var(--text)' }}>{row.overallPct}%</td>
                  <td className="px-5 py-4"><Badge variant={STATUS_VARIANT[row.finalStatus] || 'gray'}>{row.finalStatus?.replace('_', ' ')}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create badge modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New badge"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg text-slate-600">Cancel</button>
            <PrimaryButton onClick={createBadge} className={saving ? 'opacity-60 pointer-events-none' : ''}>{saving ? 'Saving…' : 'Create badge'}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Perfect Attendance" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1.5 px-3 py-2.5 text-sm rounded-xl border border-slate-200">
              {BADGE_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Auto-award metric (optional)</label>
              <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className="w-full mt-1.5 px-3 py-2.5 text-sm rounded-xl border border-slate-200">
                <option value="">None (manual only)</option>
                {METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <Input label="Threshold (%)" type="number" value={form.gte} onChange={(e) => setForm({ ...form, gte: e.target.value })} placeholder="e.g. 95" disabled={!form.metric} />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default LearningBadges;
