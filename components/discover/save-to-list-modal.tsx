"use client";

import { X, Plus, Calendar, ListPlus, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { getPlans, addCreatorsToList, createPlanInline, createListInline } from "@/app/plans/actions";

type Mode = "existing" | "new_list" | "new_plan";

export function SaveToListModal({
  isOpen,
  onClose,
  selectedCreatorIds,
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedCreatorIds: string[];
  onSuccess: () => void;
}) {
  const [plans, setPlans] = useState<any[]>([]);
  const [mode, setMode] = useState<Mode>("existing");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Existing mode state
  const [selectedListId, setSelectedListId] = useState<string>("");

  // New List mode state
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [newListName, setNewListName] = useState<string>("");
  const [newListPlatform, setNewListPlatform] = useState<string>("Instagram");

  // New Plan mode state
  const [newPlanName, setNewPlanName] = useState<string>("");
  const [newPlanBrand, setNewPlanBrand] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getPlans().then((data) => {
        setPlans(data);
        if (data.length > 0) {
          setSelectedPlanId(data[0].id);
        }
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let targetListId = selectedListId;

      if (mode === "new_plan") {
        if (!newPlanName || !newPlanBrand || !newListName) {
          alert("Please fill all plan and list fields.");
          setIsSubmitting(false);
          return;
        }

        // 1. Create plan inline
        const planRes = await createPlanInline({ name: newPlanName, brand: newPlanBrand });
        if (planRes.error || !planRes.plan) {
          throw new Error(planRes.error || "Failed to create plan");
        }

        // 2. Create list inline under that plan
        const listRes = await createListInline({
          planId: planRes.plan.id,
          name: newListName,
          color: "#4f46e5", // Default blue/indigo
          platform: newListPlatform,
        });
        if (listRes.error || !listRes.list) {
          throw new Error(listRes.error || "Failed to create list");
        }

        targetListId = listRes.list.id;

      } else if (mode === "new_list") {
        if (!selectedPlanId || !newListName) {
          alert("Please select a plan and specify a list name.");
          setIsSubmitting(false);
          return;
        }

        // Create list inline
        const listRes = await createListInline({
          planId: selectedPlanId,
          name: newListName,
          color: "#ec4899", // Default pink
          platform: newListPlatform,
        });
        if (listRes.error || !listRes.list) {
          throw new Error(listRes.error || "Failed to create list");
        }

        targetListId = listRes.list.id;
      }

      if (!targetListId) {
        alert("No destination list specified.");
        setIsSubmitting(false);
        return;
      }

      // Add creators to that list
      await addCreatorsToList(targetListId, selectedCreatorIds);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("[SAVE_TO_LIST_ERROR]", err);
      alert(err.message || "Failed to save to list.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Add to Plan Blueprint <Sparkles className="h-4.5 w-4.5 text-indigo-500 fill-indigo-50" />
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5 font-medium">
              Save <span className="font-bold text-slate-800">{selectedCreatorIds.length} creator(s)</span> into campaign lists.
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Toggle Mode Segmented Control */}
        <div className="px-6 pt-5 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200/50">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${
                mode === "existing"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Existing List
            </button>
            <button
              type="button"
              onClick={() => setMode("new_list")}
              className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${
                mode === "new_list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              + New List
            </button>
            <button
              type="button"
              onClick={() => setMode("new_plan")}
              className={`flex-1 py-2 text-[12px] font-bold rounded-lg transition-all ${
                mode === "new_plan"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              + New Plan
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                <span className="text-[12px] font-bold">Fetching campaign plans...</span>
              </div>
            ) : (
              <>
                {/* ── MODE 1: EXISTING LIST ── */}
                {mode === "existing" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">Choose Target List</label>
                    {plans.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                        <p className="text-[13px] text-slate-500 font-semibold">No active campaign plans found.</p>
                        <button
                          type="button"
                          onClick={() => setMode("new_plan")}
                          className="mt-2 text-[12px] text-indigo-600 font-bold hover:underline"
                        >
                          Create your first plan now →
                        </button>
                      </div>
                    ) : (
                      <select
                        required
                        value={selectedListId}
                        onChange={(e) => setSelectedListId(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold cursor-pointer"
                      >
                        <option value="" disabled>-- Choose a Plan & List --</option>
                        {plans.map((plan) => (
                          <optgroup key={plan.id} label={`Plan: ${plan.name} (${plan.brand})`}>
                            {plan.lists.map((list: any) => (
                              <option key={list.id} value={list.id}>
                                ↳ {list.name} ({list.creator_ids?.length || 0} creators)
                              </option>
                            ))}
                            {plan.lists.length === 0 && (
                              <option disabled>↳ No lists in this plan yet</option>
                            )}
                          </optgroup>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* ── MODE 2: NEW LIST UNDER EXISTING PLAN ── */}
                {mode === "new_list" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">Select Parent Plan</label>
                      <select
                        required
                        value={selectedPlanId}
                        onChange={(e) => setSelectedPlanId(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold cursor-pointer"
                      >
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name} ({plan.brand})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">New List Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Micro Influencers"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">Platform Channel</label>
                      <select
                        value={newListPlatform}
                        onChange={(e) => setNewListPlatform(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="YouTube">YouTube</option>
                        <option value="X">X (Twitter)</option>
                        <option value="TikTok">TikTok</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* ── MODE 3: BRAND NEW PLAN & LIST ── */}
                {mode === "new_plan" && (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">Plan Name</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Q3 Launch"
                          value={newPlanName}
                          onChange={(e) => setNewPlanName(e.target.value)}
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">Brand Client</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Nike India"
                          value={newPlanBrand}
                          onChange={(e) => setNewPlanBrand(e.target.value)}
                          className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">Initial List Name</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Phase 1 Celebrities"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">Platform Channel</label>
                      <select
                        value={newListPlatform}
                        onChange={(e) => setNewListPlatform(e.target.value)}
                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[13px] font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="YouTube">YouTube</option>
                        <option value="X">X (Twitter)</option>
                        <option value="TikTok">TikTok</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3.5 mt-8 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold py-3 px-4 rounded-xl text-[13px] transition text-center shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || (mode === "existing" && !selectedListId && plans.length > 0) || isLoading}
              className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl text-[13px] transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
            >
              {isSubmitting ? "Compiling..." : "Save Creators"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
