"use client";

export function TopSearchInsights() {
  const insights = [
    { query: "Fitness creators in Bangalore", searches: 128 },
    { query: "Fashion influencers under 100k", searches: 96 },
    { query: "Tech YouTubers India", searches: 74 },
    { query: "Travel creators with high engagement", searches: 63 },
    { query: "Lifestyle creators Mumbai", searches: 52 },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[320px] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-bold text-slate-900">Top Search Insights</h3>
        <button className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex items-center gap-1">
          Today <span className="opacity-50 text-[8px]">▼</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 flex-1 overflow-y-auto custom-scrollbar mt-2">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-center justify-between gap-4 w-full min-w-0">
            <div className="text-[12px] font-semibold text-slate-700 truncate min-w-0 flex-1">
              {insight.query}
            </div>
            <div className="text-[11px] font-bold text-slate-500 shrink-0 whitespace-nowrap">
              {insight.searches} searches
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
