// ══════════════════════════════════════════════
//  ADMIN — pages/Settings.jsx
// ══════════════════════════════════════════════

import { useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { Card, Toggle, SectionHeader } from "../../shared/components/UI";

const Settings = () => {
  const [smtp,         setSmtp]         = useState(true);
  const [maintenance,  setMaintenance]  = useState(false);
  const [registration, setRegistration] = useState(true);
  const [aiAssistant,  setAiAssistant]  = useState(true);
  const [auditLog,     setAuditLog]     = useState(true);
  const [twoFactor,    setTwoFactor]    = useState(false);
  const [maxInterns,   setMaxInterns]   = useState("50");
  const [platformName, setPlatformName] = useState("SkillNova");

  const SECTIONS = [
    {
      title: "Platform",
      icon: Shield,
      rows: [
        { label: "Platform Name",        sub: "The name shown in header and emails",
          ctrl: (
            <input
              value={platformName}
              onChange={e => setPlatformName(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none w-40"
            />
          )
        },
        { label: "Max Interns",          sub: "Maximum number of intern accounts",
          ctrl: (
            <input
              type="number"
              value={maxInterns}
              onChange={e => setMaxInterns(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none w-24"
            />
          )
        },
        { label: "Open Registration",    sub: "Allow new interns to self-register",
          ctrl: <Toggle checked={registration} onChange={() => setRegistration(!registration)} />
        },
        { label: "Maintenance Mode",     sub: "Take the platform offline for maintenance",
          ctrl: <Toggle checked={maintenance} onChange={() => setMaintenance(!maintenance)} />
        },
      ],
    },
    {
      title: "Email & Notifications",
      icon: null,
      rows: [
        { label: "SMTP Notifications",   sub: "Send automated email alerts to interns",
          ctrl: <Toggle checked={smtp}         onChange={() => setSmtp(!smtp)}                 />
        },
      ],
    },
    {
      title: "Security",
      icon: null,
      rows: [
        { label: "Two-Factor Auth",      sub: "Require 2FA for all admin accounts",
          ctrl: <Toggle checked={twoFactor}    onChange={() => setTwoFactor(!twoFactor)}       />
        },
        { label: "Audit Logging",        sub: "Log all admin actions for compliance",
          ctrl: <Toggle checked={auditLog}     onChange={() => setAuditLog(!auditLog)}         />
        },
      ],
    },
    {
      title: "Features",
      icon: null,
      rows: [
        { label: "AI Assistant",         sub: "Enable the AI knowledge assistant for interns",
          ctrl: <Toggle checked={aiAssistant}  onChange={() => setAiAssistant(!aiAssistant)}   />
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <SectionHeader title="Admin Settings" subtitle="Configure platform-wide settings and permissions" />

      {SECTIONS.map(section => (
        <Card key={section.title} className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            {section.icon && <section.icon size={14} className="text-violet-500" />}
            {section.title}
          </h3>
          <div className="space-y-4">
            {section.rows.map(row => (
              <div key={row.label} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{row.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{row.sub}</p>
                </div>
                {row.ctrl}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Danger Zone */}
      <Card className="p-5 border-red-200 bg-red-50">
        <h3 className="text-sm font-semibold text-red-600 mb-1 flex items-center gap-2">
          <AlertTriangle size={14} /> Danger Zone
        </h3>
        <p className="text-xs text-red-400 mb-4">These actions are irreversible. Proceed with extreme caution.</p>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition border border-red-200">
            Reset All User Data
          </button>
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
            Delete Platform
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;