// ════════════════════════════════════════════════════════════
//  USER — pages/ProductivityAnalytics.jsx
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Activity, LogIn, FileUp, UserCheck, Award, Clock,
  Calendar, Flame, Sparkles, Filter
} from 'lucide-react';
import { Card, SectionHeader, Badge } from '../../shared/components/UI';
import api from '../../lib/api';

const MotionDiv = motion.div;

// Helper to generate mock activity timeline
const MOCK_TIMELINE = [
  { id: 1, type: 'login', title: 'User Login', detail: 'Logged in from Chrome on Windows 11', time: '10 minutes ago', icon: LogIn, color: '#ff6d34' },
  { id: 2, type: 'task_submission', title: 'Task Completed', detail: 'Submitted "REST API Interceptors for Review"', time: '2 hours ago', icon: FileUp, color: '#00bea3' },
  { id: 3, type: 'profile_update', title: 'Profile Updated', detail: 'Added LinkedIn Link and updated Bio details', time: '1 day ago', icon: UserCheck, color: '#7c3aed' },
  { id: 4, type: 'certificate', title: 'Certificate Generated', detail: 'Completed "Vite Build Optimisations" learning path', time: '3 days ago', icon: Award, color: '#f59e0b' },
  { id: 5, type: 'login', title: 'User Login', detail: 'Logged in from Firefox on macOS', time: '4 days ago', icon: LogIn, color: '#ff6d34' }
];

const MOCK_HEATMAP_WEEK = [
  { day: 'Mon', morning: 5, afternoon: 8, evening: 3, night: 1 },
  { day: 'Tue', morning: 2, afternoon: 10, evening: 6, night: 0 },
  { day: 'Wed', morning: 7, afternoon: 4, evening: 9, night: 4 },
  { day: 'Thu', morning: 4, afternoon: 7, evening: 3, night: 2 },
  { day: 'Fri', morning: 6, afternoon: 12, evening: 5, night: 1 },
  { day: 'Sat', morning: 0, afternoon: 2, evening: 1, night: 0 },
  { day: 'Sun', morning: 1, afternoon: 0, evening: 2, night: 1 }
];

const MOCK_SUBMISSION_TRENDS = [
  { week: 'Wk 1', completed: 3, pending: 8 },
  { week: 'Wk 2', completed: 6, pending: 5 },
  { week: 'Wk 3', completed: 10, pending: 7 },
  { week: 'Wk 4', completed: 14, pending: 6 },
  { week: 'Wk 5', completed: 18, pending: 4 }
];

const ProductivityAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState([]);
  const [weeklyHeatmap, setWeeklyHeatmap] = useState([]);
  const [submissionTrends, setSubmissionTrends] = useState([]);
  const [loginStats, setLoginStats] = useState([]);

  useEffect(() => {
    const loadProductivity = async () => {
      setLoading(true);
      try {
        // Load data from platforms and fallbacks
        const [statsRes] = await Promise.all([
          api.get('/analytics/platform').catch(() => ({ data: { loginsByDay: [] } }))
        ]);

        // Simulating loading
        await new Promise(r => setTimeout(r, 650));

        setTimeline(MOCK_TIMELINE);
        setWeeklyHeatmap(MOCK_HEATMAP_WEEK);
        setSubmissionTrends(MOCK_SUBMISSION_TRENDS);

        // Calculate logins by day
        const lStats = statsRes.data?.loginsByDay || [
          { day: 'Mon', count: 4 },
          { day: 'Tue', count: 6 },
          { day: 'Wed', count: 5 },
          { day: 'Thu', count: 3 },
          { day: 'Fri', count: 7 },
          { day: 'Sat', count: 1 },
          { day: 'Sun', count: 2 }
        ];
        setLoginStats(lStats);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    };

    loadProductivity();
  }, []);

  // 30 Days Contribution Cells
  const renderDailyHeatmapCells = () => {
    const cells = [];
    const seed = [0, 1, 3, 0, 5, 2, 0, 4, 1, 0, 2, 6, 3, 1, 0, 4, 2, 0, 1, 5, 0, 2, 4, 1, 0, 3, 2, 0, 1, 4];
    
    for (let i = 0; i < 30; i++) {
      const activityLevel = seed[i];
      let bg = 'rgba(255,109,52,0.05)';
      let border = 'rgba(255,255,255,0.05)';
      
      if (activityLevel === 1 || activityLevel === 2) {
        bg = 'rgba(255,109,52,0.2)';
      } else if (activityLevel === 3 || activityLevel === 4) {
        bg = 'rgba(255,109,52,0.5)';
      } else if (activityLevel >= 5) {
        bg = 'rgba(255,109,52,0.95)';
      }

      cells.push(
        <Tooltip key={i} content={`Day ${i + 1}: ${activityLevel} tasks/commits submitted`}>
          <div 
            className="w-4 h-4 rounded-sm transition-transform hover:scale-115 cursor-pointer"
            style={{ 
              background: bg, 
              border: `1px solid ${border}`,
              gridRow: (i % 7) + 1 
            }}
          />
        </Tooltip>
      );
    }
    return cells;
  };

  return (
    <div className="space-y-6 pb-16">
      <SectionHeader 
        title="Productivity Heatmap & Activity" 
        subtitle="Visual analytics on task submission trends, login frequency and timeline activity logs" 
      />

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton lg:col-span-2 h-96 rounded-2xl"></div>
          <div className="skeleton h-96 rounded-2xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visualizations Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Heatmaps Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Daily Contribution matrix */}
              <Card className="p-5 border border-[var(--border)] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <Calendar className="text-[#ff6d34]" size={16} /> Daily Activity Matrix (Last 30 Days)
                  </h3>
                  <p className="text-[11px] text-[var(--muted)] mb-5">Grid represents days of the week stacked vertically.</p>
                </div>
                
                <div className="flex gap-2 justify-center py-2">
                  {/* Row tags */}
                  <div className="grid grid-rows-7 text-[8px] font-bold text-[var(--muted)] h-[126px] items-center mr-1">
                    <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  </div>
                  
                  {/* Contribution Matrix */}
                  <div className="grid grid-flow-col grid-rows-7 gap-1 h-[126px] overflow-hidden select-none">
                    {renderDailyHeatmapCells()}
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 items-center mt-4 pt-3 border-t border-[var(--border)] text-[9px] font-bold text-[var(--muted)]">
                  <span>Less</span>
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(255,109,52,0.05)', border: '1px solid var(--border)' }} />
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(255,109,52,0.2)' }} />
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(255,109,52,0.5)' }} />
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(255,109,52,0.95)' }} />
                  <span>More</span>
                </div>
              </Card>

              {/* Weekly Heatmap Hour Blocks */}
              <Card className="p-5 border border-[var(--border)]">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Clock className="text-[#00bea3]" size={16} /> Weekly Productivity blocks
                </h3>

                <div className="space-y-2 mt-4 text-xs font-semibold">
                  {/* Header */}
                  <div className="grid grid-cols-5 text-[9px] text-[var(--muted)] font-black uppercase text-center pb-2 border-b border-[var(--border)]">
                    <span className="text-left">Day</span><span>Morning</span><span>Afternoon</span><span>Evening</span><span>Night</span>
                  </div>
                  {/* Rows */}
                  {weeklyHeatmap.map((w) => {
                    const blockColor = (val) => {
                      if (val === 0) return 'transparent';
                      if (val <= 3) return 'rgba(0,190,163,0.15)';
                      if (val <= 7) return 'rgba(0,190,163,0.4)';
                      return 'rgba(0,190,163,0.8)';
                    };

                    return (
                      <div key={w.day} className="grid grid-cols-5 items-center text-center py-1">
                        <span className="text-left font-bold text-[var(--muted)] text-[10px]">{w.day}</span>
                        {[w.morning, w.afternoon, w.evening, w.night].map((val, idx) => (
                          <div key={idx} className="flex justify-center">
                            <div 
                              className="w-7 h-5 rounded-md text-[10px] flex items-center justify-center font-bold text-[var(--text)]"
                              style={{ 
                                background: blockColor(val), 
                                border: val === 0 ? '1px dashed var(--border)' : '1px solid transparent' 
                              }}
                              title={`${val} interactions`}
                            >
                              {val > 0 ? val : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Trends and Login charts row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Task Submission Trends Area Chart */}
              <Card className="p-5 border border-[var(--border)]">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <Activity className="text-orange-500" size={16} /> Task Submission Trends
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={submissionTrends}>
                    <defs>
                      <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00bea3" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#00bea3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" name="Completed" dataKey="completed" stroke="#00bea3" fill="url(#compGrad)" strokeWidth={2} />
                    <Area type="monotone" name="Pending" dataKey="pending" stroke="#ff6d34" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Login frequency bar chart */}
              <Card className="p-5 border border-[var(--border)]">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                  <LogIn className="text-purple-500" size={16} /> Login Frequency (7 Days)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={loginStats}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, background: 'var(--card)', color: 'var(--text)' }} />
                    <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Logins" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

            </div>

          </div>

          {/* Activity Timeline Column */}
          <Card className="p-5 border border-[var(--border)] flex flex-col">
            <h3 className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Clock className="text-purple-500" size={18} /> Recent Activity Timeline
            </h3>

            <div className="flex-1 space-y-6 relative pl-4 border-l border-[var(--border)] ml-3 my-2">
              {timeline.map((act) => {
                const IconComp = act.icon;
                return (
                  <div key={act.id} className="relative group">
                    {/* Circle Dot with Icon */}
                    <div 
                      className="absolute -left-7 top-0 w-6 h-6 rounded-full flex items-center justify-center border transition-transform group-hover:scale-110" 
                      style={{ 
                        background: 'var(--card)', 
                        borderColor: act.color,
                        color: act.color
                      }}
                    >
                      <IconComp size={12} />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-xs font-bold text-[var(--text)]">{act.title}</span>
                        <span className="text-[9px] text-[var(--muted)] font-medium whitespace-nowrap">{act.time}</span>
                      </div>
                      <p className="text-[11px] text-[var(--muted)] leading-relaxed">{act.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-[var(--border)] text-center">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">Activity Logs are immutable</span>
            </div>
          </Card>

        </div>
      )}
    </div>
  );
};

export default ProductivityAnalytics;
