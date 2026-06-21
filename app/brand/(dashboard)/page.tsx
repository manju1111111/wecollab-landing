"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Award, Check, X, ShieldAlert, Sparkles, TrendingUp, Users, HeartHandshake } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getBrandSession } from "@/app/brand/actions";

interface CampaignProposal {
  id: string;
  campaign_name: string;
  creator_name: string;
  creator_username: string;
  creator_followers: number;
  proposed_price: number;
  deal_status: "proposed" | "approved" | "declined";
  notes: string;
}

export default function BrandOverviewPage() {
  const [proposals, setProposals] = useState<CampaignProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    activeCampaigns: 0,
    budgetSpent: 0,
    creatorsAssigned: 0,
    pendingApprovals: 0
  });

  const fetchProposals = async () => {
    try {
      const supabase = createClient();

      // Get brand details from cookies to query matching campaigns
      const session = await getBrandSession();
      if (!session) return;

      // 1. Fetch campaigns for this brand
      const { data: campaigns, error: campErr } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("brand_id", session.id);

      if (campErr) {
        console.error("Campaign fetch error:", campErr.message);
        setLoading(false);
        return;
      }

      if (!campaigns || campaigns.length === 0) {
        setProposals([]);
        setMetrics({
          activeCampaigns: 0,
          budgetSpent: 0,
          creatorsAssigned: 0,
          pendingApprovals: 0
        });
        setLoading(false);
        return;
      }

      const campaignIds = campaigns.map(c => c.id);

      // 2. Fetch proposals joined with creators
      const { data: propsData, error: propsErr } = await supabase
        .from("campaign_creators")
        .select("id, campaign_id, creator_id, deal_status, price, notes")
        .in("campaign_id", campaignIds);

      if (propsErr) {
        console.error("Proposals fetch error:", propsErr.message);
        setLoading(false);
        return;
      }

      if (!propsData || propsData.length === 0) {
        setProposals([]);
        setMetrics({
          activeCampaigns: campaigns.length,
          budgetSpent: 0,
          creatorsAssigned: 0,
          pendingApprovals: 0
        });
        setLoading(false);
        return;
      }

      // Fetch creator details
      const creatorIds = propsData.map(p => p.creator_id);
      const { data: creators, error: creatorsErr } = await supabase
        .from("creators")
        .select("id, name, username, followers")
        .in("id", creatorIds);

      if (creatorsErr) {
        console.error("Creators fetch error:", creatorsErr.message);
        setLoading(false);
        return;
      }

      const creatorMap = new Map();
      (creators || []).forEach(c => creatorMap.set(c.id, c));

      const campaignMap = new Map();
      campaigns.forEach(c => campaignMap.set(c.id, c.name));

      const enriched: CampaignProposal[] = propsData.map(p => {
        const creator = creatorMap.get(p.creator_id) || { name: "Creator", username: "creator", followers: 120000 };
        return {
          id: p.id,
          campaign_name: campaignMap.get(p.campaign_id) || "Campaign",
          creator_name: creator.name,
          creator_username: creator.username,
          creator_followers: creator.followers,
          proposed_price: Number(p.price || 0),
          deal_status: p.deal_status,
          notes: p.notes || "No notes logged."
        };
      });

      // Calculate live metrics
      const activeC = campaigns.length;
      const budgetS = enriched.filter(e => e.deal_status === "approved").reduce((s, e) => s + e.proposed_price, 0);
      const creatorsA = enriched.length;
      const pendingA = enriched.filter(e => e.deal_status === "proposed").length;

      setMetrics({
        activeCampaigns: activeC,
        budgetSpent: budgetS,
        creatorsAssigned: creatorsA,
        pendingApprovals: pendingA
      });

      setProposals(enriched);
      setLoading(false);
    } catch (e: any) {
      console.error("Critical error fetching brand proposals:", e.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleDecision = async (id: string, decision: "approved" | "declined") => {
    // Optimistic Update
    setProposals(prev => prev.map(p => p.id === id ? { ...p, deal_status: decision } : p));
    
    // Update pending approvals counter
    setMetrics(prev => ({
      ...prev,
      pendingApprovals: Math.max(0, prev.pendingApprovals - 1),
      budgetSpent: decision === "approved" 
        ? prev.budgetSpent + (proposals.find(p => p.id === id)?.proposed_price || 0)
        : prev.budgetSpent
    }));

    try {
      const supabase = createClient();
      await supabase
        .from("campaign_creators")
        .update({ deal_status: decision })
        .eq("id", id);
      
      // Fetch details to trigger real-time notification to assigned employee
      const { data: prop } = await supabase
        .from("campaign_creators")
        .select("campaign_id, creator_id, price")
        .eq("id", id)
        .single();
      
      if (prop) {
        const { data: creator } = await supabase
          .from("creators")
          .select("name, assigned_employee")
          .eq("id", prop.creator_id)
          .single();

        if (creator && creator.assigned_employee) {
          // Push notification to employee about the decision
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create",
              payload: {
                userId: creator.assigned_employee,
                userType: "employee",
                type: decision === "approved" ? "task_complete" : "overdue",
                title: decision === "approved" ? "Proposal Approved! 🎉" : "Proposal Declined ❌",
                body: `Brand decided to ${decision} the ₹${Number(prop.price).toLocaleString()} collaboration with @${creator.name}.`,
                link: "/employee/pipeline"
              }
            })
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Spending chart data
  const chartData = [
    { name: "Week 1", Budget: 80000, Spent: 45000 },
    { name: "Week 2", Budget: 150000, Spent: 95000 },
    { name: "Week 3", Budget: 280000, Spent: 180000 },
    { name: "Week 4", Budget: 420000, Spent: 260000 },
  ];

  return (
    <div className="flex flex-col gap-8 w-full font-sans text-slate-200">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Overview Dashboard <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />
          </h1>
          <p className="text-[13px] text-slate-400 font-semibold mt-1">
            Review proposed creators, approve campaigns, and track budgets.
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">
              Campaigns
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">{metrics.activeCampaigns}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Projects</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
              Spending
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">₹{metrics.budgetSpent.toLocaleString()}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Spent</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
              Portfolios
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">{metrics.creatorsAssigned}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Creators Tracked</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
              Alerts
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">{metrics.pendingApprovals}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Approvals</p>
        </div>
      </div>

      {/* Main Complex Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: 1-Click Approvals (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6 bg-slate-900 border border-slate-800/80 rounded-[32px] p-6 shadow-xl">
          <div>
            <h3 className="text-[15px] font-black text-white flex items-center gap-2">
              Pending Collaborations Approvals
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Accept or decline creator pricing bids in real time.</p>
          </div>

          <div className="flex flex-col gap-4 max-h-[360px] overflow-y-auto pr-1">
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-800 border-t-indigo-500"></div>
              </div>
            ) : proposals.filter(p => p.deal_status === "proposed").length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-1.5">
                <HeartHandshake className="h-8 w-8 stroke-[1.5]" />
                <p className="text-[12px] font-bold">All items approved!</p>
                <p className="text-[10px]">No pending creator decisions.</p>
              </div>
            ) : (
              proposals
                .filter(p => p.deal_status === "proposed")
                .map(prop => (
                  <div 
                    key={prop.id}
                    className="bg-slate-950/40 border border-slate-800/85 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-800"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md">
                          {prop.campaign_name}
                        </span>
                      </div>
                      <h4 className="text-[13px] font-black text-white">
                        {prop.creator_name} <span className="text-[11px] font-medium text-slate-400">@{prop.creator_username}</span>
                      </h4>
                      <p className="text-[11px] font-bold text-slate-500 mt-1">
                        Followers: <span className="text-slate-350">{(prop.creator_followers / 1000000).toFixed(1)}M</span> · Notes: <span className="text-slate-400 italic font-medium">"{prop.notes}"</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <div className="text-right mr-1">
                        <p className="text-[14px] font-black text-emerald-400">₹{prop.proposed_price.toLocaleString()}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pricing Bid</p>
                      </div>

                      <button
                        onClick={() => handleDecision(prop.id, "approved")}
                        className="h-9 w-9 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl flex items-center justify-center transition"
                        title="Approve Proposal"
                      >
                        <Check className="h-4.5 w-4.5" />
                      </button>

                      <button
                        onClick={() => handleDecision(prop.id, "declined")}
                        className="h-9 w-9 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl flex items-center justify-center transition"
                        title="Decline Proposal"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Right Column: Spending area (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-slate-900 border border-slate-800/80 rounded-[32px] p-6 shadow-xl">
          <div>
            <h3 className="text-[15px] font-black text-white">Campaign Spending Analytics</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Budget allocations vs actual expenditure growth.</p>
          </div>

          <div className="flex-1 w-full text-[10px] font-bold h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px' }} />
                <Area type="monotone" dataKey="Spent" stroke="#4f46e5" fillOpacity={1} fill="url(#colorSpent)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
