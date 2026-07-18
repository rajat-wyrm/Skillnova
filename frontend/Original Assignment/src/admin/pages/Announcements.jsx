// ══════════════════════════════════════════════
//  ADMIN — pages/Announcements.jsx
// ══════════════════════════════════════════════

import { useState } from "react";
import { Plus, Pin, Trash2, Megaphone, X } from "lucide-react";
import { Card, Badge, SectionHeader } from "../../shared/components/UI";
import { MOCK_ANNOUNCEMENTS } from "../../shared/utils/constants";

const PRIORITY_VARIANTS = { High: "danger", Medium: "warning", Low: "success" };
const PRIORITIES        = ["High", "Medium", "Low"];
const FILTERS           = ["All", "High", "Medium", "Low"];

const Announcements = () => {
  const [items,    setItems]   = useState(MOCK_ANNOUNCEMENTS);
  const [filter,   setFilter]  = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]    = useState({ title: "", desc: "", priority: "Medium" });

  const togglePin = id =>
    setItems(is => is.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a));

  const deleteItem = id =>
    setItems(is => is.filter(a => a.id !== id));

  const handlePost = () => {
    if (!form.title.trim() || !form.desc.trim()) return;
    setItems([{
      id:       Date.now(),
      title:    form.title,
      desc:     form.desc,
      priority: form.priority,
      pinned:   false,
      date:     "Mar 18, 2026",
    }, ...items]);
    setForm({ title: "", desc: "", priority: "Medium" });
    setShowForm(false);
  };

  const filtered = items
    .filter(a => filter === "All" || a.priority === filter)
    .sort((a, b) => b.pinned - a.pinned);

  return (
    <div className="space-y-6">

      <SectionHeader
        title="Announcements"
        subtitle="Create and manage platform-wide announcements"
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={15} /> New Announcement
          </button>
        }
      />

      {/* Create Form */}
      {showForm && (
        <Card className="p-5 border-blue-200 bg-blue-50/40">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Create Announcement</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Announcement title…"
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <textarea
              value={form.desc}
              onChange={e => setForm({ ...form, desc: e.target.value })}
              placeholder="Write the announcement message…"
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-500">Priority:</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    onClick={() => setForm({ ...form, priority: p })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      form.priority === p
                        ? p === "High"   ? "bg-red-500 text-white"
                        : p === "Medium" ? "bg-amber-500 text-white"
                        :                  "bg-emerald-500 text-white"
                        : "bg-white border border-slate-200 text-slate-600"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={handlePost}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Post
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map(a => (
          <Card
            key={a.id}
            className={`p-5 ${a.pinned ? "border-l-4 border-l-blue-500" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {a.pinned && (
                    <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <Pin size={11} /> Pinned
                    </span>
                  )}
                  <Badge variant={PRIORITY_VARIANTS[a.priority]}>{a.priority}</Badge>
                </div>
                <h3 className="font-semibold text-slate-900">{a.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{a.desc}</p>
                <p className="text-xs text-slate-400 mt-2">{a.date}</p>
              </div>

              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => togglePin(a.id)}
                  title={a.pinned ? "Unpin" : "Pin"}
                  className={`p-2 rounded-lg transition ${
                    a.pinned
                      ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                      : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Pin size={14} />
                </button>
                <button
                  onClick={() => deleteItem(a.id)}
                  title="Delete"
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
            <p>No announcements found.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Announcements;