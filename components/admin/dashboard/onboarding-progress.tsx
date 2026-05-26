"use client";

import { CheckCircle2, Circle } from "lucide-react";

export function OnboardingProgress() {
  const tasks = [
    { title: "Client Briefing", status: "Completed", isDone: true },
    { title: "Data Collection", status: "Completed", isDone: true },
    { title: "Creator Research", status: "In Progress", isDone: false },
    { title: "Shortlist Creators", status: "Pending", isDone: false },
    { title: "Send Proposals", status: "Pending", isDone: false },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[280px] flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[14px] font-bold text-slate-900">Onboarding Progress</h3>
        <span className="text-xl font-bold text-slate-900">42%</span>
      </div>

      {/* Progress Bar Area */}
      <div className="mb-6">
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 flex overflow-hidden">
          <div className="bg-blue-600 h-full rounded-full" style={{ width: '42%' }}></div>
          <div className="bg-slate-300 h-full rounded-full ml-1" style={{ width: '29%' }}></div>
          <div className="bg-slate-200 h-full rounded-full ml-1" style={{ width: '29%' }}></div>
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-500">
          <span>42% Task</span>
          <span className="text-center ml-4">29% Review</span>
          <span>29% Done</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[12px] font-bold text-slate-900">Onboarding Tasks</h3>
        <span className="text-[12px] font-bold text-slate-900">3/8</span>
      </div>

      <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto custom-scrollbar">
        {tasks.map((task, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.isDone ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-slate-300" />
              )}
              <span className={`text-[11px] font-semibold ${task.isDone ? 'text-slate-900' : 'text-slate-500'}`}>{task.title}</span>
            </div>
            <span className={`text-[10px] font-medium ${task.isDone ? 'text-slate-400' : 'text-slate-400'}`}>{task.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
