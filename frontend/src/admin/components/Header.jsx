import { useState, useEffect, useRef } from "react";
import { Bell, Search, Shield, Sun, Moon, Menu } from "lucide-react";
import { useAuth } from "../../shared/store/auth-context";
import { getAnnouncements } from "../../shared/services/api/announcementsApi";

const Header = ({ title, onMenuToggle }) => {
  const [showNotif, setShowNotif] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const notificationsRef = useRef(null);
  const notificationButtonRef = useRef(null);

  // ── Theme persistence & DOM sync ──────────────────
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // ── Fetch notifications from the announcements service ──
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await getAnnouncements();
        const list = Array.isArray(response)
          ? response
          : Array.isArray(response?.announcements)
            ? response.announcements
            : Array.isArray(response?.items)
              ? response.items
              : [];

        const mapped = list.slice(0, 5).map(item => ({
          text: item.title || item.desc || "New notification",
          time: item.date
            ? new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "Recently",
        }));
        setNotifications(mapped);
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();
  }, []);

  // Keep the notifications panel behaving like a focus popover instead of a sticky toggle.
  useEffect(() => {
    if (!showNotif) {
      return undefined;
    }

    const closeOnOutsidePointer = event => {
      if (!notificationsRef.current?.contains(event.target)) {
        setShowNotif(false);
      }
    };

    const closeOnEscape = event => {
      if (event.key === "Escape") {
        setShowNotif(false);
        notificationButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showNotif]);

  const handleNotificationsBlur = event => {
    if (!notificationsRef.current?.contains(event.relatedTarget)) {
      setShowNotif(false);
    }
  };

  const toggleNotifications = () => {
    setShowNotif(current => !current);
  };

  return (
    <header
      className="h-16 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0 transition-colors duration-200"
      style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded-lg transition-colors cursor-pointer -ml-2 mr-1"
        style={{ color: "var(--muted)" }}
      >
        <Menu size={20} />
      </button>

      {/* Title */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div
          className="p-1.5 rounded-lg flex-shrink-0 hidden sm:flex"
          style={{ background: "rgba(255,109,52,0.15)" }}
        >
          <Shield size={14} style={{ color: "#ff6d34" }} />
        </div>
        <h1 className="text-base font-bold truncate" style={{ color: "var(--text)" }}>{title}</h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input
          className="pl-9 pr-4 py-2 text-sm rounded-lg w-60 focus:outline-none transition-all duration-200"
          placeholder="Search users, reports…"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          onFocus={e => e.target.style.borderColor = "#ff6d34"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 relative">
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-lg transition-colors cursor-pointer"
          style={{ color: "var(--muted)" }}
          onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#f3f4f6"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          type="button"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            ref={notificationButtonRef}
            onClick={toggleNotifications}
            onBlur={handleNotificationsBlur}
            aria-expanded={showNotif}
            aria-haspopup="dialog"
            aria-controls="admin-notifications-panel"
            className="relative p-2 rounded-lg transition-colors cursor-pointer"
            style={{
              color: showNotif ? "#ff6d34" : "var(--muted)",
              background: showNotif ? (dark ? "rgba(255,109,52,0.14)" : "rgba(255,109,52,0.08)") : "transparent",
            }}
            onMouseEnter={e => {
              if (!showNotif) {
                e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "#f3f4f6";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = showNotif
                ? (dark ? "rgba(255,109,52,0.14)" : "rgba(255,109,52,0.08)")
                : "transparent";
            }}
            type="button"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "#ff6d34" }}
              />
            )}
          </button>

          {showNotif && (
            <div
              id="admin-notifications-panel"
              tabIndex={-1}
              onBlur={handleNotificationsBlur}
              className="absolute right-0 top-12 w-[min(calc(100vw-1.5rem),18rem)] sm:w-72 max-h-[70vh] overflow-y-auto rounded-2xl shadow-xl z-50"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Admin Notifications</p>
                {notifications.length > 0 && (
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,109,52,0.15)", color: "#ff6d34" }}
                  >
                    {notifications.length} new
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="px-4 py-5 text-xs text-center" style={{ color: "var(--muted)" }}>
                  No new notifications
                </p>
              ) : (
                notifications.map((n, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-4 py-3 flex gap-3 transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.04)" : "#f9fafb"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    type="button"
                  >
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#ff6d34" }} />
                    <div>
                      <p className="text-xs leading-snug" style={{ color: "var(--text)" }}>{n.text}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{n.time}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin User */}
      <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3" style={{ borderLeft: "1px solid var(--border)" }}>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md"
          style={{ background: "linear-gradient(135deg, #ff6d34, #00bea3)" }}
        >
          {user?.initials || "AD"}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-semibold leading-none" style={{ color: "var(--text)" }}>{user?.name || "Admin"}</p>
          <p className="text-xs mt-0.5 font-medium" style={{ color: "#ff6d34" }}>{user?.title || user?.role || "Super Admin"}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
