"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Search, MoreVertical, X, Trash2, RotateCcw, Sparkles } from "lucide-react";
import { createPlan, toggleArchivePlan } from "@/app/plans/actions";
import { useRouter } from "next/navigation";

// Row Actions Dropdown Component
function PlanRowActionDropdown({ plan, onRefresh }: { plan: any; onRefresh: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isArchived = plan.status === "archived";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    try {
      await toggleArchivePlan(plan.id, !isArchived);
      onRefresh();
    } catch (err) {
      console.error("[TOGGLE_ARCHIVE_UI_ERROR]", err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl ring-1 ring-slate-150 z-50 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <button
            type="button"
            onClick={handleToggleArchive}
            className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-left rounded-lg transition-colors cursor-pointer ${
              isArchived 
                ? "text-emerald-600 hover:bg-emerald-50" 
                : "text-rose-600 hover:bg-rose-50"
            }`}
          >
            {isArchived ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" /> Restore Plan
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" /> Archive Plan
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function PlansDashboard({ initialPlans }: { initialPlans: any[] }) {
  const [plansList, setPlansList] = useState(initialPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Interactive Filters State
  const [activeFolder, setActiveFolder] = useState<"active" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"created" | "alpha" | "budget">("created");
  const router = useRouter();

  const handleRefresh = async () => {
    const { getPlans } = await import("@/app/plans/actions");
    const fresh = await getPlans();
    setPlansList(fresh);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createPlan(formData);
    } catch (err) {
      console.error(err);
      alert("Failed to create plan");
      setIsSubmitting(false);
    }
  };

  // Live filter counts
  const folderCounts = useMemo(() => {
    const active = plansList.filter(p => p.status !== "archived").length;
    const archived = plansList.filter(p => p.status === "archived").length;
    return { active, archived };
  }, [plansList]);

  // Dynamic filter and sorting execution
  const filteredAndSortedPlans = useMemo(() => {
    let list = plansList.filter(p => {
      const isArchived = p.status === "archived";
      return activeFolder === "archived" ? isArchived : !isArchived;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.brand?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      if (sortBy === "alpha") {
        return (a.name || "").localeCompare(b.name || "");
      } else if (sortBy === "budget") {
        return (b.budget || 0) - (a.budget || 0);
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return list;
  }, [plansList, activeFolder, searchQuery, sortBy]);

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Plans & Lists <Sparkles className="h-5 w-5 text-indigo-500 fill-indigo-50" />
          </h1>
          <p className="text-[12px] text-slate-400 font-bold mt-0.5">Campaign Master Planning Curation CRM.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-[14px] font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={3} /> New Plan
        </button>
      </header>

      {/* Tabs & Controls */}
      <div className="px-8 py-6 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/40 shadow-inner">
          <button 
            onClick={() => setActiveFolder("active")}
            className={`px-5 py-2 text-[12px] font-black rounded-lg transition shadow-sm cursor-pointer ${
              activeFolder === "active"
                ? "bg-white text-slate-900"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            ACTIVE ({folderCounts.active})
          </button>
          <button 
            onClick={() => setActiveFolder("archived")}
            className={`px-5 py-2 text-[12px] font-black rounded-lg transition shadow-sm cursor-pointer ${
              activeFolder === "archived"
                ? "bg-white text-slate-900"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            ARCHIVED ({folderCounts.archived})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
            <span>Sort by :</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 text-slate-900 text-[12px] font-bold rounded-lg px-2 py-1.5 outline-none cursor-pointer"
            >
              <option value="created">Recently Created</option>
              <option value="alpha">Alphabetical (A-Z)</option>
              <option value="budget">Budget Size</option>
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search plans or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 text-slate-900 text-[13px] font-semibold rounded-lg pl-9 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider pb-2">
              <th className="pb-3 pl-3">Plan Name</th>
              <th className="pb-3 text-center">Platforms</th>
              <th className="pb-3 text-center">Total Payouts</th>
              <th className="pb-3 text-center">Total Influencers</th>
              <th className="pb-3 text-center">Total Lists</th>
              <th className="pb-3">Created On</th>
              <th className="pb-3 pr-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredAndSortedPlans.map((plan) => {
              // Calculate plan payouts total sum
              let planCostSum = 0;
              (plan.lists || []).forEach((l: any) => {
                const ledger = l.cost_per_creator || {};
                Object.values(ledger).forEach((v: any) => {
                  planCostSum += Number(v) || 0;
                });
              });

              return (
                <tr 
                  key={plan.id} 
                  className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                  onClick={() => router.push(`/plans/${plan.id}`)}
                >
                  <td className="py-4 pl-3">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-400 shadow-sm flex items-center justify-center text-white font-bold text-[16px]">
                        {plan.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-[14px]">{plan.name}</p>
                        <p className="text-[11px] text-slate-400 font-bold mt-0.5">{plan.brand || "None"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex justify-center gap-1.5">
                      {plan.platforms.length > 0 ? (
                        plan.platforms.slice(0,3).map((p: string) => (
                          <span key={p} className="inline-flex rounded bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[9px] font-black text-indigo-600 uppercase tracking-wider">
                            {p}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-300 font-bold">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-center font-black text-slate-900">
                    ₹{planCostSum.toLocaleString()}
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-[13px] font-bold text-slate-700">{plan.totalInfluencers}</span>
                  </td>
                  <td className="py-4 text-center">
                    <span className="text-[13px] font-bold text-slate-700">{plan.totalLists}</span>
                  </td>
                  <td className="py-4 text-[12px] font-bold text-slate-550">
                    {new Date(plan.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-4 pr-3 text-right">
                    <PlanRowActionDropdown plan={plan} onRefresh={handleRefresh} />
                  </td>
                </tr>
              );
            })}

            {filteredAndSortedPlans.length === 0 && (
              <tr>
                <td colSpan={7} className="py-24 text-center">
                  <div className="text-[14px] font-bold text-slate-900">No plans found in this folder</div>
                  <p className="text-[13px] text-slate-500 mt-1">
                    {activeFolder === "archived" ? "Archived items can be restored anytime." : "Click 'New Plan' above to start a fresh blueprint."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-[500px] overflow-hidden border border-slate-100 p-8 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                Draft Campaign Blueprint
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">Plan Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Zara Summer Launch"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">Brand Client <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="brand"
                  required
                  placeholder="e.g. Zara India"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">Allocated Budget (INR) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="budget"
                  required
                  defaultValue="1500000"
                  placeholder="e.g. 2000000"
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-black text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3.5 mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold py-3 rounded-xl text-[12px] shadow-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl text-[12px] shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? "Compiling..." : "Initialize Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
