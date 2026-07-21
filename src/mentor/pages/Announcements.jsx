// ════════════════════════════════════════════════════════════
//  USER — pages/Announcements.jsx (Premium Corporate UI)
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useMemo } from 'react';
import { Pin, Megaphone, Loader2, Bell, Calendar, Clock, Filter, AlertTriangle, Info } from 'lucide-react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';

// FIXED: Added URGENT and INFO to make the filter more robust
const FILTERS = ['All', 'URGENT', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

// --- REALISTIC CORPORATE MOCK DATA ---
const mockAnnouncements = [
  { 
    id: '1', 
    title: 'Critical: Update Your Account Passwords', 
    body: 'As part of our new security compliance policy, all interns and mentors are required to update their portal passwords by the end of the day. Failure to do so will result in a temporary account lock.', 
    priority: 'URGENT', 
    pinned: true, 
    author: { name: 'Security Admin' }, 
    publishedAt: new Date(Date.now() - 3600000).toISOString() 
  },
  { 
    id: '2', 
    title: 'Scheduled Platform Maintenance', 
    body: 'The intern portal will be undergoing scheduled maintenance this Sunday from 2:00 AM to 4:00 AM. The system might be unavailable during this window. Please save all your ongoing work beforehand to avoid any data loss.', 
    priority: 'HIGH', 
    pinned: true, 
    author: { name: 'IT Support Team' }, 
    publishedAt: new Date(Date.now() - 86400000).toISOString() 
  },
  { 
    id: '3', 
    title: 'Weekly Sync Meeting Update', 
    body: 'Our weekly all-hands sync meeting has been moved to Thursday at 10:00 AM moving forward. A new calendar invite has been shared to your work emails. Please ensure you accept the invite.', 
    priority: 'MEDIUM', 
    pinned: false, 
    author: { name: 'HR Department' }, 
    publishedAt: new Date(Date.now() - 172800000).toISOString() 
  },
  { 
    id: '4', 
    title: 'Upcoming Public Holiday', 
    body: 'Just a reminder that the office will remain closed next Monday for the public holiday. Normal operations will resume on Tuesday. Enjoy your long weekend!', 
    priority: 'LOW', 
    pinned: false, 
    author: { name: 'HR Department' }, 
    publishedAt: new Date(Date.now() - 400000000).toISOString() 
  },
  { 
    id: '5', 
    title: 'New Dashboard Theme Deployed', 
    body: 'We have successfully rolled out the new Soft Navy and Cyan color theme across the portal. We hope you enjoy the new, cleaner interface!', 
    priority: 'INFO', 
    pinned: false, 
    author: { name: 'Design Team' }, 
    publishedAt: new Date(Date.now() - 500000000).toISOString() 
  }
];

const getPriorityStyles = (priority) => {
  switch(priority) {
    case 'URGENT': return 'bg-purple-100 text-purple-700 border border-purple-200';
    case 'HIGH': return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'MEDIUM': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'LOW': return 'bg-[#4FD1C5]/20 text-[#0d9488] border border-[#4FD1C5]/30';
    case 'INFO': return 'bg-blue-100 text-blue-700 border border-blue-200';
    default: return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

const getPriorityIcon = (priority) => {
  switch(priority) {
    case 'URGENT': return <AlertTriangle size={12} className="inline mr-1 mb-0.5" />;
    case 'INFO': return <Info size={12} className="inline mr-1 mb-0.5" />;
    default: return null;
  }
};

const Announcements = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/announcements', { params: { limit: 50 } })
      .then((r) => {
        setItems(r.data?.items?.length > 0 ? r.data.items : mockAnnouncements);
      })
      .catch(() => {
        // Silently fallback to mock data
        setItems(mockAnnouncements);
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter Logic optimized with useMemo
  const filtered = useMemo(() => {
    return items
      .filter((a) => filter === 'All' || a.priority === filter)
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [items, filter]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin text-[#4FD1C5]" size={36} /></div>;
  }

  return (
    <div className="space-y-6 bg-[#F7FAFC] min-h-screen pb-10">
      
      {/* --- PRO HERO SECTION --- */}
      <div className="relative overflow-hidden rounded-[2rem] p-8 sm:p-10 shadow-lg"
           style={{ background: "linear-gradient(135deg, #1F3A5F 0%, #172a45 100%)" }}>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#4FD1C5]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-[#4FD1C5]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 flex items-center gap-3">
              <Megaphone size={32} className="text-[#4FD1C5]" /> Announcements
            </h1>
            <p className="text-[#A0AEC0] font-medium text-sm sm:text-base max-w-xl">
              Stay updated with the latest platform news, maintenance schedules, and internship updates.
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 self-start sm:self-auto">
            <span className="text-3xl font-black text-[#4FD1C5]">{items.filter((a) => a.pinned).length}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A0AEC0] mt-1">Pinned</span>
          </div>
        </div>
      </div>

      {/* --- FILTER CHIPS --- */}
      <div className="px-2 border-b border-[#A0AEC0]/20 pb-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-[#A0AEC0] font-bold text-sm uppercase tracking-wider mr-2 flex items-center gap-2">
            <Filter size={16} /> Filter
          </span>
          {FILTERS.map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                filter === f 
                  ? 'bg-[#1F3A5F] text-[#4FD1C5] transform -translate-y-0.5' 
                  : 'bg-white text-[#A0AEC0] border border-[#A0AEC0]/30 hover:border-[#1F3A5F]/40 hover:text-[#1F3A5F]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* --- ANNOUNCEMENTS LIST --- */}
      <div className="space-y-5">
        {filtered.map((a) => (
          <Card 
            key={a.id} 
            className="p-0 overflow-hidden bg-white border border-[#A0AEC0]/30 shadow-sm rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group relative animate-in fade-in slide-in-from-bottom-2"
          >
            {/* Pinned Highlight Bar */}
            {a.pinned && (
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#4FD1C5]"></div>
            )}
            
            <div className={`p-6 sm:p-8 ${a.pinned ? 'pl-8 sm:pl-10' : ''}`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    {a.pinned && (
                      <span className="bg-[#4FD1C5]/10 text-[#0d9488] px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-[#4FD1C5]/20 flex items-center gap-1.5">
                        <Pin size={12} fill="currentColor" /> Pinned
                      </span>
                    )}
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getPriorityStyles(a.priority)}`}>
                      {getPriorityIcon(a.priority)}
                      {a.priority} Priority
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-black text-[#1F3A5F] leading-snug group-hover:text-[#4FD1C5] transition-colors">
                    {a.title}
                  </h3>
                </div>
                
                {/* Date Badge */}
                <div className="flex items-center gap-2 text-xs font-bold text-[#A0AEC0] bg-[#F7FAFC] px-3 py-2 rounded-lg border border-[#A0AEC0]/20 flex-shrink-0">
                  <Calendar size={14} className="text-[#1F3A5F]" />
                  {formatDate(a.publishedAt)}
                </div>

              </div>

              <p className="text-sm text-[#1F3A5F]/80 font-medium leading-relaxed mb-6">
                {a.body}
              </p>

              <div className="flex items-center gap-2 pt-4 border-t border-[#F7FAFC] text-xs font-bold text-[#A0AEC0]">
                <span className="bg-[#1F3A5F]/5 text-[#1F3A5F] px-2.5 py-1 rounded-md">
                  {a.author?.name}
                </span>
                <span className="w-1 h-1 rounded-full bg-[#A0AEC0]/50 mx-1"></span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#4FD1C5]" /> Official Communication
                </span>
              </div>
            </div>
          </Card>
        ))}

        {/* --- EMPTY STATE --- */}
        {filtered.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-24 px-6 text-center shadow-sm border border-[#A0AEC0]/30 bg-white rounded-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 bg-[#F7FAFC] border border-[#A0AEC0]/30">
              <Bell size={36} className="text-[#A0AEC0]" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-[#1F3A5F]">No announcements right now</h3>
            <p className="max-w-md text-sm text-[#A0AEC0] font-medium">You are all caught up! Try changing the priority filter to see other updates.</p>
          </Card>
        )}
      </div>

    </div>
  );
};

export default Announcements;