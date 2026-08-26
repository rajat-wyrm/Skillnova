import { useEffect, useState } from 'react';
import {
  Brain,
  ChevronDown,
  Loader2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';

const Interns = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [recommendations, setRecommendations] = useState({});
  const [loadingRecommendation, setLoadingRecommendation] =
    useState(null);

  const [expandedIntern, setExpandedIntern] = useState(null);

  const [skillGrowth, setSkillGrowth] = useState({});
  const [loadingSkillGrowth, setLoadingSkillGrowth] =
    useState(null);

  useEffect(() => {
    api
      .get('/users', {
        params: {
          role: 'INTERN',
          limit: 100,
        },
      })
      .then((r) => {
        setInterns(r.data.items || []);
      })
      .catch((error) => {
        console.error('Failed to load interns:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getRecommendation = async (internId) => {
    setLoadingRecommendation(internId);

    try {
      const { data } = await api.get(
        `/tasks/recommendation/${internId}`
      );

      setRecommendations((prev) => ({
        ...prev,
        [internId]: data,
      }));

      setExpandedIntern(internId);
    } catch (error) {
      console.error(
        'Failed to get task recommendation:',
        error
      );
    } finally {
      setLoadingRecommendation(null);
    }
  };

  const getSkillGrowth = async (internId) => {
    setLoadingSkillGrowth(internId);

    try {
      const { data } = await api.get(
        `/tasks/skill-growth/${internId}`
      );

      setSkillGrowth((prev) => ({
        ...prev,
        [internId]: data,
      }));

      setExpandedIntern(internId);
    } catch (error) {
      console.error(
        'Failed to get skill growth:',
        error
      );
    } finally {
      setLoadingSkillGrowth(null);
    }
  };

  /*
   * -----------------------------------------
   * SKILL GROWTH COLOR
   * -----------------------------------------
   *
   * 0% - 39%   = RED
   * 40% - 69%  = YELLOW
   * 70% - 100% = GREEN
   *
   * 0% is kept gray because no progress
   * has been made yet.
   */
  const getSkillColor = (progress) => {
    if (progress === 0) {
      return '#9ca3af';
    }

    if (progress < 40) {
      return '#ef4444';
    }

    if (progress < 70) {
      return '#eab308';
    }

    return '#22c55e';
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

      {/* PAGE HEADER */}
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
          Track intern progress and get smart task suggestions.
        </p>
      </div>

      {/* INTERNS TABLE */}
      <Card className="overflow-hidden p-0">

        <div className="sn-table-scroll">

          <table className="w-full text-sm min-w-[50rem]">

            {/* TABLE HEADER */}
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
                  'Rating',
                  'Status',
                  'Actions',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left"
                    style={{
                      color: 'var(--muted)',
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody>

              {interns.map((intern) => {
                const recommendation =
                  recommendations[intern.id];

                const growth =
                  skillGrowth[intern.id];

                const isLoadingRecommendation =
                  loadingRecommendation === intern.id;

                const isLoadingSkillGrowth =
                  loadingSkillGrowth === intern.id;

                const isExpanded =
                  expandedIntern === intern.id;

                return (
                  <tr
                    key={intern.id}
                    style={{
                      borderBottom:
                        '1px solid var(--border)',
                    }}
                  >

                    <td colSpan={6} className="p-0">

                      {/* INTERN ROW */}
                      <div
                        className="grid grid-cols-[1.1fr_1.5fr_1fr_.7fr_.8fr_1.5fr] items-center"
                      >

                        {/* NAME */}
                        <div
                          className="px-5 py-4 font-medium"
                          style={{
                            color: 'var(--text)',
                          }}
                        >
                          {intern.name}
                        </div>

                        {/* EMAIL */}
                        <div
                          className="px-5 py-4 text-xs"
                          style={{
                            color: 'var(--muted)',
                          }}
                        >
                          {intern.email}
                        </div>

                        {/* DEPARTMENT */}
                        <div
                          className="px-5 py-4"
                          style={{
                            color: 'var(--muted)',
                          }}
                        >
                          {intern.department}
                        </div>

                        {/* RATING */}
                        <div className="px-5 py-4">
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                            ⭐ {intern.rating}
                          </span>
                        </div>

                        {/* STATUS */}
                        <div
                          className="px-5 py-4 text-xs"
                          style={{
                            color: 'var(--text)',
                          }}
                        >
                          {intern.status}
                        </div>

                        {/* ACTIONS */}
                        <div className="px-5 py-4 flex gap-2">

                          {/* VIEW / HIDE */}
                          <button
                            onClick={() => {
                              if (
                                recommendation ||
                                growth
                              ) {
                                setExpandedIntern(
                                  isExpanded
                                    ? null
                                    : intern.id
                                );
                              } else {
                                getRecommendation(
                                  intern.id
                                );
                              }
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700"
                          >
                            <Brain size={14} />

                            {isExpanded
                              ? 'Hide'
                              : 'View'}
                          </button>

                          {/* GROWTH */}
                          <button
                            onClick={() =>
                              getSkillGrowth(
                                intern.id
                              )
                            }
                            disabled={
                              isLoadingSkillGrowth
                            }
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-60"
                            style={{
                              background: 'var(--bg)',
                              color: 'var(--text)',
                              border:
                                '1px solid var(--border)',
                            }}
                          >
                            {isLoadingSkillGrowth ? (
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <TrendingUp size={14} />
                            )}

                            Growth
                          </button>

                        </div>
                      </div>

                      {/* EXPANDED CONTENT */}
                      {isExpanded && (
                        <div
                          className="px-5 pb-5"
                          style={{
                            background: 'var(--bg)',
                            borderTop:
                              '1px solid var(--border)',
                          }}
                        >

                          {/* =================================
                              SKILL GROWTH
                          ================================== */}

                          {growth && (
                            <div className="pt-4">

                              {/* TITLE */}
                              <div className="flex items-center gap-2 mb-3">

                                <TrendingUp
                                  size={16}
                                  style={{
                                    color: '#6366f1',
                                  }}
                                />

                                <span
                                  className="text-xs font-bold uppercase tracking-wider"
                                  style={{
                                    color: 'var(--text)',
                                  }}
                                >
                                  Skill Growth
                                </span>

                              </div>

                              {/* SKILLS */}
                              {growth.skills &&
                              growth.skills.length > 0 ? (

                                <div className="grid md:grid-cols-2 gap-3">

                                  {growth.skills.map(
                                    (skill) => {

                                      const progress =
                                        Math.max(
                                          0,
                                          Math.min(
                                            100,
                                            Number(
                                              skill.progress
                                            ) || 0
                                          )
                                        );

                                      const skillColor =
                                        getSkillColor(
                                          progress
                                        );

                                      return (
                                        <div
                                          key={
                                            skill.name
                                          }
                                          className="rounded-xl p-4"
                                          style={{
                                            background:
                                              'var(--card)',
                                            border:
                                              '1px solid var(--border)',
                                          }}
                                        >

                                          {/* SKILL NAME + % */}
                                          <div className="flex items-center justify-between mb-2">

                                            <span
                                              className="text-sm font-semibold"
                                              style={{
                                                color:
                                                  'var(--text)',
                                              }}
                                            >
                                              {
                                                skill.name
                                              }
                                            </span>

                                            <span
                                              className="text-xs font-bold"
                                              style={{
                                                color:
                                                  skillColor,
                                              }}
                                            >
                                              {progress}%
                                            </span>

                                          </div>

                                          {/* PROGRESS TRACK */}
                                          <div
                                            className="h-3 rounded-full overflow-hidden"
                                            style={{
                                              background:
                                                '#e5e7eb',
                                            }}
                                          >

                                            {/* PROGRESS */}
                                            <div
                                              className="h-full rounded-full"
                                              style={{
                                                width: `${progress}%`,
                                                background:
                                                  skillColor,
                                                transition:
                                                  'width 0.5s ease',
                                              }}
                                            />

                                          </div>

                                          {/* TASK COUNT */}
                                          <p
                                            className="text-xs mt-2"
                                            style={{
                                              color:
                                                'var(--muted)',
                                            }}
                                          >
                                            <strong
                                              style={{
                                                color:
                                                  'var(--text)',
                                              }}
                                            >
                                              {
                                                skill.completedTasks
                                              }
                                            </strong>{' '}
                                            of{' '}
                                            {
                                              skill.totalTasks
                                            }{' '}
                                            tasks completed
                                          </p>

                                        </div>
                                      );
                                    }
                                  )}

                                </div>

                              ) : (

                                <div
                                  className="rounded-xl p-4 text-sm"
                                  style={{
                                    background:
                                      'var(--card)',
                                    border:
                                      '1px solid var(--border)',
                                    color:
                                      'var(--muted)',
                                  }}
                                >
                                  No skill-based tasks
                                  available yet.
                                </div>

                              )}

                            </div>
                          )}

                          {/* =================================
                              SMART TASK RECOMMENDATION
                          ================================== */}

                          {recommendation && (
                            <div className="pt-4">

                              {/* TITLE */}
                              <div className="flex items-center gap-2 mb-3">

                                <Sparkles
                                  size={16}
                                  style={{
                                    color:
                                      'var(--primary)',
                                  }}
                                />

                                <span
                                  className="text-xs font-bold uppercase tracking-wider"
                                  style={{
                                    color:
                                      'var(--primary)',
                                  }}
                                >
                                  Smart Task Suggestion
                                </span>

                              </div>

                              {/* RECOMMENDED TASK */}
                              <div
                                className="rounded-xl p-4"
                                style={{
                                  background:
                                    'var(--card)',
                                  border:
                                    '1px solid var(--border)',
                                }}
                              >

                                <div className="flex items-start justify-between gap-4">

                                  <div>

                                    <h3
                                      className="font-semibold"
                                      style={{
                                        color:
                                          'var(--text)',
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
                                        color:
                                          'var(--muted)',
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
                                      background:
                                        'var(--bg)',
                                      color:
                                        'var(--text)',
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
                                    color:
                                      'var(--muted)',
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
                                    color:
                                      'var(--text)',
                                  }}
                                >
                                  <strong>
                                    Why:
                                  </strong>{' '}
                                  {
                                    recommendation
                                      .recommendation
                                      .reason
                                  }
                                </div>

                              </div>

                              {/* ALTERNATIVE TASKS */}
                              {recommendation
                                .alternatives
                                ?.length > 0 && (
                                <div className="mt-4">

                                  <div className="flex items-center gap-2 text-xs font-semibold">
                                    <ChevronDown
                                      size={14}
                                    />

                                    Alternative tasks
                                  </div>

                                  <div className="grid md:grid-cols-3 gap-3 mt-3">

                                    {recommendation.alternatives.map(
                                      (task) => (
                                        <div
                                          key={
                                            task.title
                                          }
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
                                            {
                                              task.title
                                            }
                                          </div>

                                          <div
                                            className="text-xs mt-1"
                                            style={{
                                              color:
                                                'var(--muted)',
                                            }}
                                          >
                                            {
                                              task.difficulty
                                            }{' '}
                                            ·{' '}
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
                                            {
                                              task.reason
                                            }
                                          </p>

                                        </div>
                                      )
                                    )}

                                  </div>

                                </div>
                              )}

                            </div>
                          )}

                          {/* =================================
                              NO DATA
                          ================================== */}

                          {!growth &&
                            !recommendation && (
                              <div className="pt-4">

                                <button
                                  onClick={() =>
                                    getRecommendation(
                                      intern.id
                                    )
                                  }
                                  disabled={
                                    isLoadingRecommendation
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                >

                                  {isLoadingRecommendation ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Brain
                                      size={14}
                                    />
                                  )}

                                  Get Smart Task Suggestion

                                </button>

                              </div>
                            )}

                        </div>
                      )}

                    </td>
                  </tr>
                );
              })}

            </tbody>
          </table>

        </div>
      </Card>
    </div>
  );
};

export default Interns;