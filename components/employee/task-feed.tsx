"use client";

import { useState, useTransition, useEffect } from "react";
import { 
  Plus, Check, Clock, Trash2, LayoutGrid, ListTodo, AlertTriangle, 
  CheckCircle2, GripVertical, Search, Filter, ArrowUpDown, HelpCircle, 
  ChevronRight, RefreshCw, Upload, Clipboard, TrendingUp, Lightbulb, 
  FileSpreadsheet, Sparkles, X, Calendar, BookOpen, ChevronDown, CheckCircle
} from "lucide-react";
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
  creator_id?: string | null;
  created_at?: string;
}

interface TaskFeedProps {
  tasks: Task[];
  employeeId: string;
  creators: { id: string; name: string }[];
}

type TaskStatus = "pending" | "in_progress" | "review" | "completed";

// Custom helper to parse status and clean title
function parseTaskStatusAndTitle(title: string, completedAt: string | null): { status: TaskStatus; cleanTitle: string } {
  if (completedAt) {
    return { status: "completed", cleanTitle: cleanTitleString(title) };
  }
  if (title.startsWith("[In Progress] ")) {
    return { status: "in_progress", cleanTitle: title.substring(14) };
  }
  if (title.startsWith("[Review] ")) {
    return { status: "review", cleanTitle: title.substring(9) };
  }
  return { status: "pending", cleanTitle: title };
}

function cleanTitleString(title: string): string {
  return title
    .replace(/^\[In Progress\]\s*/, "")
    .replace(/^\[Review\]\s*/, "");
}

function buildTitleWithStatus(cleanTitle: string, status: TaskStatus): string {
  if (status === "in_progress") return `[In Progress] ${cleanTitle}`;
  if (status === "review") return `[Review] ${cleanTitle}`;
  return cleanTitle;
}

function isOverdue(due: string | null, completed: string | null) {
  if (!due || completed) return false;
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

interface ActivityLog {
  id: string;
  action: string;
  timeLabel: string;
  type: "create" | "complete" | "move" | "delete";
}

export function TaskFeed({ tasks: initialTasks, employeeId, creators }: TaskFeedProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();

  // Modals & form state
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  
  // New task form fields
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newCreator, setNewCreator] = useState("");
  const [newStatus, setNewStatus] = useState<TaskStatus>("pending");

  // Filter/Sort State (Unified Attio-style layout controls)
  const [view, setView] = useState<"list" | "board">("list");
  const [activeTab, setActiveTab] = useState<"all" | TaskStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"due" | "created" | "title">("due");
  const [filterCreator, setFilterCreator] = useState<string>("all");
  const [filterOverdue, setFilterOverdue] = useState<boolean>(false);

  // Drag & drop state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<TaskStatus | null>(null);

  // Linear-style session logs
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Sync initial tasks
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Activity logs pre-population
  useEffect(() => {
    const initialLogs: ActivityLog[] = [
      { id: "act-1", action: "Accessed workspace dashboard", timeLabel: "10:32 AM", type: "create" }
    ];
    
    const completed = initialTasks.filter(t => t.completed_at).slice(0, 2);
    completed.forEach((t, i) => {
      const { cleanTitle } = parseTaskStatusAndTitle(t.title, t.completed_at);
      initialLogs.push({
        id: `act-comp-${i}`,
        action: `Completed task: "${cleanTitle}"`,
        timeLabel: i === 0 ? "11:15 AM" : "Yesterday",
        type: "complete"
      });
    });

    if (initialLogs.length < 3) {
      initialLogs.push(
        { id: "act-m-1", action: "Completed review stage checklist", timeLabel: "Yesterday", type: "complete" },
        { id: "act-m-2", action: "Updated contract verification status notes", timeLabel: "Yesterday", type: "move" }
      );
    }

    setActivities(initialLogs);
  }, [initialTasks]);

  const logActivity = (action: string, type: "create" | "complete" | "move" | "delete") => {
    const time = new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const newLog: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      timeLabel: time,
      type
    };
    setActivities(prev => [newLog, ...prev]);
  };

  // Task Operations
  const handleAddTask = (title: string, dueDate: string | null, status: TaskStatus, creatorId: string | null) => {
    if (!title.trim()) return;

    const clean = cleanTitleString(title);
    const finalTitle = buildTitleWithStatus(clean, status);
    const creator = creators.find(c => c.id === creatorId);
    
    const optimistic: Task = {
      id: `tmp-${Date.now()}`,
      title: finalTitle,
      due_date: dueDate || null,
      completed_at: status === "completed" ? new Date().toISOString() : null,
      creator_name: creator?.name,
      creator_id: creatorId,
      created_at: new Date().toISOString()
    };

    setTasks(prev => [optimistic, ...prev]);
    logActivity(`Created task: "${clean}"`, "create");

    startTransition(async () => {
      const result = await addTask({ 
        employeeId, 
        title: optimistic.title, 
        dueDate: optimistic.due_date, 
        creatorId: creatorId 
      });

      if (result.task) {
        if (status === "completed") {
          await completeTask(result.task.id);
        }
        setTasks(prev => prev.map(t => t.id === optimistic.id ? { ...result.task, creator_name: creator?.name } : t));
      }
      broadcastTaskUpdate();
    });
  };

  const handleCreateTaskForm = () => {
    handleAddTask(newTitle, newDue || null, newStatus, newCreator || null);
    setNewTitle("");
    setNewDue("");
    setNewCreator("");
    setNewStatus("pending");
    setShowNewTaskModal(false);
  };

  const handleUpdateStatus = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const { cleanTitle } = parseTaskStatusAndTitle(task.title, task.completed_at);
    const updatedTitle = buildTitleWithStatus(cleanTitle, newStatus);
    const isNowCompleted = newStatus === "completed";
    const completedAtVal = isNowCompleted ? new Date().toISOString() : null;

    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === taskId ? { 
      ...t, 
      title: updatedTitle, 
      completed_at: completedAtVal 
    } : t));

    logActivity(`Moved "${cleanTitle}" to ${newStatus === "pending" ? "To Do" : newStatus === "in_progress" ? "In Progress" : newStatus === "review" ? "In Review" : "Completed"}`, "move");

    startTransition(async () => {
      if (newStatus === "completed") {
        await completeTask(taskId);
      } else {
        await updateTask(taskId, { 
          completed_at: null, 
          title: updatedTitle 
        });
      }
      broadcastTaskUpdate();
    });
  };

  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.completed_at) {
      handleUpdateStatus(taskId, "pending");
    } else {
      handleUpdateStatus(taskId, "completed");
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const { cleanTitle } = parseTaskStatusAndTitle(task.title, task.completed_at);

    setTasks(prev => prev.filter(t => t.id !== taskId));
    logActivity(`Deleted task: "${cleanTitle}"`, "delete");

    startTransition(async () => {
      await deleteTask(taskId);
      broadcastTaskUpdate();
    });
  };

  const handleImportTemplate = (templateName: string) => {
    let templates: { title: string; dueDaysOut: number; status: TaskStatus }[] = [];
    if (templateName === "onboarding") {
      templates = [
        { title: "Review employee handbook & team norms", dueDaysOut: 2, status: "pending" },
        { title: "Setup workspace & configure profiles", dueDaysOut: 0, status: "in_progress" },
        { title: "Schedule onboarding 1-on-1 with manager", dueDaysOut: 1, status: "pending" }
      ];
    } else if (templateName === "campaign") {
      templates = [
        { title: "Draft campaign brief for YouTube sponsorship", dueDaysOut: 1, status: "pending" },
        { title: "Finalize pricing agreement with creators", dueDaysOut: 3, status: "in_progress" },
        { title: "Approve campaign video draft edits", dueDaysOut: 5, status: "review" }
      ];
    } else if (templateName === "operations") {
      templates = [
        { title: "Update employee pipeline statuses in CRM", dueDaysOut: 0, status: "pending" },
        { title: "Review weekly newsletter drafts", dueDaysOut: 4, status: "pending" },
        { title: "Verify pending collaboration contracts", dueDaysOut: 2, status: "review" }
      ];
    }

    templates.forEach(t => {
      const d = new Date();
      d.setDate(d.getDate() + t.dueDaysOut);
      const dueStr = d.toISOString().split("T")[0];
      handleAddTask(t.title, dueStr, t.status, null);
    });

    setShowImportModal(false);
  };

  // Calculations & Analytics
  const parsedTasks = tasks.map(t => {
    const { status, cleanTitle } = parseTaskStatusAndTitle(t.title, t.completed_at);
    return {
      ...t,
      status,
      cleanTitle
    };
  });

  const totalTasksCount = parsedTasks.length;
  const pendingCount = parsedTasks.filter(t => t.status === "pending").length;
  const inProgressCount = parsedTasks.filter(t => t.status === "in_progress").length;
  const reviewCount = parsedTasks.filter(t => t.status === "review").length;
  const completedCount = parsedTasks.filter(t => t.status === "completed").length;

  const incompleteCount = totalTasksCount - completedCount;
  const overdueCount = parsedTasks.filter(t => isOverdue(t.due_date, t.completed_at)).length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  // Filtering & Sorting
  const filteredTasks = parsedTasks.filter(t => {
    if (activeTab !== "all" && t.status !== activeTab) return false;
    const matchesSearch = t.cleanTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.creator_name && t.creator_name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterCreator !== "all" && t.creator_id !== filterCreator) return false;
    if (filterOverdue && !isOverdue(t.due_date, t.completed_at)) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortKey === "due") {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (sortKey === "created") {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    }
    return a.cleanTitle.localeCompare(b.cleanTitle);
  });

  const upcomingDeadlines = parsedTasks
    .filter(t => t.status !== "completed" && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 4);

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (activeDropCol !== status) {
      setActiveDropCol(status);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedId;
    if (taskId) {
      handleUpdateStatus(taskId, targetStatus);
    }
    setActiveDropCol(null);
    setDraggedId(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* ── Breadcrumb & Top Page Header (Muted Workspace, Bold My Tasks) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <div className="text-[12.5px] text-slate-400 font-medium flex items-center gap-1 mb-1.5 select-none">
            <span>Workspace</span>
            <span className="text-slate-300 font-normal">/</span>
            <span className="text-slate-900 font-bold tracking-tight">My Tasks</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Tasks</h1>
          <p className="text-slate-500 text-[13px] font-medium mt-0.5">
            Stay on track and get things done.
          </p>
        </div>

        {/* Top-Right Actions (Consistent 44px Height, Premium Visual Weight) */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 h-11 px-4.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[12.5px] font-bold shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition duration-150 cursor-pointer active:scale-98"
          >
            <Upload className="h-4 w-4 text-slate-400" />
            Import Tasks
          </button>
          <button 
            onClick={() => setShowNewTaskModal(true)}
            className="inline-flex items-center gap-2 h-11 px-5.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[12.5px] font-black shadow-[0_4px_12px_rgba(124,58,237,0.15)] hover:shadow-[0_4px_16px_rgba(124,58,237,0.25)] transition duration-200 cursor-pointer active:scale-98"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* ── KPI SECTION (Stripe Analytics Style with hover lift, secondary micro-text) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {[
          { 
            label: "Pending Tasks", 
            value: pendingCount + inProgressCount + reviewCount, 
            desc: pendingCount + inProgressCount + reviewCount === 0 ? "No active assignments" : `${pendingCount + inProgressCount + reviewCount} active assignments`, 
            icon: Clipboard, 
            color: "text-purple-600 bg-purple-50/50 border-purple-100/60" 
          },
          { 
            label: "Completed Tasks", 
            value: completedCount, 
            desc: completedCount === 0 ? "Nothing completed yet" : `${completedCount} tasks completed`, 
            icon: CheckCircle2, 
            color: "text-emerald-600 bg-emerald-50/50 border-emerald-100/60" 
          },
          { 
            label: "Overdue Tasks", 
            value: overdueCount, 
            desc: overdueCount === 0 ? "No overdue work" : `${overdueCount} past due tasks`, 
            icon: Clock, 
            color: "text-rose-600 bg-rose-50/50 border-rose-100/60" 
          },
          { 
            label: "Completion Rate", 
            value: `${completionRate}%`, 
            desc: totalTasksCount === 0 ? "Awaiting first task" : "Keep it up!", 
            icon: TrendingUp, 
            color: "text-blue-600 bg-blue-50/50 border-blue-100/60" 
          },
        ].map((card, idx) => (
          <div 
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-start justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:-translate-y-0.5 hover:shadow-md hover:border-slate-350 transition-all duration-200 group cursor-default"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
              <span className="text-3xl font-black text-slate-900 tracking-tight mt-1 transition-colors duration-150 group-hover:text-purple-600">{card.value}</span>
              <span className="text-[10.5px] text-slate-400 font-bold mt-1.5">{card.desc}</span>
            </div>
            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${card.color} shrink-0`}>
              <card.icon className="h-4.5 w-4.5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN WORKSPACE GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        
        {/* Left Workspace Panel: controls, tabs, feeds (cols 1-8) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Unified Attio CRM-Style Flat Toolbar (Single Baseline) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
            
            {/* Left side: search tasks & filters */}
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {/* Search Tasks */}
              <div className="relative flex-1 min-w-[160px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full h-9 pl-9 pr-3 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-[12.5px] focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 transition"
                />
              </div>

              {/* Creator filter select */}
              <div className="relative">
                <select
                  value={filterCreator}
                  onChange={(e) => setFilterCreator(e.target.value)}
                  className="h-9 pl-3 pr-8 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-650 outline-none transition appearance-none cursor-pointer"
                >
                  <option value="all">📁 All Creators</option>
                  {creators.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Overdue filter */}
              <button
                onClick={() => setFilterOverdue(!filterOverdue)}
                className={`h-9 px-3 border rounded-xl flex items-center justify-center gap-1 text-[12px] font-bold transition cursor-pointer ${
                  filterOverdue 
                    ? "bg-rose-50 border-rose-200 text-rose-600" 
                    : "bg-slate-50 hover:bg-slate-100/60 border-slate-200 text-slate-500"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Overdue Only</span>
              </button>
            </div>

            {/* Right side: Sorting & list/board toggle */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Sort Selector */}
              <div className="relative">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as any)}
                  className="h-9 pl-3 pr-8 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-650 outline-none transition appearance-none cursor-pointer"
                >
                  <option value="due">📅 Sort: Due Date</option>
                  <option value="created">🕒 Sort: Created</option>
                  <option value="title">🔤 Sort: Alphabetical</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              <div className="h-5 w-px bg-slate-200 mx-1" />

              {/* Toggle controls */}
              <div className="bg-slate-100 p-0.5 rounded-xl flex items-center">
                <button
                  onClick={() => setView("list")}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                    view === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <ListTodo className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setView("board")}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
                    view === "board" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Task Status Tabs (Linear-style animations) */}
          <div className="relative flex border-b border-slate-200 overflow-x-auto pb-px gap-6 scrollbar-none select-none">
            {[
              { id: "all", label: "All", count: totalTasksCount, color: "border-purple-600 text-purple-600" },
              { id: "pending", label: "To Do", count: pendingCount, color: "border-slate-500 text-slate-700" },
              { id: "in_progress", label: "In Progress", count: inProgressCount, color: "border-purple-600 text-purple-600" },
              { id: "review", label: "In Review", count: reviewCount, color: "border-amber-500 text-amber-700" },
              { id: "completed", label: "Completed", count: completedCount, color: "border-emerald-600 text-emerald-700" },
            ].map(tab => {
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative py-3.5 text-[12.5px] font-extrabold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer -mb-px ${
                    isTabActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                  <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-full transition-colors ${
                    isTabActive 
                      ? tab.id === "all" 
                        ? "bg-purple-50 text-purple-700 border border-purple-100" 
                        : `bg-${tab.color.split("-")[1]}-50 text-${tab.color.split("-")[1]}-700 border border-${tab.color.split("-")[1]}-100`
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {tab.count}
                  </span>
                  
                  {/* Sliding Indicator bar (Active State Underline) */}
                  {isTabActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full animate-in fade-in zoom-in-y duration-150" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── TASK LIST & KANBAN VIEWS ── */}
          {sortedTasks.length === 0 ? (
            // --- Redesigned Empty State (Reduced by 25%) ---
            <div className="bg-white rounded-2xl border border-slate-200/80 p-9 text-center shadow-[0_1px_3px_rgba(0,0,0,0.01)] flex flex-col items-center justify-center max-w-xl mx-auto my-4 transition duration-200">
              <div className="relative w-36 h-36 mb-4 flex items-center justify-center select-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/30 to-indigo-50/20 rounded-full blur-xl animate-pulse duration-4000" />
                <svg className="w-28 h-28 relative z-10 text-purple-400/70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M70 25H30C25 25 21 29 21 34V70C21 75 25 79 30 79H70C75 79 79 75 79 70V34C79 29 75 25 70 25Z" fill="white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M36 48L46 58L64 40" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="25" cy="35" r="2.5" fill="#C084FC" className="animate-bounce" />
                  <circle cx="75" cy="65" r="3.5" fill="#818CF8" />
                </svg>
              </div>

              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">You're all caught up 🎉</h3>
              <p className="text-slate-400 text-[12px] font-semibold max-w-xs mx-auto mb-5 leading-normal">
                No pending tasks assigned. <br />Create a task or wait for new assignments.
              </p>
              
              <div className="flex items-center justify-center gap-2.5">
                <button 
                  onClick={() => setShowNewTaskModal(true)}
                  className="h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white text-[11.5px] font-black rounded-xl shadow-sm transition duration-150 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Task
                </button>
                <button 
                  onClick={() => setActiveTab("completed")}
                  className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11.5px] font-bold rounded-xl transition duration-150 cursor-pointer"
                >
                  View Completed
                </button>
              </div>
            </div>
          ) : view === "list" ? (
            // --- Premium Notion-Style Table ---
            <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 font-bold text-slate-400 text-[10.5px] uppercase tracking-widest select-none">
                    <th className="w-12 px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5">Task Description</th>
                    <th className="px-4 py-3.5">Creator Link</th>
                    <th className="px-4 py-3.5">Due Date</th>
                    <th className="px-4 py-3.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedTasks.map(task => {
                    const taskOverdue = isOverdue(task.due_date, task.completed_at);
                    const label = dueLabel(task.due_date);
                    
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/30 group transition duration-150">
                        {/* Checkbox Column */}
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleComplete(task.id)}
                            className={`h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center mx-auto transition cursor-pointer ${
                              task.completed_at
                                ? "bg-emerald-500 border-emerald-500"
                                : "border-slate-300 hover:border-purple-500"
                            }`}
                          >
                            {task.completed_at && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                          </button>
                        </td>

                        {/* Title & Badge */}
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-[13px] leading-snug break-words ${
                              task.completed_at ? "line-through text-slate-400 font-medium" : "text-slate-800"
                            }`}>
                              {task.cleanTitle}
                            </span>
                            
                            {!task.completed_at && task.status !== "pending" && (
                              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shadow-sm ${
                                task.status === "in_progress" 
                                  ? "bg-purple-50 text-purple-600 border-purple-100/80" 
                                  : "bg-amber-50 text-amber-600 border-amber-100/80"
                              }`}>
                                {task.status === "in_progress" ? "In Progress" : "In Review"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Linked Creator */}
                        <td className="px-4 py-2.5">
                          {task.creator_name ? (
                            <span className="inline-flex items-center text-[9.5px] bg-purple-50/60 text-purple-700 font-black px-1.5 py-0.5 rounded border border-purple-100/50 uppercase tracking-wider">
                              @{task.creator_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold text-[11px]">—</span>
                          )}
                        </td>

                        {/* Due Date */}
                        <td className="px-4 py-2.5">
                          {label ? (
                            <span className={`text-[10.5px] font-extrabold flex items-center gap-1.5 ${
                              task.completed_at 
                                ? "text-slate-400"
                                : taskOverdue 
                                  ? "text-rose-500 animate-pulse" 
                                  : "text-slate-500"
                            }`}>
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              {label}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-semibold text-[11px]">No date</span>
                          )}
                        </td>

                        {/* Hover Action Buttons */}
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150">
                            {!task.completed_at && (
                              <div className="flex border border-slate-200 bg-white rounded-lg p-0.5 shrink-0 select-none">
                                <button
                                  onClick={() => handleUpdateStatus(task.id, "pending")}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                                    task.status === "pending" ? "bg-slate-150 text-slate-800" : "text-slate-400 hover:text-slate-650"
                                  }`}
                                >
                                  ToDo
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(task.id, "in_progress")}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                                    task.status === "in_progress" ? "bg-purple-50 text-purple-700" : "text-slate-400 hover:text-slate-650"
                                  }`}
                                >
                                  IP
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(task.id, "review")}
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                                    task.status === "review" ? "bg-amber-50 text-amber-700" : "text-slate-400 hover:text-slate-650"
                                  }`}
                                >
                                  Rev
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-7 w-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-rose-450 hover:text-rose-600 transition shrink-0 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // --- Redesigned Kanban Board (Linear style columns) ---
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-[760px] items-stretch">
                {[
                  { id: "pending" as const, label: "To Do", color: "bg-slate-50 border-slate-200", dot: "bg-slate-400", list: sortedTasks.filter(t => t.status === "pending") },
                  { id: "in_progress" as const, label: "In Progress", color: "bg-purple-50/10 border-purple-100", dot: "bg-purple-500", list: sortedTasks.filter(t => t.status === "in_progress") },
                  { id: "review" as const, label: "In Review", color: "bg-amber-50/10 border-amber-100", dot: "bg-amber-500", list: sortedTasks.filter(t => t.status === "review") },
                  { id: "completed" as const, label: "Completed", color: "bg-emerald-50/10 border-emerald-100", dot: "bg-emerald-500", list: sortedTasks.filter(t => t.status === "completed") }
                ].map(col => {
                  const isDraggingOverCol = activeDropCol === col.id;
                  
                  return (
                    <div
                      key={col.id}
                      onDragOver={(e) => handleDragOver(e, col.id)}
                      onDragLeave={() => setActiveDropCol(null)}
                      onDrop={(e) => handleDrop(e, col.id)}
                      className={`flex-1 rounded-2xl border p-4 transition-all duration-200 flex flex-col min-w-[180px] max-w-[240px] ${
                        isDraggingOverCol
                          ? "ring-2 ring-purple-650 ring-offset-2 border-purple-300 bg-purple-50/5 scale-[1.01]"
                          : `${col.color}`
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0 select-none">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                          <span className="text-[11.5px] font-black text-slate-800 tracking-tight uppercase">{col.label}</span>
                        </div>
                        <span className="text-[9.5px] font-black bg-white text-slate-500 rounded-full px-2 py-0.5 border border-slate-200 shadow-sm">
                          {col.list.length}
                        </span>
                      </div>

                      {/* Cards Stack */}
                      <div className="flex flex-col gap-2.5 min-h-[300px]">
                        {col.list.map(task => {
                          const taskOverdue = isOverdue(task.due_date, task.completed_at);
                          const label = dueLabel(task.due_date);

                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", task.id);
                                setDraggedId(task.id);
                              }}
                              onDragEnd={() => {
                                setDraggedId(null);
                                setActiveDropCol(null);
                              }}
                              className={`bg-white rounded-xl border p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-slate-350 hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing group relative select-none ${
                                draggedId === task.id 
                                  ? "opacity-35 border-dashed border-purple-500 shadow-none" 
                                  : taskOverdue 
                                    ? "border-rose-200 bg-rose-50/5" 
                                    : "border-slate-200"
                              }`}
                            >
                              <div className="flex items-start gap-2 mb-2">
                                <button
                                  onClick={() => handleToggleComplete(task.id)}
                                  className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                                    task.completed_at
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "border-slate-300 hover:border-purple-500"
                                  }`}
                                >
                                  {task.completed_at && <Check className="h-2 w-2" strokeWidth={3.5} />}
                                </button>
                                
                                <p className={`text-[12px] font-bold text-slate-800 leading-snug break-words pr-5 ${
                                  task.completed_at ? "line-through text-slate-400 font-medium" : ""
                                }`}>
                                  {task.cleanTitle}
                                </p>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2.5 top-3 text-slate-400">
                                  <GripVertical className="h-3.5 w-3.5 shrink-0" />
                                </div>
                              </div>

                              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {task.creator_name && (
                                    <span className="text-[8.5px] bg-purple-50 text-purple-700 font-black px-1.5 py-0.5 rounded border border-purple-100/50 uppercase tracking-wider">
                                      @{task.creator_name}
                                    </span>
                                  )}
                                  {label && (
                                    <span className={`text-[9px] font-extrabold flex items-center gap-0.5 ${
                                      task.completed_at 
                                        ? "text-slate-400"
                                        : taskOverdue 
                                          ? "text-rose-500 animate-pulse" 
                                          : "text-slate-450"
                                    }`}>
                                      <Clock className="h-2.5 w-2.5" />
                                      {label}
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="opacity-0 group-hover:opacity-100 transition h-5.5 w-5.5 rounded hover:bg-rose-50 flex items-center justify-center text-rose-450 hover:text-rose-600 cursor-pointer shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {col.list.length === 0 && (
                          <div className="h-28 border border-dashed border-slate-200/60 rounded-xl flex flex-col items-center justify-center text-center p-3 select-none bg-slate-50/10">
                            <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Empty</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Productivity Sidebar: Unified Board Container (cols 9-12) */}
        <div className="lg:col-span-4 space-y-6 bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.01)] p-5 divide-y divide-slate-100">
          
          {/* SECTION 1: TODAY'S PROGRESS */}
          <div className="pb-5 flex flex-col items-center text-center">
            <h3 className="font-extrabold text-slate-400 text-[10.5px] tracking-widest uppercase self-start mb-3 select-none">Today's Progress</h3>
            
            {/* SVG Circular Progress Chart with Gradient Fill */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-3">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  className="text-slate-100" 
                  strokeWidth="6" 
                  stroke="currentColor" 
                  fill="transparent" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="url(#progressGradient)"
                  strokeWidth="6" 
                  strokeDasharray="263.89" 
                  strokeDashoffset={263.89 - (263.89 * completionRate) / 100}
                  strokeLinecap="round" 
                  className="transition-all duration-500 ease-out"
                  fill="transparent" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900 leading-none">{completionRate}%</span>
                <span className="text-[8.5px] text-slate-400 font-extrabold uppercase mt-1">Complete</span>
              </div>
            </div>
            
            <p className="text-[12px] font-extrabold text-slate-800 leading-tight">
              {completedCount} Completed · {pendingCount + inProgressCount + reviewCount} Pending
            </p>
          </div>

          {/* SECTION 2: UPCOMING DEADLINES */}
          <div className="py-5 flex flex-col">
            <h3 className="font-extrabold text-slate-400 text-[10.5px] tracking-widest uppercase mb-3 select-none">Upcoming Deadlines</h3>
            
            {upcomingDeadlines.length === 0 ? (
              <div className="py-4 text-center select-none bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No upcoming deadlines</p>
                <p className="text-[9px] text-slate-450 mt-0.5">You're free and clear!</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingDeadlines.map(task => {
                  const taskOverdue = isOverdue(task.due_date, task.completed_at);
                  const label = dueLabel(task.due_date);
                  
                  return (
                    <div 
                      key={task.id}
                      className="p-2.5 bg-slate-50/30 hover:bg-slate-50 border border-slate-100 rounded-xl transition duration-150 flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11.5px] font-bold text-slate-800 truncate leading-tight">{task.cleanTitle}</p>
                        <span className={`text-[9px] font-black uppercase mt-1 flex items-center gap-1.5 leading-none ${
                          taskOverdue ? "text-rose-500 animate-pulse" : "text-slate-450"
                        }`}>
                          <Clock className="h-2.5 w-2.5" />
                          {label}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleToggleComplete(task.id)}
                        className="h-5.5 w-5.5 rounded-full border border-slate-350 hover:bg-purple-50 hover:border-purple-600 flex items-center justify-center shrink-0 cursor-pointer text-transparent hover:text-purple-650 transition duration-150"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: RECENT ACTIVITY TIMELINE (Linear-style connector line) */}
          <div className="py-5 flex flex-col">
            <h3 className="font-extrabold text-slate-400 text-[10.5px] tracking-widest uppercase mb-3 select-none">Recent Activity</h3>
            
            <div className="relative border-l border-slate-150 ml-2.5 pl-4.5 space-y-4 max-h-[220px] overflow-y-auto pr-1">
              {activities.map((act) => (
                <div key={act.id} className="relative">
                  {/* Timeline bullet connector dot */}
                  <span className={`absolute -left-[22.5px] top-1.5 h-2 w-2 rounded-full ring-4 ring-white ${
                    act.type === "complete" ? "bg-emerald-500" : act.type === "move" ? "bg-purple-500" : "bg-slate-400"
                  }`} />
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-700 font-semibold text-[11.5px] leading-snug">
                      {act.action}
                    </p>
                    <span className="text-[9px] text-slate-400 font-black block mt-0.5">{act.timeLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => logActivity("Opened timeline history log details", "move")}
              className="mt-3.5 w-full h-8.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-extrabold text-slate-650 transition cursor-pointer flex items-center justify-center gap-1"
            >
              View all activity
            </button>
          </div>

          {/* SECTION 4: PRO TIP CARD (Reduced Saturation Glassmorphic Informative Card) */}
          <div className="pt-5">
            <div className="bg-purple-550/[0.03] border border-purple-100/50 rounded-2xl p-4 backdrop-blur-sm relative overflow-hidden group select-none">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                  <Lightbulb className="h-4 w-4 text-purple-650" />
                </div>
                <div>
                  <span className="text-[9.5px] font-black tracking-widest uppercase text-purple-650 block leading-none">Productivity Insight</span>
                  <p className="text-[12px] text-slate-500 font-semibold mt-1.5 leading-relaxed">
                    Break down large tasks into smaller steps and set due dates to stay productive.
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex items-center justify-end">
                <button 
                  onClick={() => setShowTipModal(true)}
                  className="h-7.5 px-3 bg-white hover:bg-slate-50 text-purple-700 text-[10px] font-black rounded-lg border border-purple-100/60 shadow-sm transition duration-150 cursor-pointer"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── NEW TASK DIALOG MODAL (44px heights buttons, strong weight) ── */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 shadow-sm">
                  <Clipboard className="h-4.5 w-4.5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-[14.5px]">Create New Task</h3>
                  <p className="text-[11px] text-slate-400">Add a new action item to your workspace</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewTaskModal(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Task Title</label>
                <input 
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Finalize negotiation terms"
                  className="w-full h-10 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 transition"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Due Date</label>
                  <input 
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 transition appearance-none cursor-pointer"
                  >
                    <option value="pending">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Link Creator</label>
                <select
                  value={newCreator}
                  onChange={(e) => setNewCreator(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-705 focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 transition appearance-none cursor-pointer"
                >
                  <option value="">No creator link</option>
                  {creators.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer Buttons (Exactly 44px / h-11 height, Stronger weight) */}
            <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setShowNewTaskModal(false)}
                className="h-11 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12.5px] font-bold text-slate-650 transition cursor-pointer active:scale-98"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTaskForm}
                disabled={!newTitle.trim() || isPending}
                className="h-11 px-6 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-[12.5px] font-black rounded-xl shadow-[0_2px_8px_rgba(124,58,237,0.1)] transition cursor-pointer active:scale-98"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IMPORT TASKS TEMPLATE DIALOG MODAL (44px actions) ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 shadow-sm">
                  <Upload className="h-4.5 w-4.5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-[14.5px]">Import Workspace Templates</h3>
                  <p className="text-[11px] text-slate-400">Bootstrap your dashboard with standard packages</p>
                </div>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-3.5">
              {[
                { 
                  id: "onboarding", 
                  title: "New Hire Onboarding", 
                  desc: "Core setup items, handbook audits, manager check-ins.", 
                  count: 3, 
                  icon: FileSpreadsheet, 
                  color: "bg-blue-50 border-blue-100 text-blue-600" 
                },
                { 
                  id: "campaign", 
                  title: "Creator Campaign Launch", 
                  desc: "Draft campaigns, negotiate pricing, audit content drafts.", 
                  count: 3, 
                  icon: Sparkles, 
                  color: "bg-purple-50 border-purple-100 text-purple-600" 
                },
                { 
                  id: "operations", 
                  title: "Weekly Operations Check", 
                  desc: "Sync deal pipelines, check contract locks, draft newsletters.", 
                  count: 3, 
                  icon: Clipboard, 
                  color: "bg-amber-50 border-amber-100 text-amber-600" 
                }
              ].map(tpl => (
                <div 
                  key={tpl.id}
                  onClick={() => handleImportTemplate(tpl.id)}
                  className="p-4 bg-slate-50/55 hover:bg-slate-50 border border-slate-200 hover:border-purple-300 rounded-2xl cursor-pointer transition-all duration-200 flex items-start gap-4 group"
                >
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center ${tpl.color} shrink-0`}>
                    <tpl.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-[13px] text-slate-900 group-hover:text-purple-650 transition">{tpl.title}</h4>
                      <span className="text-[9.5px] font-black bg-white border border-slate-250 px-2 py-0.5 rounded-full text-slate-500 shadow-sm">
                        {tpl.count} tasks
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-400 font-semibold leading-normal">{tpl.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end shrink-0">
              <button 
                onClick={() => setShowImportModal(false)}
                className="h-11 px-5 rounded-xl border border-slate-200 hover:bg-slate-50 text-[12.5px] font-bold text-slate-650 transition cursor-pointer active:scale-98"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTIVITY TIP PRO DIALOG MODAL ── */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 shadow-sm">
                  <Lightbulb className="h-4.5 w-4.5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-[14.5px]">Productivity Frameworks</h3>
                  <p className="text-[11px] text-slate-400">Learn how to make the most of your day</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTipModal(false)}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-slate-600 text-[12.5px] leading-relaxed">
              <div className="space-y-1">
                <h4 className="font-black text-slate-800 text-[13px] flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-purple-500" />
                  1. The GTD Method (Getting Things Done)
                </h4>
                <p className="font-semibold text-slate-450 pl-5">
                  Capture everything that crosses your mind, clarify what it means, organize it into actionable lists, and review regularly to keep focus.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-800 text-[13px] flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-purple-500" />
                  2. Time Blocking / Pomodoro
                </h4>
                <p className="font-semibold text-slate-450 pl-5">
                  Allocate specific blocks of time in your day for focused task completion. Work in 25-minute intervals (Pomodoros) with short 5-minute breaks.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-800 text-[13px] flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-purple-500" />
                  3. The 2-Minute Rule
                </h4>
                <p className="font-semibold text-slate-450 pl-5">
                  If an action item takes less than two minutes to complete, do it immediately rather than writing it down or postponing it.
                </p>
              </div>
            </div>

            {/* Footer (44px) */}
            <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex justify-end shrink-0">
              <button 
                onClick={() => setShowTipModal(false)}
                className="h-11 px-5 bg-purple-600 hover:bg-purple-700 text-white text-[12.5px] font-black rounded-xl shadow-sm transition cursor-pointer active:scale-98"
              >
                Got it, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
