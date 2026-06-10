// ══════════════════════════════════════════════
//  ADMIN — pages/AdminPanel.jsx  (User Management)
// ══════════════════════════════════════════════

import { useState } from "react";
import { Search, Plus, Trash2, ShieldCheck, UserCheck, Users, UserX } from "lucide-react";
import { Card, Badge, Avatar, SectionHeader, Modal, Input } from "../../shared/components/UI";
import { MOCK_USERS } from "../../shared/utils/constants";

const ROLE_VARIANT  = { Admin: "purple", Intern: "default" };
const STATUS_VARIANT = { Active: "success", Inactive: "gray" };

const AdminPanel = () => {
  const [users,  setUsers]  = useState(MOCK_USERS);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", dept: "", role: "Intern" });

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleRole   = id => setUsers(us => us.map(u => u.id === id ? { ...u, role:   u.role   === "Admin"  ? "Intern"   : "Admin"    } : u));
  const toggleStatus = id => setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Inactive" : "Active"   } : u));
  const deleteUser   = id => setUsers(us => us.filter(u => u.id !== id));
  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    const user = {
      id: Date.now(),
      ...newUser,
      avatar: newUser.name.split(" ").map(n => n[0]).join("").toUpperCase(),
      status: "Active",
      rating: 5.0
    };
    setUsers([user, ...users]);
    setIsModalOpen(false);
    setNewUser({ name: "", email: "", dept: "", role: "Intern" });
  };

  const terminateUser = id => {
    if (window.confirm("Are you sure you want to terminate this user? This will permanently revoke their access.")) {
      setUsers(us => us.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6">

      <SectionHeader
        title="User Management"
        subtitle="Manage intern roles, status and platform access"
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition"
            style={{ background: "#ff6d34" }}
            onMouseEnter={e => e.currentTarget.style.background = "#e85d25"}
            onMouseLeave={e => e.currentTarget.style.background = "#ff6d34"}
          >
            <Plus size={15} /> Add User
          </button>
        }
      />

      {/* Summary Pills */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Total Users",    value: users.length,                          bg: "rgba(37,99,235,0.12)",  color: "#2563eb" },
          { label: "Active",         value: users.filter(u => u.status === "Active").length,   bg: "rgba(5,150,105,0.12)",  color: "#059669" },
          { label: "Inactive",       value: users.filter(u => u.status === "Inactive").length, bg: "rgba(148,163,184,0.12)", color: "var(--muted)" },
          { label: "Admins",         value: users.filter(u => u.role   === "Admin").length,    bg: "rgba(124,58,237,0.12)", color: "#7c3aed" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: s.bg, color: s.color }}>
            <Users size={14} />
            {s.value} {s.label}
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users by name or email…"
          className="w-full pl-9 py-2.5 text-sm rounded-lg focus:outline-none transition"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
        <table className="w-full text-sm min-w-[44rem]">
          <thead>
            <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
              {["User", "Role", "Department", "Rating", "Status", "Actions"].map(h => (
                <th
                  key={h}
                  className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${h === "Actions" ? "text-center" : "text-left"}`}
                  style={{ color: "var(--muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="transition" style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={e => e.currentTarget.style.background = document.documentElement.classList.contains("dark") ? "rgba(255,255,255,0.03)" : "#f9fafb"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >

                {/* User */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar initials={u.avatar} size="sm" />
                    <div>
                      <p className="font-medium" style={{ color: "var(--text)" }}>{u.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td className="px-5 py-4">
                  <Badge variant={ROLE_VARIANT[u.role]}>{u.role}</Badge>
                </td>

                {/* Department */}
                <td className="px-5 py-4" style={{ color: "var(--muted)" }}>{u.dept}</td>

                {/* Rating */}
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                    ⭐ {u.rating}
                  </span>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <Badge variant={STATUS_VARIANT[u.status]}>{u.status}</Badge>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => toggleRole(u.id)}
                      title="Toggle Role"
                      className="p-2 rounded-lg transition"
                      style={{ color: "#2563eb" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(37,99,235,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <ShieldCheck size={15} />
                    </button>
                    <button
                      onClick={() => toggleStatus(u.id)}
                      title="Toggle Status"
                      className="p-2 rounded-lg transition"
                      style={{ color: "#059669" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(5,150,105,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <UserCheck size={15} />
                    </button>
                    <button
                      onClick={() => terminateUser(u.id)}
                      title="Terminate User"
                      className="p-2 rounded-lg transition"
                      style={{ color: "#f59e0b" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(245,158,11,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <UserX size={15} />
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      title="Delete User"
                      className="p-2 rounded-lg transition"
                      style={{ color: "#dc2626" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>

              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: "var(--muted)" }}>
                  No users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New User"
        footer={
          <div className="flex justify-end gap-3">
             <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddUser}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition"
              style={{ background: "#ff6d34" }}
            >
              Create User
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Full Name" 
            placeholder="e.g. Rahul Sharma" 
            icon={Plus}
            value={newUser.name}
            onChange={e => setNewUser({...newUser, name: e.target.value})}
          />
          <Input 
            label="Email Address" 
            placeholder="e.g. rahul@skillnova.com" 
            icon={Search}
            value={newUser.email}
            onChange={e => setNewUser({...newUser, email: e.target.value})}
          />
          <Input 
            label="Department" 
            placeholder="e.g. AI / ML" 
            icon={ShieldCheck}
            value={newUser.dept}
            onChange={e => setNewUser({...newUser, dept: e.target.value})}
          />
          <div className="space-y-1.5">
             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</label>
             <select 
               className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-blue-500 transition-all font-sans"
               value={newUser.role}
               onChange={e => setNewUser({...newUser, role: e.target.value})}
             >
               <option value="Intern">Intern</option>
               <option value="Admin">Admin</option>
             </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminPanel;