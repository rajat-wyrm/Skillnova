import { useEffect, useState } from 'react';
import { Pin, Megaphone, Loader2, BookOpen, AlertCircle, Clock, Bell } from 'lucide-react';
import { Card, Badge, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import { formatDate } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;

const PRIORITY_VARIANTS = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' };
const TABS = [
  { id: 'unread', label: 'Unread Announcements', icon: Megaphone },
  { id: 'read', label: 'Read Announcements', icon: BookOpen },
  { id: 'important', label: 'Important', icon: Pin },
  { id: 'reminders', label: 'Reminder History', icon: Bell },
  { id: 'deadlines', label: 'Deadline Alerts', icon: AlertCircle },
];

const Announcements = () => {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('unread');
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem('skillnova_read_announcements');
    return saved ? JSON.parse(saved) : [];
  });
  const [deadlineAlerts, setDeadlineAlerts] = useState([]);

  const reminders = [
    {
      id: 'rem-1',
      title: 'Platform System Maintenance Complete',
      body: 'SkillNova servers have successfully migrated to AWS Cloud instances for faster load speeds.',
      publishedAt: '2026-07-09T12:00:00.000Z',
      author: { name: 'System Admin' },
      priority: 'LOW',
    },
    {
      id: 'rem-2',
      title: 'Daily Attendance Reminder',
      body: 'Remember to check in your daily status report before 6:00 PM today.',
      publishedAt: '2026-07-11T12:00:00.000Z',
      author: { name: 'HR Department' },
      priority: 'MEDIUM',
    }
  ];


  const fetchAnnouncements = () => {
    api.get('/announcements', { params: { limit: 50 } })
      .then((r) => setItems(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadDeadlineAlerts = () => {
    const saved = localStorage.getItem('skillnova_deadline_alerts') || '[]';
    setDeadlineAlerts(JSON.parse(saved));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnnouncements();
      loadDeadlineAlerts();
    }, 0);

    // Listen for real-time deadline alert triggers
    const handleDeadlineUpdate = () => {
      loadDeadlineAlerts();
    };
    window.addEventListener('skillnova_deadline_updated', handleDeadlineUpdate);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('skillnova_deadline_updated', handleDeadlineUpdate);
    };
  }, []);

  const markAsRead = (id) => {
    if (readIds.includes(id)) return;
    const next = [...readIds, id];
    setReadIds(next);
    localStorage.setItem('skillnova_read_announcements', JSON.stringify(next));
  };

  const markAsUnread = (id) => {
    const next = readIds.filter((x) => x !== id);
    setReadIds(next);
    localStorage.setItem('skillnova_read_announcements', JSON.stringify(next));
  };

  // Filter content based on active tab
  let displayContent = [];

  if (activeTab === 'unread') {
    displayContent = items.filter((a) => !readIds.includes(a.id));
  } else if (activeTab === 'read') {
    displayContent = items.filter((a) => readIds.includes(a.id));
  } else if (activeTab === 'important') {
    displayContent = items.filter((a) => a.priority === 'HIGH' || a.pinned);
  } else if (activeTab === 'reminders') {
    displayContent = reminders;
  } else if (activeTab === 'deadlines') {
    displayContent = deadlineAlerts;
  }


  // Sort pinned announcements to top except for reminders and deadlines
  if (activeTab !== 'reminders' && activeTab !== 'deadlines') {
    displayContent = [...displayContent].sort((a, b) => Number(b.pinned || 0) - Number(a.pinned || 0));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#ff6d34]" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Announcement Center"
        subtitle="Manage and view platform announcements, deadline triggers, and reminders"
      />

      {/* Tabs Header */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          let count = 0;
          if (tab.id === 'unread') count = items.filter((a) => !readIds.includes(a.id)).length;
          if (tab.id === 'read') count = items.filter((a) => readIds.includes(a.id)).length;
          if (tab.id === 'important') count = items.filter((a) => a.priority === 'HIGH' || a.pinned).length;
          if (tab.id === 'deadlines') count = deadlineAlerts.length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-[#ff6d34] text-white shadow-md shadow-[#ff6d34]/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#ff6d34]'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-[#ff6d34]' : 'bg-[#ff6d34] text-white'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Render list of content with beautiful entry animations */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {activeTab === 'deadlines' ? (
            displayContent.map((alert) => (
              <MotionDiv
                key={alert.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50/20 dark:bg-orange-950/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="warning">{alert.alertType}</Badge>
                        <span className="text-[11px] text-slate-400">
                          <Clock size={11} className="inline mr-1" />
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white leading-snug">
                        Deadline Alert: {alert.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Your assigned task "{alert.title}" reached the critical deadline reminder window: {alert.alertType}.
                      </p>
                    </div>
                  </div>
                </Card>
              </MotionDiv>
            ))
          ) : activeTab === 'reminders' ? (
            displayContent.map((rem) => (
              <MotionDiv
                key={rem.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="p-5 border-l-4 border-l-blue-500 bg-blue-50/10 dark:bg-blue-950/10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={PRIORITY_VARIANTS[rem.priority]}>{rem.priority}</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white leading-snug">{rem.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{rem.body}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {rem.author?.name} · {formatDate(rem.publishedAt)}
                      </p>
                    </div>
                  </div>
                </Card>
              </MotionDiv>
            ))
          ) : (
            displayContent.map((a) => (
              <MotionDiv
                key={a.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <Card className={`p-5 relative ${a.pinned ? 'border-l-4 border-l-blue-500' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {a.pinned && (
                          <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                            <Pin size={11} /> Pinned
                          </span>
                        )}
                        <Badge variant={PRIORITY_VARIANTS[a.priority]}>{a.priority}</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white leading-snug">{a.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{a.body}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {a.author?.name} · {formatDate(a.publishedAt)}
                      </p>
                    </div>

                    {/* Read / Unread Status Actions */}
                    <div className="flex-shrink-0">
                      {readIds.includes(a.id) ? (
                        <button
                          onClick={() => markAsUnread(a.id)}
                          className="text-xs text-slate-400 hover:text-[#ff6d34] border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg"
                        >
                          Mark Unread
                        </button>
                      ) : (
                        <button
                          onClick={() => markAsRead(a.id)}
                          className="text-xs text-white bg-[#00bea3] hover:bg-[#00a38d] px-2.5 py-1 rounded-lg shadow-sm"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              </MotionDiv>
            ))
          )}
        </AnimatePresence>

        {displayContent.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
            <p>No content to show in this view.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;
