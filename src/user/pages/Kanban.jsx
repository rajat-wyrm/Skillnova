import { useEffect, useState } from 'react';
import { ListChecks, Loader2 } from 'lucide-react';
import { Card, SectionHeader } from '../../shared/components/UI';
import KanbanBoard from '../../shared/components/KanbanBoard';
import api from '../../lib/api';
import notify from '../../lib/toast';

const Kanban = () => {
  const [projects, setProjects] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true);
    api.get('/projects', { params: { limit: 50 } })
      .then((r) => {
        setProjects(r.data.items);
        if (r.data.items[0]) setActive(r.data.items[0].id);
      })
      .catch(() => notify.error('Failed to load projects.'))
      .finally(() => setLoading(false));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (loading) return <div className="py-12 text-center"><Loader2 className="animate-spin inline" size={20} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="space-y-4">
      <SectionHeader title="Task Board" subtitle="Drag tasks across columns to update status" />
      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <ListChecks size={32} className="mx-auto opacity-30" style={{ color: 'var(--muted)' }} />
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>No projects yet.</p>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {projects.map((p) => (
              <button key={p.id} onClick={() => setActive(p.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                style={{
                  background: active === p.id ? '#ff6d34' : 'var(--card)',
                  color: active === p.id ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}>
                {p.name}
              </button>
            ))}
          </div>
          {active && <KanbanBoard projectId={active} canEdit={true} />}
        </>
      )}
    </div>
  );
};

export default Kanban;
