"use client";

import { useState, useMemo } from "react";
import { Sliders, Sparkles, TrendingUp, DollarSign, Users, Award, Percent, ShoppingBag, ArrowUpRight, HelpCircle } from "lucide-react";

interface RoiSimulatorProps {
  plan: any;
  activeList: any;
  listCreators: any[];
}

export function RoiSimulatorView({ plan, activeList, listCreators }: RoiSimulatorProps) {
  const costLedger = activeList?.cost_per_creator || {};
  
  // Interactive Sliders State
  const [ctr, setCtr] = useState<number>(1.8); // Click-Through Rate (%)
  const [cr, setCr] = useState<number>(2.5);   // Conversion Rate (%)
  const [aov, setAov] = useState<number>(1800); // Average Order Value (INR)

  // 1. Calculate Total negotiated cost for list
  const totalCost = useMemo(() => {
    return listCreators.reduce((sum, c) => {
      const creatorData = costLedger[c.id];
      const cost = typeof creatorData === "object" && creatorData !== null ? creatorData.cost : creatorData;
      return sum + (Number(cost) || 0);
    }, 0);
  }, [listCreators, costLedger]);

  const campaignBudget = plan.budget || 1000000;
  const isOverBudget = totalCost > campaignBudget;

  // 2. Calculations based on creators
  const totalFollowers = useMemo(() => {
    return listCreators.reduce((sum, c) => sum + (Number(c.totalFollowers || c.followers) || 0), 0);
  }, [listCreators]);

  // Projected Impressions (85% of followers count as a realistic default benchmark)
  const projectedImpressions = useMemo(() => {
    return Math.round(totalFollowers * 0.85);
  }, [totalFollowers]);

  // Projected Engagements (Sum of: followers * engagement_rate)
  const projectedEngagements = useMemo(() => {
    return Math.round(
      listCreators.reduce((sum, c) => {
        const followers = Number(c.totalFollowers || c.followers) || 0;
        const er = Number(c.engagementRate || c.engagement_rate) || 0;
        return sum + followers * (er / 100);
      }, 0)
    );
  }, [listCreators]);

  // Click & Conversion Projections based on interactive Sliders
  const projectedClicks = useMemo(() => {
    return Math.round(projectedImpressions * (ctr / 100));
  }, [projectedImpressions, ctr]);

  const projectedConversions = useMemo(() => {
    return Math.round(projectedClicks * (cr / 100));
  }, [projectedClicks, cr]);

  const projectedRevenue = useMemo(() => {
    return projectedConversions * aov;
  }, [projectedConversions, aov]);

  // Cost Efficiency Metrics
  const cpm = useMemo(() => {
    if (projectedImpressions === 0) return 0;
    return Number(((totalCost / projectedImpressions) * 1000).toFixed(2));
  }, [totalCost, projectedImpressions]);

  const cpc = useMemo(() => {
    if (projectedClicks === 0) return 0;
    return Number((totalCost / projectedClicks).toFixed(2));
  }, [totalCost, projectedClicks]);

  const cpa = useMemo(() => {
    if (projectedConversions === 0) return 0;
    return Number((totalCost / projectedConversions).toFixed(2));
  }, [totalCost, projectedConversions]);

  const cpe = useMemo(() => {
    if (projectedEngagements === 0) return 0;
    return Number((totalCost / projectedEngagements).toFixed(2));
  }, [totalCost, projectedEngagements]);

  const roas = useMemo(() => {
    if (totalCost === 0) return 0;
    return Number((projectedRevenue / totalCost).toFixed(2));
  }, [projectedRevenue, totalCost]);

  // Individual Creator Efficiency List (CPE / CPM)
  const creatorEfficiencies = useMemo(() => {
    return listCreators.map(c => {
      const creatorData = costLedger[c.id];
      const cost = typeof creatorData === "object" && creatorData !== null ? creatorData.cost : creatorData;
      const parsedCost = Number(cost) || 0;
      const followers = Number(c.totalFollowers || c.followers) || 0;
      const er = Number(c.engagementRate || c.engagement_rate) || 0;
      const engagements = followers * (er / 100);

      const creatorCpe = engagements > 0 ? parsedCost / engagements : 0;
      const creatorCpm = followers > 0 ? (parsedCost / followers) * 1000 : 0;

      return {
        id: c.id,
        name: c.name,
        username: c.username,
        avatar: c.avatar,
        cost: parsedCost,
        cpe: Number(creatorCpe.toFixed(2)),
        cpm: Number(creatorCpm.toFixed(2)),
        engagements: Math.round(engagements)
      };
    }).sort((a, b) => a.cpe - b.cpe); // Sort from most efficient (lowest CPE) to least
  }, [listCreators, costLedger]);

  const avgCpe = useMemo(() => {
    if (creatorEfficiencies.length === 0) return 0;
    const total = creatorEfficiencies.reduce((sum, item) => sum + item.cpe, 0);
    return Number((total / creatorEfficiencies.length).toFixed(2));
  }, [creatorEfficiencies]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fafbff] font-sans">
      {/* Upper Grid: Sliders & Forecast Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Interactive Parameter Controls (Span 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-indigo-500" /> SIMULATOR PARAMETERS
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Tune conversion assumptions to model campaign revenue.
            </p>
          </div>

          {/* CTR Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
              <span className="text-slate-500">Click-Through Rate (CTR)</span>
              <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold text-xs">{ctr}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={ctr}
              onChange={(e) => setCtr(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[9px] text-slate-400 font-semibold">Projected link clicks from user impressions.</span>
          </div>

          {/* CR Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
              <span className="text-slate-500">Conversion Rate (CR)</span>
              <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-bold text-xs">{cr}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="15"
              step="0.1"
              value={cr}
              onChange={(e) => setCr(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[9px] text-slate-400 font-semibold">Percentage of clicks that result in a sale/lead.</span>
          </div>

          {/* AOV Input */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-wider">
              <span className="text-slate-500">Average Order Value (AOV)</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold text-xs">₹{aov}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
              <input
                type="number"
                min="100"
                max="50000"
                value={aov}
                onChange={(e) => setAov(Math.max(1, Number(e.target.value)))}
                className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-4 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-[9px] text-slate-400 font-semibold">Simulated average purchasing transaction amount.</span>
          </div>
        </div>

        {/* Forecast Dashboard (Span 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-5">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-violet-500 fill-violet-50" /> PROJECTED CAMPAIGN PERFORMANCE
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Simulated business metrics based on selected influencers.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-[11px] font-black text-indigo-750">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>ROAS: {roas}x</span>
            </div>
          </div>

          {/* Output Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50/50 border border-slate-150/40 rounded-2xl p-4 text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Impressions</span>
              <p className="text-lg font-black text-slate-900 leading-none">{formatNumber(projectedImpressions)}</p>
              <span className="text-[9px] text-slate-400 font-semibold block mt-1">(85% reach default)</span>
            </div>

            <div className="bg-slate-50/50 border border-slate-150/40 rounded-2xl p-4 text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Engagements</span>
              <p className="text-lg font-black text-slate-900 leading-none">{formatNumber(projectedEngagements)}</p>
              <span className="text-[9px] text-slate-450 font-bold block mt-1">ER: {totalFollowers > 0 ? ((projectedEngagements / totalFollowers) * 100).toFixed(1) : "0"}%</span>
            </div>

            <div className="bg-slate-50/50 border border-slate-150/40 rounded-2xl p-4 text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Projected Clicks</span>
              <p className="text-lg font-black text-slate-900 leading-none">{formatNumber(projectedClicks)}</p>
              <span className="text-[9px] text-slate-400 font-semibold block mt-1">at {ctr}% CTR</span>
            </div>

            <div className="bg-slate-50/50 border border-slate-150/40 rounded-2xl p-4 text-left">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Conversions</span>
              <p className="text-lg font-black text-slate-900 leading-none">{formatNumber(projectedConversions)}</p>
              <span className="text-[9px] text-slate-450 font-bold block mt-1">Sales at {cr}% CR</span>
            </div>
          </div>

          {/* Revenue and Efficiency Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Estimated Gross Revenue</span>
                <span className="text-lg font-black text-slate-900">₹{projectedRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-500">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Cost per Acquisition (CPA)</span>
                <span className="text-lg font-black text-slate-900">₹{cpa.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mid Section: Budget Allocator Warning banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold shadow-sm ${
        isOverBudget 
          ? "bg-rose-50 border-rose-100 text-rose-700" 
          : "bg-emerald-50 border-emerald-100 text-emerald-700"
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">💰</span>
          <span>
            {isOverBudget 
              ? `Budget Overrun: Campaign is over plan budget limit by ₹${(totalCost - campaignBudget).toLocaleString()}.`
              : `Budget Safe: Remaining capital allocation capacity is ₹${(campaignBudget - totalCost).toLocaleString()}.`
            }
          </span>
        </div>
        <span className="underline font-black">₹{totalCost.toLocaleString()} Negotiated</span>
      </div>

      {/* Visual Component: Cost Per Engagement (CPE) comparison */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">
              Cost Per Engagement (CPE) Audit Chart
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Lower CPE represents higher value-for-money. Interactive ranking of list efficiency.
            </p>
          </div>
          <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Avg CPE: ₹{avgCpe}
          </span>
        </div>

        {/* CPE SVG Chart bar */}
        {creatorEfficiencies.length > 0 ? (
          <div className="space-y-4">
            {creatorEfficiencies.map((item, idx) => {
              // Find max CPE to represent 100% width
              const maxCpe = Math.max(...creatorEfficiencies.map(e => e.cpe)) || 1;
              const pct = (item.cpe / maxCpe) * 100;
              const isHighlyEfficient = item.cpe < avgCpe;

              return (
                <div key={item.id} className="flex items-center gap-4 group">
                  {/* Creator Info */}
                  <div className="w-36 shrink-0 flex items-center gap-2.5">
                    <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0 bg-slate-100 border border-slate-200">
                      <img src={item.avatar} alt={item.name} className="object-cover h-full w-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                      <p className="text-[9px] text-[#2563eb] font-semibold truncate leading-none">@{item.username}</p>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="flex-1 h-7 bg-slate-50 rounded-lg relative overflow-hidden flex items-center px-3 border border-slate-100">
                    <div 
                      className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                        isHighlyEfficient 
                          ? "bg-gradient-to-r from-emerald-400/20 to-emerald-500/20 border-r border-emerald-500/30" 
                          : "bg-gradient-to-r from-rose-400/10 to-rose-500/15 border-r border-rose-500/30"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative z-10 flex justify-between w-full text-[10px] font-bold">
                      <span className="text-slate-500">Payout: ₹{item.cost.toLocaleString()}</span>
                      <span className={isHighlyEfficient ? "text-emerald-700 font-extrabold" : "text-slate-650"}>
                        ₹{item.cpe} CPE
                      </span>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="w-24 shrink-0 text-right">
                    <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                      isHighlyEfficient 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                        : "bg-slate-50 border-slate-200 text-slate-450"
                    }`}>
                      {isHighlyEfficient ? "🔥 High Value" : "Standard"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">
            Add influencers to this blueprint list to audit pricing and CPE distributions.
          </div>
        )}
      </div>

      {/* Lower Block: Optimization recommendations */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase mb-4">
          Wecollab Budget Optimization Insights
        </h3>
        
        {creatorEfficiencies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Value picks */}
            <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-2 text-xs">
              <h4 className="text-emerald-700 font-black flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                💡 High Efficiency Recommendations
              </h4>
              <p className="text-slate-550 font-medium">
                These creators deliver engagements significantly below the list average cost of <strong>₹{avgCpe} CPE</strong>. Increasing deliverables or budget allocations here will optimize overall ROI.
              </p>
              <ul className="space-y-1.5 mt-2">
                {creatorEfficiencies.filter(e => e.cpe < avgCpe).slice(0, 3).map(e => (
                  <li key={e.id} className="flex items-center gap-2 font-bold text-slate-700">
                    <span className="text-emerald-500">✔</span>
                    <span>{e.name} (@{e.username}) — ₹{e.cpe} CPE (Average Payout: ₹{e.cost.toLocaleString()})</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium warnings */}
            <div className="bg-amber-50/20 border border-amber-100 rounded-2xl p-4 flex flex-col gap-2 text-xs">
              <h4 className="text-amber-700 font-black flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                ⚠️ Premium/Low Efficiency Audits
              </h4>
              <p className="text-slate-550 font-medium">
                These creators have a cost-per-engagement higher than the average list CPE. Ensure their brand alignment, content quality, and conversion potential justify the premium pricing.
              </p>
              <ul className="space-y-1.5 mt-2">
                {creatorEfficiencies.filter(e => e.cpe >= avgCpe).reverse().slice(0, 3).map(e => (
                  <li key={e.id} className="flex items-center gap-2 font-bold text-slate-700">
                    <span className="text-amber-500">⚠</span>
                    <span>{e.name} (@{e.username}) — ₹{e.cpe} CPE (Average Payout: ₹{e.cost.toLocaleString()})</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        ) : (
          <p className="text-xs text-slate-400 font-bold">No optimization data available yet. Please select creators first.</p>
        )}
      </div>
    </div>
  );
}
