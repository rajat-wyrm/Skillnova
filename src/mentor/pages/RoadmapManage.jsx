// ════════════════════════════════════════════════════════════
//  MENTOR — pages/RoadmapManage.jsx
//  Create learning paths, assign to interns, view completion progress
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Plus, Loader2, Trash2, Map, TrendingUp, X, Edit } from 'lucide-react';
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
  const [editingPath, setEditingPath] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    skillTags: '',
    milestones: [{ title: '', description: '', resourceUrl: '', duration: '' }],
  });
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

  const addMilestoneField = () =>
    setForm((f) => ({
      ...f,
      milestones: [...f.milestones, { title: '', description: '', resourceUrl: '', duration: '' }],
    }));

  const removeMilestoneField = (idx) =>
    setForm((f) => ({
      ...f,
      milestones: f.milestones.filter((_, i) => i !== idx),
    }));

  const updateMilestoneField = (idx, key, value) =>
    setForm((f) => ({
      ...f,
      milestones: f.milestones.map((m, i) => (i === idx ? { ...m, [key]: value } : m)),
    }));

  const handleEdit = (p) => {
    setEditingPath(p);
    setForm({
      title: p.title,
      description: p.description || '',
      skillTags: p.skillTags?.join(', ') || '',
      milestones: p.milestones?.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description || '',
        resourceUrl: m.resourceUrl || '',
        duration: m.duration || '',
        order: m.order,
      })) || [{ title: '', description: '', resourceUrl: '', duration: '' }],
    });
    setShowCreate(true);
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    setEditingPath(null);
    setForm({
      title: '',
      description: '',
      skillTags: '',
      milestones: [{ title: '', description: '', resourceUrl: '', duration: '' }],
    });
  };

  const savePath = async () => {
    if (!form.title.trim()) {
      notify.error('Title is required.');
      return;
    }
    setSaving(true);
    try {
      const skillTags = form.skillTags.split(',').map((s) => s.trim()).filter(Boolean);
      const formMilestones = form.milestones.filter((m) => m.title.trim());

      if (editingPath) {
        // 1. Update Path Info
        await api.patch(`/roadmap/${editingPath.id}`, {
          title: form.title,
          description: form.description || null,
          skillTags,
        });

        // 2. Identify deleted milestones (present in original but not in form)
        const originalMilestones = editingPath.milestones || [];
        const deleted = originalMilestones.filter((om) => !formMilestones.some((fm) => fm.id === om.id));
        for (const dm of deleted) {
          await api.delete(`/roadmap/${editingPath.id}/milestones/${dm.id}`);
        }

        // 3. Create or update milestones
        for (let i = 0; i < formMilestones.length; i++) {
          const fm = formMilestones[i];
          const payload = {
            title: fm.title,
            description: fm.description || null,
            resourceUrl: fm.resourceUrl || null,
            duration: fm.duration || null,
            order: i,
          };
          if (fm.id) {
            await api.patch(`/roadmap/${editingPath.id}/milestones/${fm.id}`, payload);
          } else {
            await api.post(`/roadmap/${editingPath.id}/milestones`, payload);
          }
        }

        notify.success('Learning path updated.');
      } else {
        // Create path
        await api.post('/roadmap', {
          title: form.title,
          description: form.description || undefined,
          skillTags,
          milestones: formMilestones.map((m, i) => ({
            title: m.title,
            description: m.description || undefined,
            resourceUrl: m.resourceUrl || undefined,
            duration: m.duration || undefined,
            order: i,
          })),
        });
        notify.success('Learning path created.');
      }

      handleCloseCreate();
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not save path.');
    } finally {
      setSaving(false);
    }
  };

  const deletePath = async (id) => {
    if (!window.confirm('Are you sure you want to delete this learning path?')) return;
    try {
      await api.delete(`/roadmap/${id}`);
      notify.success('Path deleted.');
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not delete path.');
    }
  };

  const assignPath = async () => {
    if (!assignUserId) {
      notify.error('Select an intern.');
      return;
    }
    try {
      await api.post(`/roadmap/${assignModalPath.id}/assign`, {
        userId: assignUserId,
        mentorGoal: assignGoal || undefined,
      });
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Learning Roadmaps"
        subtitle="Create skill paths and assign them to your interns"
        action={
          <PrimaryButton icon={Plus} onClick={() => setShowCreate(true)}>
            New Path
          </PrimaryButton>
        }
      />

      {paths.length === 0 && (
        <Card className="p-8 text-center">
          <Map className="mx-auto mb-3" size={28} style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            No learning paths yet. Create one to get started.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {paths.map((p) => (
          <Card key={p.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {p.title}
                  </h3>
                  {p.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {p.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(p)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    style={{ color: '#4f46e5' }}
                    title="Edit path"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deletePath(p.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    style={{ color: '#dc2626' }}
                    title="Delete path"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {!!p.skillTags?.length && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.skillTags.map((tag) => (
                    <Badge key={tag} variant="purple">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                {p.milestones?.length || 0} milestones · {p._count?.assignments || 0} interns assigned
              </p>
            </div>
            <div>
              <button
                onClick={() => setAssignModalPath(p)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity"
                style={{ background: '#00bea3' }}
              >
                Assign to intern
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Intern progress overview */}
      <Card className="overflow-hidden p-0">
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
          <TrendingUp size={16} style={{ color: 'var(--muted)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Intern completion progress
          </h3>
        </div>
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[40rem]">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Intern', 'Tasks', 'Attendance', 'Learning', 'Mentor Eval', 'Overall', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left"
                    style={{ color: 'var(--muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {progressList.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: 'var(--muted)' }}>
                    No progress data yet.
                  </td>
                </tr>
              )}
              {progressList.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>
                    {row.user?.name}
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>
                    {row.taskPct}%
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>
                    {row.attendancePct}%
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>
                    {row.learningPct}%
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>
                    {row.mentorEvalPct}%
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    {row.overallPct}%
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[row.finalStatus] || 'gray'}>
                      {row.finalStatus?.replace('_', ' ')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit path modal */}
      <Modal
        isOpen={showCreate}
        onClose={handleCloseCreate}
        title={editingPath ? 'Edit Learning Path' : 'New Learning Path'}
        footer={
          <>
            <button onClick={handleCloseCreate} className="px-4 py-2 text-sm rounded-lg text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <PrimaryButton onClick={savePath} className={saving ? 'opacity-60 pointer-events-none' : ''}>
              {saving ? 'Saving…' : editingPath ? 'Save Changes' : 'Create path'}
            </PrimaryButton>
          </>
        }
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Frontend Fundamentals"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description"
          />
          <Input
            label="Skill tags (comma separated)"
            value={form.skillTags}
            onChange={(e) => setForm({ ...form, skillTags: e.target.value })}
            placeholder="React, CSS, Git"
          />

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Milestones
            </label>
            <div className="space-y-3 mt-2">
              {form.milestones.map((m, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-800 space-y-2 relative"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {form.milestones.length > 1 && (
                    <button
                      onClick={() => removeMilestoneField(idx)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      title="Remove milestone"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div className="text-xs font-semibold text-slate-500">Milestone #{idx + 1}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={m.title}
                      onChange={(e) => updateMilestoneField(idx, 'title', e.target.value)}
                      placeholder="Title"
                      className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white flex-1"
                    />
                    <input
                      value={m.duration}
                      onChange={(e) => updateMilestoneField(idx, 'duration', e.target.value)}
                      placeholder="Duration (e.g. 2h, 1 week)"
                      className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white flex-1"
                    />
                  </div>
                  <input
                    value={m.description}
                    onChange={(e) => updateMilestoneField(idx, 'description', e.target.value)}
                    placeholder="Short description of this milestone"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <input
                    value={m.resourceUrl}
                    onChange={(e) => updateMilestoneField(idx, 'resourceUrl', e.target.value)}
                    placeholder="Resource URL (optional)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addMilestoneField}
              className="text-xs mt-2 font-medium"
              style={{ color: '#ff6d34' }}
            >
              + Add milestone
            </button>
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
            <button onClick={() => setAssignModalPath(null)} className="px-4 py-2 text-sm rounded-lg text-slate-600">
              Cancel
            </button>
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
              className="w-full mt-1.5 px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Select an intern…</option>
              {interns.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Mentor goal (optional)"
            value={assignGoal}
            onChange={(e) => setAssignGoal(e.target.value)}
            placeholder="e.g. Focus on completing this before next sprint"
          />
        </div>
      </Modal>
    </div>
  );
};

export default RoadmapManage;
