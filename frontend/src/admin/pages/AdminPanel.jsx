// ══════════════════════════════════════════════
//  ADMIN — pages/AdminPanel.jsx  (User Management)
// ══════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Card,
  ConfirmationModal,
  Input,
  Modal,
  SectionHeader,
} from "../../shared/components/UI";
import { EmptyState, ErrorState } from "../../shared/components/AppState";
import { AdminPanelSkeleton } from "../../shared/components/PageSkeletons";
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  terminateAdminUser,
  updateAdminUser,
} from "../../shared/services/api/usersApi";

const ROLE_VARIANT = { Admin: "purple", Intern: "default" };
const STATUS_VARIANT = { Active: "success", Inactive: "gray" };
const INITIAL_USER_FORM = { name: "", email: "", dept: "", role: "Intern" };

const sortUsers = users => [...users].sort((left, right) => Number(right.id) - Number(left.id));

const toAvatar = name =>
  String(name || "U")
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const normalizeStatus = value => {
  const normalized = String(value || "Active").trim().toLowerCase();
  return normalized === "inactive" ? "Inactive" : "Active";
};

const normalizeRole = value => {
  const normalized = String(value || "Intern").trim().toLowerCase();
  return normalized === "admin" ? "Admin" : "Intern";
};

const normalizeRating = value => {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : Number(parsed.toFixed(1));
};

const normalizeUser = item => {
  if (!item || typeof item !== "object") return null;

  const name = item.name || item.fullName || "Unknown User";
  const dept = item.dept || item.department || "General";

  return {
    id: item.id ?? item._id ?? item.email ?? name,
    name,
    email: item.email || "No email provided",
    role: normalizeRole(item.role),
    dept,
    status: normalizeStatus(item.status),
    avatar: item.avatar || toAvatar(name),
    rating: normalizeRating(item.rating ?? item.score ?? item.performance),
  };
};

const extractUsers = response => {
  const payload = response?.data ?? response ?? {};
  const list = Array.isArray(payload)
    ? payload
    : payload.users || payload.items || payload.data || [];

  return Array.isArray(list) ? sortUsers(list.map(normalizeUser).filter(Boolean)) : [];
};

const extractUser = response => normalizeUser(response?.data ?? response);

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState(INITIAL_USER_FORM);
  const [formError, setFormError] = useState("");
  const [pageState, setPageState] = useState("loading");
  const [pageError, setPageError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "idle", message: "" });
  const [activeActionKey, setActiveActionKey] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter(user =>
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.dept.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  }, [search, users]);

  const replaceUser = updatedUser => {
    if (!updatedUser) return;

    setUsers(existing =>
      sortUsers(existing.map(user => (user.id === updatedUser.id ? updatedUser : user)))
    );
  };

  const removeUser = id => {
    setUsers(existing => existing.filter(user => user.id !== id));
  };

  const loadUsers = useCallback(async () => {
    setPageState("loading");
    setPageError("");

    try {
      const response = await getAdminUsers();
      setUsers(extractUsers(response));
      setPageState("ready");
    } catch (error) {
      setUsers([]);
      setPageError(error.message || "Unable to load users.");
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openConfirm = action => {
    setConfirmAction(action);
    setFeedback({ type: "idle", message: "" });
  };

  const closeConfirm = () => {
    if (!confirmAction?.busy) {
      setConfirmAction(null);
    }
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;

    const currentAction = confirmAction;
    const actionKey = `${currentAction.type}-${currentAction.user.id}`;

    setActiveActionKey(actionKey);
    setConfirmAction(existing => ({ ...existing, busy: true }));
    setFeedback({ type: "idle", message: "" });

    try {
      if (currentAction.type === "terminate") {
        const response = await terminateAdminUser(currentAction.user.id);
        const updatedUser = extractUser(response);

        if (updatedUser) {
          replaceUser(updatedUser);
        } else {
          await loadUsers();
        }

        setFeedback({
          type: "success",
          message: `${currentAction.user.name} has been terminated and marked inactive.`,
        });
      }

      if (currentAction.type === "delete") {
        await deleteAdminUser(currentAction.user.id);
        removeUser(currentAction.user.id);
        setFeedback({
          type: "success",
          message: `${currentAction.user.name} has been deleted.`,
        });
      }

      setConfirmAction(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || `Could not complete the action for ${currentAction.user.name}.`,
      });
      setConfirmAction(null);
    } finally {
      setActiveActionKey("");
    }
  };

  const handleToggleRole = async user => {
    const actionKey = `role-${user.id}`;
    setActiveActionKey(actionKey);
    setFeedback({ type: "idle", message: "" });

    try {
      const nextRole = user.role === "Admin" ? "Intern" : "Admin";
      const response = await updateAdminUser(user.id, { role: nextRole });
      const updatedUser = extractUser(response);

      if (updatedUser) {
        replaceUser(updatedUser);
      } else {
        replaceUser({ ...user, role: nextRole });
      }

      setFeedback({
        type: "success",
        message: `${user.name} is now ${nextRole}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || `Could not update the role for ${user.name}.`,
      });
    } finally {
      setActiveActionKey("");
    }
  };

  const handleToggleStatus = async user => {
    const actionKey = `status-${user.id}`;
    setActiveActionKey(actionKey);
    setFeedback({ type: "idle", message: "" });

    try {
      const nextStatus = user.status === "Active" ? "Inactive" : "Active";
      const response = await updateAdminUser(user.id, { status: nextStatus });
      const updatedUser = extractUser(response);

      if (updatedUser) {
        replaceUser(updatedUser);
      } else {
        replaceUser({ ...user, status: nextStatus });
      }

      setFeedback({
        type: "success",
        message: `${user.name} is now ${nextStatus}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || `Could not update the status for ${user.name}.`,
      });
    } finally {
      setActiveActionKey("");
    }
  };

  const handleAddUser = async () => {
    const trimmedPayload = {
      name: newUser.name.trim(),
      email: newUser.email.trim().toLowerCase(),
      dept: newUser.dept.trim(),
      role: newUser.role,
    };

    if (!trimmedPayload.name || !trimmedPayload.email || !trimmedPayload.dept) {
      setFormError("Name, email, and department are required.");
      return;
    }

    const emailExists = users.some(
      user => user.email.toLowerCase() === trimmedPayload.email.toLowerCase()
    );

    if (emailExists) {
      setFormError("A user with this email already exists.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    setFeedback({ type: "idle", message: "" });

    try {
      const response = await createAdminUser(trimmedPayload);
      const createdUser = extractUser(response);

      if (createdUser) {
        setUsers(existing => sortUsers([createdUser, ...existing]));
      } else {
        await loadUsers();
      }

      setFeedback({
        type: "success",
        message: `${trimmedPayload.name} was added successfully.`,
      });
      setIsModalOpen(false);
      setNewUser(INITIAL_USER_FORM);
    } catch (error) {
      setFormError(error.message || "Could not create the user.");
      setFeedback({
        type: "error",
        message: error.message || `Could not create ${trimmedPayload.name}.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const summaryItems = [
    {
      label: "Total Users",
      value: users.length,
      bg: "rgba(37,99,235,0.12)",
      color: "#2563eb",
    },
    {
      label: "Active",
      value: users.filter(user => user.status === "Active").length,
      bg: "rgba(5,150,105,0.12)",
      color: "#059669",
    },
    {
      label: "Inactive",
      value: users.filter(user => user.status === "Inactive").length,
      bg: "rgba(148,163,184,0.12)",
      color: "var(--muted)",
    },
    {
      label: "Admins",
      value: users.filter(user => user.role === "Admin").length,
      bg: "rgba(124,58,237,0.12)",
      color: "#7c3aed",
    },
  ];

  if (pageState === "loading") {
    return <AdminPanelSkeleton />;
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <SectionHeader
          title="User Management"
          subtitle="Manage intern roles, status and platform access"
        />
        <ErrorState
          title="Could not load users"
          description={pageError}
          action={
            <button
              onClick={loadUsers}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
              type="button"
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
        title="User Management"
        subtitle="Manage intern roles, status and platform access"
        action={
          <button
            onClick={() => {
              setFormError("");
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition"
            style={{ background: "#ff6d34" }}
            onMouseEnter={event => {
              event.currentTarget.style.background = "#e85d25";
            }}
            onMouseLeave={event => {
              event.currentTarget.style.background = "#ff6d34";
            }}
            type="button"
          >
            <Plus size={15} /> Add User
          </button>
        }
      />

      {feedback.message ? (
        <Card className="p-4">
          <p
            className="text-sm font-medium"
            style={{ color: feedback.type === "error" ? "#dc2626" : "var(--text)" }}
          >
            {feedback.message}
          </p>
        </Card>
      ) : null}

      <div className="flex gap-3 flex-wrap">
        {summaryItems.map(summary => (
          <div
            key={summary.label}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: summary.bg, color: summary.color }}
          >
            <Users size={14} />
            {summary.value} {summary.label}
          </div>
        ))}
      </div>

      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--muted)" }}
        />
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search users by name, email, department, or role..."
          className="w-full pl-9 py-2.5 text-sm rounded-lg focus:outline-none transition"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
          <table className="w-full text-sm min-w-[44rem]">
            <thead>
              <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
                {["User", "Role", "Department", "Rating", "Status", "Actions"].map(header => (
                  <th
                    key={header}
                    className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${header === "Actions" ? "text-center" : "text-left"}`}
                    style={{ color: "var(--muted)" }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr
                  key={user.id}
                  className="transition"
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={event => {
                    event.currentTarget.style.background = document.documentElement.classList.contains("dark")
                      ? "rgba(255,255,255,0.03)"
                      : "#f9fafb";
                  }}
                  onMouseLeave={event => {
                    event.currentTarget.style.background = "transparent";
                  }}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={user.avatar} size="sm" />
                      <div>
                        <p className="font-medium" style={{ color: "var(--text)" }}>{user.name}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant={ROLE_VARIANT[user.role]}>{user.role}</Badge>
                  </td>

                  <td className="px-5 py-4" style={{ color: "var(--muted)" }}>{user.dept}</td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                      ⭐ {user.rating}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant={STATUS_VARIANT[user.status]}>{user.status}</Badge>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggleRole(user)}
                        disabled={activeActionKey === `role-${user.id}`}
                        title={`Change ${user.name} to ${user.role === "Admin" ? "Intern" : "Admin"}`}
                        className="p-2 rounded-lg transition disabled:opacity-60"
                        style={{ color: "#2563eb" }}
                        onMouseEnter={event => {
                          event.currentTarget.style.background = "rgba(37,99,235,0.1)";
                        }}
                        onMouseLeave={event => {
                          event.currentTarget.style.background = "transparent";
                        }}
                        type="button"
                      >
                        <ShieldCheck size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        disabled={activeActionKey === `status-${user.id}`}
                        title={`Toggle ${user.name} status`}
                        className="p-2 rounded-lg transition disabled:opacity-60"
                        style={{ color: "#059669" }}
                        onMouseEnter={event => {
                          event.currentTarget.style.background = "rgba(5,150,105,0.1)";
                        }}
                        onMouseLeave={event => {
                          event.currentTarget.style.background = "transparent";
                        }}
                        type="button"
                      >
                        <UserCheck size={15} />
                      </button>
                      <button
                        onClick={() =>
                          openConfirm({
                            type: "terminate",
                            user,
                            busy: false,
                            title: "Terminate User",
                            description: `This will immediately mark ${user.name} as inactive and revoke access until reactivated.`,
                            confirmLabel: "Terminate User",
                            tone: "warning",
                          })
                        }
                        disabled={activeActionKey === `terminate-${user.id}`}
                        title={`Terminate ${user.name}`}
                        className="p-2 rounded-lg transition disabled:opacity-60"
                        style={{ color: "#f59e0b" }}
                        onMouseEnter={event => {
                          event.currentTarget.style.background = "rgba(245,158,11,0.1)";
                        }}
                        onMouseLeave={event => {
                          event.currentTarget.style.background = "transparent";
                        }}
                        type="button"
                      >
                        <UserX size={15} />
                      </button>
                      <button
                        onClick={() =>
                          openConfirm({
                            type: "delete",
                            user,
                            busy: false,
                            title: "Delete User",
                            description: `This will permanently remove ${user.name} from the user list.`,
                            confirmLabel: "Delete User",
                            tone: "danger",
                          })
                        }
                        disabled={activeActionKey === `delete-${user.id}`}
                        title={`Delete ${user.name}`}
                        className="p-2 rounded-lg transition disabled:opacity-60"
                        style={{ color: "#dc2626" }}
                        onMouseEnter={event => {
                          event.currentTarget.style.background = "rgba(220,38,38,0.1)";
                        }}
                        onMouseLeave={event => {
                          event.currentTarget.style.background = "transparent";
                        }}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && users.length > 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "var(--muted)" }}>
                    No users match your search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {users.length === 0 ? (
        <EmptyState
          title="No users created yet"
          description="Start by creating the first backend-backed user record."
          action={
            <button
              onClick={() => {
                setFormError("");
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: "#ff6d34" }}
              type="button"
            >
              Add First User
            </button>
          }
        />
      ) : null}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsModalOpen(false);
            setFormError("");
          }
        }}
        title="Add New User"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setFormError("");
              }}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-60"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleAddUser}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60"
              style={{ background: "#ff6d34" }}
              type="button"
            >
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            icon={Users}
            value={newUser.name}
            onChange={event => setNewUser({ ...newUser, name: event.target.value })}
          />
          <Input
            label="Email Address"
            placeholder="e.g. rahul@skillnova.com"
            icon={Search}
            value={newUser.email}
            onChange={event => setNewUser({ ...newUser, email: event.target.value })}
          />
          <Input
            label="Department"
            placeholder="e.g. AI / ML"
            icon={ShieldCheck}
            value={newUser.dept}
            onChange={event => setNewUser({ ...newUser, dept: event.target.value })}
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</label>
            <select
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 transition-all font-sans"
              value={newUser.role}
              onChange={event => setNewUser({ ...newUser, role: event.target.value })}
            >
              <option value="Intern">Intern</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          {formError ? <p className="text-xs text-red-500 font-medium">{formError}</p> : null}
        </div>
      </Modal>

      {confirmAction ? (
        <ConfirmationModal
          isOpen={Boolean(confirmAction)}
          onClose={closeConfirm}
          onConfirm={runConfirmedAction}
          title={confirmAction.title}
          description={confirmAction.description}
          confirmLabel={confirmAction.confirmLabel}
          tone={confirmAction.tone}
          isBusy={confirmAction.busy}
        />
      ) : null}
    </div>
  );
};

export default AdminPanel;

