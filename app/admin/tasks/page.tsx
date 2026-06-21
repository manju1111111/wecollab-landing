"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Search, 
  Plus, 
  Check,
  RefreshCw
} from "lucide-react";
import { AdminTaskModal } from "@/components/admin/dashboard/admin-task-modal";

interface Task {
  id: string;
  employee_id: string;
  creator_id: string | null;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Creator {
  id: string;
  name: string;
  username: string;
}

function broadcastTaskUpdate() {
  try {
    const bc = new BroadcastChannel("wecollab-updates");
    bc.postMessage({ type: "TASK_UPDATE", timestamp: Date.now() });
    bc.close();
  } catch (_) {}
}

function AdminTasksInner() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, empsRes, creatsRes] = await Promise.all([
        fetch("/api/admin/employee-tasks"),
        fetch("/api/admin/employees"),
        fetch("/api/admin/creators"),
      ]);

      const tasksJson = await tasksRes.json();
      const empsJson = await empsRes.json();
      const creatsJson = await creatsRes.json();

      setTasks(tasksJson.tasks || []);
      setEmployees(empsJson.employees || []);
      setCreators(creatsJson.creators || []);
    } catch (e) {
      console.error("[ADMIN_TASKS_FETCH]", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen for cross-tab updates
    const bc = new BroadcastChannel("wecollab-updates");
    bc.onmessage = (e) => {
      if (e.data?.type === "TASK_UPDATE") {
        fetchData();
      }
    };
    return () => bc.close();
  }, []);

  const handleToggleCompletion = async (task: Task) => {
    const isCompleted = !!task.completed_at;
    const completedAt = isCompleted ? null : new Date().toISOString();

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed_at: completedAt } : t));

    try {
      const res = await fetch(`/api/admin/employee-tasks?id=${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed_at: completedAt }),
      });
      if (!res.ok) throw new Error("Update failed");
      broadcastTaskUpdate();
    } catch {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    // Optimistic remove
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const res = await fetch(`/api/admin/employee-tasks?id=${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      broadcastTaskUpdate();
    } catch {
      // Revert
      fetchData();
    }
  };

  // Filter tasks
  const todayStr = new Date().toISOString().split("T")[0];
  const filtered = tasks.filter(task => {
    const emp = employees.find(e => e.id === task.employee_id);
    const creator = creators.find(c => c.id === task.creator_id);

    const searchLower = search.toLowerCase();
    const matchesSearch = 
      task.title.toLowerCase().includes(searchLower) ||
      (emp && emp.full_name.toLowerCase().includes(searchLower)) ||
      (creator && creator.name.toLowerCase().includes(searchLower)) ||
      (creator && creator.username.toLowerCase().includes(searchLower));

    const isCompleted = !!task.completed_at;
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "completed" && isCompleted) ||
      (statusFilter === "pending" && !isCompleted);

    const matchesEmployee = 
      employeeFilter === "all" ||
      task.employee_id === employeeFilter;

    return matchesSearch && matchesStatus && matchesEmployee;
  });

  const completedCount = tasks.filter(t => t.completed_at).length;
  const pendingCount = tasks.filter(t => !t.completed_at).length;
  const overdueCount = tasks.filter(t => !t.completed_at && t.due_date && t.due_date < todayStr).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Management</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">
            Assign, review, and track research operations for team members.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Refresh database"
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsAssignOpen(true)}
            className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold shadow-sm shadow-indigo-200 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4.5 w-4.5" /> Assign Task
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: tasks.length, icon: CheckSquare, color: "text-slate-600", bg: "bg-slate-50" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Tasks", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Overdue Tasks", value: overdueCount, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50" },
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

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, employee, or creator name..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm shrink-0 min-w-[140px] w-full sm:w-auto"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>

        {/* Employee Filter */}
        <select
          value={employeeFilter}
          onChange={e => setEmployeeFilter(e.target.value)}
          className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm shrink-0 min-w-[180px] w-full sm:w-auto"
        >
          <option value="all">All Employees</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>{emp.full_name}</option>
          ))}
        </select>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <CheckSquare className="h-10 w-10 text-slate-200 mb-3" />
            <h3 className="font-bold text-slate-700 mb-1">No Tasks Found</h3>
            <p className="text-[13px] text-slate-400 max-w-xs">
              {search || statusFilter !== "all" || employeeFilter !== "all" 
                ? "Try adjusting your filters or search terms." 
                : "Assign your first task to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Task Details</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Assigned To</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Linked Creator</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Due Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(task => {
                  const emp = employees.find(e => e.id === task.employee_id);
                  const creator = creators.find(c => c.id === task.creator_id);
                  const isCompleted = !!task.completed_at;
                  const isOverdue = !isCompleted && task.due_date && task.due_date < todayStr;

                  return (
                    <tr 
                      key={task.id} 
                      className={`transition group border-l-4 ${
                        isCompleted 
                          ? "border-l-emerald-500 bg-emerald-50/10 hover:bg-emerald-50/20" 
                          : isOverdue 
                            ? "border-l-rose-500 bg-rose-50/20 hover:bg-rose-50/30" 
                            : "border-l-slate-250 hover:bg-slate-50/70"
                      }`}
                    >
                      <td className="px-5 py-4 max-w-md">
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleToggleCompletion(task)}
                            className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
                              isCompleted 
                                ? "bg-emerald-500 border-emerald-500 text-white" 
                                : "border-slate-300 hover:border-indigo-500 hover:bg-slate-50"
                            }`}
                          >
                            {isCompleted && <Check className="h-3 w-3 stroke-[3]" />}
                          </button>
                          <div>
                            <p className={`font-semibold text-slate-800 leading-normal ${isCompleted ? "line-through text-slate-400" : ""}`}>
                              {task.title}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1 font-medium">
                              Created {new Date(task.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{emp?.full_name || "—"}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{emp?.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {creator ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-700">{creator.name}</span>
                            <span className="text-[11px] text-slate-400 font-bold">@{creator.username}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {task.due_date ? (
                          <div className="flex flex-col">
                            <span className={`font-semibold ${isOverdue ? "text-rose-600" : "text-slate-700"}`}>
                              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            {isOverdue && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-500 uppercase mt-0.5 tracking-wider">
                                <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">No due date</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition"
                          title="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminTaskModal 
        isOpen={isAssignOpen}
        onClose={() => {
          setIsAssignOpen(false);
          fetchData();
        }}
      />
    </div>
  );
}

export default function AdminTasksPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    }>
      <AdminTasksInner />
    </Suspense>
  );
}
