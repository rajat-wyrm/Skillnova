const fs = require('fs');
let content = fs.readFileSync('src/user/pages/Dashboard.jsx', 'utf8');

const oldDiv = '<div className="space-y-6 pb-16">';
const newDiv = `<div className="space-y-6 pb-16">
      {(overdue.length > 0 || dueSoon.length > 0) && (
        <div className="rounded-xl p-4 border border-red-500/30 bg-red-500/10">
          <p className="text-red-400 font-semibold mb-2">Task Deadline Alert</p>
          {overdue.length > 0 && (
            <div className="mb-2">
              <p className="text-red-400 text-sm font-medium">Overdue - {overdue.length} task(s)</p>
              {overdue.map((t) => (
                <p key={t.id} className="text-red-300 text-xs mt-1">- {t.title} ({t.project?.name}) was due on {new Date(t.dueDate).toLocaleDateString()}</p>
              ))}
            </div>
          )}
          {dueSoon.length > 0 && (
            <div>
              <p className="text-yellow-400 text-sm font-medium">Due in 24 hours - {dueSoon.length} task(s)</p>
              {dueSoon.map((t) => (
                <p key={t.id} className="text-yellow-300 text-xs mt-1">- {t.title} ({t.project?.name}) due at {new Date(t.dueDate).toLocaleTimeString()}</p>
              ))}
            </div>
          )}
        </div>
      )}`;

content = content.replace(oldDiv, newDiv);
fs.writeFileSync('src/user/pages/Dashboard.jsx', content, 'utf8');
console.log('Done! Banner added:', content.includes('Deadline Alert') ? 'YES' : 'NO');