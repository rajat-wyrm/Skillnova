// ══════════════════════════════════════════════
//  ADMIN — pages/Announcements.jsx
// ══════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import { Plus, Pin, Trash2, Megaphone, X } from "lucide-react";
import { Card, Badge, SectionHeader } from "../../shared/components/UI";
import { EmptyState, ErrorState } from "../../shared/components/AppState";
import { AdminAnnouncementsSkeleton } from "../../shared/components/PageSkeletons";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from "../../shared/services/api/announcementsApi";

const PRIORITY_VARIANTS = { High: "danger", Medium: "warning", Low: "success" };
const PRIORITIES = ["High", "Medium", "Low"];
const FILTERS = ["All", "High", "Medium", "Low"];

const formatAnnouncementDate = value => {
  if (!value) {
    return "Recently posted";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const normalizePriority = value => {
  const raw = String(value || "Medium").toLowerCase();
  if (raw === "high") return "High";
  if (raw === "low") return "Low";
  return "Medium";
};

const normalizeAnnouncement = announcement => ({
  id: announcement?.id,
  title: announcement?.title || "Untitled announcement",
  desc: announcement?.desc || announcement?.description || announcement?.content || "",
  priority: normalizePriority(announcement?.priority),
  pinned: Boolean(announcement?.pinned),
  date: formatAnnouncementDate(announcement?.date || announcement?.createdAt),
});

const normalizeAnnouncementsResponse = response => {
  const items = response?.data || response?.items || response?.announcements || response || [];
  return Array.isArray(items) ? items.map(normalizeAnnouncement) : [];
};

const Announcements = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", desc: "", priority: "Medium" });
  const [pageState, setPageState] = useState("loading");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeActionId, setActiveActionId] = useState(null);

  const fetchAnnouncements = async () => {
    return getAnnouncements();
  };

  useEffect(() => {
    let isActive = true;

    const initializeAnnouncements = async () => {
      try {
        const response = await fetchAnnouncements();
        if (!isActive) return;

        setItems(normalizeAnnouncementsResponse(response));
        setPageState("ready");
      } catch (loadError) {
        if (!isActive) return;

        setError(loadError.message || "Failed to load announcements.");
        setPageState("error");
      }
    };

    initializeAnnouncements();

    return () => {
      isActive = false;
    };
  }, []);

  const handleRetry = async () => {
    setPageState("loading");
    setError("");

    try {
      const response = await fetchAnnouncements();
      setItems(normalizeAnnouncementsResponse(response));
      setPageState("ready");
    } catch (loadError) {
      setError(loadError.message || "Failed to load announcements.");
      setPageState("error");
    }
  };

  const handlePost = async () => {
    if (!form.title.trim() || !form.desc.trim()) {
      setFormError("Title and announcement message are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await createAnnouncement({
        title: form.title.trim(),
        desc: form.desc.trim(),
        priority: form.priority,
        pinned: false,
      });

      setItems(existing => [normalizeAnnouncement(response?.data || response), ...existing]);
      setForm({ title: "", desc: "", priority: "Medium" });
      setShowForm(false);
    } catch (createError) {
      setFormError(createError.message || "Failed to create announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async item => {
    setActiveActionId(item.id);

    try {
      const response = await updateAnnouncement(item.id, {
        pinned: !item.pinned,
      });

      const updated = normalizeAnnouncement(response?.data || response);
      setItems(existing => existing.map(entry => (entry.id === item.id ? updated : entry)));
    } catch (updateError) {
      setError(updateError.message || "Failed to update announcement.");
      setPageState("error");
    } finally {
      setActiveActionId(null);
    }
  };

  const handleDelete = async id => {
    setActiveActionId(id);

    try {
      await deleteAnnouncement(id);
      setItems(existing => existing.filter(entry => entry.id !== id));
    } catch (deleteError) {
      setError(deleteError.message || "Failed to delete announcement.");
      setPageState("error");
    } finally {
      setActiveActionId(null);
    }
  };

  const filtered = useMemo(
    () =>
      [...items]
        .filter(item => filter === "All" || item.priority === filter)
        .sort((left, right) => Number(right.pinned) - Number(left.pinned)),
    [filter, items]
  );

  if (pageState === "loading") {
    return <AdminAnnouncementsSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Announcements"
          subtitle="Create and manage platform-wide announcements"
        />
        <ErrorState
          title="Could not load announcements"
          description={error}
          action={
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Announcements"
        subtitle="Create and manage platform-wide announcements"
        action={
          <button
            onClick={() => setShowForm(current => !current)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={15} /> New Announcement
          </button>
        }
      />

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
              onChange={event => setForm({ ...form, title: event.target.value })}
              placeholder="Announcement title..."
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <textarea
              value={form.desc}
              onChange={event => setForm({ ...form, desc: event.target.value })}
              placeholder="Write the announcement message..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-xs font-medium text-slate-500">Priority:</label>
              <div className="flex gap-2 flex-wrap">
                {PRIORITIES.map(priority => (
                  <button
                    key={priority}
                    onClick={() => setForm({ ...form, priority })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      form.priority === priority
                        ? priority === "High"
                          ? "bg-red-500 text-white"
                          : priority === "Medium"
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-500 text-white"
                        : "bg-white border border-slate-200 text-slate-600"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
              <button
                onClick={handlePost}
                disabled={isSubmitting}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-70"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(entry => (
          <button
            key={entry}
            onClick={() => setFilter(entry)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === entry
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
            }`}
          >
            {entry}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(item => (
            <Card
              key={item.id}
              className={`p-5 ${item.pinned ? "border-l-4 border-l-blue-500" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {item.pinned && (
                      <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                        <Pin size={11} /> Pinned
                      </span>
                    )}
                    <Badge variant={PRIORITY_VARIANTS[item.priority]}>{item.priority}</Badge>
                  </div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  <p className="text-xs text-slate-400 mt-2">{item.date}</p>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleTogglePin(item)}
                    title={item.pinned ? "Unpin" : "Pin"}
                    disabled={activeActionId === item.id}
                    className={`p-2 rounded-lg transition ${
                      item.pinned
                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                        : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <Pin size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete"
                    disabled={activeActionId === item.id}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No announcements found"
          description="Create the first announcement or change the selected filter to view more results."
        />
      )}
    </div>
  );
};

export default Announcements;

