import { useState, useEffect } from 'react';
import { Target, TrendingUp, BookOpen, ChevronRight, Loader2, Search, Zap } from 'lucide-react';
import { Card, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const COLORS = { green: '#10b981', amber: '#f59e0b', red: '#ef4444', blue: '#3b82f6', purple: '#8b5cf6' };

const readinessColor = (score) => score >= 70 ? COLORS.green : score >= 40 ? COLORS.amber : COLORS.red;

const DonutChart = ({ matched, partial, missing }) => {
  const total = matched + partial + missing;
  if (total === 0) return null;
  const r = 60, cx = 75, cy = 75, strokeW = 20;
  const circ = 2 * Math.PI * r;
  const segments = [
    { value: matched, color: COLORS.green, label: 'Matched' },
    { value: partial, color: COLORS.amber, label: 'Partial' },
    { value: missing, color: COLORS.red, label: 'Missing' },
  ].filter((s) => s.value > 0);
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={150} height={150} viewBox="0 0 150 150">
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circ;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color}
              strokeWidth={strokeW} strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset} transform={`rotate(-90 ${cx} ${cy})`} />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize={22} fontWeight={800}>{matched}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={11}>matched</text>
      </svg>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            {s.label}: {s.value}
          </div>
        ))}
      </div>
    </div>
  );
};

const ScoreBar = ({ label, score, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      <span style={{ color: color || 'white', fontWeight: 700 }}>{score.toFixed(1)}%</span>
    </div>
    <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${score}%`, background: color || readinessColor(score), borderRadius: 4, transition: 'width 0.5s ease' }} />
    </div>
  </div>
);

const SkillGapAnalyzer = () => {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [userSkills, setUserSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [fetchingMeta, setFetchingMeta] = useState(true);

  useEffect(() => {
    api.get('/skill-gap/metadata')
      .then(({ data }) => { setDomains(data.domains); if (data.domains.length) setSelectedDomain(data.domains[0]); })
      .catch(() => notify.error('Failed to load skill gap data'))
      .finally(() => setFetchingMeta(false));
  }, []);

  useEffect(() => {
    if (!selectedDomain) return;
    api.get('/skill-gap/roles', { params: { domain: selectedDomain } })
      .then(({ data }) => { setRoles(data.roles); if (data.roles.length) setSelectedRole(data.roles[0]); })
      .catch(() => setRoles([]));
  }, [selectedDomain]);

  const handleAnalyze = async () => {
    const skills = userSkills.split(',').map((s) => s.trim()).filter(Boolean);
    if (!skills.length) { notify.error('Enter at least one skill'); return; }
    if (!selectedRole) { notify.error('Select a role'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/skill-gap/analyze', { skills, domain: selectedDomain, role: selectedRole });
      setResult(data);
    } catch (err) {
      notify.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingMeta) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="max-w-5xl space-y-6 w-full min-w-0">
      <SectionHeader title="Skill Gap Analyzer" subtitle="Compare your skills against industry role requirements" />

      <Card className="p-6">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Domain</label>
            <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14 }}>
              {domains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Role</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14 }}>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>Your Skills (comma-separated)</label>
          <textarea value={userSkills} onChange={(e) => setUserSkills(e.target.value)} rows={3}
            placeholder="e.g. Python, SQL, Machine Learning, Excel, Git"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, resize: 'vertical' }} />
        </div>

        <button onClick={handleAnalyze} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', background: loading ? '#6b7280' : '#ff6d34', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Target size={16} /> Analyze Skill Gap</>}
        </button>
      </Card>

      {result && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Skills Entered', value: result.summary.skillsEntered, icon: '📝', color: 'white' },
              { label: 'Matched', value: result.summary.matched, icon: '✅', color: COLORS.green },
              { label: 'Missing', value: result.summary.missing, icon: '❌', color: COLORS.red },
              { label: 'Readiness', value: `${result.scores.weightedScore.toFixed(1)}%`, icon: '🎯', color: readinessColor(result.scores.weightedScore) },
            ].map((kpi) => (
              <Card key={kpi.label} className="p-4 text-center">
                <div style={{ fontSize: 20, marginBottom: 4 }}>{kpi.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.05 }}>{kpi.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{kpi.label === 'Readiness' ? result.scores.label : ''}</div>
              </Card>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card className="p-6">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>Skill Distribution</h3>
              <DonutChart matched={result.summary.matched} partial={result.summary.partial} missing={result.summary.missing} />
            </Card>
            <Card className="p-6">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text)' }}>Score Breakdown</h3>
              <ScoreBar label="Weighted Score" score={result.scores.weightedScore} />
              <ScoreBar label="Core Score" score={result.scores.coreScore} color={COLORS.blue} />
              <ScoreBar label="Secondary Score" score={result.scores.secondaryScore} color={COLORS.purple} />
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Unweighted baseline: {result.scores.naiveScore.toFixed(1)}%</div>
            </Card>
          </div>

          {result.gap.missing.length > 0 && (
            <Card className="p-6">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
                <Zap size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Missing Skills ({result.gap.missing.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.gap.missing.map((s) => (
                  <span key={s.skill} style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                    background: s.category === 'core' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                    color: s.category === 'core' ? COLORS.red : COLORS.amber,
                    border: `1px solid ${s.category === 'core' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}>
                    {s.category === 'core' ? '⚠️' : '📌'} {s.skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {result.gap.matched.length > 0 && (
            <Card className="p-6">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
                ✅ Matched Skills ({result.gap.matched.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {result.gap.matched.map((s) => (
                  <span key={s.skill} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: 'rgba(16,185,129,0.15)', color: COLORS.green, border: '1px solid rgba(16,185,129,0.3)' }}>
                    ✅ {s.skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {result.top5.length > 0 && (
            <Card className="p-6">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
                <TrendingUp size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Best Fit Alternative Roles
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
                {result.top5.map((r, i) => (
                  <div key={r.role} style={{ textAlign: 'center', padding: '16px 8px', borderRadius: 12, background: 'var(--card)', border: r.role === selectedRole ? '2px solid #ff6d34' : '1px solid var(--border)' }}>
                    <div style={{ fontSize: 20 }}>{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: 'var(--text)' }}>{r.role}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.domain}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, color: readinessColor(r.weightedScore) }}>{r.weightedScore.toFixed(1)}%</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.matchedCount}/{r.totalCount} skills</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {result.recommendations.length > 0 && (
            <Card className="p-6">
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>
                <BookOpen size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Learning Recommendations
              </h3>
              <div style={{ display: 'grid', gap: 12 }}>
                {result.recommendations.filter((r) => r.courses.length > 0).slice(0, 8).map((rec) => (
                  <div key={rec.skill} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{rec.skill}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: rec.category === 'core' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: rec.category === 'core' ? COLORS.red : COLORS.amber }}>
                        {rec.category}
                      </span>
                    </div>
                    {rec.courses.slice(0, 2).map((c) => (
                      <a key={c.url} href={c.url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', color: COLORS.blue, fontSize: 13, textDecoration: 'none' }}>
                        <ChevronRight size={12} />
                        {c.title} <span style={{ color: 'var(--muted)' }}>· {c.platform}</span>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default SkillGapAnalyzer;
