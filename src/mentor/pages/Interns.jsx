// Mentor — Interns page
import { useEffect, useState } from 'react';
import { Loader2, Flame } from 'lucide-react';
import { Card } from '../../shared/components/UI';
import api from '../../lib/api';

const Interns = () => {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users', { params: { role: 'INTERN', limit: 100 } })
      .then((r) => setInterns(r.data.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin" size={28} style={{ color: 'var(--muted)' }} /></div>;

  return (
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
        </div>
      </Card>
    </div>
  );
};

export default Interns;
