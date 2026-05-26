"use client";

import { Search, Sparkles } from "lucide-react";

export function DiscoverHeader({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (s: string) => void;
}) {
  return (
    <div className="flex h-[72px] items-center border-b border-slate-200 bg-white px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex flex-1 items-center">
          <div className="pointer-events-none absolute left-4 flex items-center gap-2 text-slate-400">
            <Search className="h-4 w-4" strokeWidth={2} />
            <Sparkles className="h-4 w-4 text-pink-400" strokeWidth={2} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type names, categories or keywords mentioned in their posts or bios"
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-14 pr-4 text-[13px] text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
          />
        </div>
        <button className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#768194] px-6 text-[13px] font-semibold text-white transition hover:bg-[#606b7d]">
          <Search className="h-4 w-4" strokeWidth={2.5} />
          Search
        </button>
      </div>
    </div>
  );
}
