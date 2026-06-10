// ══════════════════════════════════════════════
//  USER — pages/Announcements.jsx
// ══════════════════════════════════════════════

import { useState } from "react";
import { Pin, Megaphone } from "lucide-react";
import { Card, Badge, SectionHeader } from "../../shared/components/UI";
import { MOCK_ANNOUNCEMENTS } from "../../shared/utils/constants";

const PRIORITY_VARIANTS = { High: "danger", Medium: "warning", Low: "success" };
const FILTERS = ["All", "High", "Medium", "Low"];

const Announcements = () => {
  const [items,  setItems]  = useState(MOCK_ANNOUNCEMENTS);
  const [filter, setFilter] = useState("All");

  const togglePin = id =>
    setItems(items.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a));

  const filtered = items
    .filter(a => filter === "All" || a.priority === filter)
    .sort((a, b) => b.pinned - a.pinned);

  return (
    <div className="space-y-6">

      <SectionHeader
        title="Announcements"
        subtitle="Stay updated with platform and internship news"
        action={
          <span className="text-sm text-slate-400">{items.filter(a => a.pinned).length} pinned</span>
        }
      />

      {/* Priority Filter */}
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

      {/* Announcement Cards */}
      <div className="space-y-3">
        {filtered.map(a => (
          <Card
            key={a.id}
            className={`p-5 transition ${a.pinned ? "border-l-4 border-l-blue-500" : ""}`}
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
                <h3 className="font-semibold text-slate-900 leading-snug">{a.title}</h3>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{a.desc}</p>
                <p className="text-xs text-slate-400 mt-2">{a.date}</p>
              </div>

              <button
                onClick={() => togglePin(a.id)}
                className={`p-1.5 rounded-lg transition flex-shrink-0 ${
                  a.pinned
                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                }`}
                title={a.pinned ? "Unpin" : "Pin"}
              >
                <Pin size={15} />
              </button>
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