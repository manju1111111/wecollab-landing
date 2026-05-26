"use client";

import { Users, UserCheck, ShieldAlert, ListTodo } from "lucide-react";

export function OverviewMetrics({ totalCreators = 12450 }) {
  const metrics = [
    {
      title: "Total Creators",
      value: totalCreators.toLocaleString(),
      icon: Users,
    },
    {
      title: "Active Today",
      value: "8,942",
      icon: UserCheck,
    },
    {
      title: "Pending Verifications",
      value: "43",
      icon: ShieldAlert,
    },
    {
      title: "Tasks Pending",
      value: "315",
      icon: ListTodo,
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6 bg-white/50 backdrop-blur-xl border border-slate-200/60 rounded-[24px] p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)]">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <div 
            key={i} 
            className={`flex-1 flex items-center gap-5 w-full ${i !== metrics.length - 1 ? 'lg:border-r border-slate-100' : ''}`}
          >
            <div className="h-12 w-12 rounded-[18px] bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
              <Icon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 tracking-tight leading-none">{m.value}</div>
              <div className="text-[13px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{m.title}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
