"use client";

import { useState, useEffect } from "react";
import { UserPlus, Users, UserCog, Search, MoreHorizontal, ChevronRight, CheckCircle2, XCircle, Clock, Shield, Send } from "lucide-react";
import { AddEmployeeModal } from "@/components/admin/dashboard/add-employee-modal";
import { toggleEmployeeStatus } from "@/app/employee/actions";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  phone: string;
  status: string;
  assigned_count: number;
  tasks_completed: number;
  created_at: string;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string; icon: any }> = {
  active:     { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Active",      icon: CheckCircle2 },
  invited:    { bg: "bg-amber-50 border-amber-200",     text: "text-amber-700",   label: "Invited",     icon: Clock },
  deactivated:{ bg: "bg-rose-50 border-rose-200",       text: "text-rose-600",    label: "Deactivated", icon: XCircle },
};

const ROLE_COLORS: Record<string, string> = {
  Admin:      "bg-indigo-100 text-indigo-700",
  Manager:    "bg-blue-100 text-blue-700",
  Researcher: "bg-violet-100 text-violet-700",
  Employee:   "bg-slate-100 text-slate-600",
};

function Initials({ name }: { name: string }) {
  const initials = name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const gradients = ["from-indigo-400 to-violet-500", "from-rose-400 to-pink-500", "from-fuchsia-400 to-primary", "from-emerald-400 to-teal-500", "from-blue-400 to-cyan-500"];
  const g = gradients[name.charCodeAt(0) % gradients.length];
  return (
    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${g} flex items-center justify-center text-white font-bold text-[13px] shrink-0 shadow-sm`}>
      {initials || "?"}
    </div>
  );
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (e) {
      console.error("[EMPLOYEES_FETCH]", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = employees.filter(e => e.status === "active").length;
  const invitedCount = employees.filter(e => e.status === "invited").length;
  const totalAssigned = employees.reduce((s, e) => s + e.assigned_count, 0);

  const handleToggleStatus = async (emp: Employee) => {
    const res = await toggleEmployeeStatus(emp.id, emp.status);
    if (res.success && res.newStatus) {
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, status: res.newStatus! } : e));
    } else if (res.error) {
      alert(res.error);
    }
    setActionMenu(null);
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Management</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">
            {activeCount} active · {invitedCount} invited · {totalAssigned} creators assigned
          </p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold shadow-sm shadow-indigo-200 transition-colors flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" /> Invite Employee
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Team", value: employees.length, icon: Users, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Active", value: activeCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Invite", value: invitedCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Creators Assigned", value: totalAssigned, icon: UserCog, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl border border-slate-200 p-4 flex items-center gap-3`}>
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-xl font-black text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-200 transition"
        />
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Users className="h-10 w-10 text-slate-200 mb-3" />
            <h3 className="font-bold text-slate-700 mb-1">No Employees Found</h3>
            <p className="text-[13px] text-slate-400 max-w-xs">
              {search ? "Try a different search term." : "Invite your first team member to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Employee</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Department</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Creators</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Tasks Done</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(emp => {
                  const badge = STATUS_BADGE[emp.status] || STATUS_BADGE.active;
                  const roleColor = ROLE_COLORS[emp.role] || ROLE_COLORS.Employee;
                  const status = emp.status || "active";
                  const isActive = status === "active";
                  const isInvited = status === "invited";
                  const isDeactivated = status === "deactivated";

                  return (
                    <tr 
                      key={emp.id} 
                      className={`transition group border-l-4 ${
                        isActive 
                          ? "border-l-emerald-500 bg-emerald-50/10 hover:bg-emerald-50/20" 
                          : isInvited 
                            ? "border-l-amber-500 bg-amber-50/10 hover:bg-amber-50/20" 
                            : "border-l-rose-500 bg-rose-50/20 hover:bg-rose-50/30"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Initials name={emp.full_name} />
                          <div>
                            <p className="font-semibold text-slate-900">{emp.full_name}</p>
                            <p className="text-[12px] text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${roleColor}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{emp.department || "—"}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-slate-800">{emp.assigned_count}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-slate-800">{emp.tasks_completed}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${badge.bg} ${badge.text}`}>
                          <badge.icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenu(actionMenu === emp.id ? null : emp.id)}
                            className="opacity-0 group-hover:opacity-100 transition h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {actionMenu === emp.id && (
                            <div className="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 w-48 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                onClick={() => handleToggleStatus(emp)}
                                className="w-full px-4 py-2.5 text-left text-[13px] font-semibold hover:bg-slate-50 transition flex items-center gap-2"
                              >
                                {emp.status === "deactivated" ? (
                                  <><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Reactivate</>
                                ) : (
                                  <><XCircle className="h-4 w-4 text-rose-400" /> Deactivate</>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddEmployeeModal isOpen={isInviteOpen} onClose={() => { setIsInviteOpen(false); fetchEmployees(); }} />
    </div>
  );
}
