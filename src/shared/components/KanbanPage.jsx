// ════════════════════════════════════════════════════════════
//  KanbanPage — project picker + board
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { ListChecks, Loader2 } from 'lucide-react';
import { Card, SectionHeader } from './UI';
import { EmptyState } from './Skeleton';
import KanbanBoard from './KanbanBoard';
import api from '../../lib/api';
import notify from '../../lib/toast';

const KanbanPage = ({ canEdit = true }) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <SectionHeader title="Task Board" subtitle="Drag tasks across columns to update status" />
      {projects.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No projects yet"
          description="Create a project from the Projects menu to start adding tasks."
        />
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
          {active && <KanbanBoard projectId={active} canEdit={canEdit} />}
        </>
      )}
    </div>
  );
};

export default KanbanPage;
