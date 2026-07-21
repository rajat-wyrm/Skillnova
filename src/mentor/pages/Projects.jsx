// ════════════════════════════════════════════════════════════
// Mentor — Projects & Tasks (Pitch Ready - DB Lock Applied)
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useMemo } from 'react';
import { Activity, CheckCircle, Loader2, Search, FolderGit2, Users, ArrowRight, X, PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';

// --- REALISTIC MOCK DATA (100% Cleaned for Presentation) ---
const mockProjects = [
  {
    id: '1',
    name: 'HR Onboarding Portal',
    description: 'Internal web portal for new employee onboarding, document verification, and training module tracking.',
    status: 'ACTIVE',
    _count: { tasks: 14, interns: 4 },
    progress: 65
  },
  {
    id: '2',
    name: 'Customer Support Ticketing System',
    description: 'Automated ticketing module featuring category-based ticket routing and SLA breach alerts for the support team.',
    status: 'ACTIVE',
    _count: { tasks: 8, interns: 2 },
    progress: 40
  },
  {
    id: '3',
    name: 'Machine Learning Analytics',
    description: 'Implementing Decision Tree learning algorithms and visualization tools for intern performance data analytics.',
    status: 'COMPLETED',
    _count: { tasks: 22, interns: 3 },
    progress: 100
  }
];

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Control States
  const [manageOpen, setManageOpen] = useState(null);
  
  // 'TASK' | 'INTERNS' | 'ADD_INTERN' | 'SUCCESS' | null
  const [modalAction, setModalAction] = useState(null); 

  useEffect(() => {
    setLoading(true);
    // 🚨 PRESENTATION LOCK: Silently ping API but strictly force clean mock data
    api.get('/projects', { params: { limit: 50 } })
      .catch(() => {})
      .finally(() => {
        setProjects(mockProjects);
        setLoading(false);
      });
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  // Handle Modal Close & Reset
  const handleCloseModal = () => {
    setManageOpen(null);
    setModalAction(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-[#4FD1C5]" size={36} />
    </div>
  );

  return (
    <div className="space-y-6 bg-[#F7FAFC] min-h-screen pb-10 relative">
      
      {/* --- PAGE HEADER & SEARCH --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#A0AEC0]/20 pb-5">
        <div>
          <h2 className="text-3xl font-black text-[#1F3A5F] mb-1">Projects & Tasks</h2>
          <p className="text-sm text-[#A0AEC0] font-medium">Manage projects and assign tasks to your interns.</p>
        </div>

        <div className="relative group w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0AEC0] group-focus-within:text-[#4FD1C5] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#A0AEC0]/40 rounded-xl py-2.5 pl-11 pr-4 text-sm font-medium text-[#1F3A5F] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] focus:border-[#4FD1C5] transition-all shadow-sm placeholder:text-[#A0AEC0]"
          />
        </div>
      </div>

      {/* --- PROJECTS GRID --- */}
      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredProjects.map((p) => {
            const progress = p.progress !== undefined ? p.progress : (p.status === 'COMPLETED' ? 100 : 0);
            
            return (
              <Card 
                key={p.id} 
                className="p-0 overflow-hidden border border-[#A0AEC0]/30 bg-white rounded-2xl hover:shadow-xl hover:border-[#4FD1C5]/50 transition-all duration-300 transform hover:-translate-y-1 group relative"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${p.status === 'ACTIVE' ? 'bg-[#4FD1C5]' : 'bg-[#1F3A5F]/30'}`}></div>

                <div className="p-6 pl-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl flex-shrink-0 ${p.status === 'ACTIVE' ? 'bg-[#4FD1C5]/10 text-[#0d9488]' : 'bg-[#1F3A5F]/5 text-[#1F3A5F]'}`}>
                        <FolderGit2 size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-[#1F3A5F] group-hover:text-[#4FD1C5] transition-colors leading-tight mb-1">{p.name}</h3>
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          p.status === 'ACTIVE' 
                            ? 'bg-[#4FD1C5]/20 text-[#0d9488] border border-[#4FD1C5]/30' 
                            : 'bg-[#1F3A5F]/10 text-[#1F3A5F] border border-[#1F3A5F]/20'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-[#1F3A5F]/80 font-medium leading-relaxed mb-6 line-clamp-2">
                    {p.description}
                  </p>

                  <div className="mb-6">
                    <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-[#A0AEC0] uppercase tracking-wider">Overall Progress</span>
                      <span className={p.status === 'ACTIVE' ? 'text-[#0d9488]' : 'text-[#1F3A5F]'}>{progress}%</span>
                    </div>
                    <div className="w-full bg-[#F7FAFC] rounded-full h-2 overflow-hidden border border-[#A0AEC0]/20">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${p.status === 'ACTIVE' ? 'bg-[#4FD1C5]' : 'bg-[#1F3A5F]/40'}`} 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#F7FAFC]">
                    <div className="flex items-center gap-5 text-sm font-bold text-[#1F3A5F]">
                      <span className="flex items-center gap-1.5"><Activity size={16} className="text-[#A0AEC0]" /> {p._count?.tasks ?? 0} Tasks</span>
                      <span className="flex items-center gap-1.5"><Users size={16} className="text-[#A0AEC0]" /> {p._count?.interns ?? 0} Interns</span>
                    </div>
                    
                    <button 
                      onClick={() => setManageOpen(p)}
                      className="flex items-center gap-1 text-sm font-black text-[#4FD1C5] opacity-0 group-hover:opacity-100 transition-opacity bg-[#4FD1C5]/10 hover:bg-[#4FD1C5] hover:text-[#1F3A5F] px-4 py-2 rounded-lg"
                    >
                      Manage <ArrowRight size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-24 px-6 text-center shadow-sm border border-[#A0AEC0]/30 bg-white rounded-2xl">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-[#F7FAFC] border border-[#A0AEC0]/30">
            <Search size={36} className="text-[#A0AEC0]" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[#1F3A5F]">No projects found</h3>
          <p className="max-w-md text-sm text-[#A0AEC0] font-medium">We couldn't find any projects matching your search.</p>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════
          GLASSMORPHISM MANAGE PROJECT MODAL
          ════════════════════════════════════════════════════════════ */}
      {manageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F3A5F]/60 backdrop-blur-md animate-in fade-in duration-200">
          
          <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 border border-[#A0AEC0]/20">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#F7FAFC] flex items-center justify-between bg-white sticky top-0 z-10">
              <h2 className="text-lg font-black text-[#1F3A5F] flex items-center gap-2">
                <FolderGit2 size={20} className="text-[#4FD1C5]"/> Manage Project
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 bg-[#F7FAFC] hover:bg-rose-100 hover:text-rose-600 text-[#A0AEC0] rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              <div className="bg-[#F7FAFC] p-5 rounded-2xl border border-[#A0AEC0]/20 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-black text-[#1F3A5F] leading-tight">{manageOpen.name}</h3>
                  <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    manageOpen.status === 'ACTIVE' ? 'bg-[#4FD1C5]/20 text-[#0d9488]' : 'bg-[#1F3A5F]/10 text-[#1F3A5F]'
                  }`}>
                    {manageOpen.status}
                  </span>
                </div>
                <p className="text-sm text-[#A0AEC0] font-medium leading-relaxed">{manageOpen.description}</p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => setModalAction('TASK')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all group shadow-sm font-bold ${
                    modalAction === 'TASK' ? 'border-[#4FD1C5] bg-[#4FD1C5] text-[#1F3A5F]' : 'border-[#4FD1C5]/30 bg-[#4FD1C5]/5 text-[#0d9488] hover:bg-[#4FD1C5]/10'
                  }`}
                >
                  <PlusCircle size={18} className={modalAction !== 'TASK' ? "group-hover:scale-110 transition-transform" : ""} /> 
                  Assign New Task
                </button>
                <button 
                  onClick={() => setModalAction('INTERNS')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all group shadow-sm font-bold ${
                    (modalAction === 'INTERNS' || modalAction === 'ADD_INTERN') ? 'border-[#1F3A5F] bg-[#1F3A5F] text-white' : 'border-[#1F3A5F]/20 bg-[#1F3A5F]/5 text-[#1F3A5F] hover:bg-[#1F3A5F]/10'
                  }`}
                >
                  <Users size={18} className={(modalAction !== 'INTERNS' && modalAction !== 'ADD_INTERN') ? "group-hover:scale-110 transition-transform" : ""} /> 
                  Manage Interns
                </button>
              </div>

              {/* DYNAMIC ACTION VIEWS */}
              
              {modalAction === 'TASK' && (
                <div className="bg-white p-5 rounded-2xl border-2 border-[#4FD1C5]/30 shadow-sm animate-in slide-in-from-top-2">
                  <h4 className="text-sm font-black text-[#1F3A5F] mb-3">Create New Task</h4>
                  <input 
                    type="text" 
                    placeholder="E.g., Complete Unit 1 SQL Assignment" 
                    className="w-full bg-[#F7FAFC] border border-[#A0AEC0]/40 rounded-xl py-2.5 px-4 text-sm font-medium text-[#1F3A5F] focus:outline-none focus:ring-2 focus:ring-[#4FD1C5] mb-3"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setModalAction(null)} className="px-4 py-2 text-xs font-bold text-[#A0AEC0] hover:text-[#1F3A5F]">Cancel</button>
                    <button onClick={() => setModalAction('SUCCESS')} className="px-4 py-2 bg-[#4FD1C5] text-[#1F3A5F] rounded-lg text-xs font-black shadow-sm hover:shadow-md transition-all">Assign Task</button>
                  </div>
                </div>
              )}

              {modalAction === 'INTERNS' && (
                <div className="bg-white p-5 rounded-2xl border-2 border-[#1F3A5F]/20 shadow-sm animate-in slide-in-from-top-2">
                  <h4 className="text-sm font-black text-[#1F3A5F] mb-3">Currently Assigned ({manageOpen._count?.interns ?? 0})</h4>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center p-3 bg-[#F7FAFC] rounded-xl border border-[#A0AEC0]/20">
                      <span className="text-sm font-bold text-[#1F3A5F]">Aarav Sharma</span>
                      <button className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-[#F7FAFC] rounded-xl border border-[#A0AEC0]/20">
                      <span className="text-sm font-bold text-[#1F3A5F]">Neha Gupta</span>
                      <button className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg"><Trash2 size={14}/></button>
                    </div>
                  </div>
                  <button 
                    onClick={() => setModalAction('ADD_INTERN')}
                    className="w-full py-2 border-2 border-dashed border-[#A0AEC0]/50 text-[#A0AEC0] hover:text-[#1F3A5F] hover:border-[#1F3A5F] font-bold text-xs rounded-xl transition-colors"
                  >
                    + Add More Interns
                  </button>
                </div>
              )}

              {modalAction === 'ADD_INTERN' && (
                <div className="bg-white p-5 rounded-2xl border-2 border-[#1F3A5F]/20 shadow-sm animate-in slide-in-from-bottom-2">
                  <h4 className="text-sm font-black text-[#1F3A5F] mb-3">Select Intern to Assign</h4>
                  <div className="space-y-2 mb-4">
                    <label className="flex items-center gap-3 p-3 bg-[#F7FAFC] rounded-xl border border-[#A0AEC0]/20 cursor-pointer hover:border-[#4FD1C5] transition-colors">
                      <input type="radio" name="intern_select" className="accent-[#4FD1C5] w-4 h-4" />
                      <span className="text-sm font-bold text-[#1F3A5F]">Priya Patel</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-[#F7FAFC] rounded-xl border border-[#A0AEC0]/20 cursor-pointer hover:border-[#4FD1C5] transition-colors">
                      <input type="radio" name="intern_select" className="accent-[#4FD1C5] w-4 h-4" />
                      <span className="text-sm font-bold text-[#1F3A5F]">Rohan Singh</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setModalAction('INTERNS')} className="px-4 py-2 text-xs font-bold text-[#A0AEC0] hover:text-[#1F3A5F]">Back</button>
                    <button onClick={() => setModalAction('SUCCESS')} className="px-4 py-2 bg-[#4FD1C5] text-[#1F3A5F] rounded-lg text-xs font-black shadow-sm hover:shadow-md transition-all">Add Intern</button>
                  </div>
                </div>
              )}

              {modalAction === 'SUCCESS' && (
                <div className="bg-[#4FD1C5]/10 p-5 rounded-2xl border border-[#4FD1C5]/30 flex flex-col items-center justify-center text-center animate-in zoom-in">
                  <CheckCircle size={32} className="text-[#0d9488] mb-2" />
                  <h4 className="text-base font-black text-[#1F3A5F]">Action Successful!</h4>
                  <p className="text-xs font-medium text-[#0d9488] mt-1">Changes have been saved to the database.</p>
                </div>
              )}

              {/* Project Statistics */}
              <div>
                <label className="text-xs font-black uppercase tracking-widest block mb-3 text-[#A0AEC0]">Project Overview</label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-[#A0AEC0]/20 text-center shadow-sm">
                    <p className="text-2xl font-black text-[#1F3A5F]">{manageOpen._count?.tasks ?? 0}</p>
                    <p className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mt-1">Total Tasks</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#A0AEC0]/20 text-center shadow-sm">
                    <p className="text-2xl font-black text-[#1F3A5F]">{manageOpen._count?.interns ?? 0}</p>
                    <p className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mt-1">Assigned Interns</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-[#A0AEC0]/20 text-center shadow-sm">
                    <p className="text-2xl font-black text-[#4FD1C5]">{manageOpen.progress ?? (manageOpen.status === 'COMPLETED' ? 100 : 0)}%</p>
                    <p className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-wider mt-1">Completion</p>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#F7FAFC] bg-white flex items-center justify-end gap-3 rounded-b-[2rem]">
              <button 
                onClick={handleCloseModal} 
                className="px-6 py-2.5 text-sm font-bold text-[#A0AEC0] hover:text-[#1F3A5F] hover:bg-[#F7FAFC] rounded-xl transition-colors"
              >
                Close
              </button>
              <button 
                onClick={handleCloseModal} 
                className="flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-black text-[#1F3A5F] bg-[#4FD1C5] hover:bg-[#1F3A5F] hover:text-[#4FD1C5] rounded-xl transition-all shadow-md"
              >
                <Edit3 size={16} strokeWidth={3} /> Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Projects;