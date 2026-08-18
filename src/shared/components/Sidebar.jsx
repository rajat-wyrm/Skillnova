import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';

const Sidebar = ({ menu = [], active, onNavigate, forceMobileExpanded, bg = '#1a1f20', border = '#2d3436', activeColor = '#ff6d34', textColor = '#9ca3af' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const isCollapsed = forceMobileExpanded ? false : collapsed;
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside
      className={`h-screen flex flex-col transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'w-16' : 'w-60'}`}
      style={{ background: bg, borderRight: `1px solid ${border}` }}
    >
      <div className={`h-20 flex items-center gap-3 flex-shrink-0 ${isCollapsed ? 'px-3 justify-center' : 'px-4'}`} style={{ borderBottom: `1px solid ${border}` }}>
        {!isCollapsed && <img src="/logo.png" alt="SkillNova" style={{ height: 48, mixBlendMode: 'lighten' }} />}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{ background: activeColor }}>U</div>
        )}
        {!forceMobileExpanded && (
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-lg transition flex-shrink-0" style={{ color: textColor }}>
            {collapsed ? <span>&gt;</span> : <span>&lt;</span>}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 no-scrollbar">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? item.label : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative group"
              style={{ background: isActive ? activeColor : 'transparent', color: isActive ? '#ffffff' : textColor }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = border; e.currentTarget.style.color = '#ffffff'; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textColor; } }}
            >
              {Icon && <Icon size={17} className="flex-shrink-0" />}
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-2" style={{ borderTop: `1px solid ${border}` }}>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
          style={{ color: textColor }}
          onMouseEnter={(e) => { e.currentTarget.style.background = border; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textColor; }}
        >
          <LogOut size={17} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
