// ════════════════════════════════════════════════════════════
// Mentor — Interns page
 sneha-new-ui
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useMemo } from 'react';
import { 
  Loader2, Users, Search, Filter, Mail, 
  Star, Briefcase, ChevronRight, CheckCircle, AlertCircle, X, FileCheck
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { Loader2, Flame } from 'lucide-react';
 main
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';

// --- REALISTIC MOCK DATA ---
const mockInterns = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav@example.com', department: 'Frontend Dev', rating: 9.2, status: 'ACTIVE', tasksCompleted: 18, totalTasks: 20 },
  { id: 2, name: 'Priya Patel', email: 'priya@example.com', department: 'Backend Dev', rating: 8.5, status: 'ACTIVE', tasksCompleted: 14, totalTasks: 20 },
  { id: 3, name: 'Rohan Singh', email: 'rohan@example.com', department: 'UI/UX Design', rating: 6.4, status: 'NEEDS ATTENTION', tasksCompleted: 7, totalTasks: 20 },
  { id: 4, name: 'Neha Gupta', email: 'neha@example.com', department: 'Machine Learning', rating: 9.5, status: 'ACTIVE', tasksCompleted: 22, totalTasks: 25 },
  { id: 5, name: 'Kabir Das', email: 'kabir@example.com', department: 'Frontend Dev', rating: 7.8, status: 'ACTIVE', tasksCompleted: 11, totalTasks: 20 },
  { id: 6, name: 'Aditi Verma', email: 'aditi@example.com', department: 'Backend Dev', rating: 8.9, status: 'ACTIVE', tasksCompleted: 16, totalTasks: 20 },
];

const Interns = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Naya State: Popup (Modal) ko control karne ke liye
  const [activeModal, setActiveModal] = useState(null); 
  // activeModal format: { type: 'PROFILE' | 'REVIEW', intern: object } ya null

  const fetchInterns = () => {
    setLoading(true);
    api
      .get('/users', { params: { role: 'INTERN', limit: 100 } })
      .then((r) => {
        setInterns(r.data?.items?.length > 0 ? r.data.items : mockInterns);
      })
      .catch(() => {
        console.warn("API Error: Loading mock data for UI");
        setInterns(mockInterns);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInterns();
  }, []);

  const departments = ['All', ...new Set(interns.map(i => i.department))];

  const filteredInterns = useMemo(() => {
    return interns.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            i.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'All' || i.department === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [interns, searchQuery, activeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#4FD1C5]" size={36} />
      </div>
    );
  }

  return (
 sneha-new-ui
    <div className="space-y-6 bg-[#F7FAFC] min-h-screen pb-10 relative">
      
      {/* --- PAGE HEADER & CONTROLS --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-[#1F3A5F]">
              My Interns
            </h2>
            <span className="px-3 py-1 bg-[#1F3A5F] text-[#4FD1C5] font-bold text-xs rounded-full shadow-sm">
              {interns.length} Total
            </span>
          </div>
          <p className="text-sm text-[#A0AEC0] font-medium">Manage, review, and track individual progress.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#4FD1C5] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#A0AEC0]/40 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-[#1F3A5F] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] focus:border-[#4FD1C5] transition-all shadow-sm placeholder:text-[#A0AEC0]"
            />
          </div>
        </div>
      </div>

      {/* --- FILTER CHIPS --- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Filter size={16} className="text-[#A0AEC0] min-w-[16px]" />
        {departments.map(dept => (
          <button
            key={dept}
            onClick={() => setActiveFilter(dept)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeFilter === dept 
                ? 'bg-[#1F3A5F] text-[#F7FAFC] shadow-md' 
                : 'bg-white text-[#A0AEC0] hover:bg-[#F7FAFC] border border-[#A0AEC0]/40 hover:border-[#1F3A5F]/50 hover:text-[#1F3A5F]'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* --- INTERN GRID CARDS --- */}
      {filteredInterns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredInterns.map((i) => {
            const progressPercentage = ((i.tasksCompleted / i.totalTasks) * 100) || 0;
            const isAlert = i.status === 'NEEDS ATTENTION' || i.rating < 7;

            return (
              <div 
                key={i.id} 
                className="bg-white rounded-[1.5rem] p-6 border border-[#A0AEC0]/30 shadow-sm hover:shadow-xl hover:border-[#4FD1C5]/50 transition-all duration-300 transform hover:-translate-y-1 group relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-full h-1.5 ${isAlert ? 'bg-red-500' : 'bg-gradient-to-r from-[#1F3A5F] to-[#4FD1C5]'}`}></div>

                <div className="flex justify-between items-start mb-4 mt-2">
                  <div className="flex gap-4 items-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[#F7FAFC] font-black text-xl shadow-sm ${isAlert ? 'bg-red-500' : 'bg-gradient-to-br from-[#1F3A5F] to-[#4FD1C5]'}`}>
                      {i.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#1F3A5F] group-hover:text-[#4FD1C5] transition-colors">{i.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#A0AEC0] font-medium mt-0.5">
                        <Briefcase size={12} /> {i.department}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-[#1F3A5F]">
                    <Mail size={14} className="text-[#A0AEC0]" />
                    <span className="truncate font-medium">{i.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between bg-[#F7FAFC] px-3 py-2 rounded-lg border border-[#A0AEC0]/20">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#1F3A5F]">
                      <Star size={16} className={i.rating >= 8 ? "text-amber-400 fill-amber-400" : "text-[#A0AEC0]"} />
                      {i.rating} <span className="text-xs text-[#A0AEC0] font-semibold">/ 10 Rating</span>
                    </div>
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${isAlert ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-[#4FD1C5]/20 text-[#1F3A5F] border border-[#4FD1C5]/30'}`}>
                      {isAlert ? <AlertCircle size={10} /> : <CheckCircle size={10} />}
                      {i.status}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[#1F3A5F]">Task Progress</span>
                    <span className="text-[#1F3A5F]">{i.tasksCompleted} <span className="text-[#A0AEC0]">/ {i.totalTasks}</span></span>
                  </div>
                  <div className="w-full bg-[#F7FAFC] rounded-full h-2.5 overflow-hidden border border-[#A0AEC0]/20">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${isAlert ? 'bg-red-400' : 'bg-[#4FD1C5]'}`} 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* --- YAHAN MAIN BUTTON CLICK LOGIC ADD KIYA HAI --- */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => setActiveModal({ type: 'PROFILE', intern: i })}
                    className="flex-1 bg-transparent border-2 border-[#A0AEC0]/40 text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-[#F7FAFC] hover:border-[#1F3A5F] transition-all duration-300 py-2.5 rounded-xl text-sm font-bold shadow-sm"
                  >
                    View Profile
                  </button>
                  <button 
                    onClick={() => setActiveModal({ type: 'REVIEW', intern: i })}
                    className="flex-1 bg-[#4FD1C5] text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-[#4FD1C5] transition-all duration-300 py-2.5 rounded-xl text-sm font-black shadow-md flex items-center justify-center gap-1"
                  >
                    Review <ChevronRight size={16} strokeWidth={3} />
                  </button>
                </div>

              </div>
            );
          })}

    <div className="space-y-6">
      <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>My Interns ({interns.length})</h2>
      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[40rem]">
            <thead><tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              {['Name', 'Email', 'Department', 'Rating', 'Streak', 'Status'].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {interns.map((i) => (
                <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 font-medium" style={{ color: 'var(--text)' }}>{i.name}</td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{i.email}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--muted)' }}>{i.department}</td>
                  <td className="px-5 py-4"><span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">⭐ {i.rating}</span></td>
                  <td className="px-5 py-4 font-bold">
                    <span className="flex items-center gap-1">
                      {i.currentStreak ?? 0} <Flame size={14} fill={(i.currentStreak ?? 0) > 0 ? '#ff6d34' : 'transparent'} color={(i.currentStreak ?? 0) > 0 ? '#ff6d34' : 'var(--muted)'} />
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs">{i.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
 main
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-20 px-6 text-center shadow-sm border border-[#A0AEC0]/30 bg-white rounded-2xl">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-[#F7FAFC] border border-[#A0AEC0]/30">
            <Search size={36} className="text-[#A0AEC0]" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[#1F3A5F]">
            No Interns Found
          </h3>
          <p className="max-w-md text-sm mb-6 text-[#A0AEC0] font-medium">
            We couldn't find any intern matching your search filters. Try clearing the search or changing the department filter.
          </p>
          <button 
            onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
            className="px-6 py-2.5 rounded-xl font-bold text-[#F7FAFC] bg-[#1F3A5F] hover:bg-[#4FD1C5] hover:text-[#1F3A5F] transition-all shadow-md"
          >
            Clear Filters
          </button>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════
          PREMIUM MODALS (POPUPS) SECTION
          ════════════════════════════════════════════════════════════ */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F3A5F]/60 backdrop-blur-sm animate-in fade-in duration-200">
          
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 bg-[#F7FAFC] hover:bg-rose-100 hover:text-rose-600 text-[#A0AEC0] rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>

            {/* --- PROFILE MODAL UI --- */}
            {activeModal.type === 'PROFILE' && (
              <div>
                <div className="bg-gradient-to-br from-[#1F3A5F] to-[#4FD1C5] h-24 w-full"></div>
                <div className="px-6 pb-6 relative">
                  {/* Huge Avatar overlapping header */}
                  <div className="w-20 h-20 rounded-2xl bg-white p-1 absolute -top-10 shadow-lg">
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1F3A5F] to-[#4FD1C5] flex items-center justify-center text-white font-black text-3xl">
                      {activeModal.intern.name.charAt(0)}
                    </div>
                  </div>
                  
                  <div className="mt-12">
                    <h2 className="text-2xl font-black text-[#1F3A5F]">{activeModal.intern.name}</h2>
                    <p className="text-[#A0AEC0] font-medium text-sm mt-1">{activeModal.intern.department} Intern</p>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-[#F7FAFC]">
                      <span className="text-sm font-bold text-[#A0AEC0]">Email</span>
                      <span className="text-sm font-bold text-[#1F3A5F]">{activeModal.intern.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[#F7FAFC]">
                      <span className="text-sm font-bold text-[#A0AEC0]">Performance</span>
                      <span className="text-sm font-bold text-[#4FD1C5]">{activeModal.intern.rating} / 10</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-[#F7FAFC]">
                      <span className="text-sm font-bold text-[#A0AEC0]">Status</span>
                      <span className={`text-xs font-black uppercase px-2 py-1 rounded-md ${activeModal.intern.status === 'NEEDS ATTENTION' ? 'bg-red-100 text-red-600' : 'bg-[#4FD1C5]/20 text-[#1F3A5F]'}`}>
                        {activeModal.intern.status}
                      </span>
                    </div>
                  </div>
                  
                  <button onClick={() => setActiveModal(null)} className="w-full mt-8 py-3 bg-[#F7FAFC] hover:bg-[#A0AEC0]/20 text-[#1F3A5F] font-bold rounded-xl transition-colors">
                    Close Profile
                  </button>
                </div>
              </div>
            )}

            {/* --- REVIEW MODAL UI --- */}
            {activeModal.type === 'REVIEW' && (
              <div className="p-6">
                <div className="w-12 h-12 bg-[#4FD1C5]/20 text-[#1F3A5F] rounded-xl flex items-center justify-center mb-4">
                  <FileCheck size={24} />
                </div>
                <h2 className="text-xl font-black text-[#1F3A5F] mb-1">Review Tasks</h2>
                <p className="text-sm text-[#A0AEC0] font-medium mb-6">
                  You are reviewing pending submissions for <strong className="text-[#4FD1C5]">{activeModal.intern.name}</strong>.
                </p>

                <div className="bg-[#F7FAFC] p-4 rounded-xl border border-[#A0AEC0]/20 mb-6">
                  <h4 className="text-sm font-bold text-[#1F3A5F] mb-2">Pending Modules: 2</h4>
                  <ul className="text-sm space-y-2 text-[#A0AEC0] font-medium">
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#4FD1C5]"></span> React UI Dashboard Setup</li>
                    <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#4FD1C5]"></span> API Integration for Reports</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-white border-2 border-[#A0AEC0]/30 text-[#1F3A5F] hover:bg-[#F7FAFC] font-bold rounded-xl transition-all">
                    Cancel
                  </button>
                  <button onClick={() => setActiveModal(null)} className="flex-1 py-3 bg-[#4FD1C5] text-[#1F3A5F] hover:bg-[#1F3A5F] hover:text-[#4FD1C5] font-black rounded-xl transition-all shadow-md">
                    Approve All
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

export default Interns;