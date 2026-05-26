"use client";

import Image from "next/image";

export function UpcomingSchedule() {
  const days = [
    { day: "Mon", date: "26", active: true },
    { day: "Tue", date: "27", active: false },
    { day: "Wed", date: "28", active: false },
    { day: "Thu", date: "29", active: false },
    { day: "Fri", date: "30", active: false },
    { day: "Sat", date: "31", active: false },
    { day: "Sun", date: "01", active: false },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[320px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[14px] font-bold text-slate-900">Upcoming Schedule</h3>
        <button className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1">
          May 2024 <span className="opacity-50 text-[8px]">▼</span>
        </button>
      </div>

      <div className="flex justify-between mb-8">
        {days.map((d, i) => (
          <div key={i} className={`flex flex-col items-center justify-center w-9 h-11 rounded-xl ${d.active ? 'bg-[#0b3b84] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            <span className={`text-[10px] font-semibold ${d.active ? 'text-blue-200' : 'text-slate-400'}`}>{d.day}</span>
            <span className="text-[12px] font-bold">{d.date}</span>
          </div>
        ))}
      </div>

      <div className="flex-1 relative border-l-2 border-slate-100 ml-4 pl-6 flex flex-col gap-6">
        <div className="relative">
          <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#0b3b84] border-2 border-white" />
          <div className="flex gap-4">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 mt-0.5">10:30 AM</span>
            <div>
              <div className="text-[12px] font-bold text-slate-900">Team Standup Meeting</div>
              <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                Conference Room
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#0b3b84] border-2 border-white" />
          <div className="flex gap-4">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 mt-0.5">02:00 PM</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-slate-900">Creator Onboarding Session</div>
              <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                Online Meeting
              </div>
            </div>
            <div className="flex -space-x-2 shrink-0 self-center">
              <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80" alt="" className="w-5 h-5 rounded-full border-2 border-white object-cover" />
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" alt="" className="w-5 h-5 rounded-full border-2 border-white object-cover" />
              <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500 z-10">+3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
