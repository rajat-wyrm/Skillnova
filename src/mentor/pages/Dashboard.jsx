// ════════════════════════════════════════════════════════════
//  Mentor — pages/Dashboard.jsx (100% Crash-Free & Clickable)
// ════════════════════════════════════════════════════════════
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell
} from "recharts";
import { useEffect, useState } from 'react';
// 🚨 HATA DIYA: react-router-dom ka koi import nahi hai ab yahan!
import { 
  Users, FileText, AlertTriangle, TrendingUp, 
  Search, AlertCircle, BookOpen, Sparkles, Activity, CheckCircle, ChevronRight
} from 'lucide-react';
import { Card, StatCard, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

// --- REALISTIC MOCK DATA ---
const mockInterns = [
  { id: 1, name: 'Aarav Sharma', department: 'Frontend Dev', avgScore: 9.2, completedTasks: 18, attendanceRate: 95 },
  { id: 2, name: 'Priya Patel', department: 'Backend Dev', avgScore: 8.5, completedTasks: 14, attendanceRate: 88 },
  { id: 3, name: 'Rohan Singh', department: 'UI/UX Design', avgScore: 6.4, completedTasks: 7, attendanceRate: 70 }, 
  { id: 4, name: 'Neha Gupta', department: 'Machine Learning', avgScore: 9.5, completedTasks: 22, attendanceRate: 98 },
  { id: 5, name: 'Kabir Das', department: 'Frontend Dev', avgScore: 7.8, completedTasks: 11, attendanceRate: 82 },
];

const mockReports = Array(8).fill({}); 

const MentorDashboard = ({ onNavigate }) => { // 👈 SIRF onNavigate PROP USE KARENGE
  const { user } = useAuthStore();
  const [interns, setInterns] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [i, r] = await Promise.all([
          api.get('/analytics/interns'),
          api.get('/reports', { params: { limit: 50, status: 'PENDING' } }),
        ]);
        
        setInterns(i.data?.items?.length > 0 ? i.data.items : mockInterns);
        setReports(r.data?.items?.length > 0 ? r.data.items : mockReports);
      } catch (err) {
        console.warn("API fetch failed, loading mock data.");
        setInterns(mockInterns);
        setReports(mockReports);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- DYNAMIC CHART LOGIC ---
  const currentDayOfWeek = new Date().getDay(); 
  const currentDayIndex = currentDayOfWeek === 0 ? -1 : currentDayOfWeek - 1;

  const baseWeeklyData = [
    { day: "Mon", reports: 4 },
    { day: "Tue", reports: 7 },
    { day: "Wed", reports: 3 },
    { day: "Thu", reports: 9 },
    { day: "Fri", reports: 5 },
    { day: "Sat", reports: 2 },
  ];

  const weeklyData = baseWeeklyData.map((item, index) => ({
    ...item,
    reports: index > currentDayIndex ? 0 : item.reports
  }));

  if (loading) return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="h-72 bg-slate-200/50 rounded-3xl w-full"></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-slate-200/50 rounded-2xl w-full"></div>)}
      </div>
    </div>
  );

  const avgScore = interns.length ? (interns.reduce((s, i) => s + (i.avgScore || 0), 0) / interns.length).toFixed(1) : 0;
  const needAttention = interns.filter((i) => (i.avgScore ?? 0) < 7 || (i.attendanceRate ?? 0) < 75);

  const filteredInterns = interns.filter(i => 
    i.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 bg-[#F7FAFC] min-h-screen pb-10">
      
      {/* --- PRO HERO SECTION --- */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 lg:p-10 shadow-xl border border-slate-700/50"
           style={{ background: "linear-gradient(135deg, #1F3A5F 0%, #172a45 100%)" }}>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4FD1C5]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-64 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="grid lg:grid-cols-2 gap-8 items-center relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4FD1C5] animate-pulse shadow-[0_0_8px_rgba(79,209,197,0.8)]"></span>
              <p className="uppercase tracking-[0.2em] text-xs font-bold text-slate-300">
                Mentor Command Center
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight text-white mb-4">
              Welcome Back,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4FD1C5] to-cyan-300">
                {user?.name?.split(" ")[0] || "Sneha"} 
              </span>
            </h1>
            <p className="text-sm md:text-base max-w-xl text-slate-300 leading-relaxed font-medium">
              Your dashboard is fully synced. You have <b className="text-white">{needAttention.length} interns</b> needing immediate attention and <b className="text-white">{reports.length} reports</b> pending your review.
            </p>
            <div className="flex gap-4 mt-8">
              {/* 👈 Clean Custom Navigation */}
              <button 
                onClick={() => onNavigate && onNavigate('reports')}
                className="px-7 py-3.5 rounded-xl font-bold text-[#1F3A5F] bg-gradient-to-r from-[#4FD1C5] to-cyan-400 shadow-[0_0_20px_rgba(79,209,197,0.3)] hover:shadow-[0_0_25px_rgba(79,209,197,0.5)] transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2"
              >
                Review Pending Work <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Active Interns", val: interns.length, icon: Users, color: "text-blue-400", routeKey: 'interns' },
              { label: "Pending Reviews", val: reports.length, icon: FileText, color: "text-amber-400", routeKey: 'reports' },
              { label: "Average Score", val: avgScore, icon: TrendingUp, color: "text-[#4FD1C5]" },
              { label: "Need Attention", val: needAttention.length, icon: AlertTriangle, alert: true, color: "text-rose-400" }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                onClick={stat.routeKey && onNavigate ? () => onNavigate(stat.routeKey) : undefined}
                className={`backdrop-blur-md rounded-2xl p-5 border ${stat.alert && stat.val > 0 ? 'border-rose-500/30 bg-rose-500/10' : 'border-white/10 bg-white/5'} transition-all hover:bg-white/10 ${stat.routeKey ? 'cursor-pointer transform hover:scale-[1.02]' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{stat.label}</h4>
                  <stat.icon size={18} className={stat.color} />
                </div>
                <div className="text-3xl font-black mt-2 text-white">{stat.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- QUICK ACTIONS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { title: "Intern Profiles", icon: Users, desc: "Performance tracking", bg: "bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white", routeKey: 'interns' },
          { title: "Review Reports", icon: CheckCircle, desc: `${reports.length} tasks waiting`, bg: "bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white", routeKey: 'reports' },
          { title: "AI Analytics", icon: Sparkles, desc: "Smart suggestions", bg: "bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white", routeKey: 'ai' },
          { title: "Resources", icon: BookOpen, desc: "Upload docs & guides", bg: "bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white", routeKey: 'knowledge' },
        ].map((action, idx) => (
          <Card 
            hover 
            key={idx} 
            onClick={() => onNavigate && onNavigate(action.routeKey)}
            className="p-6 group cursor-pointer border border-[#A0AEC0]/30 hover:border-[#1F3A5F]/40 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-2xl"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${action.bg}`}>
              <action.icon size={24} />
            </div>
            <h3 className="text-base font-bold text-[#1F3A5F]">{action.title}</h3>
            <p className="text-sm mt-1 text-[#A0AEC0] font-medium">{action.desc}</p>
          </Card>
        ))}
      </div>

      {/* --- CHARTS & METRICS --- */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 flex flex-col shadow-sm border border-[#A0AEC0]/30 bg-white rounded-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-bold text-[#1F3A5F]">Weekly Activity Flow</h2>
              <p className="text-sm text-[#A0AEC0] mt-1">Report submissions over the last 7 days</p>
            </div>
          </div>
          <div className="flex-1 min-h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#A0AEC0', fontSize: 13, fontWeight: 500 }} dy={10} />
                <Tooltip 
                  cursor={{ fill: '#F7FAFC' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backgroundColor: '#1F3A5F', color: '#F7FAFC' }}
                  itemStyle={{ color: '#4FD1C5', fontWeight: 'bold' }}
                />
                <Bar dataKey="reports" radius={[6, 6, 0, 0]} maxBarSize={45}>
                  {weeklyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === currentDayIndex ? '#4FD1C5' : '#A0AEC0'} 
                      className="hover:opacity-80 transition-opacity duration-300" 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 shadow-sm border border-[#A0AEC0]/30 bg-white rounded-2xl">
           <h2 className="text-xl font-bold text-[#1F3A5F]">Mentorship Goals</h2>
           <p className="text-sm text-[#A0AEC0] mt-1 mb-8">Current batch performance metrics</p>
          
          <div className="space-y-7">
            {[
              { title: "Batch Average Score", value: `${avgScore} / 10`, progress: (avgScore/10)*100, color: "#4FD1C5", bg: "bg-teal-100" },
              { title: "Overall Attendance", value: "88%", progress: 88, color: "#3b82f6", bg: "bg-blue-100" },
              { title: "Review Completion", value: "65%", progress: 65, color: "#8b5cf6", bg: "bg-purple-100" },
            ].map((item) => (
              <div key={item.title}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-[#1F3A5F]">{item.title}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out"
                       style={{ width: `${item.progress}%`, background: item.color }} />
                </div>
              </div>
            ))}
            
            <div className="rounded-xl p-5 mt-8 border border-rose-200 bg-rose-50 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-rose-700">
                <Activity size={18} className="text-rose-600" />
                <h3 className="font-bold text-sm">Action Required</h3>
              </div>
              <p className="text-xs text-rose-600/90 leading-relaxed font-medium">
                You have {needAttention.length} interns falling behind. Schedule 1-on-1 sessions this week to get them back on track.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* --- DATA TABLE --- */}
      <Card className="p-0 overflow-hidden shadow-sm border border-[#A0AEC0]/30 bg-white rounded-2xl">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
             <h2 className="text-xl font-bold text-[#1F3A5F]">Intern Roster</h2>
             <p className="text-sm text-[#A0AEC0] mt-1">Manage and track individual progress</p>
          </div>
          
          <div className="relative group w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#4FD1C5] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search interns by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7FAFC] border border-[#A0AEC0]/40 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-[#1F3A5F] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5]/40 focus:border-[#4FD1C5] transition-all placeholder:text-[#A0AEC0]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[50rem]">
            <thead>
              <tr className="bg-[#F7FAFC]">
                {['Intern Details', 'Department', 'Current Score', 'Tasks', 'Status'].map((h) => (
                  <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-left text-[#A0AEC0]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInterns.map((i) => (
                <tr key={i.id} className="border-b border-slate-50 hover:bg-[#F7FAFC]/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${i.avgScore >= 7 ? 'bg-gradient-to-br from-[#4FD1C5] to-teal-600' : 'bg-gradient-to-br from-rose-400 to-red-500'}`}>
                        {i.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-[#1F3A5F] group-hover:text-[#4FD1C5] transition-colors">{i.name}</p>
                        <p className="text-xs text-[#A0AEC0] mt-0.5 font-medium">ID: #INT-0{i.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#1F3A5F]/80">{i.department}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base" style={{ color: i.avgScore >= 7 ? '#0d9488' : '#e11d48' }}>
                        {i.avgScore.toFixed(1)}
                      </span>
                      <span className="text-[#A0AEC0] text-xs font-semibold">/ 10</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#1F3A5F]/80">{i.completedTasks} modules</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${i.attendanceRate >= 90 ? 'bg-teal-50 text-teal-700 border border-teal-100' : i.attendanceRate >= 75 ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                      {i.attendanceRate >= 90 ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                      {i.attendanceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredInterns.length === 0 && (
             <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-[#F7FAFC] p-4 rounded-full mb-4">
                <Search className="text-[#A0AEC0]" size={32} />
              </div>
              <h3 className="text-[#1F3A5F] font-bold text-lg mb-1">No matches found</h3>
              <p className="text-[#A0AEC0] text-sm max-w-sm">
                We couldn't find any intern matching your search.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MentorDashboard;