// ════════════════════════════════════════════════════════════
//  ADMIN — pages/LearningBadges.jsx
//  Badge management (CRUD, criteria rules) + internship
//  completion leaderboard / learning analytics
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2, Award, RefreshCw, Trophy, Edit, UserPlus, X } from 'lucide-react';
import { Card, SectionHeader, Badge, PrimaryButton, Modal, Input, StatCard } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const BADGE_TYPES = ['ATTENDANCE', 'PROJECT_COMPLETION', 'SKILL_MASTERY', 'TOP_PERFORMER', 'CUSTOM'];
const METRICS = ['attendancePct', 'taskPct', 'learningPct', 'overallPct'];
const STATUS_VARIANT = { NOT_STARTED: 'gray', IN_PROGRESS: 'warning', COMPLETED: 'success' };

const LearningBadges = () => {
  const [badges, setBadges] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', type: 'CUSTOM', metric: '', gte: '' });
  const [saving, setSaving] = useState(false);

  const [awardModalBadge, setAwardModalBadge] = useState(null);
  const [awardUserId, setAwardUserId] = useState('');
  const [awardNote, setAwardNote] = useState('');
  const [awarding, setAwarding] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [b, p, u] = await Promise.all([
        api.get('/badges'),
        api.get('/progress/list', { params: { limit: 50, sort: 'overallPct' } }),
        api.get('/users', { params: { role: 'INTERN', limit: 100 } }),
      ]);
      setBadges(b.data.items || []);
      setProgressList(p.data.items || []);
      setInterns(u.data.items || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleEdit = (b) => {
    setEditingBadge(b);
    setForm({
      name: b.name,
      description: b.description || '',
      type: b.type,
      metric: b.criteria?.metric || '',
      gte: b.criteria?.gte || '',
    });
    setShowCreate(true);
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    setEditingBadge(null);
    setForm({ name: '', description: '', type: 'CUSTOM', metric: '', gte: '' });
  };

  const saveBadge = async () => {
    if (!form.name.trim()) { notify.error('Name is required.'); return; }
    setSaving(true);
    try {
      const criteria = form.metric && form.gte ? { metric: form.metric, gte: Number(form.gte) } : null;
      if (editingBadge) {
        await api.patch(`/badges/${editingBadge.id}`, {
          name: form.name,
          description: form.description || null,
          type: form.type,
          criteria,
        });
        notify.success('Badge updated.');
      } else {
        await api.post('/badges', {
          name: form.name,
          description: form.description || undefined,
          type: form.type,
          criteria: criteria || undefined,
        });
        notify.success('Badge created.');
      }
      handleCloseCreate();
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not save badge.');
    } finally {
      setSaving(false);
    }
  };

  const deleteBadge = async (id) => {
    if (!window.confirm('Are you sure you want to delete this badge?')) return;
    try {
      await api.delete(`/badges/${id}`);
      notify.success('Badge deleted.');
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not delete badge.');
    }
  };

  const awardBadgeManually = async () => {
    if (!awardUserId) { notify.error('Select an intern.'); return; }
    setAwarding(true);
    try {
      await api.post(`/badges/${awardModalBadge.id}/award`, {
        userId: awardUserId,
        note: awardNote || undefined,
      });
      notify.success('Badge awarded.');
      setAwardModalBadge(null);
      setAwardUserId('');
      setAwardNote('');
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not award badge.');
    } finally {
      setAwarding(false);
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
      fetchAll();
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
        <button onClick={recomputeAll} disabled={recomputing} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <RefreshCw size={14} className={recomputing ? 'animate-spin' : ''} /> Recompute all progress
        </button>
        <button onClick={evaluateTopPerformers} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <Trophy size={14} /> Evaluate top performers
        </button>
      </div>

      {/* Badge list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((b) => (
          <Card key={b.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#ff6d3420' }}>
                  <Award size={18} style={{ color: '#ff6d34' }} />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(b)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ color: '#4f46e5' }} title="Edit badge"><Edit size={14} /></button>
                  <button onClick={() => deleteBadge(b.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ color: '#dc2626' }} title="Delete badge"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{b.name}</h3>
              {b.description && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{b.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <Badge variant="gray">{b.type.replace('_', ' ')}</Badge>
                <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{b._count?.awards ?? 0} awarded</span>
              </div>
              {b.criteria?.metric && (
                <p className="text-[11px] mt-2 italic" style={{ color: 'var(--muted)' }}>Auto-awards when {b.criteria.metric} ≥ {b.criteria.gte}%</p>
              )}

              {/* Earners section */}
              {b.awards && b.awards.length > 0 && (
                <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-[11px] font-semibold mb-1" style={{ color: 'var(--text)' }}>Earners:</p>
                  <div className="flex flex-wrap gap-1">
                    {b.awards.map((aw) => (
                      <span key={aw.id} className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'var(--bg)', color: 'var(--text)' }} title={aw.note || 'No custom note'}>
                        {aw.user?.name} {aw.note && '📝'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-2">
              <button
                onClick={() => setAwardModalBadge(b)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
                style={{ background: '#00bea3' }}
              >
                <UserPlus size={13} /> Award Badge
              </button>
            </div>
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
                {['Intern', 'Department', 'Overall Progress', 'Status'].map((h) => (
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

      {/* Create / Edit badge modal */}
      <Modal
        isOpen={showCreate}
        onClose={handleCloseCreate}
        title={editingBadge ? 'Edit Badge' : 'New Badge'}
        footer={
          <>
            <button onClick={handleCloseCreate} className="px-4 py-2 text-sm rounded-lg text-slate-600 dark:text-slate-300">Cancel</button>
            <PrimaryButton onClick={saveBadge} className={saving ? 'opacity-60 pointer-events-none' : ''}>{saving ? 'Saving…' : editingBadge ? 'Save Changes' : 'Create badge'}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Perfect Attendance" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1.5 px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
              {BADGE_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Auto-award metric (optional)</label>
              <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className="w-full mt-1.5 px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                <option value="">None (manual only)</option>
                {METRICS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <Input label="Threshold (%)" type="number" value={form.gte} onChange={(e) => setForm({ ...form, gte: e.target.value })} placeholder="e.g. 95" disabled={!form.metric} />
          </div>
        </div>
      </Modal>

      {/* Manual award modal */}
      <Modal
        isOpen={!!awardModalBadge}
        onClose={() => setAwardModalBadge(null)}
        title={`Award "${awardModalBadge?.name ?? ''}"`}
        footer={
          <>
            <button onClick={() => setAwardModalBadge(null)} className="px-4 py-2 text-sm rounded-lg text-slate-600 dark:text-slate-300">Cancel</button>
            <PrimaryButton onClick={awardBadgeManually} className={awarding ? 'opacity-60 pointer-events-none' : ''}>{awarding ? 'Awarding…' : 'Award'}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Intern</label>
            <select
              value={awardUserId}
              onChange={(e) => setAwardUserId(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Select an intern…</option>
              {interns.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <Input label="Custom Award Note (optional)" value={awardNote} onChange={(e) => setAwardNote(e.target.value)} placeholder="e.g. Exhibited exceptional teamwork during the system outage recovery." />
        </div>
      </Modal>
    </div>
  );
};

export default LearningBadges;
