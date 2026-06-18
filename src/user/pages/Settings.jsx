// ════════════════════════════════════════════════════════════
//  USER — pages/Settings.jsx (UI-only, uses Zustand)
// ════════════════════════════════════════════════════════════
import { useState, useCallback } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Card, Toggle, SectionHeader } from '../../shared/components/UI';
import { useAuthStore } from '../../lib/auth';

const Settings = () => {
  const logout = useAuthStore((s) => s.logout);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifications, setNotifications] = useState(true);
  const [privateAcct, setPrivateAcct] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const toggleDark = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  return (
    <div className="max-w-2xl space-y-4">
      <SectionHeader title="Settings" subtitle="Personalise your SkillNova experience" />

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Appearance</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Dark mode</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Switch between light and dark themes</p>
            </div>
            <Toggle checked={darkMode} onChange={toggleDark} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Push notifications</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Realtime alerts for new reports, announcements and tasks</p>
            </div>
            <Toggle checked={notifications} onChange={() => setNotifications(!notifications)} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4">Privacy & Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Private profile</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Hide profile from non-admin users</p>
            </div>
            <Toggle checked={privateAcct} onChange={() => setPrivateAcct(!privateAcct)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Two-Factor Authentication</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Add an extra layer of security with TOTP</p>
            </div>
            <Toggle checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
          </div>
        </div>
      </Card>

      <Card className="p-5" style={{ borderColor: '#fecaca', background: 'rgba(254,242,242,0.4)' }}>
        <h3 className="text-sm font-semibold text-red-600 mb-1 flex items-center gap-2"><AlertTriangle size={14} /> Account actions</h3>
        <p className="text-xs text-red-400 mb-4">Logging out will end your current session.</p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={logout} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#dc2626' }}>
            <Trash2 size={12} className="inline mr-1" /> Sign out
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
