// ════════════════════════════════════════════════════════════
//  Mentor — pages/Assignments.jsx
//  Pick a project, see its interns, create + assign tasks,
//  and see who has what open.
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2, ListChecks, Clock } from 'lucide-react';
import { Card, SectionHeader, Badge, PrimaryButton } from '../../shared/components/UI';
import { TaskModal } from '../../shared/components/KanbanBoard';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatRelative } from '../../lib/utils';

const STATUS_VARIANT = { TODO: 'default', IN_PROGRESS: 'warning', REVIEW: 'default', DONE: 'success', BLOCKED: 'danger' };

const Assignments = () => {
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTask, setModalTask] = useState(null);

  const loadProject = useCallback(async () => {
    if (!activeId) return;
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        api.get(`/projects/${activeId}`),
        api.get('/tasks', { params: { projectId: activeId, limit: 100 } }),
      ]);
      setProject(p.data.project);
      setTasks(t.data.items);
    } catch { notify.error('Failed to load project'); }
    setLoading(false);
  }, [activeId]);

  useEffect(() => {
  api.get('/projects', { params: { limit: 50 } })
    .then((r) => {
      setProjects(r.data.items);
      if (r.data.items[0]) setActiveId(r.data.items[0].id);
    })
    .catch(() => notify.error('Failed to load projects'));
}, []);

  const interns = (project?.interns || []).map((i) => i.user).filter(Boolean);

  const tasksFor = (internId) => tasks.filter((t) => t.assigneeId === internId);
  const unassigned = tasks.filter((t) => !t.assigneeId);

  const onSaveTask = async (data) => {
    if (data.id) {
      await api.patch(`/tasks/${data.id}`, {
        title: data.title, description: data.description, priority: data.priority,
        status: data.status, dueDate: data.dueDate, assigneeId: data.assigneeId,
        attachmentIds: data.attachmentIds,
      });
      notify.success('Assignment updated');
    } else {
      await api.post('/tasks', {
        projectId: data.projectId, title: data.title, description: data.description,
        priority: data.priority, status: data.status, dueDate: data.dueDate,
        assigneeId: data.assigneeId, attachmentIds: data.attachmentIds,
      });
      notify.success('Task assigned');
    }
    loadProject();
  };

  const onDeleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await api.delete(`/tasks/${task.id}`);
    notify.success('Deleted');
    setModalTask(null);
    loadProject();
  };

  const newAssignment = (internId) => setModalTask({ title: '', priority: 'MEDIUM', status: 'TODO', projectId: activeId, assigneeId: internId || '', id: null });

  if (loading && projects.length === 0) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Assignments"
        subtitle="Assign tasks to your interns and track who's working on what"
        action={<PrimaryButton icon={Plus} onClick={() => newAssignment('')}>New assignment</PrimaryButton>}
      />

      <div className="flex gap-2 flex-wrap">
        {projects.map((p) => (
          <button key={p.id} onClick={() => setActiveId(p.id)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition"
            style={{ background: activeId === p.id ? '#7C3AED' : 'var(--card)', color: activeId === p.id ? '#fff' : 'var(--text)', border: '1px solid var(--border)' }}>
            {p.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="animate-spin inline" size={20} style={{ color: 'var(--muted)' }} /></div>
      ) : !project ? (
        <Card className="p-12 text-center">
          <ListChecks size={32} className="mx-auto opacity-30" style={{ color: 'var(--muted)' }} />
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>No projects yet — create one from Projects first.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {interns.length === 0 && (
            <Card className="p-6 md:col-span-2 text-center text-sm" style={{ color: 'var(--muted)' }}>
              No interns are on this project yet.
            </Card>
          )}
          {interns.map((intern) => {
            const list = tasksFor(intern.id);
            return (
              <Card key={intern.id} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #ff6d34, #00bea3)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {intern.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{intern.name}</h3>
                  </div>
                  <button onClick={() => newAssignment(intern.id)} className="text-xs font-medium flex items-center gap-1" style={{ color: '#ff6d34' }}>
                    <Plus size={12} /> Assign
                  </button>
                </div>
                {list.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: 'var(--muted)' }}>No tasks assigned.</p>
                ) : (
                  <div className="space-y-2">
                    {list.map((t) => (
                      <div key={t.id} onClick={() => setModalTask(t)}
                        className="p-3 rounded-lg cursor-pointer transition"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{t.title}</p>
                          <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace('_', ' ')}</Badge>
                        </div>
                        {t.dueDate && (
                          <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                            <Clock size={10} /> Due {formatRelative(t.dueDate)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}

          {unassigned.length > 0 && (
            <Card className="p-5 md:col-span-2">
              <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text)' }}>Unassigned ({unassigned.length})</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {unassigned.map((t) => (
                  <div key={t.id} onClick={() => setModalTask(t)}
                    className="p-3 rounded-lg cursor-pointer transition flex items-center justify-between gap-2"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{t.title}</p>
                    <Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace('_', ' ')}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {modalTask && (
        <TaskModal task={modalTask} interns={interns} onClose={() => setModalTask(null)} onSave={onSaveTask} onDelete={onDeleteTask} />
      )}
    </div>
  );
};

export default Assignments;