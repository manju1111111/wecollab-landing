"use client";

import { useState, useEffect, useRef } from "react";
import { UserPlus, Users, UserCog, Search, MoreHorizontal, CheckCircle2, XCircle, Clock, KeyRound, Eye, EyeOff, X, Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import { AddEmployeeModal } from "@/components/admin/dashboard/add-employee-modal";
import { toggleEmployeeStatus, adminResetEmployeePassword } from "@/app/employee/actions";
import { useAdminProfile } from "@/components/admin/layout/admin-profile-context";

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

// ── Reset Password Modal ────────────────────────────────────────────
function ResetPasswordModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setIsLoading(true);
    const res = await adminResetEmployeePassword(employee.id, password);
    setIsLoading(false);

    if (res.error) { setError(res.error); return; }
    setSuccess(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <KeyRound className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-900">Reset Password</p>
              <p className="text-[12px] text-slate-400">{employee.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          {success ? (
            <div className="py-6 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="font-bold text-slate-900">Password Updated</p>
              <p className="text-[13px] text-slate-500">The new password has been set for {employee.full_name.split(" ")[0]}.</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-xl">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full h-11 px-4 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-slate-700">Confirm Password</label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  className="flex-1 h-11 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={isLoading || !password || !confirm}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <><KeyRound className="h-3.5 w-3.5" /> Set Password</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete Employee Modal ───────────────────────────────────────────
function DeleteEmployeeModal({
  employee,
  onClose,
  onConfirm,
  isDeleting,
}: {
  employee: Employee;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  const hasLinkedRecords = employee.assigned_count > 0 || employee.tasks_completed > 0;
  const [confirmed, setConfirmed] = useState(!hasLinkedRecords);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-50 flex items-center justify-center">
              <Trash2 className="h-4.5 w-4.5 text-rose-655 text-rose-600" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-slate-900">Delete Employee</p>
              <p className="text-[12px] text-slate-400">{employee.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isDeleting} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-[13px] text-slate-600 leading-relaxed">
            Are you sure you want to delete this employee? This action cannot be undone.
          </p>

          {hasLinkedRecords && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[12px] font-bold text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                Active Assignments Detected
              </div>
              <ul className="list-disc pl-5 text-[11px] font-medium text-amber-700 space-y-1">
                {employee.assigned_count > 0 && (
                  <li>This employee is currently assigned to <strong className="font-semibold">{employee.assigned_count}</strong> creator(s).</li>
                )}
                {employee.tasks_completed > 0 && (
                  <li>This employee has completed <strong className="font-semibold">{employee.tasks_completed}</strong> task(s).</li>
                )}
              </ul>
              <div className="mt-2 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="confirm-delete-checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={isDeleting}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="confirm-delete-checkbox" className="text-[11px] font-bold text-amber-900 cursor-pointer select-none leading-normal">
                  I understand that this employee has active assignments and I want to delete them anyway.
                </label>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting || !confirmed}
              className="flex-1 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>Delete</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
export default function AdminEmployeesPage() {
  const { profile } = useAdminProfile();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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

  // Close action menu when clicking outside
  useEffect(() => {
    const handler = () => setActionMenu(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

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
      showToast(`Employee status updated to ${res.newStatus}.`, "success");
    } else if (res.error) {
      showToast(res.error, "error");
    }
    setActionMenu(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/employees?id=${deleteTarget.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      
      if (res.ok) {
        showToast(data.message || "Employee deleted successfully.", "success");
        setEmployees(prev => prev.filter(e => e.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        showToast(data.error || "Failed to delete employee.", "error");
      }
    } catch (e) {
      console.error("[DELETE_EMPLOYEE]", e);
      showToast("An unexpected error occurred during employee deletion.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[250] flex items-center gap-2 px-4 py-3.5 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-[13px] font-semibold">{toast.message}</span>
        </div>
      )}

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
                  <th className="text-center px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Password</th>
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
                  
                  const isSelf = emp.id === profile?.id || emp.email === profile?.email;

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

                      {/* Password Column */}
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => { setResetTarget(emp); setActionMenu(null); }}
                          title="Reset password for this employee"
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[11px] font-bold border border-indigo-100 transition-colors"
                        >
                          <KeyRound className="h-3 w-3" />
                          Reset
                        </button>
                      </td>

                      {/* Actions Column */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          {/* Delete Employee */}
                          <button
                            onClick={() => {
                              if (isSelf) return;
                              setDeleteTarget(emp);
                              setActionMenu(null);
                            }}
                            disabled={isSelf}
                            className={`transition h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelf
                                ? "opacity-20 cursor-not-allowed text-slate-300"
                                : "opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                            }`}
                            title={
                              isSelf
                                ? "You cannot delete yourself (currently logged-in admin)"
                                : "Delete employee"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setActionMenu(actionMenu === emp.id ? null : emp.id)}
                              className="opacity-0 group-hover:opacity-100 transition h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 shrink-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {actionMenu === emp.id && (
                              <div className="absolute right-0 top-9 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 w-52 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => { setResetTarget(emp); setActionMenu(null); }}
                                  className="w-full px-4 py-2.5 text-left text-[13px] font-semibold hover:bg-indigo-50 text-indigo-700 transition flex items-center gap-2"
                                >
                                  <KeyRound className="h-4 w-4" /> Reset Password
                                </button>
                                <div className="border-t border-slate-100 my-1" />
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

      {/* Modals */}
      <AddEmployeeModal isOpen={isInviteOpen} onClose={() => { setIsInviteOpen(false); fetchEmployees(); }} />
      {resetTarget && (
        <ResetPasswordModal
          employee={resetTarget}
          onClose={() => { setResetTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteEmployeeModal
          employee={deleteTarget}
          onClose={() => { setDeleteTarget(null); }}
          onConfirm={handleDeleteConfirm}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
