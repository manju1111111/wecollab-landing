"use client";

import { Users, CheckSquare, TrendingUp, Clock } from "lucide-react";

interface MetricsStripProps {
  assignedCount: number;
  completedTasks: number;
  avgEngagement: number;
  pendingTasks: number;
}

export function EmployeeMetricsStrip({
  assignedCount,
  completedTasks,
  avgEngagement,
  pendingTasks,
}: MetricsStripProps) {
  const metrics = [
    {
      label: "Assigned Creators",
      value: assignedCount,
      icon: Users,
      color: "indigo",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      text: "text-indigo-600",
      num: "text-indigo-900",
      suffix: "",
    },
    {
      label: "Tasks Completed",
      value: completedTasks,
      icon: CheckSquare,
      color: "emerald",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      text: "text-emerald-600",
      num: "text-emerald-900",
      suffix: "",
    },
    {
      label: "Avg Engagement",
      value: avgEngagement,
      icon: TrendingUp,
      color: "violet",
      bg: "bg-violet-50",
      border: "border-violet-100",
      text: "text-violet-600",
      num: "text-violet-900",
      suffix: "%",
    },
    {
      label: "Pending Tasks",
      value: pendingTasks,
      icon: Clock,
      color: pendingTasks > 0 ? "amber" : "slate",
      bg: pendingTasks > 0 ? "bg-amber-50" : "bg-slate-50",
      border: pendingTasks > 0 ? "border-amber-100" : "border-slate-100",
      text: pendingTasks > 0 ? "text-amber-600" : "text-slate-400",
      num: pendingTasks > 0 ? "text-amber-900" : "text-slate-500",
      suffix: "",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <div
          key={m.label}
          className={`${m.bg} ${m.border} border rounded-2xl px-5 py-4 flex flex-col gap-3`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${m.text}`}>
              {m.label}
            </span>
            <m.icon className={`h-4 w-4 ${m.text}`} strokeWidth={2} />
          </div>
          <span className={`text-3xl font-black ${m.num}`}>
            {m.value}{m.suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
