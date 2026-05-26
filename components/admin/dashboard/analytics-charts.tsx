"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight } from "lucide-react";

const data = [
  { name: 'Mon', creators: 4000, active: 2400 },
  { name: 'Tue', creators: 4500, active: 2500 },
  { name: 'Wed', creators: 4200, active: 2800 },
  { name: 'Thu', creators: 5800, active: 3100 },
  { name: 'Fri', creators: 6500, active: 3800 },
  { name: 'Sat', creators: 6100, active: 4200 },
  { name: 'Sun', creators: 7500, active: 4800 },
];

export function AnalyticsCharts() {
  return (
    <div className="rounded-[24px] bg-white p-6 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Growth Analytics</h2>
          <p className="text-[13px] font-medium text-slate-500">Creator acquisition this week</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-300" />
            <span className="text-[11px] font-bold text-slate-500 uppercase">Active</span>
          </div>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-6">
        <div className="text-4xl font-black text-slate-900 tracking-tighter">7,500</div>
        <div className="flex items-center gap-1 text-[13px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full mb-1.5">
          <ArrowUpRight className="h-3.5 w-3.5" /> +18.2%
        </div>
      </div>

      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCreators" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#93c5fd" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
              itemStyle={{ fontWeight: 'bold' }}
              labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold', fontSize: '12px' }}
            />
            <Area 
              type="monotone" 
              dataKey="creators" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCreators)" 
            />
            <Area 
              type="monotone" 
              dataKey="active" 
              stroke="#60a5fa" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorActive)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
