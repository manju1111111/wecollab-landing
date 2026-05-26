"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function ProgressOverview() {
  const data = [
    { name: 'M', hours: 4.2 },
    { name: 'T', hours: 5.1 },
    { name: 'W', hours: 3.8 },
    { name: 'T', hours: 6.2 },
    { name: 'F', hours: 7.5 },
    { name: 'S', hours: 0 },
    { name: 'S', hours: 0 },
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[280px] flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[14px] font-bold text-slate-900">Progress Overview</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-slate-900">6.1h</span>
            <span className="text-[11px] text-slate-400 font-medium leading-tight">Work Time<br/>This week</span>
          </div>
        </div>
        <button className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          This Week <span className="ml-1 opacity-50">▼</span>
        </button>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={8} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
            <Bar dataKey="hours" radius={[10, 10, 10, 10]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 4 ? '#2563eb' : '#1e3a8a'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Tooltip bubble mockup for max value */}
        <div className="absolute top-0 right-8 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          +1.2h
        </div>
      </div>
    </div>
  );
}
