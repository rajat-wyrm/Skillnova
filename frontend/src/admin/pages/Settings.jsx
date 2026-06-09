import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Shield } from "lucide-react";
import { Card, ConfirmationModal, SectionHeader, Toggle } from "../../shared/components/UI";
import { ErrorState } from "../../shared/components/AppState";
import { AdminSettingsSkeleton } from "../../shared/components/PageSkeletons";
import {
  deleteAdminPlatform,
  getAdminSettings,
  resetAdminUserData,
  updateAdminSettings,
} from "../../shared/services/api/settingsApi";

const mapAdminSettings = response => {
  const data = response?.data ?? response ?? {};

  return {
    platformName: data.platformName ?? "SkillNova",
    maxInterns: String(data.maxInterns ?? 50),
    registration: data.registration ?? true,
    maintenance: data.maintenance ?? false,
    smtp: data.smtp ?? true,
    twoFactor: data.twoFactor ?? false,
    auditLog: data.auditLog ?? true,
    aiAssistant: data.aiAssistant ?? true,
  };
};

const toAdminSettingsPayload = settings => ({
  ...settings,
  maxInterns: Number(settings.maxInterns) || 0,
});

const dangerActions = {
  reset: {
    title: "Reset All User Data",
    description:
      "This will remove submitted user-linked data across the platform. This action is irreversible.",
    confirmLabel: "Yes, Reset Data",
    tone: "warning",
  },
  delete: {
    title: "Delete Platform",
    description:
      "This will permanently delete the platform instance and its stored records. This action cannot be undone.",
    confirmLabel: "Yes, Delete Platform",
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

  const loadSettings = useCallback(async () => {
    setPageState("loading");
    setError("");

    try {
      const response = await getAdminSettings();
      setSettings(mapAdminSettings(response));
      setPageState("ready");
    } catch (loadError) {
      setError(loadError.message || "Unable to load admin settings.");
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
      await updateAdminSettings(toAdminSettingsPayload(nextSettings));
      setSaveFeedback({ type: "success", message: "Settings saved successfully." });
    } catch (saveError) {
      setSaveFeedback({
        type: "error",
        message: saveError.message || "Failed to save admin settings.",
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

  const handleInputChange = (key, value) => {
    setSettings(current => ({ ...current, [key]: value }));
  };

  const handleInputBlur = () => {
    if (!settings) return;
    persistSettings(settings);
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

  const confirmDangerAction = async () => {
    if (!pendingAction) return;

    setActionBusy(true);
    setActionFeedback({ type: "idle", message: "" });

    try {
      if (pendingAction === "reset") {
        await resetAdminUserData();
        setActionFeedback({ type: "success", message: "User data reset request completed." });
      } else {
        await deleteAdminPlatform();
        setActionFeedback({ type: "success", message: "Platform deletion request completed." });
      }

      setPendingAction(null);
    } catch (actionError) {
      setActionFeedback({
        type: "error",
        message: actionError.message || "Danger zone action failed.",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const sections = !settings
    ? []
    : [
        {
          title: "Platform",
          icon: Shield,
          rows: [
            {
              label: "Platform Name",
              sub: "The name shown in the shell, emails, and branded screens.",
              ctrl: (
                <input
                  value={settings.platformName}
                  onChange={event => handleInputChange("platformName", event.target.value)}
                  onBlur={handleInputBlur}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none w-44"
                />
              ),
            },
            {
              label: "Max Interns",
              sub: "Maximum number of intern accounts allowed on the platform.",
              ctrl: (
                <input
                  type="number"
                  min="0"
                  value={settings.maxInterns}
                  onChange={event => handleInputChange("maxInterns", event.target.value)}
                  onBlur={handleInputBlur}
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none w-24"
                />
              ),
            },
            {
              label: "Open Registration",
              sub: "Allow new interns to self-register.",
              ctrl: <Toggle checked={settings.registration} onChange={() => handleToggle("registration")} />,
            },
            {
              label: "Maintenance Mode",
              sub: "Take the platform offline for maintenance windows.",
              ctrl: <Toggle checked={settings.maintenance} onChange={() => handleToggle("maintenance")} />,
            },
          ],
        },
        {
          title: "Email & Notifications",
          icon: null,
          rows: [
            {
              label: "SMTP Notifications",
              sub: "Send automated email alerts to interns and admins.",
              ctrl: <Toggle checked={settings.smtp} onChange={() => handleToggle("smtp")} />,
            },
          ],
        },
        {
          title: "Security",
          icon: null,
          rows: [
            {
              label: "Two-Factor Authentication",
              sub: "Require 2FA for all admin accounts.",
              ctrl: <Toggle checked={settings.twoFactor} onChange={() => handleToggle("twoFactor")} />,
            },
            {
              label: "Audit Logging",
              sub: "Keep a record of sensitive admin actions.",
              ctrl: <Toggle checked={settings.auditLog} onChange={() => handleToggle("auditLog")} />,
            },
          ],
        },
        {
          title: "Features",
          icon: null,
          rows: [
            {
              label: "AI Assistant",
              sub: "Enable the AI knowledge assistant for interns.",
              ctrl: <Toggle checked={settings.aiAssistant} onChange={() => handleToggle("aiAssistant")} />,
            },
          ],
        },
      ];

  if (pageState === "loading") {
    return <AdminSettingsSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="max-w-2xl space-y-4">
        <SectionHeader
          title="Admin Settings"
          subtitle="Configure platform-wide settings and permissions"
        />
        <ErrorState
          title="Could not load admin settings"
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

  const activeModal = pendingAction ? dangerActions[pendingAction] : null;

  return (
    <div className="max-w-2xl space-y-4">
      <SectionHeader
        title="Admin Settings"
        subtitle="Configure platform-wide settings and permissions"
      />

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
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            {section.icon ? <section.icon size={14} className="text-violet-500" /> : null}
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

      <Card className="p-5 border-red-200 bg-red-50">
        <h3 className="text-sm font-semibold text-red-600 mb-1 flex items-center gap-2">
          <AlertTriangle size={14} /> Danger Zone
        </h3>
        <p className="text-xs text-red-400 mb-4">
          These actions are irreversible. Proceed with extreme caution.
        </p>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => openActionModal("reset")}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition border border-red-200"
            type="button"
          >
            Reset All User Data
          </button>
          <button
            onClick={() => openActionModal("delete")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
            type="button"
          >
            Delete Platform
          </button>
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
          onConfirm={confirmDangerAction}
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

