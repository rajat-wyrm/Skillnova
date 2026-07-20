// ════════════════════════════════════════════════════════════
//  NotificationPreferences — channels + per-type + quiet hours
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Bell, Mail, Smartphone, Volume2, Save, Moon, Loader2 } from 'lucide-react';
import { Card, Toggle, SectionHeader } from './UI';
import api from '../../lib/api';
import notify from '../../lib/toast';

const TYPES = [
  { key: 'announcement', label: 'Announcements' },
  { key: 'report', label: 'Report updates' },
  { key: 'task', label: 'Task assignments' },
  { key: 'meeting', label: 'Meetings' },
  { key: 'qa', label: 'Q&A activity' },
  { key: 'security', label: 'Security alerts' },
];

const NotificationPreferences = () => {
  const [pref, setPref] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/preferences/notifications').then((r) => setPref(r.data.pref));
  }, []);

  const update = (k, v) => setPref({ ...pref, [k]: v });
  const updateType = (k, v) => setPref({ ...pref, typePrefs: { ...(pref.typePrefs || {}), [k]: v } });

  const save = async () => {
    setSaving(true);
    try {
      await api.patch('/preferences/notifications', pref);
      notify.success('Preferences saved');
    } catch (err) { notify.error(err.response?.data?.error || 'Failed'); }
    setSaving(false);
  };

  if (!pref) return <div className="py-12 text-center"><Loader2 className="animate-spin inline" size={20} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="max-w-2xl space-y-4">
      <SectionHeader title="Notifications" subtitle="Decide what reaches you, when and where" />

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Bell size={14} style={{ color: '#ff6d34' }} /> Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={16} style={{ color: '#ff6d34' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>In-app</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Notification bell & inbox</p>
              </div>
            </div>
            <Toggle checked={pref.inAppEnabled} onChange={() => update('inAppEnabled', !pref.inAppEnabled)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail size={16} style={{ color: '#2563EB' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Email</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Daily digest + critical alerts</p>
              </div>
            </div>
            <Toggle checked={pref.emailEnabled} onChange={() => update('emailEnabled', !pref.emailEnabled)} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone size={16} style={{ color: '#00bea3' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Browser push</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>OS-level push (when tab is closed)</p>
              </div>
            </div>
            <Toggle checked={pref.pushEnabled} onChange={() => update('pushEnabled', !pref.pushEnabled)} />
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Volume2 size={14} style={{ color: '#7C3AED' }} /> Per-type</h3>
        <div className="space-y-3">
          {TYPES.map((t) => {
            const enabled = pref.typePrefs?.[t.key] !== false;
            return (
              <div key={t.key} className="flex items-center justify-between">
                <p className="text-sm" style={{ color: 'var(--text)' }}>{t.label}</p>
                <Toggle checked={enabled} onChange={() => updateType(t.key, !enabled)} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Moon size={14} style={{ color: '#94a3b8' }} /> Quiet hours</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>No non-critical notifications during these hours.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted)' }}>From</label>
            <input type="time" value={pref.quietFrom || ''} onChange={(e) => update('quietFrom', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted)' }}>To</label>
            <input type="time" value={pref.quietTo || ''} onChange={(e) => update('quietTo', e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
        </div>
      </Card>

      <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: '#ff6d34' }}>
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save preferences
      </button>
    </div>
  );
};

export default NotificationPreferences;
