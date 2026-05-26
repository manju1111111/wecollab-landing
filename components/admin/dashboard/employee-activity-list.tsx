"use client";

import Image from "next/image";

export function EmployeeActivityList() {
  const employees = [
    { name: "Rahul Sharma", role: "Data Manager", status: "Online", color: "bg-emerald-500", time: "05h 12m", avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80" },
    { name: "Manju Patel", role: "Verifier", status: "Online", color: "bg-emerald-500", time: "04h 45m", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" },
    { name: "Sneha Reddy", role: "Data Entry", status: "Break", color: "bg-amber-500", time: "02h 15m", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80" },
    { name: "Arjun Mehta", role: "Operations", status: "Online", color: "bg-emerald-500", time: "06h 30m", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80" },
    { name: "Karan Singh", role: "Researcher", status: "Offline", color: "bg-slate-300", time: "—", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[280px] flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[14px] font-bold text-slate-900">Employee Activity</h3>
        <button className="text-[11px] font-bold text-blue-500 hover:text-blue-600">View All</button>
      </div>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {employees.map((emp, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
                <Image src={emp.avatar} alt={emp.name} width={32} height={32} className="object-cover" />
              </div>
              <div>
                <div className="text-[12px] font-bold text-slate-900 leading-tight">{emp.name}</div>
                <div className="text-[10px] font-medium text-slate-400">{emp.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 w-16">
                <div className={`w-1.5 h-1.5 rounded-full ${emp.color}`} />
                <span className="text-[11px] font-semibold text-slate-500">{emp.status}</span>
              </div>
              <div className="text-[11px] font-bold text-slate-900 w-12 text-right">{emp.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
