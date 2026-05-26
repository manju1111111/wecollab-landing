"use client";

import Image from "next/image";
import { Scissors, CheckCircle, FileSpreadsheet } from "lucide-react";

export function RecentActivityFeed({ activities: propActivities }: { activities?: any[] }) {
  const activities = propActivities || [
    {
      type: "new_creator",
      content: "New creator Ananya Sharma added by Rahul",
      time: "2 min ago",
      icon: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
      isImage: true
    },
    {
      type: "update",
      content: "Profile updated for @tech_with_rahul",
      time: "15 min ago",
      icon: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80",
      isImage: true
    },
    {
      type: "delete",
      content: "Duplicate entry removed: Raj Sharma",
      time: "35 min ago",
      icon: Scissors,
      isImage: false,
      color: "bg-red-100 text-red-500"
    },
    {
      type: "verify",
      content: "Creator verified: Neha Kapoor",
      time: "1 hr ago",
      icon: CheckCircle,
      isImage: false,
      color: "bg-emerald-100 text-emerald-500"
    },
    {
      type: "import",
      content: "CSV import completed: 120 creators",
      time: "2 hr ago",
      icon: FileSpreadsheet,
      isImage: false,
      color: "bg-blue-100 text-blue-500"
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[320px] flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[14px] font-bold text-slate-900">Recent Activity</h3>
        <button className="text-[11px] font-bold text-blue-500 hover:text-blue-600">View All</button>
      </div>

      <div className="flex flex-col gap-4 flex-1 overflow-y-auto custom-scrollbar">
        {activities.map((act, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {act.isImage ? (
                <div className="h-6 w-6 rounded-full overflow-hidden">
                  <Image src={act.icon as string} alt="" width={24} height={24} className="object-cover" />
                </div>
              ) : (
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${act.color}`}>
                  {(() => {
                    const Icon = act.icon as any;
                    return <Icon className="h-3 w-3" />;
                  })()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold text-slate-700 leading-tight">
                {act.content}
              </p>
              <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap shrink-0">{act.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
