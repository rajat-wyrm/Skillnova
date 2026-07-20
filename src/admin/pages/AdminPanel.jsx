// ════════════════════════════════════════════════════════════
//  ADMIN — pages/AdminPanel.jsx (User Management, API)
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Trash2, ShieldCheck, UserCheck, Users, Loader2 } from 'lucide-react';
import { Card, Badge, SectionHeader, Modal, Input } from '../../shared/components/UI';
import api from '../../lib/api';
import notify from '../../lib/toast';
import { useAuthStore } from '../../lib/auth';
import { formatDate } from '../../lib/utils';

const ROLE_VARIANT = { ADMIN: 'purple', SUPER_ADMIN: 'purple', MENTOR: 'default', INTERN: 'default' };
const STATUS_VARIANT = { ACTIVE: 'success', INACTIVE: 'gray', SUSPENDED: 'danger', PENDING: 'warning' };

const AdminPanel = () => {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'INTERN', department: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { limit: 100, search: search || undefined, role: roleFilter || undefined, status: statusFilter || undefined } });
      setUsers(data.items);
    } finally { setLoading(false); }
  }, [search, roleFilter, statusFilter]);
  useEffect(() => { fetch(); }, [fetch]);

  const add = async () => {
    if (!form.email || !form.password || !form.name) return notify.error('Fill all required fields.');
    try {
      await api.post('/users', form);
      notify.success('User created.');
      setModalOpen(false);
      setForm({ email: '', password: '', name: '', role: 'INTERN', department: '' });
      fetch();
    } catch (err) {
      notify.error(err.response?.data?.error || 'Failed to create user.');
    }
  };

  const toggleRole = async (u) => {
    const next = u.role === 'INTERN' ? 'MENTOR' : 'INTERN';
    if (next === 'SUPER_ADMIN' && me?.role !== 'SUPER_ADMIN') return notify.error('Only super admins can grant SUPER_ADMIN');
    try { await api.patch(`/users/${u.id}/role`, { role: next }); notify.success(`Role updated to ${next}`); fetch(); }
    catch (err) { notify.error(err.response?.data?.error || 'Failed'); }
  };

  const toggleStatus = async (u) => {
    const next = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try { await api.patch(`/users/${u.id}/status`, { status: next }); notify.success(`Status: ${next}`); fetch(); }
    catch (err) { notify.error(err.response?.data?.error || 'Failed'); }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This is irreversible.`)) return;
    try { await api.delete(`/users/${u.id}`); notify.success('User deleted.'); fetch(); }
    catch (err) { notify.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  return (
    <div className="space-y-6">
      <SectionHeader title="User Management" subtitle="Manage intern roles, status and platform access"
        action={
          <button onClick={() => setModalOpen(true)} className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition" style={{ background: '#ff6d34' }}>
            <Plus size={15} /> Add User
          </button>
        } />

      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(37,99,235,0.12)', color: '#2563eb' }}>
          <Users size={14} /> {users.length} Total
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(5,150,105,0.12)', color: '#059669' }}>
          {users.filter((u) => u.status === 'ACTIVE').length} Active
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>
          {users.filter((u) => ['ADMIN', 'SUPER_ADMIN'].includes(u.role)).length} Admins
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by name or email…"
            className="w-full pl-9 py-2.5 text-sm rounded-lg focus:outline-none border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <option value="">All roles</option>
          <option value="INTERN">Intern</option>
          <option value="MENTOR">Mentor</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <option value="">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[44rem]">
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                {['User', 'Role', 'Department', 'Rating', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${h === 'Actions' ? 'text-center' : 'text-left'}`} style={{ color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #ff6d34, #00bea3)' }}>
                        {u.name?.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--text)' }}>{u.name}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge variant={ROLE_VARIANT[u.role] || 'default'}>{u.role.replace('_', ' ')}</Badge></td>
                  <td className="px-5 py-4" style={{ color: 'var(--muted)' }}>{u.department || '—'}</td>
                  <td className="px-5 py-4"><span className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">⭐ {u.rating}</span></td>
                  <td className="px-5 py-4"><Badge variant={STATUS_VARIANT[u.status] || 'gray'}>{u.status}</Badge></td>
                  <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>{formatDate(u.createdAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => toggleRole(u)} title="Toggle role" className="p-2 rounded-lg transition" style={{ color: '#2563eb' }}><ShieldCheck size={15} /></button>
                      <button onClick={() => toggleStatus(u)} title="Toggle status" className="p-2 rounded-lg transition" style={{ color: '#059669' }}><UserCheck size={15} /></button>
                      <button onClick={() => remove(u)} title="Delete user" className="p-2 rounded-lg transition" style={{ color: '#dc2626' }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--muted)' }}>No users match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New User"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={add} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ background: '#ff6d34' }}>Create User</button>
          </>
        }>
        <div className="space-y-4">
          <Input label="Full Name *" placeholder="e.g. Rahul Sharma" icon={Plus} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email *" type="email" placeholder="user@skillnova.com" icon={Search} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password *" type="password" placeholder="Strong password" icon={ShieldCheck} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input label="Department" placeholder="e.g. AI / ML" icon={Users} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500">
              <option value="INTERN">Intern</option>
              <option value="MENTOR">Mentor</option>
              {me?.role === 'SUPER_ADMIN' && <option value="ADMIN">Admin</option>}
              {me?.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Admin</option>}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel;
