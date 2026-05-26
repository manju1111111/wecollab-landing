"use client";

import Image from "next/image";
import { Clock, CheckCircle2, TrendingUp } from "lucide-react";

export function EmployeePerformance() {
  const employees = [
    {
      id: 1,
      name: "Alex Chen",
      role: "Creator Success",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80",
      status: "online",
      loginTime: "6.1h",
      tasksCompleted: 42,
      score: 98,
      salaryInfo: "$1,500", // Reference to image design element
    },
    {
      id: 2,
      name: "Sarah Miller",
      role: "Verification",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
      status: "break",
      loginTime: "4.5h",
      tasksCompleted: 28,
      score: 85,
      salaryInfo: "$1,200",
    },
    {
      id: 3,
      name: "David Kim",
      role: "Onboarding",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&q=80",
      status: "online",
      loginTime: "2.3h",
      tasksCompleted: 15,
      score: 92,
      salaryInfo: "$1,450",
    },
  ];

  return (
    <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col h-full relative overflow-hidden">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Team Performance</h2>
          <p className="text-[13px] font-medium text-slate-500">Live activity and scores</p>
        </div>
        <button className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
          <span className="text-xl font-bold text-slate-400 leading-none mb-2">...</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 flex-1 justify-center">
        {employees.map((emp) => (
          <div key={emp.id} className="group relative flex items-center gap-4 rounded-2xl p-3 hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
            {/* Avatar & Status */}
            <div className="relative">
              <div className="h-14 w-14 rounded-[20px] overflow-hidden bg-slate-100 relative">
                <Image src={emp.avatar} alt={emp.name} fill className="object-cover" />
              </div>
              <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                emp.status === "online" ? "bg-emerald-500" : "bg-amber-400"
              }`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-bold text-slate-900 truncate">{emp.name}</h3>
              <p className="text-[12px] font-medium text-slate-500 truncate">{emp.role}</p>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-right">
              <div className="hidden sm:block">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase">
                  <Clock className="h-3 w-3" /> Time
                </div>
                <div className="text-[14px] font-bold text-slate-700">{emp.loginTime}</div>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase">
                  <CheckCircle2 className="h-3 w-3" /> Tasks
                </div>
                <div className="text-[14px] font-bold text-slate-700">{emp.tasksCompleted}</div>
              </div>
              
              <div className="w-px h-8 bg-slate-100 hidden sm:block mx-1" />
              
              <div>
                <div className="flex items-center justify-end gap-1 text-[11px] font-bold text-slate-400 uppercase">
                  Score <TrendingUp className="h-3 w-3 text-indigo-500" />
                </div>
                <div className="text-[16px] font-black text-indigo-600">{emp.score}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="mt-4 w-full rounded-xl bg-slate-50 py-2.5 text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
        View All Employees
      </button>
    </div>
  );
}
