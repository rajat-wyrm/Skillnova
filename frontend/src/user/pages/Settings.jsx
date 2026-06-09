import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Power, Trash2 } from "lucide-react";
import { Card, ConfirmationModal, SectionHeader, Toggle } from "../../shared/components/UI";
import { ErrorState } from "../../shared/components/AppState";
import { UserSettingsSkeleton } from "../../shared/components/PageSkeletons";
import {
  deactivateCurrentUser,
  deleteCurrentUser,
  getUserSettings,
  updateUserSettings,
} from "../../shared/services/api/usersApi";

const mapUserSettings = response => {
  const data = response?.data ?? response ?? {};

  return {
    notifications: data.notifications ?? true,
    privateAcct: data.privateAcct ?? false,
    language: data.language ?? "English",
    twoFactor: data.twoFactor ?? false,
  };
};

const accountActions = {
  deactivate: {
    title: "Deactivate Account",
    description:
      "This will temporarily disable your account until it is reactivated. You can sign back in again later after reactivation.",
    confirmLabel: "Yes, Deactivate",
    tone: "warning",
  },
  delete: {
    title: "Delete Account",
    description:
      "This will permanently remove your account and associated data. This action cannot be undone.",
    confirmLabel: "Yes, Delete Account",
    tone: "danger",
  },
};

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [pageState, setPageState] = useState("loading");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState({ type: "idle", message: "" });
  const [actionFeedback, setActionFeedback] = useState({ type: "idle", message: "" });
  const [pendingAction, setPendingAction] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

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

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const loadSettings = useCallback(async () => {
    setPageState("loading");
    setError("");

    try {
      const response = await getUserSettings();
      setSettings(mapUserSettings(response));
      setPageState("ready");
    } catch (loadError) {
      setError(loadError.message || "Unable to load user settings.");
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const persistSettings = async nextSettings => {
    setSettings(nextSettings);
    setIsSaving(true);
    setSaveFeedback({ type: "idle", message: "" });

    try {
      await updateUserSettings(nextSettings);
      setSaveFeedback({ type: "success", message: "Preferences updated successfully." });
    } catch (saveError) {
      setSaveFeedback({
        type: "error",
        message: saveError.message || "Failed to save your settings.",
      });
      await loadSettings();
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = key => {
    if (!settings) return;
    const nextSettings = { ...settings, [key]: !settings[key] };
    persistSettings(nextSettings);
  };

  const handleSelectChange = value => {
    if (!settings) return;
    persistSettings({ ...settings, language: value });
  };

  const openActionModal = actionKey => {
    setActionFeedback({ type: "idle", message: "" });
    setPendingAction(actionKey);
  };

  const closeActionModal = () => {
    if (!actionBusy) {
      setPendingAction(null);
    }
  };

  const confirmAccountAction = async () => {
    if (!pendingAction) return;

    setActionBusy(true);
    setActionFeedback({ type: "idle", message: "" });

    try {
      if (pendingAction === "deactivate") {
        await deactivateCurrentUser();
        setActionFeedback({ type: "success", message: "Account deactivation request completed." });
      } else {
        await deleteCurrentUser();
        setActionFeedback({ type: "success", message: "Account deletion request completed." });
      }

      setPendingAction(null);
    } catch (actionError) {
      setActionFeedback({
        type: "error",
        message: actionError.message || "Account action failed.",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const sections = !settings
    ? []
    : [
        {
          title: "Appearance",
          rows: [
            {
              label: "Dark Mode",
              sub: "Switch to a darker interface theme for the app shell.",
              ctrl: <Toggle checked={darkMode} onChange={toggleDarkMode} />,
            },
          ],
        },
        {
          title: "Security",
          rows: [
            {
              label: "Two-Factor Authentication",
              sub: "Require an extra layer of security when signing in.",
              ctrl: <Toggle checked={settings.twoFactor} onChange={() => handleToggle("twoFactor")} />,
            },
          ],
        },
        {
          title: "Notifications",
          rows: [
            {
              label: "Email Notifications",
              sub: "Receive updates and alerts via email.",
              ctrl: (
                <Toggle
                  checked={settings.notifications}
                  onChange={() => handleToggle("notifications")}
                />
              ),
            },
          ],
        },
        {
          title: "Privacy",
          rows: [
            {
              label: "Private Account",
              sub: "Limit full profile visibility to admins.",
              ctrl: <Toggle checked={settings.privateAcct} onChange={() => handleToggle("privateAcct")} />,
            },
          ],
        },
        {
          title: "Language",
          rows: [
            {
              label: "Display Language",
              sub: "Choose your preferred interface language.",
              ctrl: (
                <select
                  value={settings.language}
                  onChange={event => handleSelectChange(event.target.value)}
                  className="px-3 py-1.5 text-sm rounded-lg cursor-pointer focus:outline-none"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  {["English", "Hindi", "Spanish", "German"].map(language => (
                    <option key={language}>{language}</option>
                  ))}
                </select>
              ),
            },
          ],
        },
      ];

  if (pageState === "loading") {
    return <UserSettingsSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="max-w-2xl space-y-4">
        <SectionHeader title="Settings" subtitle="Manage your account and preferences" />
        <ErrorState
          title="Could not load your settings"
          description={error}
          action={(
            <button
              onClick={loadSettings}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
              type="button"
            >
              Retry
            </button>
          )}
        />
      </div>
    );
  }

  const activeModal = pendingAction ? accountActions[pendingAction] : null;

  return (
    <div className="max-w-2xl space-y-4">
      <SectionHeader title="Settings" subtitle="Manage your account and preferences" />

      {isSaving ? (
        <p className="text-xs px-1" style={{ color: "var(--muted)" }}>
          Saving latest changes...
        </p>
      ) : null}
      {saveFeedback.message ? (
        <p
          className="text-xs px-1"
          style={{ color: saveFeedback.type === "error" ? "#dc2626" : "#00bea3" }}
        >
          {saveFeedback.message}
        </p>
      ) : null}

      {sections.map(section => (
        <Card key={section.title} className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text)" }}>
            {section.title}
          </h3>
          <div className="space-y-4">
            {section.rows.map(row => (
              <div key={row.label} className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {row.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    {row.sub}
                  </p>
                </div>
                {row.ctrl}
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card className="p-5" style={{ borderColor: "rgba(220,38,38,0.2)" }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} style={{ color: "#f59e0b" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Account Status
          </h3>
        </div>

        <div className="space-y-4">
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <div className="flex items-start gap-3 flex-1">
              <Power size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#f59e0b" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Deactivate Account
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Temporarily disable your account. You can reactivate it later.
                </p>
              </div>
            </div>
            <button
              onClick={() => openActionModal("deactivate")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition flex-shrink-0"
              style={{
                background: "rgba(245,158,11,0.15)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.3)",
              }}
              type="button"
            >
              Deactivate
            </button>
          </div>

          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl"
            style={{
              background: "rgba(220,38,38,0.06)",
              border: "1px solid rgba(220,38,38,0.15)",
            }}
          >
            <div className="flex items-start gap-3 flex-1">
              <Trash2 size={18} className="mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                  Delete Account
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Permanently delete your account and all associated data.
                </p>
              </div>
            </div>
            <button
              onClick={() => openActionModal("delete")}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition flex-shrink-0"
              style={{ background: "#dc2626" }}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>

        {actionFeedback.message ? (
          <p
            className="text-xs mt-4"
            style={{ color: actionFeedback.type === "error" ? "#dc2626" : "#00bea3" }}
          >
            {actionFeedback.message}
          </p>
        ) : null}
      </Card>

      {activeModal ? (
        <ConfirmationModal
          isOpen={Boolean(activeModal)}
          onClose={closeActionModal}
          onConfirm={confirmAccountAction}
          title={activeModal.title}
          description={activeModal.description}
          confirmLabel={activeModal.confirmLabel}
          tone={activeModal.tone}
          isBusy={actionBusy}
        />
      ) : null}
    </div>
  );
};

export default Settings;


