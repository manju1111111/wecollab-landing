"use client";

import { CheckCircle2, UserPlus, RefreshCw, Trash2, ArrowRight } from "lucide-react";

export function ActivityFeed() {
  const activities = [
    {
      id: 1,
      title: "Creator Approved",
      desc: "Sarah M. verified @johndoe",
      time: "2m ago",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      id: 2,
      title: "Bulk Import Started",
      desc: "Alex C. uploading 250 profiles",
      time: "15m ago",
      icon: UserPlus,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      id: 3,
      title: "Profile Updated",
      desc: "System sync for @lifestyle_jane",
      time: "1h ago",
      icon: RefreshCw,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: 4,
      title: "Duplicate Removed",
      desc: "David K. merged 2 records",
      time: "2h ago",
      icon: Trash2,
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
    {
      id: 5,
      title: "Verification Failed",
      desc: "Missing contact info for @tech_guru",
      time: "3h ago",
      icon: CheckCircle2, // Reusing icon but changing color
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Live Activity</h2>
          <p className="text-[13px] font-medium text-slate-500">Real-time system feed</p>
        </div>
      </div>

      <div className="relative flex-1">
        {/* Vertical line connecting timeline */}
        <div className="absolute left-6 top-2 bottom-4 w-px bg-slate-100 -z-10" />
        
        <div className="flex flex-col gap-5">
          {activities.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="group flex items-start gap-4 cursor-pointer">
                <div className={`relative h-12 w-12 shrink-0 rounded-full ${item.bg} flex items-center justify-center border-4 border-white shadow-sm transition-transform group-hover:scale-110 duration-300`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-[14px] font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">{item.time}</span>
                  </div>
                  <p className="text-[13px] text-slate-500 truncate mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-[13px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
        View Full Log <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
