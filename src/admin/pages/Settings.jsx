// ════════════════════════════════════════════════════════════
//  ADMIN — pages/Settings.jsx (API-driven system settings)
// ════════════════════════════════════════════════════════════
import { useState } from 'react';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, Toggle, SectionHeader } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const Settings = () => {
  const [settings, setSettings] = useState({ maintenance: false, registrationOpen: true });
  const [platformName, setPlatformName] = useState('SkillNova');
  const [maxInterns, setMaxInterns] = useState('50');
  const [twoFactor, setTwoFactor] = useState(false);
  const [loading] = useState(false);

  const persist = async (key, value) => {
    try {
      await api.patch('/users/me', { preferences: { [key]: value } });
      notify.success('Settings saved.');
    } catch {
      notify.error('Failed to save settings.');
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  const SECTIONS = [
    {
      title: 'Platform', icon: Shield, rows: [
        { label: 'Platform Name', sub: 'The name shown in header and emails',
          ctrl: <input value={platformName} onChange={(e) => setPlatformName(e.target.value)} onBlur={() => notify.success('Saved')} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-40" /> },
        { label: 'Max Interns', sub: 'Maximum intern accounts',
          ctrl: <input type="number" value={maxInterns} onChange={(e) => setMaxInterns(e.target.value)} onBlur={() => notify.success('Saved')} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 w-24" /> },
        { label: 'Open Registration', sub: 'Allow new interns to self-register',
          ctrl: <Toggle checked={settings.registrationOpen} onChange={() => { setSettings({ ...settings, registrationOpen: !settings.registrationOpen }); persist('registrationOpen', !settings.registrationOpen); }} /> },
        { label: 'Maintenance Mode', sub: 'Take the platform offline for maintenance',
          ctrl: <Toggle checked={settings.maintenance} onChange={() => { setSettings({ ...settings, maintenance: !settings.maintenance }); persist('maintenance', !settings.maintenance); }} /> },
      ],
    },
    {
      title: 'Security', rows: [
        { label: 'Two-Factor Required', sub: 'Require 2FA for all admin accounts',
          ctrl: <Toggle checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} /> },
        { label: 'Audit Logging', sub: 'Log every privileged action', ctrl: <Toggle checked={true} onChange={() => {}} /> },
      ],
    },
    {
      title: 'AI Assistant', rows: [
        { label: 'Enable AI Chat', sub: 'Allow interns to use the Groq-powered assistant', ctrl: <Toggle checked={true} onChange={() => notify.info('Demo: AI toggle')} /> },
        { label: 'Knowledge-base Augmentation', sub: 'Grounded on UptoSkills KB + live data', ctrl: <Toggle checked={true} onChange={() => {}} /> },
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <SectionHeader title="Admin Settings" subtitle="Configure platform-wide settings and permissions" />

      {SECTIONS.map((section) => (
        <Card key={section.title} className="p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            {section.icon && <section.icon size={14} style={{ color: '#7c3aed' }} />} {section.title}
          </h3>
          <div className="space-y-4">
            {section.rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{row.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{row.sub}</p>
                </div>
                {row.ctrl}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card className="p-5" style={{ borderColor: '#fecaca', background: 'rgba(254,242,242,0.4)' }}>
        <h3 className="text-sm font-semibold text-red-600 mb-1 flex items-center gap-2"><AlertTriangle size={14} /> Danger Zone</h3>
        <p className="text-xs text-red-400 mb-4">These actions are irreversible. Proceed with extreme caution.</p>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 rounded-lg text-sm font-medium border border-red-200" style={{ background: 'rgba(254,226,226,0.4)', color: '#b91c1c' }}>Reset All User Data</button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#dc2626' }}>Delete Platform</button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;
