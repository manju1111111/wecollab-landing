"use client";

import { UserPlus, Upload, Download, BellRing, Settings2, ShieldCheck } from "lucide-react";

export function QuickActions() {
  const actions = [
    { name: "Add Creator", icon: UserPlus, color: "text-indigo-600", bg: "bg-indigo-50", hover: "hover:bg-indigo-100 hover:border-indigo-200" },
    { name: "Import CSV", icon: Upload, color: "text-emerald-600", bg: "bg-emerald-50", hover: "hover:bg-emerald-100 hover:border-emerald-200" },
    { name: "Export DB", icon: Download, color: "text-blue-600", bg: "bg-blue-50", hover: "hover:bg-blue-100 hover:border-blue-200" },
    { name: "Broadcast", icon: BellRing, color: "text-amber-600", bg: "bg-amber-50", hover: "hover:bg-amber-100 hover:border-amber-200" },
    { name: "Verify All", icon: ShieldCheck, color: "text-rose-600", bg: "bg-rose-50", hover: "hover:bg-rose-100 hover:border-rose-200" },
    { name: "Settings", icon: Settings2, color: "text-slate-600", bg: "bg-slate-100", hover: "hover:bg-slate-200 hover:border-slate-300" },
  ];

  return (
    <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Quick Actions</h2>
        <p className="text-[13px] font-medium text-slate-500">Frequently used tools</p>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button 
              key={i}
              className={`group flex flex-col items-center justify-center gap-2 rounded-2xl border border-transparent p-4 transition-all duration-300 ${action.bg} ${action.hover}`}
            >
              <div className={`h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <span className={`text-[12px] font-bold ${action.color}`}>{action.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
