// ════════════════════════════════════════════════════════════
//  useDeadlineChecker — polls for upcoming/overdue tasks
// ════════════════════════════════════════════════════════════
import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

export function useDeadlineChecker() {
  const { user } = useAuthStore();
  const [overdue, setOverdue] = useState([]);
  const [dueSoon, setDueSoon] = useState([]);

  const check = useCallback(async () => {
    if (!user || user.role !== 'INTERN') return;
    try {
      const { data } = await api.get('/tasks/deadlines');
      setOverdue(data.overdue || []);
      setDueSoon(data.dueSoon || []);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    check();
    // Check every 30 minutes
    const interval = setInterval(check, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [check]);

  return { overdue, dueSoon };
}

export default useDeadlineChecker;