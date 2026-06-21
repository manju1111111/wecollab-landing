"use client";

import { useState } from "react";
import { ChevronUp, Settings, LogOut, Shield } from "lucide-react";
import Link from "next/link";

interface SidebarProfileCardProps {
  initials: string;
  name: string;
  role: string;
}

export function SidebarProfileCard({ initials, name, role }: SidebarProfileCardProps) {
  const [status, setStatus] = useState<"online" | "break">("online");
  const [isOpen, setIsOpen] = useState(false);

  const statusColors = {
    online: "bg-emerald-500 ring-2 ring-white",
    break: "bg-amber-500 ring-2 ring-white",
  };

  return (
    <div className="relative flex flex-col gap-2">
      {/* Profile Card Container */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 hover:border-slate-200/50 transition-all duration-200 cursor-pointer group relative select-none"
      >
        {/* Avatar with Status Dot */}
        <div className="relative shrink-0">
          <div className="h-8 w-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-[12px] border border-purple-100">
            {initials}
          </div>
          <span className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ${statusColors[status]}`} />
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-[12.5px] font-extrabold text-slate-800 truncate leading-tight">{name}</p>
          <div className="flex items-center gap-1 mt-0.5 leading-none">
            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">{role}</span>
          </div>
        </div>

        {/* Dropup Trigger */}
        <ChevronUp className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition duration-150 shrink-0" />
      </div>

      {/* Dropup Menu with Scale/Slide Animation */}
      <div className={`absolute bottom-[52px] left-0 right-0 bg-white border border-slate-200/80 rounded-2xl shadow-lg z-50 p-2 flex flex-col gap-1 transition-all duration-200 origin-bottom ${
        isOpen 
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" 
          : "opacity-0 translate-y-2 scale-95 pointer-events-none"
      }`}>
        <div className="px-2 py-1.5 border-b border-slate-50 mb-1">
          <p className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">Select Status</p>
          <div className="flex gap-1.5 mt-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setStatus("online");
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent("employee-status-changed", { detail: { status: "online" } }));
              }}
              className={`flex-1 py-1 rounded-lg text-[10.5px] font-extrabold border transition ${
                status === "online" 
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700" 
                  : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
              }`}
            >
              🟢 Active
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setStatus("break");
                setIsOpen(false);
                window.dispatchEvent(new CustomEvent("employee-status-changed", { detail: { status: "break" } }));
              }}
              className={`flex-1 py-1 rounded-lg text-[10.5px] font-extrabold border transition ${
                status === "break" 
                  ? "bg-amber-50 border-amber-100 text-amber-700" 
                  : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
              }`}
            >
              🟡 Break
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
