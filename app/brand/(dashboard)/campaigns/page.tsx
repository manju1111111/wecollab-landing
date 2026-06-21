"use client";

import { useState, useEffect } from "react";
import { Award, Plus, Calendar, DollarSign, Target, Search, Folder, ChevronRight, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getBrandSession } from "@/app/brand/actions";

interface Campaign {
  id: string;
  name: string;
  description: string;
  budget: number;
  status: "draft" | "active" | "completed" | "paused";
  target_followers: number;
  niche: string;
}

export default function BrandCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const supabase = createClient();

      const session = await getBrandSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("brand_id", session.id)
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        triggerMockFallback();
        return;
      }

      setCampaigns(data as Campaign[]);
      setLoading(false);
    } catch (e) {
      triggerMockFallback();
    }
  };

  const triggerMockFallback = () => {
    setIsDemo(true);
    setCampaigns([
      {
        id: "camp-mock-1",
        name: "Summer Activewear 2026",
        description: "Launching our lightweight training line designed for athletes in hot climates.",
        budget: 2500000,
        status: "active",
        target_followers: 5000000,
        niche: "Sports, Fitness, Athletics"
      },
      {
        id: "camp-mock-2",
        name: "Nike Air Max Launch",
        description: "High-production reels promoting the iconic cushioning technology.",
        budget: 1500000,
        status: "active",
        target_followers: 1000000,
        niche: "Fashion, Sneakers, Lifestyle"
      },
      {
        id: "camp-mock-3",
        name: "Winter Hoodies Launch",
        description: "Cozy comfortable aesthetic pitches for cold season.",
        budget: 800000,
        status: "draft",
        target_followers: 500000,
        niche: "Lifestyle, Students"
      }
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const budget = parseFloat(formData.get("budget") as string) || 0;
    const targetFollowers = parseInt(formData.get("target_followers") as string) || 0;
    const niche = formData.get("niche") as string;

    if (isDemo) {
      const newCamp: Campaign = {
        id: `camp-mock-${Date.now()}`,
        name,
        description,
        budget,
        status: "active",
        target_followers: targetFollowers,
        niche
      };
      setCampaigns(prev => [newCamp, ...prev]);
      setIsAddModalOpen(false);
      return;
    }

    try {
      const supabase = createClient();
      const session = await getBrandSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          brand_id: session.id,
          name,
          description,
          budget,
          status: "active",
          target_followers: targetFollowers,
          niche
        })
        .select()
        .single();

      if (error) {
        setError(error.message);
      } else {
        setCampaigns(prev => [data as Campaign, ...prev]);
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "draft":
        return "bg-slate-500/10 border-slate-500/20 text-slate-400";
      case "paused":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      default:
        return "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full font-sans text-slate-200">
      
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Campaigns Manager
          </h1>
          <p className="text-[13px] text-slate-400 font-semibold mt-1">
            Build briefs, allocate budgets, and audit collaborator assignments.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-2xl text-[12px] flex items-center gap-1.5 transition shadow-md shrink-0"
        >
          <Plus className="h-4 w-4" /> Create Brief
        </button>
      </div>

      {/* Grid of campaigns */}
      {loading ? (
        <div className="py-32 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-indigo-500"></div>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] py-24 flex flex-col items-center justify-center text-slate-500 gap-2">
          <Folder className="h-10 w-10 stroke-[1.5]" />
          <p className="text-[13px] font-bold text-white">No campaigns found</p>
          <p className="text-[11px]">Click "Create Brief" at the top to configure your first active campaign.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => (
            <div 
              key={camp.id}
              className="bg-slate-900 border border-slate-800/80 rounded-[32px] p-6 flex flex-col justify-between hover:border-slate-750 transition duration-300 group shadow-md"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusColor(camp.status)}`}>
                    {camp.status}
                  </span>
                  <Award className="h-5 w-5 text-slate-600 group-hover:text-indigo-400 transition" />
                </div>

                <h3 className="text-[15px] font-black text-white group-hover:text-indigo-300 transition duration-200 mb-2 truncate">
                  {camp.name}
                </h3>
                <p className="text-[12px] text-slate-400 font-semibold leading-relaxed line-clamp-3 mb-6">
                  {camp.description || "No description logged."}
                </p>
              </div>

              {/* Specs items */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-800/60 mt-auto">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500 flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Budget</span>
                  <span className="text-white">₹{camp.budget.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500 flex items-center gap-1"><Target className="h-3.5 w-3.5" /> Followers</span>
                  <span className="text-white">{(camp.target_followers / 1000000).toFixed(1)}M+</span>
                </div>

                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-500 flex items-center gap-1"><Search className="h-3.5 w-3.5" /> Niche</span>
                  <span className="text-indigo-400 truncate max-w-[150px]">{camp.niche}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Campaign Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] max-w-md w-full p-8 md:p-10 shadow-2xl flex flex-col">
            <h3 className="text-lg font-black text-white mb-2">Create Campaign Brief</h3>
            <p className="text-[11px] text-slate-400 font-semibold mb-6">Define your parameters for automated creator recommendations.</p>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold rounded-2xl p-3">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Campaign Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Nike Summer Run 2026"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-white outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Description</label>
                <textarea
                  name="description"
                  placeholder="What is the goal of this collaboration campaign? Write detailed brief specifications..."
                  rows={3}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-white outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Budget (INR)</label>
                  <input
                    required
                    type="number"
                    name="budget"
                    placeholder="1500000"
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Target Followers</label>
                  <input
                    required
                    type="number"
                    name="target_followers"
                    placeholder="1000000"
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Target Niches (comma separated)</label>
                <input
                  required
                  type="text"
                  name="niche"
                  placeholder="Fitness, Running, Healthy Lifestyle"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-white outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex items-center gap-3.5 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-950/60 border border-slate-800/80 hover:bg-slate-800/40 text-slate-400 hover:text-white font-bold py-2.5 px-4 rounded-xl text-[12px] transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-[12px] transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  Publish Brief
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
