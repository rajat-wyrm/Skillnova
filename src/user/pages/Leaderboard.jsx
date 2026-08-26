// ════════════════════════════════════════════════════════════
//  USER — pages/Leaderboard.jsx (UptoSkills Premium Gamification)
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Search, Medal, Award, Sparkles, Loader2 } from 'lucide-react';
import { Card, SectionHeader, Badge } from '../../shared/components/UI';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

const MotionDiv = motion.div;

const Leaderboard = () => {
  const { user: currentUser } = useAuthStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/analytics/leaderboard');
        setItems(res.data.items || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    (item.department && item.department.toLowerCase().includes(search.toLowerCase()))
  );

  const top3 = filtered.slice(0, 3);
  const remaining = filtered.slice(3);

  // Find current user's rank
  const myRank = items.findIndex((item) => item.id === currentUser?.id) + 1;
  const myStats = items[myRank - 1];

  const podiumColors = [
    { border: '#F59E0B', bg: 'rgba(245,158,11,0.08)', shadow: 'rgba(245,158,11,0.2)', text: '#d97706', rank: '1st' }, // Gold
    { border: '#94A3B8', bg: 'rgba(148,163,184,0.08)', shadow: 'rgba(148,163,184,0.2)', text: '#64748b', rank: '2nd' }, // Silver
    { border: '#B45309', bg: 'rgba(180,83,9,0.08)', shadow: 'rgba(180,83,9,0.2)', text: '#78350f', rank: '3rd' },   // Bronze
  ];

  return (
    <div className="space-y-6 pb-16 font-sans">
      <SectionHeader
        title="Learning Streak Leaderboard"
        subtitle="Ranked by active learning days and consistent daily habits"
        action={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search interns or depts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border bg-white focus:outline-none focus:ring-4 focus:ring-[#ff6d34]/10 hover:border-slate-300 focus:border-[#ff6d34] transition-all"
              style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }}
            />
          </div>
        }
      />

      {/* Current User Streak Status Header Card */}
      {myRank > 0 && myStats && (
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl p-5 overflow-hidden border flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background: 'linear-gradient(135deg, #2D3436 0%, #1a1f20 100%)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}>
              #{myRank}
            </div>
            <div>
              <h3 className="text-white font-bold text-base flex items-center gap-1.5">
                Your Leaderboard Rank <Sparkles size={14} style={{ color: '#00bea3' }} />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Keep learning daily to climb the ranks and win rewards!</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Streak</p>
              <p className="text-2xl font-black text-white flex items-center gap-1.5 justify-center sm:justify-end">
                {myStats.currentStreak} <Flame size={20} fill="#ff6d34" color="#ff6d34" className="animate-pulse" />
              </p>
            </div>
            <div className="text-center sm:text-right border-l border-white/10 pl-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Longest Streak</p>
              <p className="text-2xl font-black text-white flex items-center gap-1.5 justify-center sm:justify-end">
                {myStats.longestStreak} <Award size={20} color="#00bea3" />
              </p>
            </div>
          </div>
        </MotionDiv>
      )}

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {top3.map((intern, i) => {
            const style = podiumColors[i] || podiumColors[2];
            const isMe = intern.id === currentUser?.id;
            return (
              <Card
                key={intern.id}
                className="relative overflow-hidden p-6 text-center border-t-4 transition-all duration-300"
                style={{
                  borderTopColor: style.border,
                  background: isMe ? 'rgba(255,109,52,0.03)' : 'var(--card)',
                  boxShadow: `0 10px 30px -10px ${style.shadow}`
                }}
                hover
                delay={i * 0.1}
              >
                {/* Crown / Trophy icon overlay */}
                <div className="absolute top-3 right-3 opacity-20">
                  {i === 0 ? <Trophy size={48} color={style.border} /> : <Award size={48} color={style.border} />}
                </div>

                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {intern.avatarUrl ? (
                      <img
                        src={intern.avatarUrl}
                        alt={intern.name}
                        className="w-20 h-20 rounded-2xl object-cover border-2 shadow-md"
                        style={{ borderColor: style.border }}
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center font-black text-white text-2xl border-2 shadow-md"
                        style={{ borderColor: style.border, background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}
                      >
                        {intern.name.charAt(0)}
                      </div>
                    )}
                    <span
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase text-white shadow-sm"
                      style={{ background: style.border }}
                    >
                      {style.rank}
                    </span>
                  </div>

                  <h3 className="font-bold text-base truncate max-w-full" style={{ color: 'var(--text)' }}>
                    {intern.name} {isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-[#ff6d34]/10 text-[#ff6d34] ml-1">You</span>}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    {intern.department || 'General'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-5 w-full pt-4 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Current Streak</p>
                      <p className="text-lg font-black mt-0.5 flex items-center justify-center gap-1" style={{ color: 'var(--text)' }}>
                        {intern.currentStreak} <Flame size={15} fill="#ff6d34" color="#ff6d34" />
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Longest Streak</p>
                      <p className="text-lg font-black mt-0.5 flex items-center justify-center gap-1" style={{ color: 'var(--text)' }}>
                        {intern.longestStreak} <Medal size={15} color="#00bea3" />
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ranks 4+ Leaderboard List Table */}
      <Card className="overflow-hidden p-0">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Rankings</h3>
          <Badge variant="purple">Active Learners</Badge>
        </div>
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[40rem]">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['Rank', 'Intern', 'Department', 'Current Streak', 'Longest Streak', 'Streak Status'].map((h) => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {remaining.length === 0 && filtered.length <= 3 && (
                <tr>
                  <td colSpan={6} className="text-center py-12" style={{ color: 'var(--muted)' }}>
                    No other active rankings yet.
                  </td>
                </tr>
              )}
              {remaining.map((intern, i) => {
                const rankNum = i + 4;
                const isMe = intern.id === currentUser?.id;
                return (
                  <tr key={intern.id} style={{ borderBottom: '1px solid var(--border)', background: isMe ? 'rgba(255,109,52,0.02)' : 'transparent' }}>
                    <td className="px-5 py-4 font-bold text-xs" style={{ color: 'var(--muted)' }}>
                      #{rankNum}
                    </td>
                    <td className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>
                      <div className="flex items-center gap-3">
                        {intern.avatarUrl ? (
                          <img src={intern.avatarUrl} alt={intern.name} className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                            style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}>
                            {intern.name.charAt(0)}
                          </div>
                        )}
                        <span>
                          {intern.name} {isMe && <span className="text-[9px] font-extrabold px-1 py-0.5 rounded bg-[#ff6d34]/15 text-[#ff6d34] ml-1.5">YOU</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--muted)' }}>
                      {intern.department || 'General'}
                    </td>
                    <td className="px-5 py-4 font-black">
                      <span className="flex items-center gap-1">
                        {intern.currentStreak} <Flame size={14} fill={intern.currentStreak > 0 ? '#ff6d34' : 'transparent'} color={intern.currentStreak > 0 ? '#ff6d34' : 'var(--muted)'} />
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold" style={{ color: 'var(--muted)' }}>
                      {intern.longestStreak}
                    </td>
                    <td className="px-5 py-4">
                      {intern.currentStreak > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                          Active Today
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded">
                          Inactive
                        </span>
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

export default Leaderboard;
