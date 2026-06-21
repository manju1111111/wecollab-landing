"use client";

import { useState, useTransition, useEffect } from "react";
import { 
  CheckCircle, 
  Move, 
  ArrowRight, 
  Clock, 
  Activity, 
  RefreshCw, 
  Search, 
  Plus, 
  Filter, 
  List, 
  Kanban, 
  Layers, 
  TrendingUp, 
  Coins, 
  UserPlus, 
  X, 
  ChevronRight, 
  ArrowUpDown, 
  Info,
  Calendar,
  Check
} from "lucide-react";
import { resolveCreatorImage } from "@/lib/avatar-utils";
import { updateDealStatus, assignCreatorToEmployee } from "@/app/employee/creator-actions";

type DealStatus = "new" | "contacted" | "negotiating" | "deal_closed" | "not_interested";

const COLUMNS: { id: DealStatus; label: string; color: string; border: string; text: string; bg: string }[] = [
  { id: "new",            label: "New",            color: "bg-slate-50",       border: "border-slate-200",  text: "text-slate-600",    bg: "bg-slate-100/70" },
  { id: "contacted",      label: "Contacted",      color: "bg-blue-50/40",     border: "border-blue-100",   text: "text-blue-600",     bg: "bg-blue-100/50" },
  { id: "negotiating",    label: "Negotiating",    color: "bg-purple-50/40",   border: "border-purple-100", text: "text-purple-600",   bg: "bg-purple-100/50" },
  { id: "deal_closed",    label: "Deal Closed",    color: "bg-emerald-50/40",  border: "border-emerald-100",text: "text-emerald-600",  bg: "bg-emerald-100/50" },
  { id: "not_interested", label: "Not Interested", color: "bg-rose-50/40",     border: "border-rose-100",   text: "text-rose-600",     bg: "bg-rose-100/50" },
];

const STATUS_BADGES: Record<string, string> = {
  new: "bg-slate-100 text-slate-600 border-slate-200",
  contacted: "bg-blue-50 text-blue-650 border-blue-100",
  negotiating: "bg-purple-50 text-purple-700 border-purple-100",
  deal_closed: "bg-emerald-50 text-emerald-755 border-emerald-100",
  not_interested: "bg-rose-50 text-rose-650 border-rose-100"
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
  engagement_rate?: number;
  collaboration_pricing?: number;
  estimated_rates?: any;
  deal_status: DealStatus;
}

interface DealPipelineProps {
  creators: PipelineCreator[];
  employeeId: string;
  history?: PipelineHistoryEvent[];
  unassignedCreators?: any[];
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtCurrency(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val);
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const getCampaignValue = (c: any) => {
  if (c.collaboration_pricing) return c.collaboration_pricing;
  if (c.estimated_rates?.reel) {
    const match = c.estimated_rates.reel.match(/[\d,]+/);
    if (match) return parseInt(match[0].replace(/,/g, ''), 10);
  }
  return Math.round((c.followers * 0.18) / 100) * 100 || 15000;
};

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

export function DealPipeline({ creators: initial, employeeId, history: initialHistory, unassignedCreators = [] }: DealPipelineProps) {
  const [creators, setCreators] = useState<PipelineCreator[]>(initial);
  const [history, setHistory] = useState<PipelineHistoryEvent[]>(initialHistory || []);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeDropCol, setActiveDropCol] = useState<DealStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  // UX Controls
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "followers" | "value">("value");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isActivityOpen, setIsActivityOpen] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Add Creator state
  const [searchUnassigned, setSearchUnassigned] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [unassignedList, setUnassignedList] = useState(unassignedCreators);

  // Sync if page revalidates
  useEffect(() => { setCreators(initial); }, [initial]);
  useEffect(() => { setHistory(initialHistory || []); }, [initialHistory]);
  useEffect(() => { setUnassignedList(unassignedCreators); }, [unassignedCreators]);

  const handleMove = (creatorId: string, newStatus: DealStatus) => {
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return;

    const oldStatus = creator.deal_status;
    if (oldStatus === newStatus) return;

    // Optimistic UI updates
    setCreators(prev => prev.map(c => c.id === creatorId ? { ...c, deal_status: newStatus } : c));

    const newLogEvent: PipelineHistoryEvent = {
      id: `tmp-log-${Date.now()}`,
      creator_name: creator.name,
      creator_username: creator.username,
      from_status: oldStatus,
      to_status: newStatus,
      changed_at: new Date().toISOString()
    };
    setHistory(prev => [newLogEvent, ...prev]);

    startTransition(async () => {
      await updateDealStatus({ employeeId, creatorId, dealStatus: newStatus });
    });
  };

  const handleAddCreator = async (creatorId: string) => {
    setAddingId(creatorId);
    const res = await assignCreatorToEmployee({ employeeId, creatorId });
    setAddingId(null);
    if (res.success) {
      // Find the creator in the unassigned list
      const added = unassignedList.find(c => c.id === creatorId);
      if (added) {
        // Add to local state
        setCreators(prev => [...prev, { ...added, deal_status: "new" }]);
        setUnassignedList(prev => prev.filter(c => c.id !== creatorId));
      }
      setIsAddOpen(false);
    } else {
      alert(res.error || "Failed to add creator.");
    }
  };

  // Filters & Sorters logic
  const filteredCreators = creators.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "followers") return b.followers - a.followers;
    return getCampaignValue(b) - getCampaignValue(a);
  });

  const categories = Array.from(new Set(creators.map(c => c.category).filter(Boolean)));

  // KPI calculations
  const totalDealsCount = creators.length;
  const activeDealsCount = creators.filter(c => ["new", "contacted", "negotiating"].includes(c.deal_status)).length;
  const closedDealsCount = creators.filter(c => c.deal_status === "deal_closed").length;
  
  const revenueTotal = creators
    .filter(c => c.deal_status === "deal_closed")
    .reduce((sum, c) => sum + getCampaignValue(c), 0);

  const activeRevenue = creators
    .filter(c => ["new", "contacted", "negotiating"].includes(c.deal_status))
    .reduce((sum, c) => sum + getCampaignValue(c), 0);

  return (
    <div className="flex flex-col gap-6 w-full pb-10">

      {/* ── Breadcrumb & Action Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Deal Pipeline</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">
            Manage your creators and monitor revenue projections.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setSortKey(sortKey === "value" ? "followers" : "value")}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-650 hover:bg-slate-50 text-[13px] font-bold transition cursor-pointer"
          >
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            Sort: {sortKey === "value" ? "Value" : "Followers"}
          </button>
          
          <button 
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-bold shadow-sm shadow-purple-100 transition duration-150 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Creator
          </button>
        </div>
      </div>

      {/* ── KPI SECTION ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Projections", value: fmtCurrency(revenueTotal + activeRevenue), desc: "Combined deal opportunities value", icon: Coins, color: "text-purple-600 bg-purple-50 border-purple-100" },
          { label: "Revenue Closed", value: fmtCurrency(revenueTotal), desc: `From ${closedDealsCount} successfully closed deals`, icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          { label: "Active Pipelines", value: activeDealsCount, desc: `Worth ${fmtCurrency(activeRevenue)} pending closing`, icon: Layers, color: "text-blue-600 bg-blue-50 border-blue-100" },
          { label: "Total Handled", value: totalDealsCount, desc: "Total creators assigned in workspace", icon: TrendingUp, color: "text-slate-600 bg-slate-50 border-slate-200" },
        ].map((card, idx) => (
          <div 
            key={idx} 
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-300 transition-all duration-200 group flex items-start justify-between"
          >
            <div className="flex flex-col gap-1.5">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-purple-700 transition duration-200">{card.value}</p>
              <p className="text-[11px] text-slate-400 font-semibold">{card.desc}</p>
            </div>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${card.color} shrink-0`}>
              <card.icon className="h-4.5 w-4.5" />
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH + FILTER + VIEW TOGGLE BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creator name or handle..."
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[13.5px] focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 transition"
          />
        </div>

        {/* Filters & Toggles */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 pl-3.5 pr-8 bg-white border border-slate-200 rounded-xl text-[12.5px] font-bold text-slate-650 outline-none hover:bg-slate-50 transition cursor-pointer appearance-none"
            >
              <option value="all">📁 All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* Kanban / List Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-[12px] font-bold transition cursor-pointer ${
                viewMode === "kanban" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              Board
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`h-8 px-3 rounded-lg flex items-center gap-1.5 text-[12px] font-bold transition cursor-pointer ${
                viewMode === "list" 
                  ? "bg-white text-slate-900 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          {/* Activity Pane Toggle */}
          <button
            onClick={() => setIsActivityOpen(!isActivityOpen)}
            className={`h-10 w-10 border rounded-xl flex items-center justify-center transition cursor-pointer ${
              isActivityOpen 
                ? "bg-purple-50 border-purple-200 text-purple-700" 
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            title="Toggle Activity Feed"
          >
            <Activity className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* ── CORE WORKSPACE GRID ── */}
      <div className="flex gap-6 items-stretch w-full">
        
        {/* Main Board / List View Area */}
        <div className="flex-1 min-w-0">
          
          {viewMode === "kanban" ? (
            // ── KANBAN BOARD ──
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-5 min-w-[1200px] items-stretch">
                {COLUMNS.map(col => {
                  const colCreators = filteredCreators.filter(c => c.deal_status === col.id);
                  const isDraggingOver = activeDropCol === col.id;

                  return (
                    <div
                      key={col.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (activeDropCol !== col.id) setActiveDropCol(col.id);
                      }}
                      onDragLeave={() => {
                        if (activeDropCol === col.id) setActiveDropCol(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const cid = e.dataTransfer.getData("text/plain") || draggedId;
                        if (cid) handleMove(cid, col.id);
                        setActiveDropCol(null);
                        setDraggedId(null);
                      }}
                      className={`flex-1 min-w-[280px] max-w-[360px] rounded-2xl p-4 border transition-all duration-300 flex flex-col ${
                        isDraggingOver
                          ? "ring-2 ring-purple-600 ring-offset-2 border-purple-300 bg-purple-550/5 scale-[1.01]"
                          : `bg-[#f8fafc]/60 border-slate-200/80`
                      }`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/40 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${col.bg} border`} />
                          <span className="text-[12.5px] font-black text-slate-800 tracking-tight">{col.label}</span>
                        </div>
                        <span className={`text-[10px] font-black text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 border border-slate-200`}>
                          {colCreators.length}
                        </span>
                      </div>

                      {/* Cards Stack */}
                      <div className="flex flex-col gap-3 min-h-[450px]">
                        {colCreators.map(creator => {
                          const val = getCampaignValue(creator);
                          return (
                            <div
                              key={creator.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/plain", creator.id);
                                setDraggedId(creator.id);
                              }}
                              onDragEnd={() => {
                                setDraggedId(null);
                                setActiveDropCol(null);
                              }}
                              className={`bg-white rounded-xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-slate-350 transition-all duration-200 cursor-grab active:cursor-grabbing group relative ${
                                draggedId === creator.id ? "opacity-30 border-dashed border-purple-500 shadow-none" : "border-slate-200"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <Avatar src={creator.profile_image} name={creator.name} size="md" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13.5px] font-black text-slate-900 truncate leading-tight group-hover:text-purple-650 transition duration-150">{creator.name}</p>
                                  <p className="text-[11px] text-purple-600 font-bold mt-0.5">@{creator.username}</p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-4 text-slate-350 cursor-pointer">
                                  <Move className="h-3.5 w-3.5 shrink-0" />
                                </div>
                              </div>

                              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pricing</span>
                                  <span className="text-slate-800 font-extrabold mt-0.5">{fmtCurrency(val)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Followers</span>
                                  <span className="text-slate-600 font-extrabold mt-0.5">{fmt(creator.followers)}</span>
                                </div>
                              </div>

                              {/* Manual keyboard selection */}
                              <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[9.5px] text-slate-400 uppercase tracking-widest font-black">{creator.category || "General"}</span>
                                <div className="flex gap-1">
                                  {COLUMNS.filter(colItem => colItem.id !== creator.deal_status).map(colItem => (
                                    <button
                                      key={colItem.id}
                                      onClick={() => handleMove(creator.id, colItem.id)}
                                      title={`Move to ${colItem.label}`}
                                      className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] hover:scale-105 transition cursor-pointer ${colItem.color} ${colItem.border} ${colItem.text}`}
                                    >
                                      {colItem.label[0]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {colCreators.length === 0 && (
                          <div className="h-60 border-2 border-dashed border-slate-200/50 rounded-2xl flex flex-col items-center justify-center text-center p-5 select-none bg-slate-50/20">
                            <Info className="h-7 w-7 text-slate-250 mb-2" />
                            <p className="text-[11.5px] text-slate-400 font-extrabold">No creators yet</p>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-[120px] leading-tight">Drag creators here to update their status</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // ── LIST VIEW (NOTION STYLE) ──
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 font-bold text-slate-400 text-[11px] uppercase tracking-widest">
                    <th className="px-5 py-3.5">Creator</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5">Followers</th>
                    <th className="px-4 py-3.5">Engagement</th>
                    <th className="px-4 py-3.5">Deal Status</th>
                    <th className="px-4 py-3.5 text-right">Value Projections</th>
                    <th className="px-4 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredCreators.map(creator => {
                    const val = getCampaignValue(creator);
                    return (
                      <tr key={creator.id} className="hover:bg-slate-50/50 group transition duration-150">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={creator.profile_image} name={creator.name} size="sm" />
                            <div>
                              <p className="font-extrabold text-slate-900 leading-tight">{creator.name}</p>
                              <p className="text-[11px] text-purple-600 font-bold mt-0.5">@{creator.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-black uppercase text-slate-450 tracking-wider">
                            {creator.category || "General"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-extrabold text-slate-700">{fmt(creator.followers)}</td>
                        <td className="px-4 py-3 font-extrabold text-slate-500">{creator.engagement_rate || 3.5}%</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_BADGES[creator.deal_status]}`}>
                            {creator.deal_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">{fmtCurrency(val)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-1.5 justify-end">
                            {COLUMNS.map(colItem => (
                              <button
                                key={colItem.id}
                                onClick={() => handleMove(creator.id, colItem.id)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                                  creator.deal_status === colItem.id
                                    ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                                    : "bg-white border-slate-200 text-slate-650 hover:bg-slate-50"
                                }`}
                              >
                                {colItem.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCreators.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <Info className="h-8 w-8 text-slate-250 mx-auto mb-2" />
                        <p className="text-[12px] text-slate-400 font-bold">No deals matched filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* ── SIDEBAR ACTIVITY STREAM (Linear Style) ── */}
        {isActivityOpen && (
          <aside className="w-[320px] bg-white rounded-2xl border border-slate-200 p-5 shadow-sm shrink-0 flex flex-col animate-in fade-in slide-in-from-right-2 duration-200">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-purple-650" />
                <h3 className="font-extrabold text-slate-900 text-[13.5px] tracking-tight">Recent Activity</h3>
              </div>
              <button 
                onClick={() => setIsActivityOpen(false)}
                className="h-6 w-6 hover:bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto max-h-[460px] pr-1 flex flex-col gap-3">
              {history.map((event) => {
                const fromLabel = event.from_status ? event.from_status.toUpperCase() : "NEW";
                const toLabel = event.to_status.toUpperCase();
                
                const fromColor = COLUMNS.find(c => c.id === event.from_status)?.text || "text-slate-400";
                const toColor = COLUMNS.find(c => c.id === event.to_status)?.text || "text-slate-400";

                return (
                  <div 
                    key={event.id} 
                    className="p-3 bg-slate-50/40 hover:bg-slate-50 border border-slate-100 hover:border-slate-200/60 rounded-xl transition flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12.5px] font-black text-slate-800 truncate">@{event.creator_username}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold shrink-0">
                        <Clock className="h-3 w-3" />
                        {timeAgo(event.changed_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[9.5px] font-bold text-slate-400 uppercase tracking-wider flex-wrap">
                      <span className={fromColor}>{fromLabel}</span>
                      <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                      <span className={toColor}>{toLabel}</span>
                    </div>
                  </div>
                );
              })}

              {history.length === 0 && (
                <div className="py-16 text-center">
                  <RefreshCw className="h-8 w-8 text-slate-200 mx-auto mb-2 animate-spin" />
                  <p className="text-[11px] text-slate-400 font-bold">Waiting for updates...</p>
                </div>
              )}
            </div>
          </aside>
        )}

      </div>

      {/* ── ANALYTICS SECTION (Conversion metrics) ── */}
      <div className="mt-4">
        <h3 className="text-base font-black text-slate-900 tracking-tight mb-4">Pipeline Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Conversion Rate", value: totalDealsCount > 0 ? `${Math.round((closedDealsCount / totalDealsCount) * 100)}%` : "0%", desc: "Deals closed vs total opportunities", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
            { label: "Avg Deal Size", value: totalDealsCount > 0 ? fmtCurrency(Math.round((revenueTotal + activeRevenue) / totalDealsCount)) : "₹0", desc: "Average financial sizing", color: "bg-purple-50 text-purple-700 border-purple-100" },
            { label: "Total Projections", value: fmtCurrency(revenueTotal + activeRevenue), desc: "Current estimated deal pipe", color: "bg-blue-50 text-blue-700 border-blue-100" },
            { label: "Active Follow-ups", value: totalDealsCount - closedDealsCount, desc: "Pending pipeline deal closures", color: "bg-amber-50 text-amber-700 border-amber-100" },
          ].map((item, index) => (
            <div key={index} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
              <span className="text-xl font-black text-slate-900 mt-1">{item.value}</span>
              <span className="text-[11px] text-slate-400 font-semibold mt-1">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ADD CREATOR MODAL DIALOG ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[500px] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                  <UserPlus className="h-4.5 w-4.5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-[14.5px]">Add Creator to Pipeline</h3>
                  <p className="text-[11.5px] text-slate-400">Select and assign a creator to your pipeline</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsAddOpen(false); setSearchUnassigned(""); }}
                className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-50 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  value={searchUnassigned}
                  onChange={(e) => setSearchUnassigned(e.target.value)}
                  placeholder="Search unassigned creators..."
                  className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-purple-600/10 focus:border-purple-600 transition"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
              {unassignedList
                .filter(c => c.name.toLowerCase().includes(searchUnassigned.toLowerCase()) || c.username.toLowerCase().includes(searchUnassigned.toLowerCase()))
                .map(creator => {
                  const val = getCampaignValue(creator);
                  const isAdding = addingId === creator.id;
                  return (
                    <div 
                      key={creator.id}
                      className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition duration-150"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Avatar src={creator.profile_image} name={creator.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-extrabold text-slate-800 truncate">{creator.name}</p>
                          <p className="text-[10px] text-purple-650 font-bold">@{creator.username} · {fmt(creator.followers)} followers</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[12.5px] font-black text-slate-900">{fmtCurrency(val)}</span>
                        <button
                          onClick={() => handleAddCreator(creator.id)}
                          disabled={isAdding}
                          className="h-8 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-[11.5px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          {isAdding ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            "Add"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

              {unassignedList.filter(c => c.name.toLowerCase().includes(searchUnassigned.toLowerCase()) || c.username.toLowerCase().includes(searchUnassigned.toLowerCase())).length === 0 && (
                <div className="py-10 text-center select-none">
                  <p className="text-[12px] text-slate-400 font-bold">No unassigned creators found</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">All database creators are already allocated</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
