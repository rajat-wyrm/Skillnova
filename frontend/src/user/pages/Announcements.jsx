// ══════════════════════════════════════════════
//  USER — pages/Announcements.jsx
// ══════════════════════════════════════════════

import { useEffect, useMemo, useState } from "react";
import { Pin, Megaphone } from "lucide-react";
import { Card, Badge, SectionHeader } from "../../shared/components/UI";
import { EmptyState, ErrorState } from "../../shared/components/AppState";
import { UserAnnouncementsSkeleton } from "../../shared/components/PageSkeletons";
import {
  getAnnouncements,
  getUserAnnouncementPins,
  setUserAnnouncementPin,
} from "../../shared/services/api/announcementsApi";

const PRIORITY_VARIANTS = { High: "danger", Medium: "warning", Low: "success" };
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
  const [pageState, setPageState] = useState("loading");
  const [error, setError] = useState("");
  const [activePinId, setActivePinId] = useState(null);

  const fetchAnnouncements = async () => {
    const [announcementResponse, pinnedIds] = await Promise.all([
      getAnnouncements(),
      getUserAnnouncementPins(),
    ]);

    const pinnedSet = new Set(Array.isArray(pinnedIds) ? pinnedIds : []);
    const normalizedItems = normalizeAnnouncementsResponse(announcementResponse).map(item => ({
      ...item,
      pinned: item.pinned || pinnedSet.has(item.id),
    }));

    return normalizedItems;
  };

  useEffect(() => {
    let isActive = true;

    const initializeAnnouncements = async () => {
      try {
        const nextItems = await fetchAnnouncements();
        if (!isActive) return;

        setItems(nextItems);
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
      const nextItems = await fetchAnnouncements();
      setItems(nextItems);
      setPageState("ready");
    } catch (loadError) {
      setError(loadError.message || "Failed to load announcements.");
      setPageState("error");
    }
  };

  const handleTogglePin = async item => {
    setActivePinId(item.id);

    try {
      await setUserAnnouncementPin(item.id, !item.pinned);
      setItems(existing =>
        existing.map(entry =>
          entry.id === item.id ? { ...entry, pinned: !entry.pinned } : entry
        )
      );
    } catch (pinError) {
      setError(pinError.message || "Failed to update pinned announcement.");
      setPageState("error");
    } finally {
      setActivePinId(null);
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
    return <UserAnnouncementsSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="Announcements"
          subtitle="Stay updated with platform and internship news"
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
        subtitle="Stay updated with platform and internship news"
        action={
          <span className="text-sm text-slate-400">{items.filter(item => item.pinned).length} pinned</span>
        }
      />

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
              className={`p-5 transition ${item.pinned ? "border-l-4 border-l-blue-500" : ""}`}
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
                  <h3 className="font-semibold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                  <p className="text-xs text-slate-400 mt-2">{item.date}</p>
                </div>

                <button
                  onClick={() => handleTogglePin(item)}
                  disabled={activePinId === item.id}
                  className={`p-1.5 rounded-lg transition flex-shrink-0 ${
                    item.pinned
                      ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                      : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  title={item.pinned ? "Unpin" : "Pin"}
                >
                  <Pin size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No announcements found"
          description="Try another filter or wait for announcements to be published through the shared API layer."
        />
      )}
    </div>
  );
};

export default Announcements;

