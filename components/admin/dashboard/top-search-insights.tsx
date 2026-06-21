"use client";

import { Search } from "lucide-react";

interface SearchInsight {
  query: string;
  searches: number;
}

export function TopSearchInsights({ insights = [] }: { insights?: SearchInsight[] }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[320px] flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className="text-[14px] font-bold text-slate-900">Top Search Insights</h3>
        <button className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1">
          Today <span className="opacity-50 text-[8px]">▼</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar mt-2 min-h-0">
        {insights.length > 0 ? (
          insights.map((insight, i) => (
            <div key={i} className="flex items-center justify-between gap-4 w-full min-w-0 group">
              <div className="text-[12px] font-semibold text-slate-700 truncate min-w-0 flex-1 group-hover:text-indigo-600 transition-colors">
                {insight.query}
              </div>
              <div className="text-[11px] font-bold text-slate-500 shrink-0 whitespace-nowrap bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                {insight.searches} search{insight.searches !== 1 ? "es" : ""}
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-350 gap-1.5 py-4">
            <Search className="h-6 w-6 stroke-[1.5]" />
            <p className="text-[11px] font-bold">No search insights logged yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
