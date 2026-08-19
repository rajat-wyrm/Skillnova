// Mentor — Interns page
import { useEffect, useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';

const Interns = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState({});
  const [loadingRecommendation, setLoadingRecommendation] = useState(null);
  const [expandedIntern, setExpandedIntern] = useState(null);

  useEffect(() => {
    api.get('/users', { params: { role: 'INTERN', limit: 100 } })
      .then((r) => setInterns(r.data.items))
      .finally(() => setLoading(false));
  }, []);

  const getRecommendation = async (internId) => {
    setLoadingRecommendation(internId);

    try {
      const { data } = await api.get(`/tasks/recommendation/${internId}`);

      setRecommendations((prev) => ({
        ...prev,
        [internId]: data,
      }));

      setExpandedIntern(internId);
    } catch (error) {
      console.error('Failed to get task recommendation:', error);
    } finally {
      setLoadingRecommendation(null);
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
          <table className="w-full text-sm min-w-[50rem]">
            <thead>
              <tr
                style={{
                  background: 'var(--bg)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {['Name', 'Email', 'Department', 'Rating', 'Status', 'Smart Task'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left"
                    style={{ color: 'var(--muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {interns.map((intern) => {
                const recommendation = recommendations[intern.id];
                const isLoading = loadingRecommendation === intern.id;
                const isExpanded = expandedIntern === intern.id;

                return (
                  <tr
                    key={intern.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td colSpan={6} className="p-0">
                      <div
                        className="grid grid-cols-[1.1fr_1.5fr_1fr_.7fr_.8fr_1.2fr] items-center"
                      >
                        <div className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>
                          {intern.name}
                        </div>

                        <div className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>
                          {intern.email}
                        </div>

                        <div className="px-5 py-4" style={{ color: 'var(--muted)' }}>
                          {intern.department}
                        </div>

                        <div className="px-5 py-4">
                          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                            ⭐ {intern.rating}
                          </span>
                        </div>

                        <div className="px-5 py-4 text-xs">
                          {intern.status}
                        </div>

                        <div className="px-5 py-4">
                          <button
                            onClick={() =>
                              recommendation
                                ? setExpandedIntern(isExpanded ? null : intern.id)
                                : getRecommendation(intern.id)
                            }
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-60"
                          >
                            {isLoading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Brain size={14} />
                            )}

                            {recommendation
                              ? isExpanded
                                ? 'Hide'
                                : 'View'
                              : 'Suggest'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && recommendation && (
                        <div
                          className="px-5 pb-5"
                          style={{
                            background: 'var(--bg)',
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          <div className="pt-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles size={16} style={{ color: 'var(--primary)' }} />

                              <span
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{ color: 'var(--primary)' }}
                              >
                                Smart Task Suggestion
                              </span>
                            </div>

                            <div
                              className="rounded-xl p-4"
                              style={{
                                background: 'var(--card)',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3
                                    className="font-semibold"
                                    style={{ color: 'var(--text)' }}
                                  >
                                    {recommendation.recommendation.title}
                                  </h3>

                                  <p
                                    className="text-sm mt-1"
                                    style={{ color: 'var(--muted)' }}
                                  >
                                    {recommendation.recommendation.description}
                                  </p>
                                </div>

                                <span
                                  className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full"
                                  style={{
                                    background: 'var(--bg)',
                                    color: 'var(--text)',
                                  }}
                                >
                                  {recommendation.recommendation.difficulty}
                                </span>
                              </div>

                              <div
                                className="text-xs mt-3"
                                style={{ color: 'var(--muted)' }}
                              >
                                ⏱ Estimated time:{' '}
                                {recommendation.recommendation.estimatedTime}
                              </div>

                              <div
                                className="mt-3 pt-3 text-sm"
                                style={{
                                  borderTop: '1px solid var(--border)',
                                  color: 'var(--text)',
                                }}
                              >
                                <strong>Why:</strong>{' '}
                                {recommendation.recommendation.reason}
                              </div>
                            </div>

                            {recommendation.alternatives?.length > 0 && (
                              <div className="mt-4">
                                <button
                                  onClick={() =>
                                    setExpandedIntern(
                                      isExpanded ? null : intern.id
                                    )
                                  }
                                  className="flex items-center gap-2 text-xs font-semibold"
                                  style={{ color: 'var(--primary)' }}
                                >
                                  {isExpanded ? (
                                    <ChevronUp size={14} />
                                  ) : (
                                    <ChevronDown size={14} />
                                  )}
                                  Alternative tasks
                                </button>

                                <div className="grid md:grid-cols-3 gap-3 mt-3">
                                  {recommendation.alternatives.map((task) => (
                                    <div
                                      key={task.title}
                                      className="rounded-lg p-3"
                                      style={{
                                        background: 'var(--card)',
                                        border: '1px solid var(--border)',
                                      }}
                                    >
                                      <div
                                        className="text-sm font-semibold"
                                        style={{ color: 'var(--text)' }}
                                      >
                                        {task.title}
                                      </div>

                                      <div
                                        className="text-xs mt-1"
                                        style={{ color: 'var(--muted)' }}
                                      >
                                        {task.difficulty} · {task.estimatedTime}
                                      </div>

                                      <p
                                        className="text-xs mt-2"
                                        style={{ color: 'var(--muted)' }}
                                      >
                                        {task.reason}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
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