"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";

export function TaskPanel() {
  const tasks = [
    {
      id: 1,
      title: "Client Meeting",
      time: "10:30 AM",
      completed: true,
      category: "External"
    },
    {
      id: 2,
      title: "Design Review",
      time: "11:00 AM",
      completed: true,
      category: "Internal"
    },
    {
      id: 3,
      title: "Project Update",
      time: "1:00 PM",
      completed: true,
      category: "Internal"
    },
    {
      id: 4,
      title: "Discuss Q3 Goals",
      time: "2:45 PM",
      completed: false,
      category: "Strategy"
    },
    {
      id: 5,
      title: "HR Policy Review",
      time: "4:30 PM",
      completed: false,
      category: "Admin"
    }
  ];

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Onboarding Tasks</h2>
          <p className="text-[13px] font-medium text-slate-500 mt-1">Today's schedule</p>
        </div>
        <div className="text-2xl font-black text-indigo-600 tracking-tighter">
          {completedCount}/{tasks.length}
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {tasks.map((task) => (
          <div key={task.id} className="group flex items-center gap-4 p-2.5 rounded-[16px] hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
            <button className="shrink-0 flex items-center justify-center transition-transform hover:scale-110">
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300 group-hover:text-slate-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h4 className={`text-[14px] font-bold truncate transition-colors ${task.completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                {task.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="h-3 w-3 text-slate-400" />
                <span className="text-[12px] font-medium text-slate-500">{task.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
