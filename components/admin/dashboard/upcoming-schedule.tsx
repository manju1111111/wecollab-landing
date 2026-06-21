"use client";

import { Clock, Calendar as CalendarIcon } from "lucide-react";

interface UpcomingTask {
  id: string;
  title: string;
  day: string;
  date: string;
  time: string;
  creatorId?: string | null;
  employeeId?: string | null;
}

export function UpcomingSchedule({ tasks = [] }: { tasks?: UpcomingTask[] }) {
  // 1. Calculate current week days (Monday to Sunday) dynamically based on current time
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + mondayOffset + i);
    const dayStr = d.toLocaleDateString("en-US", { weekday: "short" });
    const dateStr = d.getDate().toString().padStart(2, "0");
    const isToday = today.toDateString() === d.toDateString();
    return {
      day: dayStr,
      date: dateStr,
      active: isToday,
    };
  });

  const monthYearLabel = today.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[320px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[14px] font-bold text-slate-900">Upcoming Schedule</h3>
        <button className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1">
          {monthYearLabel} <span className="opacity-50 text-[8px]">▼</span>
        </button>
      </div>

      {/* Week days strip */}
      <div className="flex justify-between mb-6 shrink-0">
        {days.map((d, i) => (
          <div 
            key={i} 
            className={`flex flex-col items-center justify-center w-9 h-11 rounded-xl transition ${
              d.active 
                ? "bg-indigo-650 text-white shadow-sm shadow-indigo-100" 
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <span className={`text-[10px] font-semibold ${d.active ? "text-indigo-200" : "text-slate-400"}`}>
              {d.day}
            </span>
            <span className="text-[12px] font-bold">{d.date}</span>
          </div>
        ))}
      </div>

      {/* Tasks listing area */}
      <div className="flex-1 relative border-l-2 border-slate-100 ml-4 pl-6 flex flex-col gap-5 overflow-y-auto pr-1 -mr-1 custom-scrollbar min-h-0">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="relative group">
              <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white group-hover:scale-110 transition-transform" />
              <div className="flex gap-4">
                <span className="text-[11px] font-bold text-slate-400 shrink-0 mt-0.5 flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {task.time}
                </span>
                <div>
                  <div className="text-[12px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                    {task.title}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                    Due: {task.day}, {task.date}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-350 gap-1.5 py-4">
            <CalendarIcon className="h-6 w-6 stroke-[1.5]" />
            <p className="text-[11px] font-bold">No tasks scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
}
