"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, TrendingUp, Users, Eye, Info } from "lucide-react";
import { resolveCreatorImage } from "@/lib/avatar-utils";
import { CreatorQuickView } from "./creator-quick-view";

const DEAL_COLORS: Record<string, string> = {
  new:             "bg-slate-100 text-slate-500",
  contacted:       "bg-blue-100 text-blue-700",
  negotiating:     "bg-amber-100 text-amber-700",
  deal_closed:     "bg-emerald-100 text-emerald-700",
  not_interested:  "bg-rose-100 text-rose-700",
};
const DEAL_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", negotiating: "Negotiating",
  deal_closed: "Deal Closed", not_interested: "Not Interested",
};

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function Avatar({ src, name }: { src?: string; name: string }) {
  const [err, setErr] = useState(false);
  const safeSrc = resolveCreatorImage({ profile_image: src });
  const initials = name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["from-violet-400 to-indigo-500", "from-rose-400 to-pink-500", "from-fuchsia-400 to-primary", "from-emerald-400 to-teal-500"];
  const grad = colors[name.charCodeAt(0) % colors.length];

  if (!safeSrc || err) {
    return (
      <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-[12px] shrink-0`}>
        {initials || "?"}
      </div>
    );
  }
  return <img src={safeSrc} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setErr(true)} className="h-9 w-9 rounded-full object-cover shrink-0" />;
}

interface AssignedCreatorsTableProps {
  creators: any[];
  employeeId: string;
}

export function AssignedCreatorsTable({ creators, employeeId }: AssignedCreatorsTableProps) {
  const [selected, setSelected] = useState<any | null>(null);
  const [sortCol, setSortCol] = useState<"followers" | "engagement_rate">("followers");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [search, setSearch] = useState("");

  const filtered = creators
    .filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.username?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === "desc" ? (b[sortCol] || 0) - (a[sortCol] || 0) : (a[sortCol] || 0) - (b[sortCol] || 0));

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  if (creators.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center py-16 text-center">
        <Users className="h-10 w-10 text-slate-200 mb-3" />
        <h3 className="font-bold text-slate-700 mb-1">No Creators Assigned Yet</h3>
        <p className="text-[13px] text-slate-400 max-w-xs">Once an admin assigns creators to you, they will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-[15px]">My Assigned Creators</h3>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creators..."
            className="h-9 px-3 rounded-lg border border-slate-200 text-[13px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 w-48"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-5 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Creator</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Category</th>
                <th
                  onClick={() => toggleSort("followers")}
                  className="text-right px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider cursor-pointer hover:text-slate-600 select-none"
                >
                  Followers {sortCol === "followers" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th
                  onClick={() => toggleSort("engagement_rate")}
                  className="text-right px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider cursor-pointer hover:text-slate-600 select-none"
                >
                  ER% {sortCol === "engagement_rate" ? (sortDir === "desc" ? "↓" : "↑") : ""}
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(creator => {
                const dealStatus = creator._deal_status || "new";
                return (
                  <tr key={creator.id} className="hover:bg-slate-50/70 transition group">
                    {/* Creator Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar src={creator.profile_image} name={creator.name} />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-slate-900">{creator.name}</span>
                            {creator.verified && <CheckCircle2 className="h-3.5 w-3.5 fill-blue-500 text-white" />}
                          </div>
                          <span className="text-slate-400 text-[12px]">@{creator.username}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-1 rounded-full">
                        {creator.category || "General"}
                      </span>
                    </td>

                    {/* Followers */}
                    <td className="px-4 py-3.5 text-right font-semibold text-slate-700">
                      {fmt(creator.followers || 0)}
                    </td>

                    {/* ER */}
                    <td className="px-4 py-3.5 text-right">
                      <span className={`font-bold ${(creator.engagement_rate || 0) >= 5 ? "text-emerald-600" : "text-slate-600"}`}>
                        {creator.engagement_rate || 0}%
                      </span>
                    </td>

                    {/* Deal Status */}
                    <td className="px-4 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${DEAL_COLORS[dealStatus]}`}>
                        {DEAL_LABELS[dealStatus]}
                      </span>
                    </td>

                    {/* View */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setSelected(creator)}
                        className="opacity-0 group-hover:opacity-100 transition h-8 w-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-indigo-600"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 text-[12px] text-slate-400">
          {filtered.length} of {creators.length} creators
        </div>
      </div>

      {/* Quick View Panel */}
      {selected && (
        <CreatorQuickView
          creator={selected}
          employeeId={employeeId}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
