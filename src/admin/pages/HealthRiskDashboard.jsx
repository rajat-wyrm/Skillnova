// ════════════════════════════════════════════════════════════
//  ADMIN — pages/HealthRiskDashboard.jsx
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, HelpCircle, Heart, Search, Filter,
  Mail, MessageSquare, ShieldAlert, ArrowRight, Loader2, Sparkles
} from 'lucide-react';
import { Card, StatCard, SectionHeader, Badge } from '../../shared/components/UI';
import api from '../../lib/api';

const MotionDiv = motion.div;

// Mock At-Risk Interns
const MOCK_AT_RISK_INTERNS = [
  {
    id: 'risk-1',
    name: 'Vikram Malhotra',
    department: 'Backend',
    attendance: 68,
    daysSinceLogin: 9,
    pendingTasks: 7,
    avgScore: 5.4,
    missingProfileInfo: true,
    mentorName: 'David Miller',
    riskLevel: 'HIGH',
    reasons: ['Low attendance (68%)', 'No login for 9 days', '7 pending tasks', 'Low average score (5.4)']
  },
  {
    id: 'risk-2',
    name: 'Priya Sharma',
    department: 'Web Dev',
    attendance: 72,
    daysSinceLogin: 2,
    pendingTasks: 8,
    avgScore: 6.8,
    missingProfileInfo: false,
    mentorName: 'Prof. Bob Jenkins',
    riskLevel: 'HIGH',
    reasons: ['Low attendance (72%)', '8 pending tasks']
  },
  {
    id: 'risk-3',
    name: 'Rahul Verma',
    department: 'AI/ML',
    attendance: 94,
    daysSinceLogin: 12,
    pendingTasks: 3,
    avgScore: 8.5,
    missingProfileInfo: true,
    mentorName: 'Dr. Alice Vance',
    riskLevel: 'MEDIUM',
    reasons: ['No login for 12 days', 'Missing LinkedIn URL & Bio']
  },
  {
    id: 'risk-4',
    name: 'Neha Kapoor',
    department: 'Data Science',
    attendance: 88,
    daysSinceLogin: 3,
    pendingTasks: 6,
    avgScore: 5.9,
    missingProfileInfo: false,
    mentorName: 'Clara Oswald',
    riskLevel: 'MEDIUM',
    reasons: ['6 pending tasks', 'Low average score (5.9)']
  },
  {
    id: 'risk-5',
    name: 'Amit Patel',
    department: 'Frontend',
    attendance: 90,
    daysSinceLogin: 1,
    pendingTasks: 4,
    avgScore: 7.2,
    missingProfileInfo: true,
    mentorName: 'Emily Watson',
    riskLevel: 'LOW',
    reasons: ['Missing profile information (no profile image / resume)']
  }
];

const HealthRiskDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [riskList, setRiskList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW
  const [stats, setStats] = useState({
    healthy: 0,
    atRisk: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0
  });

  useEffect(() => {
    const fetchHealthStats = async () => {
      setLoading(true);
      try {
        const [internsRes] = await Promise.all([
          api.get('/analytics/interns').catch(() => ({ data: { items: [] } }))
        ]);

        await new Promise(r => setTimeout(r, 650));

        // Incorporate real database values where possible
        const platformInterns = internsRes.data.items || [];
        
        // Count overall numbers
        const totalInterns = Math.max(platformInterns.length, 30);
        const atRiskCount = MOCK_AT_RISK_INTERNS.length;
        const healthyCount = totalInterns - atRiskCount;

        setStats({
          healthy: healthyCount,
          atRisk: atRiskCount,
          highRisk: MOCK_AT_RISK_INTERNS.filter(i => i.riskLevel === 'HIGH').length,
          mediumRisk: MOCK_AT_RISK_INTERNS.filter(i => i.riskLevel === 'MEDIUM').length,
          lowRisk: MOCK_AT_RISK_INTERNS.filter(i => i.riskLevel === 'LOW').length
        });

        setRiskList(MOCK_AT_RISK_INTERNS);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };

    fetchHealthStats();
  }, []);

  const getRecommendedAction = (risk) => {
    if (risk.riskLevel === 'HIGH') {
      return `Schedule urgent 1-on-1 meeting. Assign helper peer. Send final attendance alert.`;
    }
    if (risk.riskLevel === 'MEDIUM') {
      return `Send checkin email regarding login lag / tasks workload. Notify mentor ${risk.mentorName}.`;
    }
    return `Remind intern to complete missing profile fields before certificate generation.`;
  };

  const getRiskBadgeColor = (level) => {
    if (level === 'HIGH') return 'danger';
    if (level === 'MEDIUM') return 'warning';
    return 'default';
  };

  // Filter list
  const filteredRiskList = riskList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.mentorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || item.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6 pb-16">
      <SectionHeader 
        title="Internship Health & Risk Detection" 
        subtitle="Automatic monitoring panel tracking attendance drop, task bottlenecks and inactive interns" 
      />

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="animate-spin text-[var(--brand-orange)]" size={28} />
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card className="p-5 border border-[var(--border)] text-center flex flex-col items-center">
              <CheckCircle size={24} className="text-emerald-500 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Healthy Interns</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">{stats.healthy}</p>
            </Card>

            <Card className="p-5 border border-[var(--border)] text-center flex flex-col items-center">
              <AlertTriangle size={24} className="text-amber-500 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Total At Risk</p>
              <p className="text-2xl font-black text-amber-500 mt-1">{stats.atRisk}</p>
            </Card>

            <Card className="p-5 border border-[var(--border)] text-center flex flex-col items-center">
              <ShieldAlert size={24} className="text-red-500 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">High Risk</p>
              <p className="text-2xl font-black text-red-500 mt-1">{stats.highRisk}</p>
            </Card>

            <Card className="p-5 border border-[var(--border)] text-center flex flex-col items-center">
              <AlertTriangle size={24} className="text-orange-500 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Medium Risk</p>
              <p className="text-2xl font-black text-orange-500 mt-1">{stats.mediumRisk}</p>
            </Card>

            <Card className="p-5 border border-[var(--border)] text-center flex flex-col items-center">
              <HelpCircle size={24} className="text-slate-400 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Low Risk</p>
              <p className="text-2xl font-black text-[var(--text)] mt-1">{stats.lowRisk}</p>
            </Card>
          </div>

          {/* Filtering and Search Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)]">
            <div className="flex gap-1.5 p-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl w-full sm:w-auto">
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterRisk(lvl)}
                  className="flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                  style={{
                    background: filterRisk === lvl ? '#ff6d34' : 'transparent',
                    color: filterRisk === lvl ? '#ffffff' : 'var(--muted)',
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search by name, dept or mentor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[#ff6d34] transition"
              />
            </div>
          </div>

          {/* Risk Table list */}
          <Card className="p-5 overflow-hidden border border-[var(--border)]">
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Monitored Interns at Risk</h3>
            
            {filteredRiskList.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle size={44} className="text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-bold text-[var(--text)]">Platform Health Check: Clear!</p>
                <p className="text-xs text-[var(--muted)] mt-1">No interns found matching the selected risk filters.</p>
              </div>
            ) : (
              <div className="sn-table-scroll -mx-1">
                <table className="w-full text-sm min-w-[56rem]">
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>Intern</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>Department</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>Mentor Name</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--muted)' }}>Risk Level</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left animate-pulse" style={{ color: 'var(--muted)' }}>Warning Indicators</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>Recommended Action</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--muted)' }}>Action Buttons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRiskList.map((risk) => (
                      <tr key={risk.id} className="hover:bg-[var(--hover-overlay)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                        {/* Name */}
                        <td className="px-4 py-4 font-semibold text-[var(--text)] whitespace-nowrap">{risk.name}</td>
                        {/* Department */}
                        <td className="px-4 py-4 text-xs" style={{ color: 'var(--muted)' }}>{risk.department}</td>
                        {/* Mentor */}
                        <td className="px-4 py-4 text-xs font-medium text-[var(--text)]">{risk.mentorName}</td>
                        {/* Risk Badge */}
                        <td className="px-4 py-4 text-center">
                          <Badge variant={getRiskBadgeColor(risk.riskLevel)}>
                            {risk.riskLevel}
                          </Badge>
                        </td>
                        {/* Reasons */}
                        <td className="px-4 py-4">
                          <ul className="list-disc list-inside space-y-0.5 max-w-sm">
                            {risk.reasons.map((r, i) => (
                              <li key={i} className="text-[10px] text-red-500 font-medium leading-normal">{r}</li>
                            ))}
                          </ul>
                        </td>
                        {/* Recommended Actions */}
                        <td className="px-4 py-4 text-xs max-w-xs font-medium leading-relaxed" style={{ color: 'var(--text-soft)' }}>
                          {getRecommendedAction(risk)}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="flex gap-2 justify-end">
                            <button 
                              title="Email Intern"
                              className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--elevated)] transition text-[var(--muted)] hover:text-[#ff6d34]"
                              onClick={() => alert(`Sending alert email to ${risk.name}...`)}
                            >
                              <Mail size={14} />
                            </button>
                            <button 
                              title="Notify Mentor"
                              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white transition hover:opacity-90"
                              style={{ background: '#ff6d34' }}
                              onClick={() => alert(`Notifying mentor ${risk.mentorName} about ${risk.name}'s risk status...`)}
                            >
                              Notify Mentor <ArrowRight size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default HealthRiskDashboard;
