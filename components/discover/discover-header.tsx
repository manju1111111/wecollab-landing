"use client";

import { Search, Sparkles } from "lucide-react";

export function DiscoverHeader({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
}) {
  const prompts = [
    { label: "Skincare routine", query: "Skincare routine" },
    { label: "Tech unboxing", query: "Tech unboxing" },
    { label: "Luxury travel", query: "Luxury travel" },
    { label: "Personal finance", query: "Personal finance" },
    { label: "Home workouts", query: "Home workouts" }
  ];

  return (
    <div className="flex flex-col justify-center border-b border-slate-200 bg-white px-6 py-4 shrink-0 gap-3">
      <div className="flex items-center gap-4">
        <div className="relative flex flex-1 items-center">
          <div className="pointer-events-none absolute left-4 flex items-center gap-2 text-slate-400">
            <Search className="h-4 w-4" strokeWidth={2} />
            <Sparkles className="h-4 w-4 text-primary animate-pulse" strokeWidth={2} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type names, categories or keywords mentioned in their posts or bios"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-14 pr-4 text-[13px] text-slate-900 outline-none transition-all duration-300 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 shadow-sm"
          />
        </div>
        <button className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-6 text-[13px] font-bold text-white transition-all shadow-md shadow-primary/10 cursor-pointer">
          <Search className="h-4 w-4" strokeWidth={2.5} />
          Search
        </button>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Suggest:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {prompts.map((p) => (
            <button
              key={p.label}
              onClick={() => setSearchQuery(p.query)}
              className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-primary-soft hover:border-primary/30 hover:text-primary text-slate-600 font-bold transition-all cursor-pointer shadow-sm text-[10px]"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
