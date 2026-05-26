"use client";

import Image from "next/image";

export function CalendarWidget() {
  const schedule = [
    {
      id: 1,
      time: "08:00 am",
      event: null,
    },
    {
      id: 2,
      time: "09:00 am",
      event: {
        title: "Weekly Team Sync",
        desc: "Discuss progress on projects",
        color: "bg-white",
        textColor: "text-slate-900",
        border: "border-slate-100",
        avatars: [
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
          "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80"
        ]
      }
    },
    {
      id: 3,
      time: "10:00 am",
      event: null,
    },
    {
      id: 4,
      time: "11:00 am",
      event: {
        title: "Onboarding Session",
        desc: "Introduction for new hires",
        color: "bg-blue-500",
        textColor: "text-white",
        border: "border-blue-600",
        avatars: [
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"
        ]
      }
    },
    {
      id: 5,
      time: "12:00 pm",
      event: null,
    }
  ];

  return (
    <div className="rounded-[24px] bg-slate-50 p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">September 2024</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 text-[12px] font-bold bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors">Today</button>
          <button className="px-3 py-1 text-[12px] font-bold bg-slate-200 text-slate-700 rounded-full hover:bg-slate-300 transition-colors">Month</button>
        </div>
      </div>

      <div className="flex-1 relative">
        {/* Days Header */}
        <div className="flex justify-between px-12 mb-6">
          {["Mon 22", "Tue 23", "Wed 24", "Thu 25", "Fri 26", "Sat 27"].map((day, i) => (
            <div key={day} className={`text-center ${i === 2 ? "text-indigo-600" : "text-slate-400"}`}>
              <div className="text-[12px] font-bold">{day.split(" ")[0]}</div>
              <div className={`text-[15px] font-black mt-1 ${i === 2 ? "bg-indigo-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto" : ""}`}>
                {day.split(" ")[1]}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Grid */}
        <div className="relative border-t border-slate-200 pt-4">
          {/* Vertical grid lines */}
          <div className="absolute top-0 bottom-0 left-[20%] w-px bg-slate-200 border-dashed" />
          <div className="absolute top-0 bottom-0 left-[40%] w-px bg-slate-200 border-dashed" />
          <div className="absolute top-0 bottom-0 left-[60%] w-px bg-slate-200 border-dashed" />
          <div className="absolute top-0 bottom-0 left-[80%] w-px bg-slate-200 border-dashed" />

          {schedule.map((slot) => (
            <div key={slot.id} className="relative h-20 group">
              <div className="absolute left-0 -top-2.5 text-[11px] font-bold text-slate-400 w-12 text-right">
                {slot.time}
              </div>
              <div className="absolute left-14 right-0 border-t border-slate-200 border-dashed w-full" />
              
              {slot.event && (
                <div className={`absolute top-2 left-[25%] right-[10%] ${slot.event.color} ${slot.event.border} border rounded-2xl p-3 shadow-sm hover:-translate-y-1 transition-transform z-10 cursor-pointer`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h4 className={`text-[13px] font-bold ${slot.event.textColor} truncate`}>{slot.event.title}</h4>
                      <p className={`text-[11px] font-medium opacity-80 ${slot.event.textColor} truncate mt-0.5`}>{slot.event.desc}</p>
                    </div>
                    <div className="flex -space-x-2 shrink-0">
                      {slot.event.avatars.map((avatar, i) => (
                        <div key={i} className="relative h-6 w-6 rounded-full overflow-hidden border-2 border-white">
                          <Image src={avatar} alt="avatar" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
