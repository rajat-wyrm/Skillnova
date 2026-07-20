// ════════════════════════════════════════════════════════════
//  USER — pages/LeaderboardSystem.jsx
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy, Medal, Search, Calendar, Target, CheckCircle2,
  Clock, ArrowUpRight, ShieldCheck, Flame, Zap, Award
} from 'lucide-react';
import { Card, SectionHeader, Badge } from '../../shared/components/UI';

const MotionDiv = motion.div;

const MOCK_INTERNS_LEADERBOARD = [
  { id: 'int-1', name: 'Aarav Mehta', department: 'Web Dev', completedTasks: 22, attendanceRate: 100, avgScore: 9.6, points: 2850, avatar: 'AM' },
  { id: 'int-2', name: 'Ishita Sharma', department: 'AI/ML', completedTasks: 18, attendanceRate: 98, avgScore: 9.4, points: 2420, avatar: 'IS' },
  { id: 'int-3', name: 'Kabir Bakshi', department: 'Backend', completedTasks: 19, attendanceRate: 96, avgScore: 9.1, points: 2310, avatar: 'KB' },
  { id: 'int-4', name: 'Meera Nair', department: 'Data Science', completedTasks: 16, attendanceRate: 95, avgScore: 9.0, points: 2050, avatar: 'MN' },
  { id: 'int-5', name: 'Rohan Gupta', department: 'Frontend', completedTasks: 15, attendanceRate: 92, avgScore: 8.8, points: 1920, avatar: 'RG' },
  { id: 'int-6', name: 'Ananya Roy', department: 'Web Dev', completedTasks: 14, attendanceRate: 100, avgScore: 8.7, points: 1850, avatar: 'AR' },
  { id: 'int-7', name: 'Siddharth Sen', department: 'AI/ML', completedTasks: 13, attendanceRate: 94, avgScore: 8.5, points: 1710, avatar: 'SS' },
  { id: 'int-8', name: 'Diya Joshi', department: 'Backend', completedTasks: 11, attendanceRate: 90, avgScore: 8.2, points: 1490, avatar: 'DJ' }
];

const LeaderboardSystem = () => {
  const [filter, setFilter] = useState('overall'); // weekly, monthly, overall
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [interns, setInterns] = useState([]);

  useEffect(() => {
    // Simulate API loading
    const loadLeaderboard = async () => {
      setLoading(true);
      try {
        // Future API point:
        // const res = await api.get('/analytics/leaderboard', { params: { filter } });
        // setInterns(res.data);
        await new Promise(r => setTimeout(r, 600));

        // Let's add slight variations to mock data based on selected filter
        let data = [...MOCK_INTERNS_LEADERBOARD];
        if (filter === 'weekly') {
          data = data.map((item, idx) => ({
            ...item,
            completedTasks: Math.max(1, Math.round(item.completedTasks / 4)),
            points: Math.round(item.points / 4) + (idx === 1 ? 200 : 0) // Ishita ranks 1st this week
          })).sort((a, b) => b.points - a.points);
        } else if (filter === 'monthly') {
          data = data.map((item, idx) => ({
            ...item,
            completedTasks: Math.max(2, Math.round(item.completedTasks * 0.75)),
            points: Math.round(item.points * 0.75) + (idx === 2 ? 150 : 0) // Kabir ranks higher
          })).sort((a, b) => b.points - a.points);
        } else {
          data = data.sort((a, b) => b.points - a.points);
        }

        setInterns(data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [filter]);

  const getBadgesForIntern = (intern) => {
    const badges = [];
    if (intern.avgScore >= 9.4) badges.push({ text: 'Top Performer', variant: 'success', icon: Trophy });
    if (intern.attendanceRate === 100) badges.push({ text: 'Perfect Attendance', variant: 'purple', icon: ShieldCheck });
    else if (intern.attendanceRate >= 95) badges.push({ text: 'Consistent', variant: 'default', icon: Flame });
    if (intern.completedTasks >= 18) badges.push({ text: 'Task Master', variant: 'warning', icon: Target });
    if (intern.completedTasks >= 15 && intern.avgScore >= 9.0) badges.push({ text: 'Fast Learner', variant: 'danger', icon: Zap });
    return badges.slice(0, 3); // max 3 badges to avoid crowding
  };

  const filteredInterns = interns.filter(i =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = filteredInterns.slice(0, 3);
  const remainingList = filteredInterns.slice(3);

  return (
    <div className="space-y-6 pb-16">
      <SectionHeader 
        title="Leaderboard & Achievements" 
        subtitle="Track top performing interns and earn special achievement badges" 
      />

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--card)] p-4 rounded-2xl border border-[var(--border)]">
        <div className="flex gap-1.5 p-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl w-full sm:w-auto">
          {['weekly', 'monthly', 'overall'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
              style={{
                background: filter === t ? '#ff6d34' : 'transparent',
                color: filter === t ? '#ffffff' : 'var(--muted)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[#ff6d34] transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-52">
            {[1, 2, 3].map(n => <div key={n} className="skeleton rounded-2xl"></div>)}
          </div>
          <div className="h-64 skeleton rounded-2xl"></div>
        </div>
      ) : filteredInterns.length === 0 ? (
        <Card className="p-12 text-center border border-[var(--border)]">
          <Award size={48} className="text-[var(--muted)] mx-auto mb-3 opacity-50" />
          <p className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>No interns found matching "{searchQuery}"</p>
        </Card>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
            {/* 2nd Place */}
            {topThree[1] && (
              <MotionDiv 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="order-2 md:order-1"
              >
                <Card className="p-6 text-center border border-[var(--border)] relative overflow-hidden flex flex-col items-center group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-300 shadow-md text-slate-500 font-bold mb-3 relative">
                    <Medal className="text-slate-400 absolute -top-2 -right-2" size={16} />
                    2
                  </div>
                  <div className="w-14 h-14 rounded-full bg-slate-500 text-white flex items-center justify-center font-bold text-lg mb-2 shadow">
                    {topThree[1].avatar}
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text)]">{topThree[1].name}</h4>
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-semibold">{topThree[1].department}</p>
                  
                  <div className="my-4 w-full h-[1px] bg-[var(--border)]" />

                  <div className="grid grid-cols-2 gap-4 w-full text-center">
                    <div>
                      <p className="text-[10px] text-[var(--muted)] font-medium">Tasks Done</p>
                      <p className="text-sm font-bold text-[var(--text)]">{topThree[1].completedTasks}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--muted)] font-medium">Avg Score</p>
                      <p className="text-sm font-bold text-emerald-500">{topThree[1].avgScore}/10</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-[var(--border)] w-full flex justify-center gap-1.5 flex-wrap">
                    {getBadgesForIntern(topThree[1]).map(b => {
                      const Icon = b.icon;
                      return (
                        <Badge key={b.text} variant={b.variant}>
                          <span className="flex items-center gap-1"><Icon size={10} />{b.text}</span>
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="mt-4 font-black text-sm text-[var(--brand-orange)]">{topThree[1].points} pts</div>
                </Card>
              </MotionDiv>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <MotionDiv 
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0 }}
                className="order-1 md:order-2"
              >
                <Card className="p-6 text-center border-2 border-yellow-500/30 relative overflow-hidden flex flex-col items-center shadow-xl group scale-105">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-yellow-500" />
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-yellow-500/10 rounded-full blur-2xl"></div>
                  
                  <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center border-2 border-yellow-400 shadow-md text-yellow-600 font-bold mb-3 relative">
                    <Trophy className="text-yellow-500 absolute -top-2.5 -right-2.5 animate-bounce" size={20} />
                    1
                  </div>
                  <div className="w-16 h-16 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-xl mb-2 shadow-lg border-2 border-yellow-300">
                    {topThree[0].avatar}
                  </div>
                  <h4 className="font-bold text-md text-[var(--text)]">{topThree[0].name}</h4>
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-semibold">{topThree[0].department}</p>
                  
                  <div className="my-4 w-full h-[1px] bg-[var(--border)]" />

                  <div className="grid grid-cols-2 gap-4 w-full text-center">
                    <div>
                      <p className="text-[10px] text-[var(--muted)] font-medium">Tasks Done</p>
                      <p className="text-sm font-bold text-[var(--text)]">{topThree[0].completedTasks}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--muted)] font-medium">Avg Score</p>
                      <p className="text-sm font-bold text-emerald-500">{topThree[0].avgScore}/10</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-[var(--border)] w-full flex justify-center gap-1.5 flex-wrap">
                    {getBadgesForIntern(topThree[0]).map(b => {
                      const Icon = b.icon;
                      return (
                        <Badge key={b.text} variant={b.variant}>
                          <span className="flex items-center gap-1"><Icon size={10} />{b.text}</span>
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="mt-4 font-black text-lg text-yellow-500">{topThree[0].points} pts</div>
                </Card>
              </MotionDiv>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <MotionDiv 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="order-3"
              >
                <Card className="p-6 text-center border border-[var(--border)] relative overflow-hidden flex flex-col items-center group">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600" />
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center border border-amber-500 shadow-md text-amber-700 font-bold mb-3 relative">
                    <Medal className="text-amber-600 absolute -top-2 -right-2" size={16} />
                    3
                  </div>
                  <div className="w-14 h-14 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-lg mb-2 shadow">
                    {topThree[2].avatar}
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text)]">{topThree[2].name}</h4>
                  <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-semibold">{topThree[2].department}</p>
                  
                  <div className="my-4 w-full h-[1px] bg-[var(--border)]" />

                  <div className="grid grid-cols-2 gap-4 w-full text-center">
                    <div>
                      <p className="text-[10px] text-[var(--muted)] font-medium">Tasks Done</p>
                      <p className="text-sm font-bold text-[var(--text)]">{topThree[2].completedTasks}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--muted)] font-medium">Avg Score</p>
                      <p className="text-sm font-bold text-emerald-500">{topThree[2].avgScore}/10</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-[var(--border)] w-full flex justify-center gap-1.5 flex-wrap">
                    {getBadgesForIntern(topThree[2]).map(b => {
                      const Icon = b.icon;
                      return (
                        <Badge key={b.text} variant={b.variant}>
                          <span className="flex items-center gap-1"><Icon size={10} />{b.text}</span>
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="mt-4 font-black text-sm text-amber-600">{topThree[2].points} pts</div>
                </Card>
              </MotionDiv>
            )}
          </div>

          {/* Remaining Interns List Table */}
          {remainingList.length > 0 && (
            <Card className="p-5 overflow-hidden">
              <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Rankings List</h3>
              <div className="sn-table-scroll -mx-1">
                <table className="w-full text-sm min-w-[46rem]">
                  <thead>
                    <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>Rank</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>Intern</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>Department</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--muted)' }}>Tasks</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--muted)' }}>Attendance</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--muted)' }}>Avg Score</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>Earned Achievements</th>
                      <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: 'var(--muted)' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remainingList.map((intern, idx) => (
                      <tr key={intern.id} className="hover:bg-[var(--hover-overlay)] transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-4 py-3 font-bold text-xs" style={{ color: 'var(--muted)' }}>#{idx + 4}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-[var(--elevated)] text-[var(--text)] flex items-center justify-center font-bold text-xs">
                              {intern.avatar}
                            </div>
                            <span className="font-semibold text-xs sm:text-sm text-[var(--text)]">{intern.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>{intern.department}</td>
                        <td className="px-4 py-3 text-center text-xs font-semibold">{intern.completedTasks}</td>
                        <td className="px-4 py-3 text-center text-xs">{intern.attendanceRate}%</td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-emerald-500">{intern.avgScore}/10</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {getBadgesForIntern(intern).map(b => {
                              const Icon = b.icon;
                              return (
                                <Badge key={b.text} variant={b.variant}>
                                  <span className="flex items-center gap-0.5 text-[9px]"><Icon size={8} />{b.text}</span>
                                </Badge>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-xs text-[#ff6d34]">{intern.points} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderboardSystem;
