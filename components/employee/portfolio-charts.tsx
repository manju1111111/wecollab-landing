"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { TrendingUp, PieChart as PieIcon, BarChart2 } from "lucide-react";

// ─── Follower Growth Chart ─────────────────────────────────────────────────
export function PortfolioGrowthChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-[15px]">Roster Follower Growth</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">Cumulative across your assigned creators</p>
        </div>
        <TrendingUp className="h-5 w-5 text-indigo-400" />
      </div>
      <div className="flex-1 min-h-[160px] -mx-2">
        {data.length > 1 ? (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="empGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} minTickGap={24} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} width={36} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: "12px" }} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill="url(#empGrowth)" activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center">
            <p className="text-[13px] text-slate-300 font-medium">Not enough data yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Category Breakdown Pie ────────────────────────────────────────────────
const RADIAN = Math.PI / 180;

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) {
  if (percent < 0.07) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={700}>
      {Math.round(percent * 100)}%
    </text>
  );
}

const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6"];

export function CategoryBreakdownChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-[15px]">Category Breakdown</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">Your portfolio by niche</p>
        </div>
        <PieIcon className="h-5 w-5 text-amber-400" />
      </div>
      {data.length > 0 ? (
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <PieChart width={140} height={140}>
              <Pie data={data} cx={65} cy={65} innerRadius={38} outerRadius={65} labelLine={false} label={CustomLabel} dataKey="value">
                {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
            </PieChart>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            {data.slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                <span className="text-[12px] font-semibold text-slate-700 truncate flex-1">{d.name}</span>
                <span className="text-[12px] font-bold text-slate-400">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-36 flex items-center justify-center">
          <p className="text-[13px] text-slate-300 font-medium">No creators assigned yet</p>
        </div>
      )}
    </div>
  );
}

// ─── Platform Mix Bar Chart ────────────────────────────────────────────────
const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#e1306c",
  YouTube: "#ff0000",
  TikTok: "#010101",
  Twitter: "#1da1f2",
  LinkedIn: "#0077b5",
};

export function PlatformMixChart({ data }: { data: { name: string; value: number }[] }) {
  const colored = data.map(d => ({ ...d, fill: PLATFORM_COLORS[d.name] || "#6366f1" }));
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-[15px]">Platform Mix</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">Creators per platform</p>
        </div>
        <BarChart2 className="h-5 w-5 text-emerald-400" />
      </div>
      {data.length > 0 ? (
        <div className="-mx-2">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={colored} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={28}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} width={24} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: "12px" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {colored.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-36 flex items-center justify-center">
          <p className="text-[13px] text-slate-300 font-medium">No platform data yet</p>
        </div>
      )}
    </div>
  );
}
