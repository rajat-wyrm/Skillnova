// ════════════════════════════════════════════════════════════
//  MENTOR — pages/RoadmapManage.jsx
//  Create learning paths, assign to interns, view completion progress
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2, Map, TrendingUp, X } from 'lucide-react';
import { Card, SectionHeader, Badge, PrimaryButton, Modal, Input } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const STATUS_VARIANT = { NOT_STARTED: 'gray', IN_PROGRESS: 'warning', COMPLETED: 'success' };

const RoadmapManage = () => {
  const [paths, setPaths] = useState([]);
  const [interns, setInterns] = useState([]);
  const [progressList, setProgressList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', skillTags: '', milestones: [{ title: '', resourceUrl: '' }] });
  const [saving, setSaving] = useState(false);

  const [assignModalPath, setAssignModalPath] = useState(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignGoal, setAssignGoal] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, i, pr] = await Promise.all([
        api.get('/roadmap'),
        api.get('/users', { params: { role: 'INTERN', limit: 100 } }),
        api.get('/progress/list', { params: { limit: 50 } }),
      ]);
      setPaths(p.data.items || []);
      setInterns(i.data.items || []);
      setProgressList(pr.data.items || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const addMilestoneField = () => setForm((f) => ({ ...f, milestones: [...f.milestones, { title: '', resourceUrl: '' }] }));
  const removeMilestoneField = (idx) => setForm((f) => ({ ...f, milestones: f.milestones.filter((_, i) => i !== idx) }));
  const updateMilestoneField = (idx, key, value) =>
    setForm((f) => ({ ...f, milestones: f.milestones.map((m, i) => (i === idx ? { ...m, [key]: value } : m)) }));

  const createPath = async () => {
    if (!form.title.trim()) { notify.error('Title is required.'); return; }
    setSaving(true);
    try {
      await api.post('/roadmap', {
        title: form.title,
        description: form.description || undefined,
        skillTags: form.skillTags.split(',').map((s) => s.trim()).filter(Boolean),
        milestones: form.milestones.filter((m) => m.title.trim()).map((m, i) => ({
          title: m.title,
          resourceUrl: m.resourceUrl || undefined,
          order: i,
        })),
      });
      notify.success('Learning path created.');
      setShowCreate(false);
      setForm({ title: '', description: '', skillTags: '', milestones: [{ title: '', resourceUrl: '' }] });
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not create path.');
    } finally {
      setSaving(false);
    }
  };

  const deletePath = async (id) => {
    try {
      await api.delete(`/roadmap/${id}`);
      notify.success('Path deleted.');
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not delete path.');
    }
  };

  const assignPath = async () => {
    if (!assignUserId) { notify.error('Select an intern.'); return; }
    try {
      await api.post(`/roadmap/${assignModalPath.id}/assign`, { userId: assignUserId, mentorGoal: assignGoal || undefined });
      notify.success('Path assigned.');
      setAssignModalPath(null);
      setAssignUserId('');
      setAssignGoal('');
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not assign path.');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Learning Roadmaps"
        subtitle="Create skill paths and assign them to your interns"
        action={<PrimaryButton icon={Plus} onClick={() => setShowCreate(true)}>New Path</PrimaryButton>}
      />

      {paths.length === 0 && (
        <Card className="p-8 text-center">
          <Map className="mx-auto mb-3" size={28} style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No learning paths yet. Create one to get started.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {paths.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.title}</h3>
                {p.description && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{p.description}</p>}
              </div>
              <button onClick={() => deletePath(p.id)} className="p-1.5 rounded-lg" style={{ color: '#dc2626' }}>
                <Trash2 size={15} />
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>{p.milestones?.length || 0} milestones · {p._count?.assignments || 0} interns assigned</p>
            <button
              onClick={() => setAssignModalPath(p)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-white"
              style={{ background: '#00bea3' }}
            >
              Assign to intern
            </button>
          </Card>
        ))}
      </div>

      {/* Intern progress overview */}
      <Card className="overflow-hidden p-0">
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <TrendingUp size={16} style={{ color: 'var(--muted)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Intern completion progress</h3>
        </div>
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[40rem]">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Intern', 'Tasks', 'Attendance', 'Learning', 'Mentor Eval', 'Overall', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {progressList.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: 'var(--muted)' }}>No progress data yet.</td></tr>
              )}
              {progressList.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>{row.user?.name}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{row.taskPct}%</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{row.attendancePct}%</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{row.learningPct}%</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{row.mentorEvalPct}%</td>
                  <td className="px-5 py-4 text-xs font-semibold" style={{ color: 'var(--text)' }}>{row.overallPct}%</td>
                  <td className="px-5 py-4"><Badge variant={STATUS_VARIANT[row.finalStatus] || 'gray'}>{row.finalStatus?.replace('_', ' ')}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create path modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New learning path"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg text-slate-600">Cancel</button>
            <PrimaryButton onClick={createPath} className={saving ? 'opacity-60 pointer-events-none' : ''}>{saving ? 'Saving…' : 'Create path'}</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Frontend Fundamentals" />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
          <Input label="Skill tags (comma separated)" value={form.skillTags} onChange={(e) => setForm({ ...form, skillTags: e.target.value })} placeholder="React, CSS, Git" />

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Milestones</label>
            <div className="space-y-2 mt-1.5">
              {form.milestones.map((m, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    value={m.title}
                    onChange={(e) => updateMilestoneField(idx, 'title', e.target.value)}
                    placeholder={`Milestone ${idx + 1} title`}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                  <input
                    value={m.resourceUrl}
                    onChange={(e) => updateMilestoneField(idx, 'resourceUrl', e.target.value)}
                    placeholder="Resource URL (optional)"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200"
                  />
                  {form.milestones.length > 1 && (
                    <button onClick={() => removeMilestoneField(idx)} className="p-1.5 text-red-500"><X size={14} /></button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addMilestoneField} className="text-xs mt-2 font-medium" style={{ color: '#ff6d34' }}>+ Add milestone</button>
          </div>
        </div>
      </Modal>

      {/* Assign modal */}
      <Modal
        isOpen={!!assignModalPath}
        onClose={() => setAssignModalPath(null)}
        title={`Assign "${assignModalPath?.title ?? ''}"`}
        footer={
          <>
            <button onClick={() => setAssignModalPath(null)} className="px-4 py-2 text-sm rounded-lg text-slate-600">Cancel</button>
            <PrimaryButton onClick={assignPath}>Assign</PrimaryButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Intern</label>
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 text-sm rounded-xl border border-slate-200"
            >
              <option value="">Select an intern…</option>
              {interns.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <Input label="Mentor goal (optional)" value={assignGoal} onChange={(e) => setAssignGoal(e.target.value)} placeholder="e.g. Focus on completing this before next sprint" />
        </div>
      </Modal>
    </div>
  );
};

export default RoadmapManage;
