// ════════════════════════════════════════════════════════════
//  USER — pages/Roadmap.jsx
//  Personalized learning roadmap + internship completion tracker
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Map, CheckCircle2, Circle, Loader2, ExternalLink, TrendingUp, ListChecks, CalendarCheck, GraduationCap, UserCheck } from 'lucide-react';
import { Card, StatCard, SectionHeader, Badge } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const ProgressBar = ({ value, color = '#ff6d34' }) => (
  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
    <div
      className="h-full rounded-full transition-all duration-500"
      style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
    />
  </div>
);

const STATUS_VARIANT = {
  NOT_STARTED: 'gray',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
};

const Roadmap = () => {
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyMilestone, setBusyMilestone] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([
        api.get('/roadmap/mine'),
        api.get('/progress/mine'),
      ]);
      setAssignments(r.data.items || []);
      setProgress(p.data.progress);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const completeMilestone = async (milestoneId) => {
    setBusyMilestone(milestoneId);
    try {
      await api.patch(`/roadmap/milestones/${milestoneId}/complete`);
      notify.success('Milestone marked complete!');
      fetchAll();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not update milestone.');
    } finally {
      setBusyMilestone(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Learning Roadmap" subtitle="Your personalized skill paths and internship completion progress" />

      {/* Completion Tracker */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Overall" value={`${progress?.overallPct ?? 0}%`} icon={TrendingUp} color="#ff6d34" />
        <StatCard title="Tasks" value={`${progress?.taskPct ?? 0}%`} icon={ListChecks} color="#00bea3" />
        <StatCard title="Attendance" value={`${progress?.attendancePct ?? 0}%`} icon={CalendarCheck} color="#3b82f6" />
        <StatCard title="Learning" value={`${progress?.learningPct ?? 0}%`} icon={GraduationCap} color="#a855f7" />
        <StatCard title="Mentor Eval" value={`${progress?.mentorEvalPct ?? 0}%`} icon={UserCheck} color="#f59e0b" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Internship completion status</h3>
          <Badge variant={STATUS_VARIANT[progress?.finalStatus] || 'gray'}>{(progress?.finalStatus || 'NOT_STARTED').replace('_', ' ')}</Badge>
        </div>
        <ProgressBar value={progress?.overallPct ?? 0} />
      </Card>

      {/* Learning Paths */}
      {assignments.length === 0 && (
        <Card className="p-8 text-center">
          <Map className="mx-auto mb-3" size={28} style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No learning paths assigned yet. Your mentor will assign one soon.</p>
        </Card>
      )}

      {assignments.map((a) => {
        const milestones = a.path.milestones || [];
        const completed = milestones.filter((m) => m.completed).length;
        const pct = milestones.length ? Math.round((completed / milestones.length) * 100) : 0;
        return (
          <Card key={a.id} className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{a.path.title}</h3>
                {a.path.description && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{a.path.description}</p>}
                {a.mentorGoal && <p className="text-xs mt-1 italic" style={{ color: 'var(--muted)' }}>Mentor note: {a.mentorGoal}</p>}
              </div>
              <Badge variant={STATUS_VARIANT[a.status] || 'gray'}>{a.status.replace('_', ' ')}</Badge>
            </div>

            {!!a.path.skillTags?.length && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {a.path.skillTags.map((tag) => <Badge key={tag} variant="purple">{tag}</Badge>)}
              </div>
            )}

            <div className="mb-3">
              <ProgressBar value={pct} color="#00bea3" />
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{completed}/{milestones.length} milestones complete</p>
            </div>

            <div className="space-y-2">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--bg)' }}>
                  <button
                    onClick={() => !m.completed && completeMilestone(m.id)}
                    disabled={m.completed || busyMilestone === m.id}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {busyMilestone === m.id ? (
                      <Loader2 size={18} className="animate-spin" style={{ color: 'var(--muted)' }} />
                    ) : m.completed ? (
                      <CheckCircle2 size={18} style={{ color: '#00bea3' }} />
                    ) : (
                      <Circle size={18} style={{ color: 'var(--muted)' }} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)', textDecoration: m.completed ? 'line-through' : 'none', opacity: m.completed ? 0.6 : 1 }}>
                      {m.title}
                    </p>
                    {m.description && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{m.description}</p>}
                    {m.resourceUrl && (
                      <a href={m.resourceUrl} target="_blank" rel="noreferrer" className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: '#ff6d34' }}>
                        View resource <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default Roadmap;
