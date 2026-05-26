"use client";

import { AlertTriangle, Database, Link2Off, MailWarning } from "lucide-react";

export function DatabaseHealth() {
  const issues = [
    {
      title: "Duplicate Profiles",
      count: 24,
      icon: Database,
      severity: "high",
      color: "text-rose-500",
      bg: "bg-rose-50",
      barColor: "bg-rose-500",
      progress: 85
    },
    {
      title: "Missing Emails",
      count: 142,
      icon: MailWarning,
      severity: "medium",
      color: "text-amber-500",
      bg: "bg-amber-50",
      barColor: "bg-amber-500",
      progress: 60
    },
    {
      title: "Broken Links",
      count: 18,
      icon: Link2Off,
      severity: "low",
      color: "text-blue-500",
      bg: "bg-blue-50",
      barColor: "bg-blue-500",
      progress: 25
    }
  ];

  return (
    <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Database Health</h2>
            <p className="text-[13px] font-medium text-slate-500">System warnings</p>
          </div>
        </div>
        <div className="text-[12px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          98.2% Healthy
        </div>
      </div>

      <div className="flex flex-col gap-5 flex-1 justify-center">
        {issues.map((issue, i) => {
          const Icon = issue.icon;
          return (
            <div key={i} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${issue.color}`} />
                  <span className="text-[14px] font-bold text-slate-700">{issue.title}</span>
                </div>
                <span className="text-[14px] font-black text-slate-900">{issue.count}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${issue.barColor} rounded-full relative overflow-hidden transition-all duration-1000 ease-out`}
                  style={{ width: `${issue.progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <button className="mt-6 w-full rounded-xl border border-slate-200 py-2.5 text-[13px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
        Run Diagnostic
      </button>
    </div>
  );
}
