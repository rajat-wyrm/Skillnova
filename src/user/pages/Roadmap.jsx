// ════════════════════════════════════════════════════════════
//  USER — pages/Roadmap.jsx
//  Personalized learning roadmap + internship completion tracker
// ════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from 'react';
import {
  Map, CheckCircle2, Circle, Loader2, ExternalLink, TrendingUp, ListChecks,
  CalendarCheck, GraduationCap, UserCheck, Sparkles, ArrowRight, BookOpen, PartyPopper,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
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

// Active work first, so interns land on what needs attention rather than
// scrolling past finished paths to find it.
const STATUS_ORDER = { IN_PROGRESS: 0, NOT_STARTED: 1, COMPLETED: 2 };

const Roadmap = ({ onNavigate }) => {
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyMilestone, setBusyMilestone] = useState(null);
  const [justCompleted, setJustCompleted] = useState(null);

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
      notify.error('Could not load your roadmap. Pull to refresh or try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const sortedAssignments = useMemo(
    () => [...assignments].sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)),
    [assignments]
  );

  // Surface the single next actionable milestone across every assigned path
  // so the intern always knows exactly what to do next, instead of having
  // to scan every card themselves.
  const upNext = useMemo(() => {
    for (const a of sortedAssignments) {
      const next = (a.path.milestones || []).find((m) => !m.completed);
      if (next) return { assignment: a, milestone: next };
    }
    return null;
  }, [sortedAssignments]);

  const remainingCount = useMemo(
    () => assignments.reduce((sum, a) => sum + (a.path.milestones || []).filter((m) => !m.completed).length, 0),
    [assignments]
  );

  const completeMilestone = async (milestoneId) => {
    setBusyMilestone(milestoneId);
    try {
      await api.patch(`/roadmap/milestones/${milestoneId}/complete`);
      setJustCompleted(milestoneId);
      notify.success('Milestone marked complete!');
      await fetchAll();
      setTimeout(() => setJustCompleted(null), 2000);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Could not update milestone.');
    } finally {
      setBusyMilestone(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;
  }

  const subtitle = assignments.length
    ? `${assignments.length} path${assignments.length !== 1 ? 's' : ''} assigned · ${remainingCount} milestone${remainingCount !== 1 ? 's' : ''} left`
    : 'Your personalized skill paths and internship completion progress';

  return (
    <div className="space-y-6">
      <SectionHeader title="Learning Roadmap" subtitle={subtitle} />

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

      {/* Up Next — the single most useful thing on this page: tells the
          intern exactly what to work on next instead of making them hunt
          for it across every assigned path. */}
      {upNext && (
        <Card className="p-5" style={{ border: '1px solid #ff6d34', background: 'linear-gradient(135deg, rgba(255,109,52,0.06), transparent)' }}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl flex-shrink-0" style={{ background: 'rgba(255,109,52,0.12)' }}>
              <Sparkles size={18} style={{ color: '#ff6d34' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#ff6d34' }}>Up next</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{upNext.milestone.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                From <span className="font-medium">{upNext.assignment.path.title}</span>
              </p>
              {upNext.milestone.description && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>{upNext.milestone.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <button
                  onClick={() => completeMilestone(upNext.milestone.id)}
                  disabled={busyMilestone === upNext.milestone.id}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white"
                  style={{ background: '#ff6d34' }}
                >
                  {busyMilestone === upNext.milestone.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <CheckCircle2 size={13} />}
                  Mark complete
                </button>
                {upNext.milestone.resourceUrl && (
                  <a href={upNext.milestone.resourceUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-medium" style={{ color: '#ff6d34' }}>
                    Open resource <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* All paths done, nothing left to surface */}
      {assignments.length > 0 && !upNext && (
        <Card className="p-5 flex items-center gap-3" style={{ border: '1px solid #00bea3' }}>
          <PartyPopper size={20} style={{ color: '#00bea3' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            All milestones complete across your assigned paths. Nice work — check back for new roadmaps from your mentor.
          </p>
        </Card>
      )}

      {/* Empty state — actionable instead of a dead end */}
      {assignments.length === 0 && (
        <Card className="p-8 text-center">
          <Map className="mx-auto mb-3" size={28} style={{ color: 'var(--muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>No learning paths assigned yet</p>
          <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: 'var(--muted)' }}>
            Your mentor assigns roadmaps based on your track. In the meantime you can browse existing resources.
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate('knowledge')}
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-xs font-semibold text-white"
              style={{ background: '#ff6d34' }}
            >
              <BookOpen size={13} /> Browse Knowledge Base <ArrowRight size={13} />
            </button>
          )}
        </Card>
      )}

      {/* Learning Paths */}
      {sortedAssignments.map((a) => {
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
                {a.createdAt && (
                  <p className="text-[11px] mt-1" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                    Assigned {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                )}
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
                <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg transition-colors"
                  style={{ background: justCompleted === m.id ? 'rgba(0,190,163,0.1)' : 'var(--bg)' }}>
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
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {m.resourceUrl && (
                        <a href={m.resourceUrl} target="_blank" rel="noreferrer" className="text-xs inline-flex items-center gap-1" style={{ color: '#ff6d34' }}>
                          View resource <ExternalLink size={11} />
                        </a>
                      )}
                      {m.completed && m.completedAt && (
                        <span className="text-[11px]" style={{ color: 'var(--muted)', opacity: 0.7 }}>
                          Completed {format(new Date(m.completedAt), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
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
