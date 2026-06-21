"use client";

import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export function OverviewMetricsStrip({ 
  totalCreators = 0,
  activeCreators = 0,
  newCreatorsToday = 0,
  pendingVerifications = 0,
  totalEmployees = 0,
  activeEmployeesToday = 0,
  tasksPending = 0,
  campaignsRunning = 0
}: {
  totalCreators?: number;
  activeCreators?: number;
  newCreatorsToday?: number;
  pendingVerifications?: number;
  totalEmployees?: number;
  activeEmployeesToday?: number;
  tasksPending?: number;
  campaignsRunning?: number;
}) {
  const dummyData = [
    { value: 10 }, { value: 15 }, { value: 25 }, { value: 20 }, { value: 35 }, { value: 30 }, { value: 45 }
  ];

  const metrics = [
    { title: "Total Creators", count: totalCreators.toLocaleString(), daily: "+12", weekly: "+2.5%" },
    { title: "Active Creators", count: activeCreators.toLocaleString(), daily: "+8", weekly: "+4.3%" },
    { title: "New Creators Today", count: newCreatorsToday.toLocaleString(), daily: `+${newCreatorsToday}`, weekly: "+18.2%" },
    { title: "Pending Verifications", count: pendingVerifications.toLocaleString(), daily: "+2", weekly: "+8.2%" },
    { title: "Total Employees", count: totalEmployees.toLocaleString(), daily: "+1", weekly: "+5.0%" },
    { title: "Active Today", count: activeEmployeesToday.toLocaleString(), daily: `${totalEmployees > 0 ? ((activeEmployeesToday / totalEmployees) * 100).toFixed(0) : 0}% of team`, weekly: "Live now" },
    { title: "Tasks Pending", count: tasksPending.toLocaleString(), daily: "Needs action", weekly: "Assigned tasks", noChart: true },
    { title: "Campaigns Running", count: campaignsRunning.toLocaleString(), daily: "+1", weekly: "+4.4%" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 w-full">
      {metrics.map((m, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between h-36 relative overflow-hidden group hover:border-indigo-100 transition-colors">
          <div className="min-w-0">
            <h3 className="text-[12px] font-semibold text-slate-500 mb-1 truncate">{m.title}</h3>
            <div className="text-2xl font-bold text-slate-900 tracking-tight truncate">{m.count}</div>
          </div>
          
          <div className="z-10 min-w-0 pb-1">
            <div className="text-[11px] font-bold text-emerald-500 truncate">{m.daily} {m.title !== "Active Today" && m.title !== "Tasks Pending" ? "today" : ""}</div>
            <div className="text-[10px] font-medium text-slate-400 mt-0.5 truncate">{m.weekly} {m.title !== "Active Today" && m.title !== "Tasks Pending" ? "vs last week" : m.title === "Active Today" ? "vs yesterday" : ""}</div>
          </div>

          {!m.noChart && (
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dummyData}>
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
