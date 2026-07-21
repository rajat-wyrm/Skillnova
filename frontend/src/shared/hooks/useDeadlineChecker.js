import { useEffect } from 'react';
import api from '../../lib/api';
import notify from '../../lib/toast';

export const useDeadlineChecker = () => {
  useEffect(() => {
    const checkDeadlines = async () => {
      try {
        const { data } = await api.get('/tasks', { params: { limit: 100 } });
        const tasks = data.items || [];
        const now = new Date();

        // Load notified log from localStorage
        const logStr = localStorage.getItem('skillnova_notified_deadlines') || '{}';
        const notifiedLog = JSON.parse(logStr);
        let updated = false;

        tasks.forEach((task) => {
          if (!task.dueDate || task.status === 'DONE') return;

          const due = new Date(task.dueDate);
          const diffMs = due.getTime() - now.getTime();

          if (diffMs <= 0) return; // already past

          const taskLog = notifiedLog[task.id] || {};

          // 1 Day (24 hrs)
          if (diffMs <= 24 * 60 * 60 * 1000 && !taskLog['1d']) {
            notify.info(`📅 "${task.title}" is due in 1 Day!`);
            taskLog['1d'] = true;
            addLocalAlert(task, '1 Day Before');
            updated = true;
          }
          // 1 Hour
          else if (diffMs <= 60 * 60 * 1000 && !taskLog['1h']) {
            notify.info(`⏰ "${task.title}" is due in 1 Hour!`);
            taskLog['1h'] = true;
            addLocalAlert(task, '1 Hour Before');
            updated = true;
          }
          // 30 Minutes
          else if (diffMs <= 30 * 60 * 1000 && !taskLog['30m']) {
            notify.info(`⏳ "${task.title}" is due in 30 Minutes!`);
            taskLog['30m'] = true;
            addLocalAlert(task, '30 Minutes Before');
            updated = true;
          }
          // 10 Minutes
          else if (diffMs <= 10 * 60 * 1000 && !taskLog['10m']) {
            notify.info(`🔔 "${task.title}" is due in 10 Minutes!`);
            taskLog['10m'] = true;
            addLocalAlert(task, '10 Minutes Before');
            updated = true;
          }
          // 5 Minutes
          else if (diffMs <= 5 * 60 * 1000 && !taskLog['5m']) {
            notify.info(`⚠️ "${task.title}" is due in 5 Minutes!`);
            taskLog['5m'] = true;
            addLocalAlert(task, '5 Minutes Before');
            updated = true;
          }

          notifiedLog[task.id] = taskLog;
        });

        if (updated) {
          localStorage.setItem('skillnova_notified_deadlines', JSON.stringify(notifiedLog));
          // Dispatch a custom event to notify Announcement Center if active
          window.dispatchEvent(new Event('skillnova_deadline_updated'));
        }
      } catch (err) {
        console.error('Failed to check deadlines', err);
      }
    };

    const addLocalAlert = (task, alertType) => {
      const alertsStr = localStorage.getItem('skillnova_deadline_alerts') || '[]';
      const alerts = JSON.parse(alertsStr);
      alerts.unshift({
        id: Date.now() + Math.random(),
        taskId: task.id,
        title: task.title,
        alertType,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('skillnova_deadline_alerts', JSON.stringify(alerts.slice(0, 100)));
    };

    // Check immediately and then every 30 seconds
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 30000);
    return () => clearInterval(interval);
  }, []);
};
