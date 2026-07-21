// ════════════════════════════════════════════════════════════
//  KanbanPage — team picker + collaborative board
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { SectionHeader } from './UI';
import { EmptyState } from './Skeleton';
import KanbanBoard from './KanbanBoard';
import api from '../../lib/api';
import notify from '../../lib/toast';

const KanbanPage = ({ canEdit = true }) => {
  const [teams, setTeams] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeRequest = true;
    api.get('/collab-tasks/teams')
      .then((r) => {
        if (!activeRequest) return;
        const fetchedTeams = r.data.teams || [];
        setTeams(fetchedTeams);
        if (fetchedTeams[0]) {
          setActive(fetchedTeams[0].id);
        }
      })
      .catch(() => notify.error('Failed to load collaborative teams.'))
      .finally(() => {
        if (activeRequest) setLoading(false);
      });

    return () => {
      activeRequest = false;
    };
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
      <SectionHeader title="Collaborative Task Board" subtitle="Manage and assign tasks within your team" />
      {teams.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No teams assigned"
          description="You are not assigned to any collaborative teams yet. Contact your mentor or administrator."
        />
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            {teams.map((t) => (
              <button key={t.id} onClick={() => setActive(t.id)}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                style={{
                  background: active === t.id ? '#ff6d34' : 'var(--card)',
                  color: active === t.id ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}>
                {t.name}
              </button>
            ))}
          </div>
          {active && <KanbanBoard teamId={active} teams={teams} canEdit={canEdit} />}
        </>
      )}
    </div>
  );
};

export default KanbanPage;
