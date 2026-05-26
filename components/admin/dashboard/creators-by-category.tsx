"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function CreatorsByCategory({ data: propData, total }: { data?: {name: string, value: number, color: string}[], total?: number }) {
  const data = propData && propData.length > 0 ? propData : [];
  const totalValue = total || 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[280px] flex flex-col">
      <h3 className="text-[14px] font-bold text-slate-900 mb-2">Creators by Category</h3>
      
      <div className="flex-1 flex items-center justify-between">
        {data.length > 0 ? (
          <>
            <div className="relative w-[140px] h-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[16px] font-bold text-slate-900">{totalValue.toLocaleString()}</span>
                <span className="text-[10px] font-medium text-slate-500">Total</span>
              </div>
            </div>

            <div className="flex-1 pl-6 flex flex-col justify-center gap-2 min-w-0">
              {data.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] font-semibold gap-2 w-full min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 truncate">{item.name}</span>
                  </div>
                  <span className="text-slate-900 shrink-0">{item.value}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-[13px] font-medium">
             No category data available
          </div>
        )}
      </div>
    </div>
  );
}
