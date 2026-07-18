import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Flame, Award, Calendar, CheckCircle2, Circle, Target,
  BookOpen, ClipboardList, Loader2, Sparkles, Star, ChevronLeft, ChevronRight
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Card, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const MotionDiv = motion.div;

const BadgeIcon = ({ name, className, size = 32 }) => {
  const IconComponent = Icons[name] || Award;
  return <IconComponent className={className} size={size} />;
};

const GamificationDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Date states for the streak calendar
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchStatus = async () => {
    try {
      const res = await api.get('/gamification/status');
      setData(res.data);
    } catch (err) {
      notify.error('Failed to load progress details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10 text-rose-500">
        Error loading progress dashboard. Please try again.
      </div>
    );
  }

  // Calculate current level stats
  const levelThreshold = data.level * 100;
  const currentXp = data.xp;
  const progressPercent = data.progressPercent;

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0

  const calendarDays = [];
  // Empty spaces for previous month's days offset
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  // Current month's days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  const isDateActive = (date) => {
    if (!date) return false;
    const dateStr = date.toISOString().split('T')[0];
    return data.activeDates.includes(dateStr);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="space-y-6 pb-16 w-full max-w-6xl mx-auto">
      <SectionHeader 
        title="Learning Progress & Achievements" 
        subtitle="Track your daily learning goals, streaking calendar, level progression, and unlock achievements."
      />

      {/* ── SECTION 1: XP PROGRESS & STREAK SUMMARY ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Progress Tracker Card */}
        <Card className="p-6 col-span-1 md:col-span-2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e252b 0%, #111417 100%)' }}>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Trophy size={140} className="text-amber-500" />
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <Sparkles size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Progress Tracker</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Current Level</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-6xl font-black text-amber-500">{data.level}</span>
                <span className="text-sm text-slate-400 font-medium">/ 100 max</span>
              </div>
            </div>
            <div className="w-full sm:w-auto text-right">
              <span className="text-sm font-semibold text-slate-400">XP Progress</span>
              <p className="text-2xl font-black text-white mt-1">
                {currentXp} <span className="text-sm text-slate-400 font-medium">/ {levelThreshold} XP</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{levelThreshold - currentXp} XP needed to Level up</p>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>LVL {data.level}</span>
              <span>{progressPercent}% Complete</span>
              <span>LVL {data.level + 1}</span>
            </div>
            <div className="h-4 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.5)] transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Streak Summary Card */}
        <Card className="p-6 relative overflow-hidden flex flex-col justify-between" style={{ background: 'linear-gradient(135deg, #2D3436 0%, #1a1f20 100%)' }}>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Flame size={120} className="text-orange-500" />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                <Flame size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Active Streak</h3>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-orange-500">{data.streak}</span>
              <span className="text-lg text-slate-400 font-bold">Days Flame</span>
            </div>
            <p className="text-sm text-slate-400 mt-2 font-medium">
              Keep checking in, completing tasks, or viewing KB articles daily to maintain your flame!
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Longest Streak:</span>
            <span className="font-bold text-white flex items-center gap-1">
              <Star size={12} className="text-amber-500 fill-amber-500" /> {data.longestStreak} days
            </span>
          </div>
        </Card>
      </div>

      {/* ── SECTION 2: DAILY GOALS & STREAK CALENDAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Daily Learning Goals */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Daily Learning Goals</h3>
              <p className="text-xs text-slate-400">Earn 100 bonus XP upon completing all daily goals</p>
            </div>
            {data.dailyGoal.completed && (
              <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 size={13} /> Completed
              </span>
            )}
          </div>

          <div className="space-y-4 flex-1">
            {/* Goal 1: Check in Attendance */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800" style={{ background: 'var(--bg)' }}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${data.dailyGoal.kbReadDone >= data.dailyGoal.kbReadGoal ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  <BookOpen size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Read KB Article</h4>
                  <p className="text-xs text-slate-400">Read onboarding docs or guidelines</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-300">
                  {data.dailyGoal.kbReadDone} / {data.dailyGoal.kbReadGoal}
                </span>
                {data.dailyGoal.kbReadDone >= data.dailyGoal.kbReadGoal ? (
                  <CheckCircle2 className="text-emerald-500" size={18} />
                ) : (
                  <Circle className="text-slate-600" size={18} />
                )}
              </div>
            </div>

            {/* Goal 2: Complete Project Tasks */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800" style={{ background: 'var(--bg)' }}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${data.dailyGoal.tasksDone >= data.dailyGoal.tasksGoal ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  <ClipboardList size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Complete Tasks</h4>
                  <p className="text-xs text-slate-400">Mark project task board item as DONE</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-300">
                  {data.dailyGoal.tasksDone} / {data.dailyGoal.tasksGoal}
                </span>
                {data.dailyGoal.tasksDone >= data.dailyGoal.tasksGoal ? (
                  <CheckCircle2 className="text-emerald-500" size={18} />
                ) : (
                  <Circle className="text-slate-600" size={18} />
                )}
              </div>
            </div>

            {/* Goal 3: Submit Weekly Reports */}
            {data.dailyGoal.reportsGoal > 0 && (
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800" style={{ background: 'var(--bg)' }}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${data.dailyGoal.reportsDone >= data.dailyGoal.reportsGoal ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    <ClipboardList size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Submit Report</h4>
                    <p className="text-xs text-slate-400">Submit progress weekly report</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-300">
                    {data.dailyGoal.reportsDone} / {data.dailyGoal.reportsGoal}
                  </span>
                  {data.dailyGoal.reportsDone >= data.dailyGoal.reportsGoal ? (
                    <CheckCircle2 className="text-emerald-500" size={18} />
                  ) : (
                    <Circle className="text-slate-600" size={18} />
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Learning Streak Calendar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Calendar size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Learning Streak Calendar</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-800 rounded transition" style={{ color: 'var(--text)' }}>
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-white min-w-[100px] text-center">
                {monthName} {year}
              </span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-slate-800 rounded transition" style={{ color: 'var(--text)' }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
              
              const active = isDateActive(date);
              const dayNum = date.getDate();
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div 
                  key={date.toISOString()}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold relative group transition-all duration-300 ${
                    active 
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                      : isToday 
                        ? 'border border-amber-500 text-amber-400 bg-amber-500/5' 
                        : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800/80'
                  }`}
                >
                  {dayNum}
                  
                  {active && (
                    <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}

                  {/* Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-950 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10 border border-slate-800">
                    {date.toLocaleDateString('default', { month: 'short', day: 'numeric' })}: {active ? '🔥 Active learning day' : '💤 No activity logged'}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── SECTION 3: ACHIEVEMENT BADGES ── */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
            <Award size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Achievement Badges</h3>
            <p className="text-xs text-slate-400">Milestone achievements you can unlock as an intern</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {data.badges.map((badge) => {
            const unlocked = true; // Handled directly because backend gets status
            return (
              <div 
                key={badge.id}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-300"
                style={{ 
                  background: '#1a1f20', 
                  borderColor: 'var(--border)',
                }}
              >
                <div 
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]`}
                >
                  <BadgeIcon name={badge.icon} />
                </div>
                
                <h4 className="text-sm font-bold text-white leading-snug">{badge.name}</h4>
                <p className="text-xs text-slate-400 mt-1 flex-1 leading-normal">{badge.description}</p>
                
                <div className="mt-4 pt-3 border-t border-slate-800/80 w-full text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Unlocked {new Date(badge.unlockedAt).toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            );
          })}

          {/* Locked badges placeholder */}
          {/* We fetch all badges from endpoint in a real scenario, but since status doesn't return locked ones, let's load locked ones if possible */}
        </div>
      </Card>
    </div>
  );
};

export default GamificationDashboard;
