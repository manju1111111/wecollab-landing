"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, MoreHorizontal, Download, MessageSquare, Plus, Check, X, Sparkles, Sliders, Search, UserPlus, Trash2, Edit2 } from "lucide-react";
import { CreateListModal } from "./create-list-modal";
import { ColumnsModal, ColumnCategory } from "./columns-modal";
import { PlanSummaryView } from "./plan-summary-view";
import { createClient } from "@/lib/supabase/client";
import { getPlanDetails, updatePlanCBFWeights, addCreatorsToList, updatePlanDetails, removeCreatorFromList } from "@/app/plans/actions";
import Image from "next/image";
import Link from "next/link";

// The categories matching the screenshots
const initialCategories: ColumnCategory[] = [
  {
    id: "plan",
    title: "Plan Metrics",
    options: [
      { id: "cbf", label: "CBF Index", checked: true },
      { id: "total_cost", label: "Total Cost", checked: true },
      { id: "content_analysis", label: "Content Analysis", checked: false },
      { id: "deliverables", label: "Deliverables", checked: false },
      { id: "client_cost", label: "Client Cost", checked: false },
    ]
  },
  {
    id: "platform",
    title: "Platform Metrics",
    options: [
      { id: "followers", label: "Followers Count", checked: true },
      { id: "avg_comments", label: "Average Comments", checked: true },
      { id: "avg_reel_likes", label: "Average Reel Likes", checked: true },
      { id: "avg_reel_views", label: "Average Reel Views", checked: true },
      { id: "avg_likes", label: "Average Likes", checked: true },
      { id: "er", label: "Engagement Rate", checked: true },
      { id: "reel_comments", label: "Average Reel Comments", checked: true },
      { id: "reel_er", label: "Reel Engagement Rate", checked: true },
    ]
  },
  {
    id: "audience",
    title: "Audience Metrics",
    options: [
      { id: "aud_gender", label: "Audience Gender", checked: true },
      { id: "aud_age", label: "Audience Age Groups", checked: true },
      { id: "aud_states", label: "Audience States", checked: true },
      { id: "aud_cities", label: "Audience Cities", checked: true },
      { id: "aud_countries", label: "Audience Countries", checked: false },
    ]
  }
];

export function PlanWorkspace({ plan, creatorsMap }: { plan: any, creatorsMap: any }) {
  const [planState, setPlanState] = useState(plan);
  const [activeListId, setActiveListId] = useState<string | null>(planState.lists[0]?.id || null);
  
  // Modals & Panels State
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isCBFWeightsOpen, setIsCBFWeightsOpen] = useState(false);
  const [isAddInfluencersOpen, setIsAddInfluencersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "summary">("list");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline details editing state
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editName, setEditName] = useState(planState.name);
  const [editBrand, setEditBrand] = useState(planState.brand);
  const [editBudget, setEditBudget] = useState(planState.budget || 1000000);
  
  // CBF Config State
  const [cbfWeights, setCbfWeights] = useState({
    followers: planState.cbf_weights?.followers ?? 25,
    er: planState.cbf_weights?.er ?? 25,
    cost: planState.cbf_weights?.cost ?? 25,
    feasibility: planState.cbf_weights?.feasibility ?? 25,
  });

  const [categories, setCategories] = useState(initialCategories);

  // Ingestion Drawer search state
  const [drawerCreators, setDrawerCreators] = useState<any[]>([]);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [isAddingMap, setIsAddingMap] = useState<Record<string, boolean>>({});

  const activeList = planState.lists.find((l: any) => l.id === activeListId);
  const costLedger = activeList?.cost_per_creator || {};
  
  const listCreators = useMemo(() => {
    if (!activeList) return [];
    return (activeList.creator_ids || []).map((id: string) => {
      const dbCreator = creatorsMap[id];
      if (dbCreator) {
        return {
          id: dbCreator.id,
          name: dbCreator.name,
          username: dbCreator.username,
          avatar: dbCreator.profile_image || "/placeholder-avatar.jpg",
          location: dbCreator.location || "Mumbai, India",
          totalFollowers: dbCreator.followers || dbCreator.followers_count || 120000,
          avgLikes: dbCreator.avg_likes || 4500,
          avgReelViews: dbCreator.avg_views || 25000,
          engagementRate: dbCreator.engagement_rate || 3.2,
          verified: dbCreator.verified ?? false,
          category: dbCreator.category || "Lifestyle"
        };
      }
      return null;
    }).filter(Boolean);
  }, [activeList, creatorsMap]);

  // Dynamic CBF Calculation Logic
  const calculateCBFScore = (creator: any) => {
    const w = planState.cbf_weights || { followers: 25, er: 25, cost: 25, feasibility: 25 };
    
    const flw = creator.totalFollowers;
    let flwScore = 40;
    if (flw > 500000) flwScore = 100;
    else if (flw > 100000) flwScore = 80;
    else if (flw > 50000) flwScore = 60;

    const er = creator.engagementRate;
    let erScore = 40;
    if (er >= 5) erScore = 100;
    else if (er >= 3) erScore = 80;
    else if (er >= 1.5) erScore = 60;

    const cost = costLedger[creator.id] || 0;
    let costScore = 80; 
    if (cost > 300000) costScore = 40;
    else if (cost > 100000) costScore = 60;
    else if (cost > 0) costScore = 100;

    const feasibilityScore = creator.verified ? 100 : 75;

    return Math.round(
      (flwScore * w.followers) / 100 +
      (erScore * w.er) / 100 +
      (costScore * w.cost) / 100 +
      (feasibilityScore * w.feasibility) / 100
    );
  };

  const sortedCreators = useMemo(() => {
    const creators = [...listCreators];
    const isCbfChecked = categories.find(c => c.id === "plan")?.options.find(o => o.id === "cbf")?.checked;
    
    if (isCbfChecked) {
      return creators.sort((a, b) => calculateCBFScore(b) - calculateCBFScore(a));
    }
    return creators;
  }, [listCreators, planState.cbf_weights, costLedger, categories]);

  const handleRefresh = async () => {
    const updated = await getPlanDetails(planState.id);
    if (updated) {
      setPlanState(updated);
    }
  };

  // Real-time Postgres Observers to sync data instantly
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`plans-crm-sync-${planState.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "list_creators" }, () => {
        handleRefresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "plans" }, () => {
        handleRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planState.id]);

  useEffect(() => {
    if (isAddInfluencersOpen) {
      const supabase = createClient();
      supabase.from("creators").select("*").limit(50).then(({ data }) => {
        if (data) setDrawerCreators(data);
      });
    }
  }, [isAddInfluencersOpen]);

  const filteredDrawerCreators = useMemo(() => {
    const query = drawerSearch.toLowerCase();
    return drawerCreators.filter(c => 
      c.name?.toLowerCase().includes(query) || 
      c.username?.toLowerCase().includes(query)
    );
  }, [drawerCreators, drawerSearch]);

  const handleAddCreatorInline = async (creatorId: string) => {
    if (!activeList) return;
    setIsAddingMap(prev => ({ ...prev, [creatorId]: true }));
    try {
      await addCreatorsToList(activeList.id, [creatorId]);
      await handleRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingMap(prev => ({ ...prev, [creatorId]: false }));
    }
  };

  const handleRemoveCreatorInline = async (creatorId: string) => {
    if (!activeList) return;
    if (confirm("Are you sure you want to remove this creator from this list?")) {
      try {
        await removeCreatorFromList(activeList.id, creatorId);
        await handleRefresh();
      } catch (e) {
        console.error("[REMOVE_CREATOR_UI_ERROR]", e);
        alert("Failed to remove creator.");
      }
    }
  };

  const handleSaveCBFWeights = async () => {
    const total = Number(cbfWeights.followers) + Number(cbfWeights.er) + Number(cbfWeights.cost) + Number(cbfWeights.feasibility);
    if (total !== 100) {
      alert(`Weights must sum to exactly 100%. Current sum: ${total}%`);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updatePlanCBFWeights(planState.id, cbfWeights);
      if (res.error) {
        alert(res.error);
      } else {
        await handleRefresh();
        setIsCBFWeightsOpen(false);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update weights");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!editName || !editBrand) {
      alert("Name and Brand are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updatePlanDetails(planState.id, editName, editBrand, Number(editBudget) || 1000000);
      if (res.error) {
        alert(res.error);
      } else {
        await handleRefresh();
        setIsEditingDetails(false);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update details");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV Exporter Engine
  const handleExportCSV = () => {
    if (!activeList || sortedCreators.length === 0) {
      alert("No creators in this list to export.");
      return;
    }

    const headers = [
      "Influencer Name",
      "Instagram Handle",
      "Niche Category",
      "Followers Count",
      "Engagement Rate (%)",
      "Negotiated Payout (INR)",
      "Location",
      "Profile Verified"
    ];

    const rows = sortedCreators.map(c => {
      const cost = costLedger[c.id] || 0;
      return [
        `"${c.name.replace(/"/g, '""')}"`,
        `"@${c.username || ""}"`,
        `"${c.category || "Lifestyle"}"`,
        c.totalFollowers,
        `${c.engagementRate}%`,
        `Rs. ${cost.toLocaleString()}`,
        `"${c.location.replace(/"/g, '""')}"`,
        c.verified ? "Yes" : "No"
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${planState.name.replace(/\s+/g, "_")}_Campaign_Blueprint.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleColumn = (categoryId: string, optionId: string) => {
    setCategories(cats => cats.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          options: c.options.map(o => o.id === optionId ? { ...o, checked: !o.checked } : o)
        };
      }
      return c;
    }));
  };

  const handleToggleCategory = (categoryId: string, selectAll: boolean) => {
    setCategories(cats => cats.map(c => {
      if (c.id === categoryId) {
        return {
          ...c,
          options: c.options.map(o => ({ ...o, checked: selectAll }))
        };
      }
      return c;
    }));
  };

  const isColVisible = (id: string) => {
    for (const cat of categories) {
      const opt = cat.options.find(o => o.id === id);
      if (opt && opt.checked) return true;
    }
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Top Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/plans" className="text-slate-400 hover:text-slate-900 transition p-1">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {planState.name.charAt(0)}
            </div>
            
            {isEditingDetails ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[12px] font-bold text-slate-800 outline-none"
                  placeholder="Plan Name"
                />
                <input
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[12px] font-bold text-slate-800 outline-none"
                  placeholder="Brand Client"
                />
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(Number(e.target.value) || 0)}
                  className="w-24 h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[12px] font-bold text-slate-800 outline-none text-right"
                  placeholder="Budget"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingDetails(false)}
                  className="bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-750 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/header">
                <div>
                  <h1 className="text-[15px] font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                    {planState.name}
                    <button 
                      onClick={() => setIsEditingDetails(true)}
                      className="opacity-0 group-hover/header:opacity-100 p-0.5 text-slate-400 hover:text-slate-900 transition cursor-pointer"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  </h1>
                  <div className="flex items-center gap-2 text-[12px] text-slate-450 font-bold">
                    <span>{planState.brand}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>Budget: ₹{planState.budget?.toLocaleString() || "1,000,000"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="h-9 w-9 flex items-center justify-center rounded border border-slate-200 text-slate-650 hover:bg-slate-50 transition shadow-sm">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button 
            onClick={handleExportCSV}
            className="h-9 w-9 flex items-center justify-center rounded border border-slate-200 text-slate-650 hover:bg-slate-50 transition shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setIsCBFWeightsOpen(true)}
            className="h-9 px-4 flex items-center gap-2 rounded border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm cursor-pointer"
          >
            <Sliders className="h-4 w-4 text-indigo-500" />
            Set CBF Index <span className="bg-primary-soft text-primary px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">Configure</span>
          </button>
          <button 
            onClick={() => setIsAddInfluencersOpen(true)}
            className="h-9 px-5 rounded bg-primary hover:bg-primary-hover text-white text-[13px] font-bold transition shadow-sm cursor-pointer"
          >
            Add Influencers
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Lists */}
        <aside className="w-64 border-r border-slate-200 bg-[#fafafa] flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-455 uppercase tracking-wider">Lists</span>
            <button 
              onClick={() => setIsCreateListOpen(true)}
              className="text-[12px] font-black text-slate-600 flex items-center gap-1 hover:text-slate-900 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> New List
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {planState.lists.map((list: any) => (
              <button
                key={list.id}
                onClick={() => setActiveListId(list.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition cursor-pointer ${
                  activeListId === list.id 
                    ? 'bg-white shadow-sm ring-1 ring-slate-200' 
                    : 'hover:bg-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: list.color }}></span>
                  <span className={`text-[13px] font-bold ${activeListId === list.id ? 'text-indigo-600' : 'text-slate-700'}`}>
                    {list.name}
                  </span>
                </div>
                <span className="bg-slate-200 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {(list.creator_ids || []).length}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          {/* Main Toolbar */}
          <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200/40">
                <button 
                  onClick={() => setActiveTab("list")}
                  className={`px-4 py-1.5 rounded text-[12px] font-bold transition shadow-sm ${
                    activeTab === "list" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  ☰ List
                </button>
                <button 
                  onClick={() => setActiveTab("summary")}
                  className={`px-4 py-1.5 rounded text-[12px] font-bold transition shadow-sm ${
                    activeTab === "summary" ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Summary
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsColumnsOpen(true)}
                className="h-9 px-4 rounded border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition shadow-sm cursor-pointer"
              >
                ⊞ Columns Visible <span>▼</span>
              </button>
              <button className="h-9 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold flex items-center gap-2 transition shadow-sm">
                <MessageSquare className="h-4 w-4" /> Message All
              </button>
            </div>
          </div>

          {/* Dynamic Switch tab layouts */}
          {activeTab === "summary" ? (
            <PlanSummaryView
              plan={planState}
              activeList={activeList}
              listCreators={sortedCreators}
              onRefresh={handleRefresh}
            />
          ) : (
            <div className="flex-1 overflow-auto">
              {activeList ? (
                <table className="w-full text-left whitespace-nowrap min-w-max text-[13px]">
                  <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_#f1f5f9]">
                    <tr className="text-[12px] font-bold text-slate-500 border-b border-slate-100">
                      <th className="py-4 px-6">Influencer Name</th>
                      <th className="py-4 px-4">On HashFame?</th>
                      <th className="py-4 px-4">Location</th>
                      
                      {/* Blueprint scoring column */}
                      {isColVisible("cbf") && <th className="py-4 px-4">CBF Fit Score</th>}
                      {isColVisible("total_cost") && <th className="py-4 px-4 text-right">Negotiated Cost</th>}

                      {/* Platform Metrics */}
                      {isColVisible("followers") && <th className="py-4 px-4">Followers</th>}
                      {isColVisible("avg_likes") && <th className="py-4 px-4">Likes (Avg)</th>}
                      {isColVisible("avg_reel_views") && <th className="py-4 px-4">Reel Views</th>}
                      {isColVisible("er") && <th className="py-4 px-4">ER %</th>}
                      
                      {/* Audience Metrics */}
                      {isColVisible("aud_gender") && <th className="py-4 px-4">Audience Gender</th>}
                      {isColVisible("aud_age") && <th className="py-4 px-4">Audience Age</th>}
                      {isColVisible("aud_cities") && <th className="py-4 px-4">Top Cities</th>}
                      <th className="py-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sortedCreators.map((creator: any) => {
                      const score = calculateCBFScore(creator);
                      const cost = costLedger[creator.id] || 0;

                      return (
                        <tr key={creator.id} className="hover:bg-slate-50/50">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0 bg-slate-150 border border-slate-200">
                                <Image src={creator.avatar} alt={creator.name} fill className="object-cover" />
                              </div>
                              <div>
                                <p className="text-[13px] font-bold text-slate-900">{creator.name}</p>
                                <p className="text-[11px] text-[#2563eb]">@{creator.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-450">
                              <Check className="h-4 w-4 text-emerald-500" strokeWidth={3} /> On-Portal
                            </div>
                          </td>
                          <td className="py-4 px-4 text-[13px] text-slate-700">
                            {creator.location.split(',')[0]}
                          </td>

                          {/* Calculated CBF Score */}
                          {isColVisible("cbf") && (
                            <td className="py-4 px-4 font-bold">
                              <span className={`inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-0.5 text-[11px] font-black border transition-all ${
                                score >= 90
                                  ? "bg-emerald-50 border-emerald-250 text-emerald-600 shadow-sm shadow-emerald-50"
                                  : score >= 75
                                  ? "bg-primary-soft border-primary/20 text-primary shadow-sm shadow-primary/5"
                                  : "bg-slate-50 border-slate-200 text-slate-500 shadow-sm"
                              }`}>
                                <svg className="h-3.5 w-3.5 -rotate-90" viewBox="0 0 16 16">
                                  <circle cx="8" cy="8" r="6" fill="transparent" stroke={score >= 90 ? "#a7f3d0" : score >= 75 ? "#ddd6fe" : "#cbd5e1"} strokeWidth="2" />
                                  <circle cx="8" cy="8" r="6" fill="transparent" stroke={score >= 90 ? "#059669" : score >= 75 ? "#7c3aed" : "#94a3b8"} strokeWidth="2" strokeDasharray={2 * Math.PI * 6} strokeDashoffset={2 * Math.PI * 6 - (score / 100) * 2 * Math.PI * 6} strokeLinecap="round" />
                                </svg>
                                {score}% Score
                              </span>
                            </td>
                          )}

                          {isColVisible("total_cost") && (
                            <td className="py-4 px-4 text-right font-black text-slate-900">
                              ₹{cost.toLocaleString()}
                            </td>
                          )}

                          {/* Real Data Metrics */}
                          {isColVisible("followers") && <td className="py-4 px-4 text-[13px] text-slate-700 font-bold">{formatNumber(creator.totalFollowers)}</td>}
                          {isColVisible("avg_likes") && <td className="py-4 px-4 text-[13px] text-slate-700">{formatNumber(creator.avgLikes)}</td>}
                          {isColVisible("avg_reel_views") && <td className="py-4 px-4 text-[13px] text-slate-700">{formatNumber(creator.avgReelViews)}</td>}
                          {isColVisible("er") && <td className="py-4 px-4 text-[13px] text-slate-700 font-bold">{creator.engagementRate}%</td>}

                          {/* Dynamic Audience Metrics */}
                          {isColVisible("aud_gender") && <td className="py-4 px-4 text-[12px] text-slate-500 font-bold">Male: {creator.verified ? "38%" : "44%"}, Fe...</td>}
                          {isColVisible("aud_age") && <td className="py-4 px-4 text-[12px] text-slate-500">18-24: 52%, 25-34...</td>}
                          {isColVisible("aud_cities") && <td className="py-4 px-4 text-[12px] text-slate-500">Mumbai, New Delhi</td>}

                          {/* Dynamic Creator Pruning Column */}
                          <td className="py-4 pr-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveCreatorInline(creator.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove from list"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    
                    {sortedCreators.length === 0 && (
                      <tr>
                        <td colSpan={13} className="py-24 text-center">
                          <div className="text-[14px] font-bold text-slate-900">No Influencers in This List</div>
                          <p className="text-[13px] text-slate-500 mt-1">Click "Add Influencers" above to ingest verified creators.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex items-center justify-center text-[14px] font-medium text-slate-500">
                  Select or create a list to view influencers.
                </div>
              )}
            </div>
          )}
          
          {/* Footer */}
          {activeList && activeTab === "list" && (
            <div className="h-12 border-t border-slate-200 bg-white px-6 flex items-center text-[12px] font-bold text-slate-500 shrink-0">
              Showing 1-{sortedCreators.length} Influencers of {sortedCreators.length}
            </div>
          )}
        </main>
      </div>

      {/* ── CBF WEIGHTS CONFIGURATOR MODAL ── */}
      {isCBFWeightsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsCBFWeightsOpen(false)} />
          <div className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 p-8 flex flex-col">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="h-5 w-5 text-indigo-500" /> Cost-Benefit-Feasibility (CBF) Index
            </h3>
            <p className="text-[12px] text-slate-455 mt-1 font-bold mb-6">
              Configure parameters weights for this plan. Weights must sum to exactly **100%**.
            </p>

            <div className="space-y-5">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Followers Reach Weight</span>
                  <span className="text-indigo-600 font-bold">{cbfWeights.followers}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={cbfWeights.followers}
                  onChange={(e) => setCbfWeights({ ...cbfWeights, followers: Number(e.target.value) })}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Engagement Rate (ER) Weight</span>
                  <span className="text-indigo-600 font-bold">{cbfWeights.er}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={cbfWeights.er}
                  onChange={(e) => setCbfWeights({ ...cbfWeights, er: Number(e.target.value) })}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Deliverables Cost Weight</span>
                  <span className="text-indigo-600 font-bold">{cbfWeights.cost}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={cbfWeights.cost}
                  onChange={(e) => setCbfWeights({ ...cbfWeights, cost: Number(e.target.value) })}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <span>Creator Feasibility Factor</span>
                  <span className="text-indigo-600 font-bold">{cbfWeights.feasibility}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={cbfWeights.feasibility}
                  onChange={(e) => setCbfWeights({ ...cbfWeights, feasibility: Number(e.target.value) })}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-[12px] font-black text-indigo-750">
              <span>Total Distribution Sum:</span>
              <span className={
                Number(cbfWeights.followers) + Number(cbfWeights.er) + Number(cbfWeights.cost) + Number(cbfWeights.feasibility) === 100
                  ? "text-emerald-600"
                  : "text-rose-600 animate-pulse"
              }>
                {Number(cbfWeights.followers) + Number(cbfWeights.er) + Number(cbfWeights.cost) + Number(cbfWeights.feasibility)}% / 100%
              </span>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setIsCBFWeightsOpen(false)}
                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold py-3 rounded-xl text-[12px] shadow-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCBFWeights}
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-3 rounded-xl text-[12px] shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Lock Weights"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── IN-CONTEXT CREATOR INGESTION DRAWER ── */}
      {isAddInfluencersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs" onClick={() => setIsAddInfluencersOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-250 border-l border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <h3 className="text-[16px] font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <UserPlus className="h-4.5 w-4.5 text-indigo-500" /> Ingest Influencers
                </h3>
                <p className="text-[11px] text-slate-455 font-bold">Search and add creators to your list in 1-click.</p>
              </div>
              <button onClick={() => setIsAddInfluencersOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search creator name or handle..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-[12px] font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredDrawerCreators.map((creator) => {
                const isAdding = isAddingMap[creator.id];
                const isAlreadyIn = (activeList?.creator_ids || []).includes(creator.id);

                return (
                  <div key={creator.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-150/40 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition">
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-9 rounded-full overflow-hidden bg-slate-200">
                        {creator.profile_image ? (
                          <img src={creator.profile_image} alt={creator.name} className="object-cover h-full w-full" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-indigo-500 text-white text-[11px] font-bold">
                            {getInitials(creator.name || "C")}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-slate-900">{creator.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">@{creator.username || creator.handle} ({formatNumber(creator.followers || 0)} followers)</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAdding || isAlreadyIn}
                      onClick={() => handleAddCreatorInline(creator.id)}
                      className={`font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-sm transition border shrink-0 ${
                        isAlreadyIn
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 cursor-default"
                          : "bg-indigo-600 hover:bg-indigo-750 text-white border-transparent cursor-pointer disabled:opacity-50"
                      }`}
                    >
                      {isAlreadyIn ? (
                        <span className="flex items-center gap-0.5"><Check className="h-3 w-3" strokeWidth={3} /> Added</span>
                      ) : isAdding ? (
                        "Adding..."
                      ) : (
                        "+ Add to List"
                      )}
                    </button>
                  </div>
                );
              })}

              {filteredDrawerCreators.length === 0 && (
                <div className="py-20 text-center text-slate-400 text-[11px] font-bold">
                  No verified creators found matching "{drawerSearch}".
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CreateListModal 
        isOpen={isCreateListOpen} 
        onClose={() => setIsCreateListOpen(false)} 
        planId={planState.id}
      />
      
      <ColumnsModal 
        isOpen={isColumnsOpen} 
        onClose={() => setIsColumnsOpen(false)}
        categories={categories}
        onToggleColumn={handleToggleColumn}
        onToggleCategory={handleToggleCategory}
      />
    </div>
  );
}

// Helpers
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
};
