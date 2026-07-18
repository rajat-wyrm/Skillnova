// ══════════════════════════════════════════════
//  USER — pages/Settings.jsx
// ══════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Power, Trash2 } from "lucide-react";
import { Card, Toggle, SectionHeader } from "../../shared/components/UI";

const Settings = () => {
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );
  const [notifications, setNotifications] = useState(true);
  const [privateAcct, setPrivateAcct] = useState(false);
  const [language, setLanguage] = useState("English");
  const [twoFactor, setTwoFactor] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleDarkMode = useCallback(() => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const SECTIONS = [
    {
      title: "Appearance",
      rows: [
        { label: "Dark Mode", sub: "Switch to a darker interface", ctrl: <Toggle checked={darkMode} onChange={toggleDarkMode} /> },
      ],
    },
    {
      title: "Security",
      rows: [
        { label: "Two-Factor Authentication", sub: "Require an extra layer of security when logging in", ctrl: <Toggle checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} /> },
      ],
    },
    {
      title: "Notifications",
      rows: [
        { label: "Email Notifications", sub: "Receive updates and alerts via email", ctrl: <Toggle checked={notifications} onChange={() => setNotifications(!notifications)} /> },
      ],
    },
    {
      title: "Privacy",
      rows: [
        { label: "Private Account", sub: "Only admins can view your full profile", ctrl: <Toggle checked={privateAcct} onChange={() => setPrivateAcct(!privateAcct)} /> },
      ],
    },
    {
      title: "Language",
      rows: [
        {
          label: "Display Language",
          sub: "Choose your preferred interface language",
          ctrl: (
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg cursor-pointer focus:outline-none"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--text)",
              }}
            >
              {["English", "Hindi", "Spanish", "German"].map(l => <option key={l}>{l}</option>)}
            </select>
          ),
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <SectionHeader title="Settings" subtitle="Manage your account and preferences" />

      {SECTIONS.map(section => (
        <Card key={section.title} className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>{section.title}</h3>
          <div className="space-y-4">
            {section.rows.map(row => (
              <div key={row.label} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{row.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{row.sub}</p>
                </div>
                {row.ctrl}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Account Status */}
      <Card className="p-5" style={{ borderColor: "rgba(220,38,38,0.2)" }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Account Status</h3>
        </div>

        <div className="space-y-4">
          {/* Deactivate Account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
            <div className="flex items-start gap-3 flex-1">
              <Power size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Deactivate Account</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Temporarily disable your account. You can reactivate it at any time.</p>
              </div>
            </div>
            {!confirmDeactivate ? (
              <button
                onClick={() => setConfirmDeactivate(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition flex-shrink-0"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.25)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(245,158,11,0.15)"}
              >
                Deactivate
              </button>
            ) : (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setConfirmDeactivate(false); alert("Account deactivated"); }}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ background: "#f59e0b" }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDeactivate(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition"
                  style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Delete Account */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>
            <div className="flex items-start gap-3 flex-1">
              <Trash2 size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Delete Account</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
            </div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition flex-shrink-0"
                style={{ background: "#dc2626" }}
                onMouseEnter={e => e.currentTarget.style.background = "#b91c1c"}
                onMouseLeave={e => e.currentTarget.style.background = "#dc2626"}
              >
                Delete
              </button>
            ) : (
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setConfirmDelete(false); alert("Account deleted"); }}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-white transition"
                  style={{ background: "#dc2626" }}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition"
                  style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Settings;