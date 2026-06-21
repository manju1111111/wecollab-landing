"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Check, Clock, Trash2, LayoutGrid, ListTodo, AlertTriangle, CheckCircle2, GripVertical } from "lucide-react";
import { addTask, completeTask, deleteTask, updateTask } from "@/app/employee/task-actions";

function broadcastTaskUpdate() {
  try {
    const bc = new BroadcastChannel("wecollab-updates");
    bc.postMessage({ type: "TASK_UPDATE", timestamp: Date.now() });
    bc.close();
  } catch (_) {}
}

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  creator_name?: string;
}

interface TaskFeedProps {
  tasks: Task[];
  employeeId: string;
  creators: { id: string; name: string }[];
}

function isOverdue(due: string | null) {
  if (!due) return false;
  return new Date(due) < new Date(new Date().toDateString());
}

function dueLabel(due: string | null) {
  if (!due) return null;
  const d = new Date(due);
  const today = new Date(new Date().toDateString());
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due in ${diff}d`;
}

type ColumnId = "todo" | "overdue" | "completed";

export function TaskFeed({ tasks: initialTasks, employeeId, creators }: TaskFeedProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newCreator, setNewCreator] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // View states
  const [view, setView] = useState<"list" | "board">("list");
  const [filter, setFilter] = useState<"pending" | "done">("pending");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<ColumnId | null>(null);

  // Sync tasks when initialTasks updates
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const pending = tasks.filter(t => !t.completed_at);
  const done = tasks.filter(t => t.completed_at);
  
  // List view shown tasks
  const shown = filter === "pending" ? pending : done;

  // Board columns
  const todoTasks = tasks.filter(t => !t.completed_at && !isOverdue(t.due_date));
  const overdueTasks = tasks.filter(t => !t.completed_at && isOverdue(t.due_date));
  const completedTasks = tasks.filter(t => !!t.completed_at);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const creator = creators.find(c => c.id === newCreator);
    const optimistic: Task = {
      id: `tmp-${Date.now()}`,
      title: newTitle,
      due_date: newDue || null,
      completed_at: null,
      creator_name: creator?.name,
    };
    setTasks(prev => [optimistic, ...prev]);
    setNewTitle(""); setNewDue(""); setNewCreator(""); setShowForm(false);

    startTransition(async () => {
      const result = await addTask({ employeeId, title: optimistic.title, dueDate: optimistic.due_date, creatorId: newCreator || null });
      if (result.task) {
        setTasks(prev => prev.map(t => t.id === optimistic.id ? { ...result.task, creator_name: creator?.name } : t));
      }
      broadcastTaskUpdate();
    });
  };

  const handleComplete = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed_at: new Date().toISOString() } : t));
    startTransition(async () => { await completeTask(id); broadcastTaskUpdate(); });
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    startTransition(async () => { await deleteTask(id); broadcastTaskUpdate(); });
  };

  const handleMoveTask = (taskId: string, targetCol: ColumnId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let updatedCompletedAt: string | null = task.completed_at;
    let updatedDueDate: string | null = task.due_date;

    if (targetCol === "completed") {
      if (task.completed_at) return; // already done
      updatedCompletedAt = new Date().toISOString();
      
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed_at: updatedCompletedAt } : t));
      startTransition(async () => {
        await completeTask(taskId);
        broadcastTaskUpdate();
      });
      return;
    }

    // Moving back to incomplete columns
    updatedCompletedAt = null;
    const todayStr = new Date().toISOString().split("T")[0];

    if (targetCol === "todo") {
      // If currently overdue or no future date, set to today
      if (isOverdue(task.due_date)) {
        updatedDueDate = todayStr;
      }
    } else if (targetCol === "overdue") {
      // Set to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      updatedDueDate = yesterday.toISOString().split("T")[0];
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed_at: updatedCompletedAt, due_date: updatedDueDate } : t));
    startTransition(async () => {
      await updateTask(taskId, { completed_at: updatedCompletedAt, due_date: updatedDueDate });
      broadcastTaskUpdate();
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight">My Tasks</h3>
          {pending.length > 0 && (
            <span className="bg-primary-soft/80 border border-primary/10 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {pending.length} pending
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* List vs Board Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-0.5 text-[11px] font-extrabold">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                view === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ListTodo className="h-3.5 w-3.5" />
              List
            </button>
            <button
              onClick={() => setView("board")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                view === "board" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Board
            </button>
          </div>

          {/* List-only Pending vs Done Filter */}
          {view === "list" && (
            <div className="flex bg-slate-100 rounded-xl p-0.5 text-[11px] font-extrabold">
              <button
                onClick={() => setFilter("pending")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filter === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter("done")}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  filter === "done" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Done ({done.length})
              </button>
            </div>
          )}

          {/* Quick Create Button */}
          <button
            onClick={() => setShowForm(v => !v)}
            className="h-8 w-8 rounded-lg bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="px-6 py-5 bg-primary-soft/30 border-b border-primary/10">
          <div className="flex flex-col gap-3">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="What needs to be done?"
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full"
              autoFocus
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={newDue}
                onChange={e => setNewDue(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1"
              />
              <select
                value={newCreator}
                onChange={e => setNewCreator(e.target.value)}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 flex-1"
              >
                <option value="">No creator link</option>
                {creators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={handleAdd} className="h-9 px-5 bg-primary hover:bg-primary-hover text-white text-[12px] font-black rounded-xl transition shadow-sm cursor-pointer">
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {view === "list" ? (
        // --- Classical List View ---
        <div className="divide-y divide-slate-50">
          {shown.length === 0 ? (
            <div className="py-16 text-center">
              <Check className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-[13px] text-slate-400 font-bold">
                {filter === "pending" ? "No pending tasks — all caught up! 🎉" : "No completed tasks yet."}
              </p>
            </div>
          ) : (
            shown.map(task => {
              const overdue = isOverdue(task.due_date) && !task.completed_at;
              const label = dueLabel(task.due_date);
              return (
                <div key={task.id} className="flex items-start gap-4 px-6 py-4 group hover:bg-slate-50/50 transition duration-150">
                  {/* Custom Checkbox */}
                  <button
                    onClick={() => !task.completed_at && handleComplete(task.id)}
                    className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition cursor-pointer ${
                      task.completed_at
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-300 hover:border-primary"
                    }`}
                  >
                    {task.completed_at && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </button>

                  {/* Body Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-bold ${task.completed_at ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2.5 mt-1 flex-wrap">
                      {task.creator_name && (
                        <span className="text-[10px] bg-primary-soft text-primary font-black px-2 py-0.5 rounded border border-primary/5">
                          @{task.creator_name}
                        </span>
                      )}
                      {label && (
                        <span className={`text-[11px] font-extrabold flex items-center gap-1 ${overdue ? "text-rose-500 animate-pulse" : "text-slate-400"}`}>
                          <Clock className="h-3 w-3" />
                          {label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition h-8 w-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-rose-400 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : (
        // --- Premium Drag & Drop Kanban Board ---
        <div className="p-5 bg-slate-50/40 border-t border-slate-100 overflow-x-auto">
          <div className="flex gap-4 min-w-[700px] items-stretch">
            
            {/* Column 1: To Do / Future */}
            <div
              onDragOver={e => { e.preventDefault(); if (activeDropCol !== "todo") setActiveDropCol("todo"); }}
              onDragLeave={() => setActiveDropCol(null)}
              onDrop={e => {
                e.preventDefault();
                const tid = e.dataTransfer.getData("text/plain") || draggedId;
                if (tid) handleMoveTask(tid, "todo");
                setActiveDropCol(null);
                setDraggedId(null);
              }}
              className={`flex-1 rounded-2xl border p-4 transition-all duration-300 flex flex-col ${
                activeDropCol === "todo"
                  ? "ring-2 ring-primary border-primary bg-primary-soft/10 scale-[1.01]"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-[12px] font-black text-slate-800 uppercase tracking-wider">To Do</span>
                </div>
                <span className="text-[10px] font-black bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 border border-slate-150 shadow-sm">
                  {todoTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 min-h-[300px]">
                {todoTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() => setDraggedId(task.id)}
                    onDragEnd={() => { setDraggedId(null); setActiveDropCol(null); }}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                  />
                ))}
                {todoTasks.length === 0 && <EmptyColumnState label="No pending tasks" desc="Drag tasks here" />}
              </div>
            </div>

            {/* Column 2: Overdue */}
            <div
              onDragOver={e => { e.preventDefault(); if (activeDropCol !== "overdue") setActiveDropCol("overdue"); }}
              onDragLeave={() => setActiveDropCol(null)}
              onDrop={e => {
                e.preventDefault();
                const tid = e.dataTransfer.getData("text/plain") || draggedId;
                if (tid) handleMoveTask(tid, "overdue");
                setActiveDropCol(null);
                setDraggedId(null);
              }}
              className={`flex-1 rounded-2xl border p-4 transition-all duration-300 flex flex-col ${
                activeDropCol === "overdue"
                  ? "ring-2 ring-rose-500 border-rose-500 bg-rose-50/10 scale-[1.01]"
                  : "bg-rose-50/10 border-rose-100"
              }`}
            >
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-rose-200/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
                  <span className="text-[12px] font-black text-rose-600 uppercase tracking-wider">Overdue</span>
                </div>
                <span className="text-[10px] font-black bg-rose-100 text-rose-600 rounded-full px-2 py-0.5 border border-rose-200/20 shadow-sm">
                  {overdueTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 min-h-[300px]">
                {overdueTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() => setDraggedId(task.id)}
                    onDragEnd={() => { setDraggedId(null); setActiveDropCol(null); }}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    isOverdueColumn
                  />
                ))}
                {overdueTasks.length === 0 && <EmptyColumnState label="All caught up" desc="No overdue items" isClean />}
              </div>
            </div>

            {/* Column 3: Completed */}
            <div
              onDragOver={e => { e.preventDefault(); if (activeDropCol !== "completed") setActiveDropCol("completed"); }}
              onDragLeave={() => setActiveDropCol(null)}
              onDrop={e => {
                e.preventDefault();
                const tid = e.dataTransfer.getData("text/plain") || draggedId;
                if (tid) handleMoveTask(tid, "completed");
                setActiveDropCol(null);
                setDraggedId(null);
              }}
              className={`flex-1 rounded-2xl border p-4 transition-all duration-300 flex flex-col ${
                activeDropCol === "completed"
                  ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/10 scale-[1.01]"
                  : "bg-emerald-50/10 border-emerald-100"
              }`}
            >
              <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-emerald-200/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                  <span className="text-[12px] font-black text-emerald-700 uppercase tracking-wider">Completed</span>
                </div>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 border border-emerald-200/20 shadow-sm">
                  {completedTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 min-h-[300px]">
                {completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() => setDraggedId(task.id)}
                    onDragEnd={() => { setDraggedId(null); setActiveDropCol(null); }}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                  />
                ))}
                {completedTasks.length === 0 && <EmptyColumnState label="Task bin empty" desc="Drag tasks here to close" />}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

/* Subcomponents for cleaner modular rendering */

function TaskCard({
  task,
  onDragStart,
  onDragEnd,
  onComplete,
  onDelete,
  isOverdueColumn = false,
}: {
  task: Task;
  onDragStart: () => void;
  onDragEnd: () => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isOverdueColumn?: boolean;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    onDragStart();
  };

  const label = dueLabel(task.due_date);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing select-none relative group ${
        task.completed_at
          ? "border-slate-200/60 opacity-70"
          : isOverdueColumn
          ? "border-rose-200 hover:border-rose-350"
          : "border-slate-200 hover:border-slate-350"
      }`}
    >
      <div className="flex items-start gap-2.5 mb-2.5">
        {!task.completed_at && (
          <button
            onClick={() => onComplete(task.id)}
            className="mt-0.5 h-4.5 w-4.5 rounded-full border border-slate-300 hover:border-primary flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Check className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 text-primary transition" strokeWidth={3} />
          </button>
        )}
        <p className={`text-[12.5px] font-bold text-slate-800 leading-snug break-words pr-5 ${task.completed_at ? "line-through text-slate-400" : ""}`}>
          {task.title}
        </p>

        {/* Drag Indicator handle */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2.5 top-3.5 text-slate-400">
          <GripVertical className="h-3.5 w-3.5 shrink-0" />
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.creator_name && (
            <span className="text-[9px] bg-primary-soft text-primary font-black px-1.5 py-0.5 rounded border border-primary/5">
              @{task.creator_name}
            </span>
          )}
          {label && !task.completed_at && (
            <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${isOverdueColumn ? "text-rose-500 animate-pulse" : "text-slate-400"}`}>
              <Clock className="h-2.5 w-2.5" />
              {label}
            </span>
          )}
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 transition h-6 w-6 rounded-md hover:bg-rose-50 flex items-center justify-center text-rose-400 cursor-pointer shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function EmptyColumnState({ label, desc, isClean = false }: { label: string; desc: string; isClean?: boolean }) {
  return (
    <div className={`h-40 border border-dashed rounded-xl flex flex-col items-center justify-center text-center p-3 select-none ${
      isClean ? "border-emerald-200/60 bg-emerald-50/5" : "border-slate-200/60 bg-slate-50/20"
    }`}>
      <p className={`text-[10.5px] font-black uppercase tracking-wider ${isClean ? "text-emerald-600" : "text-slate-400"}`}>
        {label}
      </p>
      <p className="text-[9px] text-slate-350 mt-1 max-w-[120px] leading-tight">
        {desc}
      </p>
    </div>
  );
}
