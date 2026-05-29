"use client";

import { useState, useTransition, useEffect } from "react";
import { CheckCircle2, Move, ArrowRight, Clock, Activity, RefreshCw } from "lucide-react";
import { resolveCreatorImage } from "@/lib/avatar-utils";
import { updateDealStatus } from "@/app/employee/creator-actions";

type DealStatus = "new" | "contacted" | "negotiating" | "deal_closed" | "not_interested";

const COLUMNS: { id: DealStatus; label: string; color: string; border: string; header: string }[] = [
  { id: "new",            label: "New",            color: "bg-slate-50/85",   border: "border-slate-200",  header: "text-slate-500" },
  { id: "contacted",      label: "Contacted",      color: "bg-blue-50/60",    border: "border-blue-200/60",   header: "text-blue-600" },
  { id: "negotiating",    label: "Negotiating",    color: "bg-purple-50/50",  border: "border-purple-200/50", header: "text-purple-600" },
  { id: "deal_closed",    label: "Deal Closed",    color: "bg-emerald-50/70", border: "border-emerald-200/60",header: "text-emerald-600" },
  { id: "not_interested", label: "Not Interested", color: "bg-rose-50/50",    border: "border-rose-200/50",   header: "text-rose-500" },
];

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  negotiating: "Negotiating",
  deal_closed: "Closed",
  not_interested: "No Match"
};

const STATUS_BADGES: Record<string, string> = {
  new: "bg-slate-100 text-slate-600 border-slate-200",
  contacted: "bg-blue-50 text-blue-600 border-blue-100",
  negotiating: "bg-purple-50 text-purple-650 border-purple-100",
  deal_closed: "bg-emerald-50 text-emerald-600 border-emerald-100",
  not_interested: "bg-rose-50 text-rose-600 border-rose-100"
};

export interface PipelineHistoryEvent {
  id: string;
  creator_name: string;
  creator_username: string;
  from_status: string | null;
  to_status: string;
  changed_at: string;
}

interface PipelineCreator {
  id: string;
  name: string;
  username: string;
  profile_image?: string;
  category?: string;
  followers: number;
  deal_status: DealStatus;
}

interface DealPipelineProps {
  creators: PipelineCreator[];
  employeeId: string;
  history?: PipelineHistoryEvent[];
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Avatar({ src, name, size = "sm" }: { src?: string; name: string; size?: "sm" | "md" }) {
  const [err, setErr] = useState(false);
  const safeSrc = resolveCreatorImage({ profile_image: src });
  const initials = name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["from-violet-400 to-indigo-500", "from-rose-400 to-pink-500", "from-fuchsia-400 to-primary", "from-emerald-400 to-teal-500"];
  const grad = colors[name.charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-[13px]";

  if (!safeSrc || err) {
    return <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold shrink-0`}>{initials}</div>;
  }
  return <img src={safeSrc} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setErr(true)} className={`${sz} rounded-full object-cover shrink-0`} />;
}

function CreatorCard({ 
  creator, 
  onMove,
  isBeingDragged
}: { 
  creator: PipelineCreator; 
  onMove: (id: string, status: DealStatus) => void;
  isBeingDragged: boolean;
}) {
  const [showMover, setShowMover] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", creator.id);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      className={`bg-white rounded-xl border p-3.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing select-none group relative ${
        isBeingDragged 
          ? "opacity-35 border-dashed border-primary shadow-none" 
          : "border-slate-200 hover:border-slate-350"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <Avatar src={creator.profile_image} name={creator.name} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-black text-slate-900 truncate">{creator.name}</p>
          <p className="text-[11px] text-primary font-bold">@{creator.username}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2.5 top-3.5 text-slate-400">
          <Move className="h-3.5 w-3.5 shrink-0" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{creator.category || "General"}</span>
        <span className="text-[11px] font-black text-slate-600">{fmt(creator.followers)}</span>
      </div>

      {/* Manual Keyboard Fallback */}
      <div className="mt-2.5 pt-2 border-t border-slate-100">
        <button
          onClick={() => setShowMover(v => !v)}
          className="text-[11px] text-slate-400 hover:text-primary font-bold transition w-full text-left flex items-center justify-between cursor-pointer"
        >
          <span>Move to...</span>
          <span>{showMover ? "▲" : "▼"}</span>
        </button>
        {showMover && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {COLUMNS.filter(c => c.id !== creator.deal_status).map(col => (
              <button
                key={col.id}
                onClick={() => { onMove(creator.id, col.id); setShowMover(false); }}
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${col.color} ${col.border} ${col.header} hover:opacity-85`}
              >
                {col.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DealPipeline({ creators: initial, employeeId, history: initialHistory }: DealPipelineProps) {
  const [creators, setCreators] = useState<PipelineCreator[]>(initial);
  const [history, setHistory] = useState<PipelineHistoryEvent[]>(initialHistory || []);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<DealStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  // Keep list updated if server state updates
  useEffect(() => {
    setCreators(initial);
  }, [initial]);

  useEffect(() => {
    setHistory(initialHistory || []);
  }, [initialHistory]);

  const handleMove = (creatorId: string, newStatus: DealStatus) => {
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return;

    const oldStatus = creator.deal_status;
    if (oldStatus === newStatus) return;

    // 1. Optimistic UI update for Kanban Board
    setCreators(prev => prev.map(c => c.id === creatorId ? { ...c, deal_status: newStatus } : c));

    // 2. Optimistic UI update for Live Activity Logs
    const newLogEvent: PipelineHistoryEvent = {
      id: `tmp-log-${Date.now()}`,
      creator_name: creator.name,
      creator_username: creator.username,
      from_status: oldStatus,
      to_status: newStatus,
      changed_at: new Date().toISOString()
    };
    setHistory(prev => [newLogEvent, ...prev]);

    // 3. Dispatch Server Action
    startTransition(async () => {
      await updateDealStatus({ employeeId, creatorId, dealStatus: newStatus });
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 w-full items-stretch">
      
      {/* Kanban Board Container (Left) */}
      <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
        <div>
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-[15px] tracking-tight">Pipeline Board</h3>
              <p className="text-[12px] text-slate-400 mt-0.5">Drag-and-drop creators between stages to update deal states</p>
            </div>
          </div>

          <div className="p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-[750px] items-stretch">
              {COLUMNS.map(col => {
                const colCreators = creators.filter(c => c.deal_status === col.id);
                const isDraggingOver = activeDropCol === col.id;

                return (
                  <div 
                    key={col.id} 
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (activeDropCol !== col.id) {
                        setActiveDropCol(col.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (activeDropCol === col.id) {
                        setActiveDropCol(null);
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const cid = e.dataTransfer.getData("text/plain") || draggedId;
                      if (cid) {
                        handleMove(cid, col.id);
                      }
                      setActiveDropCol(null);
                      setDraggedId(null);
                    }}
                    className={`flex-1 rounded-2xl p-3 min-w-[155px] border transition-all duration-300 flex flex-col justify-between ${
                      isDraggingOver 
                        ? "ring-2 ring-primary ring-offset-2 border-primary bg-primary-soft/10 scale-[1.01]" 
                        : `${col.color} ${col.border}`
                    }`}
                  >
                    <div>
                      {/* Column header */}
                      <div className="flex items-center justify-between mb-3 border-b border-slate-200/20 pb-2">
                        <span className={`text-[11.5px] font-black ${col.header} uppercase tracking-wider`}>{col.label}</span>
                        <span className={`text-[10px] font-black ${col.header} opacity-85 bg-white/70 rounded-full px-2 py-0.5 border border-slate-200/10 shadow-sm`}>
                          {colCreators.length}
                        </span>
                      </div>

                      {/* Cards container */}
                      <div className="flex flex-col gap-2.5 min-h-[260px]">
                        {colCreators.map(creator => (
                          <div 
                            key={creator.id}
                            onDragStart={() => setDraggedId(creator.id)}
                            onDragEnd={() => {
                              setDraggedId(null);
                              setActiveDropCol(null);
                            }}
                          >
                            <CreatorCard 
                              creator={creator} 
                              onMove={handleMove} 
                              isBeingDragged={draggedId === creator.id}
                            />
                          </div>
                        ))}
                        {colCreators.length === 0 && (
                          <div className="h-44 border border-dashed border-slate-200/50 rounded-xl flex flex-col items-center justify-center text-center p-3 select-none">
                            <p className="text-[10px] text-slate-350 font-bold uppercase tracking-wider">Empty Stage</p>
                            <p className="text-[9px] text-slate-300 mt-1 max-w-[100px] leading-tight">Drag creators here</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend / Stats */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center gap-5 flex-wrap">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full border ${col.border} shadow-sm bg-white`} />
              <span className="text-[11px] font-bold text-slate-500">{col.label}: {creators.filter(c => c.deal_status === col.id).length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Sidebar (Right) */}
      <div className="xl:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col p-5">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
          <Activity className="h-4.5 w-4.5 text-primary" />
          <h3 className="font-extrabold text-slate-900 text-[14px] tracking-tight">Audit Logs</h3>
        </div>

        {/* History Stream */}
        <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 flex flex-col gap-3">
          {history.length === 0 ? (
            <div className="py-16 text-center">
              <RefreshCw className="h-8 w-8 text-slate-200 mx-auto mb-2 animate-spin" />
              <p className="text-[11px] text-slate-400 font-bold">Waiting for updates...</p>
              <p className="text-[10px] text-slate-300 mt-0.5">Stage logs generate dynamically</p>
            </div>
          ) : (
            history.map((event) => {
              const fromLabel = event.from_status ? STATUS_LABELS[event.from_status] : "New";
              const toLabel = STATUS_LABELS[event.to_status] || "New";
              
              const fromBadge = event.from_status ? STATUS_BADGES[event.from_status] : STATUS_BADGES.new;
              const toBadge = STATUS_BADGES[event.to_status] || STATUS_BADGES.new;

              return (
                <div key={event.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col gap-2 hover:bg-slate-50 hover:border-slate-200/60 transition duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-black text-slate-800 truncate max-w-[120px]">
                      @{event.creator_username || event.creator_name}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold shrink-0">
                      <Clock className="h-3 w-3" />
                      {timeAgo(event.changed_at)}
                    </span>
                  </div>

                  {/* Visual transition path */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${fromBadge}`}>
                      {fromLabel}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-350 shrink-0" />
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${toBadge}`}>
                      {toLabel}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
