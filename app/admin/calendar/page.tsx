"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Trash2, 
  Plus, 
  User, 
  Check, 
  RefreshCw,
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
  role: string;
}

interface Creator {
  id: string;
  name: string;
  username: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function broadcastTaskUpdate() {
  try {
    const bc = new BroadcastChannel("wecollab-updates");
    bc.postMessage({ type: "TASK_UPDATE", timestamp: Date.now() });
    bc.close();
  } catch (_) {}
}

function AdminCalendarInner() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState("");

  // Calendar Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Filters
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
      console.error("[ADMIN_CALENDAR_FETCH]", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Cross-tab updates listener
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
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const res = await fetch(`/api/admin/employee-tasks?id=${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      broadcastTaskUpdate();
    } catch {
      fetchData();
    }
  };

  // Calendar Helper Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonthDate = new Date(year, month - 1, d);
    const dateStr = prevMonthDate.toLocaleDateString("sv-SE");
    cells.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currentMonthDate = new Date(year, month, d);
    const dateStr = currentMonthDate.toLocaleDateString("sv-SE");
    cells.push({ dateStr, dayNum: d, isCurrentMonth: true });
  }

  // Next month padding (pad grid to multiple of 7, i.e., 42 cells)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextMonthDate = new Date(year, month + 1, d);
    const dateStr = nextMonthDate.toLocaleDateString("sv-SE");
    cells.push({ dateStr, dayNum: d, isCurrentMonth: false });
  }

  // Apply Employee Filter to tasks
  const filteredTasks = tasks.filter(task => {
    return employeeFilter === "all" || task.employee_id === employeeFilter;
  });

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toLocaleDateString("sv-SE"));
  };

  const todayStr = new Date().toLocaleDateString("sv-SE");
  const selectedDateTasks = filteredTasks.filter(t => t.due_date === selectedDateStr);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Calendar Schedule</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">
            Map out tasks and track timelines visually across the team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="Refresh database"
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition active:scale-95 shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setPrefilledDate(selectedDateStr);
              setIsAssignOpen(true);
            }}
            className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold shadow-sm shadow-indigo-200 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4.5 w-4.5" /> Assign Task
          </button>
        </div>
      </div>

      {/* Filter and Month Navigation Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-slate-900 min-w-[160px]">
            {MONTHS[month]} {year}
          </h2>
          <div className="flex items-center border border-slate-200 rounded-xl bg-white p-0.5 shadow-sm shrink-0">
            <button
              onClick={handlePrevMonth}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleGoToday}
              className="px-3 h-8 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition-colors border-x border-slate-100 cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Employee Filter */}
        <div className="w-full sm:w-auto">
          <select
            value={employeeFilter}
            onChange={e => setEmployeeFilter(e.target.value)}
            className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-[14px] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm w-full sm:w-[220px]"
          >
            <option value="all">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid + Details Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col">
          {/* Weekday labels */}
          <div className="grid grid-cols-7 text-center mb-3">
            {WEEKDAYS.map(day => (
              <div key={day} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 border-t border-l border-slate-100 rounded-lg overflow-hidden bg-slate-50/50">
            {cells.map((cell, idx) => {
              const dayTasks = filteredTasks.filter(t => t.due_date === cell.dateStr);
              const isSelected = selectedDateStr === cell.dateStr;
              const isToday = todayStr === cell.dateStr;

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[100px] bg-white border-r border-b border-slate-100 p-2.5 flex flex-col gap-1 transition-all cursor-pointer select-none relative group hover:bg-slate-50/60 ${
                    isSelected ? "ring-2 ring-indigo-500 ring-inset z-10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span 
                      className={`text-[12px] font-extrabold ${
                        !cell.isCurrentMonth 
                          ? "text-slate-300" 
                          : isToday 
                            ? "bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-black" 
                            : "text-slate-700"
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full shrink-0">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Tasks Preview List inside cell */}
                  <div className="flex flex-col gap-1 mt-1 overflow-hidden flex-1 max-h-[64px]">
                    {dayTasks.slice(0, 2).map(task => {
                      const isComp = !!task.completed_at;
                      return (
                        <div
                          key={task.id}
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded truncate ${
                            isComp
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100/60 line-through"
                              : "bg-slate-150 text-slate-700 border border-slate-200/50"
                          }`}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-400 pl-1">
                        + {dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Day Details Panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4 min-h-[300px]">
          <div>
            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">
              Selected Date
            </span>
            <h3 className="text-base font-bold text-slate-800 mt-1">
              {new Date(selectedDateStr + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric"
              })}
            </h3>
          </div>

          <hr className="border-slate-100" />

          {/* List of Tasks Due */}
          <div className="flex-1 flex flex-col gap-3">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tasks Due ({selectedDateTasks.length})</span>
            </h4>

            {isLoading ? (
              <div className="py-6 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              </div>
            ) : selectedDateTasks.length === 0 ? (
              <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl bg-slate-50/40 p-4">
                <Clock className="h-6 w-6 text-slate-300 mb-2" />
                <p className="text-[12px] font-bold text-slate-500">No Tasks Due</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Nothing scheduled on this day.</p>
                <button
                  onClick={() => {
                    setPrefilledDate(selectedDateStr);
                    setIsAssignOpen(true);
                  }}
                  className="mt-3 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  + Quick Assign
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[350px] pr-1">
                {selectedDateTasks.map(task => {
                  const emp = employees.find(e => e.id === task.employee_id);
                  const creator = creators.find(c => c.id === task.creator_id);
                  const isCompleted = !!task.completed_at;

                  return (
                    <div 
                      key={task.id} 
                      className={`p-3 rounded-xl border flex flex-col gap-2.5 transition ${
                        isCompleted 
                          ? "bg-emerald-50/30 border-emerald-100" 
                          : "bg-slate-50/50 border-slate-200/60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => handleToggleCompletion(task)}
                          className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                            isCompleted 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "border-slate-300 hover:border-indigo-500 hover:bg-white bg-white"
                          }`}
                        >
                          {isCompleted && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                        </button>
                        <span className={`text-[12px] font-semibold text-slate-800 leading-snug flex-1 ${
                          isCompleted ? "line-through text-slate-400" : ""
                        }`}>
                          {task.title}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1 pl-6.5 text-[11px] font-medium text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 shrink-0" />
                          <strong className="text-slate-600 font-semibold">{emp?.full_name || "—"}</strong>
                        </span>
                        {creator && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded max-w-fit mt-0.5 font-bold">
                            @{creator.username}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end gap-1 border-t border-slate-100/60 pt-2">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-7 w-7 rounded-lg hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-slate-400 transition cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
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

export default function AdminCalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    }>
      <AdminCalendarInner />
    </Suspense>
  );
}
