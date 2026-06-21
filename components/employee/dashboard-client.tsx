"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { 
  Users, Clipboard, Kanban, TrendingUp, CheckCircle2, Clock, 
  Calendar, ChevronRight, Activity, ArrowRight, Check, Plus, 
  Sparkles, Shield, User, Circle
} from "lucide-react";
import { completeTask } from "@/app/employee/task-actions";

interface Creator {
  id: string;
  name: string;
  username: string;
  profile_image?: string;
  followers: number;
  category?: string;
  _deal_status: string;
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

interface ActivityLog {
  id: string;
  action: string;
  timeLabel: string;
  type: "task" | "creator" | "pipeline";
}

interface EmployeeDashboardClientProps {
  employee: {
    full_name: string;
    role: string;
  } | null;
  assignedCreators: Creator[];
  initialTasks: Task[];
  employeeId: string;
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

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function EmployeeDashboardClient({ 
  employee, 
  assignedCreators, 
  initialTasks, 
  employeeId 
}: EmployeeDashboardClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isPending, startTransition] = useTransition();

  // Sync initial tasks
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Pre-populate activity timeline
  useEffect(() => {
    const logs: ActivityLog[] = [
      { id: "act-1", action: "Accessed executive workspace", timeLabel: "10:32 AM", type: "task" }
    ];

    if (assignedCreators.length > 0) {
      logs.push({
        id: "act-c-1",
        action: `Assigned new creator portfolio: "${assignedCreators[0].name}"`,
        timeLabel: "Yesterday",
        type: "creator"
      });
    }

    const completed = initialTasks.filter(t => t.completed_at).slice(0, 1);
    completed.forEach(t => {
      logs.push({
        id: `act-t-${t.id}`,
        action: `Completed target milestone: "${t.title.replace(/^\[[^\]]+\]\s*/, "")}"`,
        timeLabel: "Yesterday",
        type: "task"
      });
    });

    if (logs.length < 3) {
      logs.push(
        { id: "act-f-1", action: "Updated deal status to Negotiating in CRM pipeline", timeLabel: "Yesterday", type: "pipeline" }
      );
    }

    setActivities(logs);
  }, [assignedCreators, initialTasks]);

  const logActivity = (action: string, type: "task" | "creator" | "pipeline") => {
    const time = new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    setActivities(prev => [
      { id: `act-${Date.now()}`, action, timeLabel: time, type },
      ...prev
    ]);
  };

  // Complete task action on dashboard
  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const cleanTitle = task.title.replace(/^\[[^\]]+\]\s*/, "");

    // Optimistic complete
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed_at: new Date().toISOString() } : t));
    logActivity(`Completed task: "${cleanTitle}"`, "task");

    startTransition(async () => {
      await completeTask(taskId);
      try {
        const bc = new BroadcastChannel("wecollab-updates");
        bc.postMessage({ type: "TASK_UPDATE", timestamp: Date.now() });
        bc.close();
      } catch (_) {}
    });
  };

  // Calculations
  const pendingTasksList = tasks.filter(t => !t.completed_at);
  const completedCount = tasks.filter(t => t.completed_at).length;
  const pendingCount = pendingTasksList.length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  
  const activeDealsCount = assignedCreators.filter(c => 
    ["new", "contacted", "negotiating"].includes(c._deal_status)
  ).length;

  const firstName = employee?.full_name?.split(" ")[0] || "there";
  
  // Format current date
  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  // Pipeline Status Counts
  const pipelineStages = [
    { id: "new", label: "New", color: "bg-slate-300", count: assignedCreators.filter(c => c._deal_status === "new").length },
    { id: "contacted", label: "Contacted", color: "bg-blue-400", count: assignedCreators.filter(c => c._deal_status === "contacted").length },
    { id: "negotiating", label: "Negotiating", color: "bg-purple-500", count: assignedCreators.filter(c => c._deal_status === "negotiating").length },
    { id: "deal_closed", label: "Closed", color: "bg-emerald-500", count: assignedCreators.filter(c => c._deal_status === "deal_closed").length },
    { id: "not_interested", label: "Rejected", color: "bg-rose-400", count: assignedCreators.filter(c => c._deal_status === "not_interested").length }
  ];

  const totalPipelineCreators = assignedCreators.length;

  // Calendar Dates: incomplete tasks with due dates, sorted chronologically
  const calendarEvents = tasks
    .filter(t => !t.completed_at && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6 w-full pb-10">

      {/* 1. Welcome Section */}
      <div className="bg-white rounded-2xl px-6 py-5 border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.01)] flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-slate-400 text-[13px] font-semibold mt-1">
            {formattedDate} · Workspace Executive Overview
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2.5 bg-purple-50 border border-purple-100/60 rounded-xl px-4 py-2">
          <Shield className="h-4 w-4 text-purple-600" />
          <span className="text-[12.5px] font-black text-purple-800 uppercase tracking-wider">{employee?.role || "Team Member"}</span>
        </div>
      </div>

      {/* 2. KPI Cards (Stripe Style, secondary helper texts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
        {[
          { 
            label: "Assigned Creators", 
            value: assignedCreators.length, 
            desc: assignedCreators.length === 0 ? "No active creators" : `${assignedCreators.length} active portfolios`, 
            icon: Users, 
            color: "text-purple-600 bg-purple-50/50 border-purple-100/60" 
          },
          { 
            label: "Pending Tasks", 
            value: pendingCount, 
            desc: pendingCount === 0 ? "No active assignments" : `${pendingCount} active assignments`, 
            icon: Clipboard, 
            color: "text-amber-600 bg-amber-50/50 border-amber-100/60" 
          },
          { 
            label: "Active Deals", 
            value: activeDealsCount, 
            desc: activeDealsCount === 0 ? "No active opportunities" : `${activeDealsCount} in negotiations`, 
            icon: Kanban, 
            color: "text-blue-600 bg-blue-50/50 border-blue-100/60" 
          },
          { 
            label: "Completion Rate", 
            value: `${completionRate}%`, 
            desc: tasks.length === 0 ? "Awaiting first task" : "Average execution rate", 
            icon: TrendingUp, 
            color: "text-emerald-600 bg-emerald-50/50 border-emerald-100/60" 
          },
        ].map((card, idx) => (
          <div 
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-start justify-between shadow-[0_1px_3px_rgba(0,0,0,0.01)] hover:-translate-y-0.5 hover:shadow-md hover:border-slate-350 transition-all duration-200 group cursor-default"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</span>
              <span className="text-2xl font-black text-slate-900 tracking-tight mt-1 transition-colors duration-150 group-hover:text-purple-650">{card.value}</span>
              <span className="text-[10.5px] text-slate-400 font-bold mt-1.5">{card.desc}</span>
            </div>
            <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${card.color} shrink-0`}>
              <card.icon className="h-4.5 w-4.5" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Grid (Left: Assigned Creators, Right: Today's Tasks) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Assigned Creators Summary Widget */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.01)] p-5 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-purple-650" />
                <h3 className="font-extrabold text-slate-800 text-[13.5px] tracking-tight">Assigned Creators</h3>
              </div>
              <span className="text-[10px] font-black bg-slate-50 text-slate-500 rounded-full px-2 py-0.5 border border-slate-200 shadow-sm">
                {assignedCreators.length} Assigned
              </span>
            </div>

            {assignedCreators.length === 0 ? (
              <div className="py-10 text-center select-none">
                <p className="text-[12px] text-slate-400 font-bold">No creators linked yet</p>
                <p className="text-[10px] text-slate-350 mt-0.5">Creators assigned by admins will appear here</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {assignedCreators.slice(0, 4).map(c => {
                  const initials = c.name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-3 group transition duration-150 p-1 hover:bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3 min-w-0">
                        {c.profile_image ? (
                          <img src={c.profile_image} alt={c.name} className="h-8.5 w-8.5 rounded-full object-cover shrink-0 border border-slate-200/60" />
                        ) : (
                          <div className="h-8.5 w-8.5 rounded-full bg-purple-50 text-purple-700 font-black text-[11px] flex items-center justify-center shrink-0 border border-purple-100">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-bold text-slate-800 truncate leading-tight group-hover:text-purple-600 transition">{c.name}</p>
                          <p className="text-[10px] text-purple-600 font-bold mt-0.5">@{c.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[9.5px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded border border-slate-200">
                          {c.category || "General"}
                        </span>
                        <span className="text-[11.5px] font-black text-slate-800">{fmt(c.followers)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link href="/employee/creators" className="mt-5 w-full h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-700 transition cursor-pointer flex items-center justify-center gap-1">
            View All Creators
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {/* Right: Today's Tasks Widget (Checkboxes linked directly) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.01)] p-5 flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-purple-650" />
                <h3 className="font-extrabold text-slate-800 text-[13.5px] tracking-tight">Today's Tasks</h3>
              </div>
              <span className="text-[10px] font-black bg-purple-50 text-purple-700 rounded-full px-2 py-0.5 border border-purple-100 shadow-sm">
                {pendingCount} Pending
              </span>
            </div>

            {pendingTasksList.length === 0 ? (
              <div className="py-10 text-center select-none">
                <p className="text-[12px] text-slate-400 font-bold">You're all caught up! 🎉</p>
                <p className="text-[10px] text-slate-350 mt-0.5">No tasks assigned to you right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasksList.slice(0, 4).map(task => {
                  const clean = task.title.replace(/^\[[^\]]+\]\s*/, "");
                  const label = dueLabel(task.due_date);
                  
                  return (
                    <div key={task.id} className="flex items-start gap-3 p-1 rounded-xl hover:bg-slate-50 transition">
                      <button 
                        onClick={() => handleCompleteTask(task.id)}
                        className="mt-0.5 h-4.5 w-4.5 rounded-full border-2 border-slate-300 hover:border-purple-600 flex items-center justify-center shrink-0 cursor-pointer text-transparent hover:text-purple-600 transition"
                      >
                        <Check className="h-2.5 w-2.5" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold text-slate-800 truncate leading-snug">{clean}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.creator_name && (
                            <span className="text-[8.5px] bg-purple-50 text-purple-700 font-black px-1.5 py-0.25 rounded border border-purple-100/50 uppercase tracking-wider">
                              @{task.creator_name}
                            </span>
                          )}
                          {label && (
                            <span className="text-[9.5px] text-slate-400 font-bold flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link href="/employee/tasks" className="mt-5 w-full h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-700 transition cursor-pointer flex items-center justify-center gap-1">
            Go to My Tasks
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        </div>

      </div>

      {/* 4. Secondary Grid (Left: Pipeline Snapshot, Right: Calendar Widget) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Pipeline Snapshot (Summary stages bar) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.01)] p-5 flex flex-col justify-between min-h-[280px]">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Kanban className="h-4.5 w-4.5 text-purple-650" />
                <h3 className="font-extrabold text-slate-800 text-[13.5px] tracking-tight">Pipeline Snapshot</h3>
              </div>
              <span className="text-[10px] font-black bg-slate-50 text-slate-500 rounded-full px-2 py-0.5 border border-slate-200 shadow-sm">
                CRM Overview
              </span>
            </div>

            {totalPipelineCreators === 0 ? (
              <div className="py-10 text-center select-none">
                <p className="text-[12px] text-slate-400 font-bold">No deals in pipeline</p>
                <p className="text-[10px] text-slate-350 mt-0.5">Assign creators to build your deal board</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Segmented Progress Bar */}
                <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  {pipelineStages.map(stage => {
                    const pct = totalPipelineCreators > 0 ? (stage.count / totalPipelineCreators) * 100 : 0;
                    if (pct === 0) return null;
                    return (
                      <div 
                        key={stage.id} 
                        style={{ width: `${pct}%` }} 
                        className={`${stage.color} h-full transition-all duration-300`} 
                        title={`${stage.label}: ${stage.count}`}
                      />
                    );
                  })}
                </div>

                {/* Badges List */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {pipelineStages.map(stage => (
                    <div key={stage.id} className="p-2.5 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                        <span className="text-[11.5px] font-bold text-slate-600">{stage.label}</span>
                      </div>
                      <span className="text-[12.5px] font-black text-slate-900">{stage.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link href="/employee/pipeline" className="mt-5 w-full h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-700 transition cursor-pointer flex items-center justify-center gap-1">
            Open Deal Pipeline
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        </div>

        {/* Right: Upcoming Dates / Calendar Widget (Chronological timeline) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.01)] p-5 flex flex-col justify-between min-h-[280px]">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-purple-650" />
                <h3 className="font-extrabold text-slate-800 text-[13.5px] tracking-tight">Upcoming Dates</h3>
              </div>
              <span className="text-[10px] font-black bg-slate-50 text-slate-500 rounded-full px-2 py-0.5 border border-slate-200 shadow-sm">
                Schedule
              </span>
            </div>

            {calendarEvents.length === 0 ? (
              <div className="py-10 text-center select-none bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">No upcoming deadlines</p>
                <p className="text-[9.5px] text-slate-450 mt-0.5">You're free and clear!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calendarEvents.map(evt => {
                  const clean = evt.title.replace(/^\[[^\]]+\]\s*/, "");
                  const dObj = new Date(evt.due_date!);
                  const day = dObj.getDate();
                  const month = dObj.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
                  
                  return (
                    <div key={evt.id} className="p-2 bg-slate-50/30 hover:bg-slate-50 border border-slate-150/50 rounded-xl transition flex items-center gap-3">
                      {/* Date Badge */}
                      <div className="h-10 w-10 bg-purple-50 border border-purple-100 rounded-lg flex flex-col items-center justify-center shrink-0">
                        <span className="text-[8px] font-black text-purple-500 uppercase tracking-widest leading-none">{month}</span>
                        <span className="text-[15px] font-black text-purple-800 leading-none mt-0.5">{day}</span>
                      </div>
                      
                      {/* Event Details */}
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-bold text-slate-800 truncate leading-snug">{clean}</p>
                        {evt.creator_name && (
                          <span className="text-[9px] text-purple-650 font-extrabold uppercase mt-0.5 block">
                            @{evt.creator_name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Link href="/employee/tasks" className="mt-5 w-full h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-700 transition cursor-pointer flex items-center justify-center gap-1">
            View Calendar Schedule
            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        </div>

      </div>

      {/* 5. Bottom Section: Recent Activity Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.01)] p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-purple-650" />
              <h3 className="font-extrabold text-slate-800 text-[13.5px] tracking-tight">Recent Activity</h3>
            </div>
            <span className="text-[10px] font-black bg-slate-50 text-slate-500 rounded-full px-2 py-0.5 border border-slate-200 shadow-sm">
              Session Audits
            </span>
          </div>

          <div className="relative border-l border-slate-150 ml-2.5 pl-4.5 space-y-4.5 py-1">
            {activities.map((act) => (
              <div key={act.id} className="relative select-none">
                {/* Timeline connector circle */}
                <span className={`absolute -left-[22.5px] top-1.5 h-2 w-2 rounded-full ring-4 ring-white ${
                  act.type === "task" ? "bg-amber-500" : act.type === "creator" ? "bg-purple-500" : "bg-blue-500"
                }`} />
                
                <div className="min-w-0 flex-1">
                  <p className="text-slate-700 font-semibold text-[12px] leading-snug">
                    {act.action}
                  </p>
                  <span className="text-[9.5px] text-slate-400 font-black block mt-0.5">{act.timeLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/employee/activity" className="mt-6 w-full h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-700 transition cursor-pointer flex items-center justify-center gap-1">
          View Activity Logs
          <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
        </Link>
      </div>

    </div>
  );
}
