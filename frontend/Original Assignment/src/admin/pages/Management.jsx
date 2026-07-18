// ══════════════════════════════════════════════
//  ADMIN — pages/Management.jsx  (Intern Management)
// ══════════════════════════════════════════════

import { useState } from "react";
import { Search, CheckCircle, XCircle, ClipboardList, UserPlus, Mail, Briefcase } from "lucide-react";
import { Card, Badge, SectionHeader, Modal, Input, PrimaryButton, GreenButton } from "../../shared/components/UI";
import { MOCK_INTERNS } from "../../shared/utils/constants";

const Management = () => {
  const [interns, setInterns] = useState(MOCK_INTERNS);
  const [search,  setSearch]  = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newIntern, setNewIntern] = useState({ name: "", department: "", task: "" });

  const toggleAttendance = id =>
    setInterns(is => is.map(i => i.id === id
      ? { ...i, attendance: i.attendance === "Present" ? "Absent" : "Present" }
      : i
    ));

  const toggleStatus = id =>
    setInterns(is => is.map(i => i.id === id
      ? { ...i, status: i.status === "Active" ? "Inactive" : "Active" }
      : i
    ));

  const filtered = interns.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.department.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddIntern = () => {
    if (!newIntern.name || !newIntern.department) return;
    const intern = {
      id: Date.now(),
      ...newIntern,
      attendance: "Present",
      status: "Active",
      rating: 5.0
    };
    setInterns([intern, ...interns]);
    setIsModalOpen(false);
    setNewIntern({ name: "", department: "", task: "" });
  };

  return (
    <div className="space-y-6">

      <SectionHeader
        title="Intern Management"
        subtitle="Manage intern attendance, tasks, status and ratings"
        action={
          <PrimaryButton icon={UserPlus} onClick={() => setIsModalOpen(true)}>
            Add Intern
          </PrimaryButton>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Interns",  value: interns.length,                                            bg: "bg-blue-50",    text: "text-blue-700"    },
          { label: "Present Today",  value: interns.filter(i => i.attendance === "Present").length,    bg: "bg-emerald-50", text: "text-emerald-700" },
          { label: "Absent Today",   value: interns.filter(i => i.attendance === "Absent").length,     bg: "bg-red-50",     text: "text-red-700"     },
          { label: "Active Status",  value: interns.filter(i => i.status === "Active").length,         bg: "bg-violet-50",  text: "text-violet-700"  },
        ].map(s => (
          <div key={s.label} className={`${s.bg} ${s.text} rounded-xl p-4`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search interns by name or department…"
          className="w-full pl-9 py-2.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <div className="sn-table-scroll">
        <table className="w-full text-sm min-w-[52rem]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Name", "Department", "Attendance", "Current Task", "Rating", "Status", "Actions"].map(h => (
                <th
                  key={h}
                  className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${h === "Actions" ? "text-center" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(intern => (
              <tr key={intern.id} className="hover:bg-slate-50 transition">

                {/* Name */}
                <td className="px-5 py-4 font-medium text-slate-900 whitespace-nowrap">
                  {intern.name}
                </td>

                {/* Department */}
                <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                  {intern.department}
                </td>

                {/* Attendance */}
                <td className="px-5 py-4">
                  <Badge variant={intern.attendance === "Present" ? "success" : "danger"}>
                    {intern.attendance}
                  </Badge>
                </td>

                {/* Task */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-slate-600 whitespace-nowrap">
                    <ClipboardList size={13} className="flex-shrink-0 text-slate-400" />
                    {intern.task}
                  </div>
                </td>

                {/* Rating */}
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                    ⭐ {intern.rating} / 10
                  </span>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <Badge variant={intern.status === "Active" ? "purple" : "gray"}>
                    {intern.status}
                  </Badge>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => toggleAttendance(intern.id)}
                      title="Toggle Attendance"
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <CheckCircle size={15} />
                    </button>
                    <button
                      onClick={() => toggleStatus(intern.id)}
                      title="Toggle Active Status"
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <XCircle size={15} />
                    </button>
                  </div>
                </td>

              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                  No interns match your search.
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
        title="Add New Intern"
        footer={
          <>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <GreenButton onClick={handleAddIntern}>
              Create Intern
            </GreenButton>
          </>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Full Name" 
            placeholder="e.g. Rahul Sharma" 
            icon={UserPlus}
            value={newIntern.name}
            onChange={e => setNewIntern({...newIntern, name: e.target.value})}
          />
          <Input 
            label="Department" 
            placeholder="e.g. Web Development" 
            icon={Briefcase}
            value={newIntern.department}
            onChange={e => setNewIntern({...newIntern, department: e.target.value})}
          />
          <Input 
            label="Current Task" 
            placeholder="e.g. Dashboard Refactor" 
            icon={ClipboardList}
            value={newIntern.task}
            onChange={e => setNewIntern({...newIntern, task: e.target.value})}
          />
        </div>
      </Modal>

    </div>
  );
};

export default Management;