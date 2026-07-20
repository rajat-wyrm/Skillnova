// Mentor Projects — list projects + manage interns
import { useEffect, useState, useCallback } from 'react';
import { Activity, CheckCircle, Loader2, UserPlus, X } from 'lucide-react';
import { Card, Badge, SectionHeader, PrimaryButton } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);   // which project card is expanded
  const [allInterns, setAllInterns] = useState([]);
  const [projectInterns, setProjectInterns] = useState([]); // interns on the open project
  const [busy, setBusy] = useState(false);

  const loadProjects = useCallback(() => {
    api.get('/projects', { params: { limit: 50 } })
      .then((r) => setProjects(r.data.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const openPanel = async (projectId) => {
    if (openId === projectId) { setOpenId(null); return; }
    setOpenId(projectId);
    setBusy(true);
    try {
      const [all, detail] = await Promise.all([
        api.get('/users', { params: { role: 'INTERN', limit: 100 } }),
        api.get(`/projects/${projectId}`),
      ]);
      setAllInterns(all.data.items);
      setProjectInterns(detail.data.project?.interns?.map((i) => i.user).filter(Boolean) || []);
    } catch { notify.error('Failed to load interns'); }
    setBusy(false);
  };

  const addIntern = async (userId) => {
    setBusy(true);
    try {
      await api.patch(`/projects/${openId}/interns`, { userId });
      notify.success('Intern added to project');
      const intern = allInterns.find((i) => i.id === userId);
      if (intern) setProjectInterns((arr) => [...arr, intern]);
      loadProjects();
    } catch (err) { notify.error(err.response?.data?.error || 'Failed to add intern'); }
    setBusy(false);
  };

  const removeIntern = async (userId) => {
    setBusy(true);
    try {
      await api.patch(`/projects/${openId}/interns`, { userId, remove: true });
      notify.success('Intern removed from project');
      setProjectInterns((arr) => arr.filter((i) => i.id !== userId));
      loadProjects();
    } catch (err) { notify.error(err.response?.data?.error || 'Failed to remove intern'); }
    setBusy(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const assignedIds = new Set(projectInterns.map((i) => i.id));
  const availableInterns = allInterns.filter((i) => !assignedIds.has(i.id));

  return (
    <div className="space-y-6">
      <SectionHeader title="Projects & Tasks" subtitle="Manage projects and assign tasks to interns" />
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{p.name}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{p.description}</p>
              </div>
              <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'COMPLETED' ? 'default' : 'warning'}>{p.status}</Badge>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><Activity size={11} /> {p._count?.tasks ?? 0} tasks</span>
                <span className="flex items-center gap-1"><CheckCircle size={11} /> {p._count?.interns ?? 0} interns</span>
              </div>
              <button onClick={() => openPanel(p.id)} className="flex items-center gap-1 font-medium" style={{ color: '#ff6d34' }}>
                <UserPlus size={12} /> {openId === p.id ? 'Close' : 'Manage interns'}
              </button>
            </div>

            {openId === p.id && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                {busy ? (
                  <div className="py-4 text-center"><Loader2 className="animate-spin inline" size={16} style={{ color: 'var(--muted)' }} /></div>
                ) : (
                  <>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>ON THIS PROJECT</p>
                    {projectInterns.length === 0 ? (
                      <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>No interns yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {projectInterns.map((i) => (
                          <span key={i.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                            {i.name}
                            <button onClick={() => removeIntern(i.id)}><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>ADD AN INTERN</p>
                    {availableInterns.length === 0 ? (
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>All interns are already on this project.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableInterns.map((i) => (
                          <button key={i.id} onClick={() => addIntern(i.id)}
                            className="text-xs px-2 py-1 rounded-full" style={{ background: '#ff6d34', color: '#fff' }}>
                            + {i.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Projects;
