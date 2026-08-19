// ════════════════════════════════════════════════════════════
//  Webhooks Management — admin/mentor
// ════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { Plus, Webhook, Trash2, Loader2, Send, Copy, Check } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal } from './UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { formatRelative } from '../../lib/utils';

const WebhooksPage = () => {
  const [hooks, setHooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: '', events: [], enabled: true });
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const [h, e] = await Promise.all([api.get('/webhooks'), api.get('/webhooks/events')]);
      setHooks(h.data.items);
      setEvents(e.data.events);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const create = async () => {
    if (!form.url || form.events.length === 0) return notify.error('URL and at least 1 event required');
    try {
      const { data } = await api.post('/webhooks', form);
      setCreatedSecret(data.webhook.secret);
      setShowForm(false);
      setForm({ url: '', events: [], enabled: true });
      fetch();
    } catch (e) { notify.error(e?.response?.data?.error || 'Failed'); }
  };

  const remove = async (h) => {
    if (!window.confirm(`Delete webhook for ${h.url}?`)) return;
    try { await api.delete(`/webhooks/${h.id}`); notify.success('Deleted'); fetch(); }
    catch { notify.error('Failed'); }
  };

  const test = async (h) => {
    try { await api.post(`/webhooks/${h.id}/test`); notify.success('Test fired!'); }
    catch { notify.error('Failed'); }
  };

  const copySecret = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (loading) return <div className="py-12 text-center"><Loader2 className="animate-spin inline" size={20} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="Webhooks" subtitle="Outbound HTTP notifications when events occur"
        action={
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#7C3AED' }}>
            <Plus size={15} /> New webhook
          </button>
        } />

      {createdSecret && (
        <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <Webhook size={20} style={{ color: '#7C3AED', flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Save your signing secret</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>You will only see this once. Use the HMAC-SHA256 of the request body to verify.</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="text-xs px-2 py-1 rounded font-mono flex-1 overflow-x-auto" style={{ background: 'var(--bg)', color: 'var(--text)' }}>{createdSecret}</code>
              <button onClick={copySecret} className="p-2 rounded-lg" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                {copied ? <Check size={14} style={{ color: '#00bea3' }} /> : <Copy size={14} style={{ color: 'var(--muted)' }} />}
              </button>
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[44rem]">
            <thead><tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
              {['URL', 'Events', 'Last fired', 'Status', 'Failures', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-left" style={{ color: 'var(--muted)' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {hooks.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>No webhooks yet.</td></tr>}
              {hooks.map((h) => (
                <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--text)' }}>{h.url}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {h.events.slice(0, 3).map((e) => <Badge key={e} variant="gray">{e}</Badge>)}
                      {h.events.length > 3 && <span className="text-xs" style={{ color: 'var(--muted)' }}>+{h.events.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{h.lastFiredAt ? formatRelative(h.lastFiredAt) : '—'}</td>
                  <td className="px-5 py-4"><Badge variant={h.lastStatus >= 200 && h.lastStatus < 300 ? 'success' : h.lastStatus ? 'warning' : 'gray'}>{h.lastStatus || '—'}</Badge></td>
                  <td className="px-5 py-4 text-xs" style={{ color: h.failureCount > 0 ? '#dc2626' : 'var(--muted)' }}>{h.failureCount || 0}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => test(h)} title="Send test" className="p-2 rounded-lg transition" style={{ color: '#7C3AED' }}><Send size={14} /></button>
                      <button onClick={() => remove(h)} title="Delete" className="p-2 rounded-lg transition" style={{ color: '#dc2626' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New webhook"
        footer={
          <>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text)' }}>Cancel</button>
            <button onClick={create} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ background: '#7C3AED' }}>Create</button>
          </>
        }>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted)' }}>Endpoint URL</label>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://your.app/webhook"
              className="w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--muted)' }}>Events ({form.events.length} selected)</label>
            <div className="max-h-48 overflow-y-auto p-2 rounded-lg space-y-1" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              {events.map((e) => (
                <label key={e} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer text-sm">
                  <input type="checkbox" checked={form.events.includes(e)} onChange={() => setForm({ ...form, events: form.events.includes(e) ? form.events.filter((x) => x !== e) : [...form.events, e] })} />
                  <code className="text-xs" style={{ color: 'var(--text)' }}>{e}</code>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WebhooksPage;
