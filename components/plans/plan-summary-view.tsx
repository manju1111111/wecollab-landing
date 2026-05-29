"use client";

import { useState, useMemo } from "react";
import { DollarSign, Users, Award, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { updateCreatorNegotiatedCost } from "@/app/plans/actions";

interface PlanSummaryProps {
  plan: any;
  activeList: any;
  listCreators: any[];
  onRefresh: () => void;
}

export function PlanSummaryView({ plan, activeList, listCreators, onRefresh }: PlanSummaryProps) {
  const costLedger = activeList?.cost_per_creator || {};
  const [editingCreatorId, setEditingCreatorId] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // 1. Calculate Aggregated Reach and ER
  const totalReach = useMemo(() => {
    return listCreators.reduce((sum, c) => {
      const followers = c.totalFollowers || c.followers || c.followers_count || 0;
      return sum + Number(followers);
    }, 0);
  }, [listCreators]);

  const avgER = useMemo(() => {
    if (listCreators.length === 0) return 0;
    const totalER = listCreators.reduce((sum, c) => sum + (Number(c.engagementRate || c.engagement_rate) || 0), 0);
    return Number((totalER / listCreators.length).toFixed(2));
  }, [listCreators]);

  // 2. Calculate Total Negotiated Cost
  const totalCost = useMemo(() => {
    return listCreators.reduce((sum, c) => {
      const cost = costLedger[c.id] || 0;
      return sum + Number(cost);
    }, 0);
  }, [listCreators, costLedger]);

  const campaignBudget = plan.budget || 1000000;
  const budgetPercentage = Math.min(100, Number(((totalCost / campaignBudget) * 100).toFixed(1)));
  const isOverBudget = totalCost > campaignBudget;

  const handleEditCost = (creatorId: string, currentCost: number) => {
    setEditingCreatorId(creatorId);
    setEditingCost(currentCost ? currentCost.toString() : "");
  };

  const handleSaveCost = async (creatorId: string) => {
    setIsSaving(true);
    try {
      const numericCost = parseFloat(editingCost) || 0;
      const res = await updateCreatorNegotiatedCost(activeList.id, creatorId, numericCost);
      if (res.error) {
        alert(res.error);
      } else {
        setEditingCreatorId(null);
        onRefresh();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update cost");
    } finally {
      setIsSaving(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 font-sans text-slate-800 bg-white">
      {/* Dynamic Budget thermometer */}
      <div className={`p-6 rounded-3xl border ${
        isOverBudget ? "bg-rose-50/50 border-rose-100" : "bg-indigo-50/30 border-indigo-100/50"
      } shadow-sm transition-all`}>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-[14px] font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              {isOverBudget ? (
                <span className="text-rose-600 flex items-center gap-1.5">
                  <ShieldAlert className="h-4.5 w-4.5" /> Budget Cap Alert
                </span>
              ) : (
                <span className="text-indigo-600 flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 fill-indigo-50" /> Campaign Budget Allocation
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-450 font-bold mt-0.5">
              Current allocated payouts vs target brand brief allocations.
            </p>
          </div>
          <div className="text-right">
            <span className={`text-[16px] font-black ${isOverBudget ? "text-rose-600" : "text-indigo-600"}`}>
              ₹{totalCost.toLocaleString()}
            </span>
            <span className="text-[12px] font-bold text-slate-400"> of ₹{campaignBudget.toLocaleString()}</span>
          </div>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shrink-0 shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-indigo-600"
            }`}
            style={{ width: `${budgetPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2">
          <span>{budgetPercentage}% Consumed</span>
          <span>₹{(campaignBudget - totalCost).toLocaleString()} {isOverBudget ? "Over budget" : "Remaining"}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-50/50 border border-slate-150/60 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2 shrink-0">
            <span className="h-8 w-8 rounded-xl bg-violet-50 border border-violet-100 text-violet-500 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </span>
            <span className="text-[11px] font-black text-slate-405 uppercase tracking-wider">Collective Reach</span>
          </div>
          <p className="text-2xl font-black text-slate-900 leading-none">{formatNumber(totalReach)}</p>
          <p className="text-[11px] text-slate-450 mt-1.5 font-bold">Total followers across selected creators.</p>
        </div>

        <div className="bg-slate-50/50 border border-slate-150/60 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2 shrink-0">
            <span className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center">
              <Award className="h-4.5 w-4.5" />
            </span>
            <span className="text-[11px] font-black text-slate-405 uppercase tracking-wider">Avg Campaign ER</span>
          </div>
          <p className="text-2xl font-black text-slate-900 leading-none">{avgER}%</p>
          <p className="text-[11px] text-slate-450 mt-1.5 font-bold">Average engagement score for this list.</p>
        </div>

        <div className="bg-slate-50/50 border border-slate-150/60 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2 shrink-0">
            <span className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center">
              <DollarSign className="h-4.5 w-4.5" />
            </span>
            <span className="text-[11px] font-black text-slate-405 uppercase tracking-wider">Payout Efficiency</span>
          </div>
          <p className="text-2xl font-black text-slate-900 leading-none">
            ₹{listCreators.length > 0 ? Math.round(totalCost / listCreators.length).toLocaleString() : "0"}
          </p>
          <p className="text-[11px] text-slate-450 mt-1.5 font-bold">Negotiated payout average per creator.</p>
        </div>
      </div>

      {/* Editable negotiated pricing ledger */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <h3 className="text-[14px] font-black text-slate-900 tracking-tight mb-4 uppercase tracking-wider">
          Creator Negotiated Payout Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider pb-2">
                <th className="pb-3 pl-3">Influencer</th>
                <th className="pb-3">Niche</th>
                <th className="pb-3 text-right">Negotiated Cost</th>
                <th className="pb-3 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {listCreators.map((creator) => {
                const currentCost = costLedger[creator.id] || 0;
                const isEditing = editingCreatorId === creator.id;

                return (
                  <tr key={creator.id} className="text-[12px] font-semibold text-slate-700 hover:bg-slate-50/50 transition">
                    <td className="py-3 pl-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{creator.name}</span>
                        <span className="text-[10px] text-slate-400">@{creator.username || creator.handle}</span>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                        {creator.category || "Lifestyle"}
                      </span>
                    </td>
                    <td className="py-3 text-right font-black text-slate-900">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <span className="text-[11px] font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            value={editingCost}
                            onChange={(e) => setEditingCost(e.target.value)}
                            className="w-24 h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-right text-[11px] font-bold outline-none focus:border-indigo-500"
                            placeholder="150000"
                            disabled={isSaving}
                          />
                        </div>
                      ) : (
                        <span>₹{currentCost.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-3">
                      {isEditing ? (
                        <div className="inline-flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingCreatorId(null)}
                            className="bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 font-bold px-2 py-1 rounded-lg text-[10px]"
                            disabled={isSaving}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveCost(creator.id)}
                            className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-2.5 py-1 rounded-lg text-[10px]"
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEditCost(creator.id, currentCost)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 hover:text-slate-900 font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-sm transition"
                        >
                          Tune Payout
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {listCreators.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 text-[11px] font-bold">
                    No creators in this blueprint to audit pricing targets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
