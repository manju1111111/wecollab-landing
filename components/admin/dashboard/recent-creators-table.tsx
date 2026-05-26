"use client";

import Image from "next/image";
import { CheckCircle2, ChevronRight, MoreHorizontal } from "lucide-react";

export function RecentCreatorsTable({ creators }: { creators: any[] }) {
  const data = creators && creators.length > 0 ? creators.slice(0, 4) : [];

  return (
    <div className="rounded-[24px] bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] border border-slate-200/60 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Creator Database</h2>
          <p className="text-[13px] font-medium text-slate-500">Recently updated profiles</p>
        </div>
        <button className="flex items-center gap-1 text-[13px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
          View Full Table <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-50/50">
            <tr>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Creator</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Metrics</th>
              <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="py-4 px-6 text-right"></th>
            </tr>
          </thead>
            {data.length > 0 ? data.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <Image src={c.profile_image || `https://i.pravatar.cc/150?u=${c.username || i}`} alt={c.name} fill className="object-cover" />
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[12px] font-medium text-slate-500">
                        @{c.username}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                    {c.platform || "Instagram"}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-slate-900">{c.followers || 0} <span className="text-[11px] text-slate-400 font-medium">followers</span></span>
                    <span className="text-[12px] font-bold text-emerald-600">{c.engagement_rate || c.er || 0}% ER</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1.5">
                    {(c.verification_status || c.status) === "Verified" && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                    {(c.verification_status || c.status) === "Pending Verification" && <div className="h-2 w-2 rounded-full bg-amber-400" />}
                    {(c.verification_status || c.status) === "Rejected" && <div className="h-2 w-2 rounded-full bg-rose-500" />}
                    <span className={`text-[12px] font-bold ${
                      (c.verification_status || c.status) === "Verified" ? "text-emerald-700" : 
                      (c.verification_status || c.status) === "Pending Verification" ? "text-amber-700" : "text-rose-700"
                    }`}>{c.verification_status || c.status || 'Draft'}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 text-[13px] font-medium">
                  No recent creators found. Import a CSV to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
