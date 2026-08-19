// Mentor Projects — list projects + tasks
import { useEffect, useState } from 'react';
import { Activity, CheckCircle, Loader2 } from 'lucide-react';
import { Card, Badge, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects', { params: { limit: 50 } })
      .then((r) => setProjects(r.data.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

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
            <div className="flex items-center gap-4 mt-3 pt-3 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}>
              <span className="flex items-center gap-1"><Activity size={11} /> {p._count?.tasks ?? 0} tasks</span>
              <span className="flex items-center gap-1"><CheckCircle size={11} /> {p._count?.interns ?? 0} interns</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Projects;
