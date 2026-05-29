"use client";

import { useState, useEffect } from "react";
import { Mail, Check, Eye, Reply, ChevronDown, ChevronUp, Clock, AlertCircle } from "lucide-react";
import { fetchCreatorPitches } from "@/app/employee/pitch-actions";

interface PitchRecord {
  id: string;
  template_type: "initial_outreach" | "pricing_offer" | "campaign_brief";
  subject: string;
  body: string;
  status: "sent" | "opened" | "replied";
  sent_at: string;
}

interface PitchHistoryListProps {
  creatorId: string;
  refreshTrigger?: number;
}

export function PitchHistoryList({ creatorId, refreshTrigger }: PitchHistoryListProps) {
  const [pitches, setPitches] = useState<PitchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function loadPitches() {
      if (!creatorId) return;
      try {
        const res = await fetchCreatorPitches(creatorId);
        if (res.pitches) {
          setPitches(res.pitches as PitchRecord[]);
          setIsDemo(!!res.isMock);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPitches();
  }, [creatorId, refreshTrigger]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "replied":
        return (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-50 border border-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full shrink-0">
            <Reply className="h-2.5 w-2.5" /> Replied
          </span>
        );
      case "opened":
        return (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-amber-50 border border-amber-100 text-amber-500 px-2 py-0.5 rounded-full shrink-0">
            <Eye className="h-2.5 w-2.5" /> Opened
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[9px] font-black uppercase bg-blue-50 border border-blue-100 text-blue-500 px-2 py-0.5 rounded-full shrink-0">
            <Check className="h-2.5 w-2.5" /> Sent
          </span>
        );
    }
  };

  const getTemplateLabel = (type: string) => {
    switch (type) {
      case "pricing_offer":
        return "Compensation Offer";
      case "campaign_brief":
        return "Campaign Brief";
      default:
        return "Outreach Pitch";
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-2 shrink-0">
        <Mail className="h-4 w-4 text-slate-500" />
        <h4 className="text-[12px] font-black text-slate-900 flex items-center gap-2">
          Outreach Pitch Logs
          {isDemo && (
            <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
              Demo
            </span>
          )}
        </h4>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-100 border-t-indigo-500"></div>
        </div>
      ) : pitches.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-1 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-center">
          <AlertCircle className="h-5 w-5 text-slate-300 stroke-[1.5]" />
          <p className="text-[11px] font-bold text-slate-500">No pitches logged</p>
          <p className="text-[10px]">Click "Pitch Creator" below to start outreach.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pitches.map((p) => {
            const isExpanded = expandedId === p.id;
            return (
              <div 
                key={p.id}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:border-slate-200 transition"
              >
                {/* Header row */}
                <div 
                  onClick={() => toggleExpand(p.id)}
                  className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/30 transition select-none"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-black bg-indigo-50 border border-indigo-100 text-indigo-500 px-2 py-0.5 rounded-md">
                        {getTemplateLabel(p.template_type)}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {formatTime(p.sent_at)}
                      </span>
                    </div>
                    <h5 className="text-[12px] font-bold text-slate-800 truncate pr-2">
                      {p.subject}
                    </h5>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(p.status)}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                </div>

                {/* Expanded body details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1.5 border-t border-slate-50 bg-slate-50/20">
                    <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-inner">
                      <p className="text-[11px] text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">
                        {p.body}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
