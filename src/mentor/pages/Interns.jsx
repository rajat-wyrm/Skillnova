// Mentor — Interns page
import { useEffect, useState } from 'react';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, Badge } from '../../shared/components/UI';
import UserProfileModal from '../../shared/components/UserProfileModal';
import api from '../../lib/api';
import notify from '../../lib/toast';

const todayKey = () => new Date().toISOString().slice(0, 10);

const Interns = () => {
  const [interns, setInterns] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState({});
  const [loading, setLoading] = useState(true);

  // Smart Task Recommendation
  const [recommendations, setRecommendations] = useState({});
  const [loadingRecommendation, setLoadingRecommendation] = useState(null);
  const [expandedIntern, setExpandedIntern] = useState(null);

  // Attendance / profile
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [marking, setMarking] = useState(null);
  const [streaks, setStreaks] = useState({});

  const fetchAll = async () => {
    setLoading(true);

    try {
      const [internsRes, attendanceRes] = await Promise.all([
        api.get('/users', {
          params: { role: 'INTERN', limit: 100 },
        }),
        api.get('/attendance', {
          params: { date: todayKey(), limit: 100 },
        }),
      ]);

      setInterns(internsRes.data.items);

      const attendanceMap = {};
      attendanceRes.data.items.forEach((a) => {
        attendanceMap[a.userId] = a.status;
      });

      setTodayAttendance(attendanceMap);

      const streakResults = await Promise.all(
        internsRes.data.items.map((intern) =>
          api
            .get('/attendance/streak', {
              params: { userId: intern.id },
            })
            .then((r) => [intern.id, r.data])
            .catch(() => [intern.id, null]),
        ),
      );

      setStreaks(Object.fromEntries(streakResults));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const getRecommendation = async (internId) => {
    setLoadingRecommendation(internId);

    try {
      const { data } = await api.get(
        `/tasks/recommendation/${internId}`,
      );

      setRecommendations((prev) => ({
        ...prev,
        [internId]: data,
      }));

      setExpandedIntern(internId);
    } catch (error) {
      console.error('Failed to get task recommendation:', error);
      notify.error(
        error.response?.data?.error ||
          'Could not get task recommendation.',
      );
    } finally {
      setLoadingRecommendation(null);
    }
  };

  const markAttendance = async (userId, status) => {
    setMarking(userId);

    try {
      await api.post('/attendance/mark', {
        userId,
        status,
      });

      setTodayAttendance((map) => ({
        ...map,
        [userId]: status,
      }));

      notify.success(`Marked ${status.toLowerCase()}.`);
    } catch (err) {
      notify.error(
        err.response?.data?.error ||
          'Could not mark attendance.',
      );
    } finally {
      setMarking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2
          className="animate-spin"
          size={28}
          style={{ color: 'var(--muted)' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-bold"
          style={{ color: 'var(--text)' }}
        >
          My Interns ({interns.length})
        </h2>

        <p
          className="text-sm mt-1"
          style={{ color: 'var(--muted)' }}
        >
          Get smart task suggestions based on each intern's progress.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[70rem]">
            <thead>
              <tr
                style={{
                  background: 'var(--bg)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {[
                  'Name',
                  'Email',
                  'Department',
                  "Today's meeting",
                  'Streak',
                  'Rating',
                  'Status',
                  'Smart Task',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left"
                    style={{ color: 'var(--muted)' }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {interns.map((intern) => {
                const status = todayAttendance[intern.id];
                const recommendation = recommendations[intern.id];
                const isLoading =
                  loadingRecommendation === intern.id;
                const isExpanded =
                  expandedIntern === intern.id;

                return (
                  <tr
                    key={intern.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <td
                      className="px-5 py-4 font-medium"
                      style={{ color: 'var(--text)' }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedUserId(intern.id)
                        }
                        className="text-left hover:underline"
                        style={{ color: 'var(--text)' }}
                      >
                        {intern.name}
                      </button>
                    </td>

                    <td
                      className="px-5 py-4 text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      {intern.email}
                    </td>

                    <td
                      className="px-5 py-4 text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      {intern.department}
                    </td>

                    <td className="px-5 py-4">
                      {status ? (
                        <Badge
                          variant={
                            status === 'PRESENT'
                              ? 'success'
                              : status === 'LEAVE'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {status}
                        </Badge>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() =>
                              markAttendance(
                                intern.id,
                                'PRESENT',
                              )
                            }
                            disabled={marking === intern.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
                            style={{
                              background: '#00bea3',
                            }}
                          >
                            <CheckCircle size={12} />
                            Present
                          </button>

                          <button
                            onClick={() =>
                              markAttendance(
                                intern.id,
                                'ABSENT',
                              )
                            }
                            disabled={marking === intern.id}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium"
                            style={{
                              background: '#dc2626',
                            }}
                          >
                            <XCircle size={12} />
                            Absent
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {streaks[intern.id] ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span
                            className="font-bold"
                            style={{ color: 'var(--text)' }}
                          >
                            🔥{' '}
                            {streaks[intern.id].currentStreak}
                          </span>

                          <Badge
                            variant={
                              streaks[intern.id].risk === 'HIGH'
                                ? 'danger'
                                : streaks[intern.id].risk ===
                                    'MEDIUM'
                                  ? 'warning'
                                  : 'success'
                            }
                          >
                            {streaks[intern.id].risk}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs opacity-40">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                        ⭐{' '}
                        {intern.rating?.toFixed?.(1) ??
                          intern.rating ??
                          0}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs uppercase font-medium">
                      {intern.status}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() =>
                          recommendation
                            ? setExpandedIntern(
                                isExpanded
                                  ? null
                                  : intern.id,
                              )
                            : getRecommendation(intern.id)
                        }
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-60"
                      >
                        {isLoading ? (
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Brain size={14} />
                        )}

                        {recommendation
                          ? isExpanded
                            ? 'Hide'
                            : 'View'
                          : 'Suggest'}
                      </button>
                    </td>

                    {isExpanded && recommendation && (
                      <td
                        colSpan={8}
                        className="p-0"
                      >
                        <div
                          className="px-5 pb-5"
                          style={{
                            background: 'var(--bg)',
                            borderTop:
                              '1px solid var(--border)',
                          }}
                        >
                          <div className="pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles
                                size={16}
                                style={{
                                  color: 'var(--primary)',
                                }}
                              />

                              <span
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{
                                  color: 'var(--primary)',
                                }}
                              >
                                Smart Task Suggestion
                              </span>
                            </div>

                            <div
                              className="rounded-xl p-4"
                              style={{
                                background: 'var(--card)',
                                border:
                                  '1px solid var(--border)',
                              }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3
                                    className="font-semibold"
                                    style={{
                                      color: 'var(--text)',
                                    }}
                                  >
                                    {
                                      recommendation
                                        .recommendation
                                        .title
                                    }
                                  </h3>

                                  <p
                                    className="text-sm mt-1"
                                    style={{
                                      color: 'var(--muted)',
                                    }}
                                  >
                                    {
                                      recommendation
                                        .recommendation
                                        .description
                                    }
                                  </p>
                                </div>

                                <span
                                  className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
                                  style={{
                                    background: 'var(--bg)',
                                    color: 'var(--text)',
                                  }}
                                >
                                  {
                                    recommendation
                                      .recommendation
                                      .difficulty
                                  }
                                </span>
                              </div>

                              <div
                                className="text-xs mt-3"
                                style={{
                                  color: 'var(--muted)',
                                }}
                              >
                                ⏱ Estimated time:{' '}
                                {
                                  recommendation
                                    .recommendation
                                    .estimatedTime
                                }
                              </div>

                              <div
                                className="mt-3 pt-3 text-sm"
                                style={{
                                  borderTop:
                                    '1px solid var(--border)',
                                  color: 'var(--text)',
                                }}
                              >
                                <strong>Why:</strong>{' '}
                                {
                                  recommendation
                                    .recommendation
                                    .reason
                                }
                              </div>
                            </div>

                            {recommendation.alternatives
                              ?.length > 0 && (
                              <div className="mt-4">
                                <div
                                  className="flex items-center gap-2 text-xs font-semibold"
                                  style={{
                                    color: 'var(--primary)',
                                  }}
                                >
                                  <ChevronDown size={14} />
                                  Alternative tasks
                                </div>

                                <div className="grid md:grid-cols-3 gap-3 mt-3">
                                  {recommendation.alternatives.map(
                                    (task) => (
                                      <div
                                        key={task.title}
                                        className="rounded-lg p-3"
                                        style={{
                                          background:
                                            'var(--card)',
                                          border:
                                            '1px solid var(--border)',
                                        }}
                                      >
                                        <div
                                          className="text-sm font-semibold"
                                          style={{
                                            color:
                                              'var(--text)',
                                          }}
                                        >
                                          {task.title}
                                        </div>

                                        <div
                                          className="text-xs mt-1"
                                          style={{
                                            color:
                                              'var(--muted)',
                                          }}
                                        >
                                          {task.difficulty} ·{' '}
                                          {
                                            task.estimatedTime
                                          }
                                        </div>

                                        <p
                                          className="text-xs mt-2"
                                          style={{
                                            color:
                                              'var(--muted)',
                                          }}
                                        >
                                          {task.reason}
                                        </p>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <UserProfileModal
        isOpen={!!selectedUserId}
        onClose={() => setSelectedUserId(null)}
        userId={selectedUserId}
      />
    </div>
  );
};

export default Interns;