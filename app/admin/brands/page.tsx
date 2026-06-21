"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Search, Globe, MoreHorizontal, ShieldCheck, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface BrandRecord {
  id: string;
  name: string;
  email: string;
  website: string | null;
  phone: string | null;
  industry: string;
  status: "active" | "inactive";
  campaign_count: number;
  total_budget: number;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const fetchBrands = async () => {
    try {
      const supabase = createClient();

      // 1. Fetch brands
      const { data: brandsData, error: brandsErr } = await supabase
        .from("brands")
        .select("id, name, email, website, phone, industry, status");

      if (brandsErr || !brandsData || brandsData.length === 0) {
        triggerMockFallback();
        return;
      }

      // 2. Fetch campaigns to compute counters
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("brand_id, budget");

      const campaignCountMap = new Map<string, number>();
      const campaignBudgetMap = new Map<string, number>();

      (campaigns || []).forEach(c => {
        campaignCountMap.set(c.brand_id, (campaignCountMap.get(c.brand_id) || 0) + 1);
        campaignBudgetMap.set(c.brand_id, (campaignBudgetMap.get(c.brand_id) || 0) + Number(c.budget || 0));
      });

      const enriched: BrandRecord[] = brandsData.map(b => ({
        id: b.id,
        name: b.name,
        email: b.email,
        website: b.website,
        phone: b.phone,
        industry: b.industry || "General",
        status: b.status || "active",
        campaign_count: campaignCountMap.get(b.id) || 0,
        total_budget: campaignBudgetMap.get(b.id) || 0
      }));

      setBrands(enriched);
      setLoading(false);
    } catch (e) {
      triggerMockFallback();
    }
  };

  const triggerMockFallback = () => {
    setIsDemo(true);
    setBrands([
      {
        id: "brand-mock-1",
        name: "Nike India",
        email: "nike@wecollab.in",
        website: "https://nike.com",
        phone: "+91 98765 11111",
        industry: "Sports & Apparel",
        status: "active",
        campaign_count: 2,
        total_budget: 4000000
      },
      {
        id: "brand-mock-2",
        name: "OnePlus Tech",
        email: "oneplus@wecollab.in",
        website: "https://oneplus.in",
        phone: "+91 98765 22222",
        industry: "Consumer Electronics",
        status: "active",
        campaign_count: 1,
        total_budget: 3500000
      },
      {
        id: "brand-mock-3",
        name: "Zomato",
        email: "zomato@wecollab.in",
        website: "https://zomato.com",
        phone: "+91 98765 33333",
        industry: "Food Delivery",
        status: "active",
        campaign_count: 3,
        total_budget: 2500000
      },
      {
        id: "brand-mock-4",
        name: "Starbucks India",
        email: "starbucks@wecollab.in",
        website: "https://starbucks.in",
        phone: "+91 98765 44444",
        industry: "Food & Beverage",
        status: "inactive",
        campaign_count: 0,
        total_budget: 0
      }
    ]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const website = formData.get("website") as string;
    const phone = formData.get("phone") as string;
    const industry = formData.get("industry") as string;

    if (!name || !email || !password) {
      setError("Name, email, and password are required.");
      return;
    }

    if (isDemo) {
      const newBrand: BrandRecord = {
        id: `brand-mock-${Date.now()}`,
        name,
        email,
        website: website || null,
        phone: phone || null,
        industry,
        status: "active",
        campaign_count: 0,
        total_budget: 0
      };
      setBrands(prev => [newBrand, ...prev]);
      setIsAddModalOpen(false);
      return;
    }

    try {
      const bcrypt = await import("bcryptjs");
      const hash = await bcrypt.hash(password, 10);

      const supabase = createClient();
      const { data, error } = await supabase
        .from("brands")
        .insert({
          name,
          email: email.toLowerCase(),
          password_hash: hash,
          website: website || null,
          phone: phone || null,
          industry,
          status: "active"
        })
        .select()
        .single();

      if (error) {
        setError(error.message);
      } else {
        const enrichedNew: BrandRecord = {
          id: data.id,
          name: data.name,
          email: data.email,
          website: data.website,
          phone: data.phone,
          industry: data.industry || "General",
          status: data.status as any,
          campaign_count: 0,
          total_budget: 0
        };
        setBrands(prev => [enrichedNew, ...prev]);
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.email.toLowerCase().includes(search.toLowerCase()) ||
    b.industry.toLowerCase().includes(search.toLowerCase())
  );

  const totalBudget = brands.reduce((s, b) => s + b.total_budget, 0);
  const activeCampaignsCount = brands.reduce((s, b) => s + b.campaign_count, 0);

  return (
    <div className="flex flex-col gap-8 w-full font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Brands Management Console
          </h1>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            Overview client brand profiles, target campaigns, and billing statistics.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-2xl text-[12px] flex items-center gap-1.5 transition shadow-sm shrink-0 self-start sm:self-center"
        >
          <Plus className="h-4 w-4" /> Add Partner Brand
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-sm flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-full">
              Partners
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{brands.length}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Onboarded Brands</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2.5 bg-emerald-600 rounded-2xl text-white shadow-sm flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full">
              Volume
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">₹{totalBudget.toLocaleString()}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Allocations</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-sm flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full">
              Campaigns
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">{activeCampaignsCount}</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Briefs</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2.5 bg-amber-600 rounded-2xl text-white shadow-sm flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full">
              Status
            </span>
          </div>
          <h3 className="text-3xl font-black text-slate-900">
            {brands.filter(b => b.status === "active").length}
          </h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Accounts</p>
        </div>
      </div>

      {/* Main List Table Area */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden flex flex-col p-6 gap-6">
        
        {/* Search tool */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 max-w-sm">
          <Search className="h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search brands by name, email, or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-[12px] font-semibold text-slate-700 placeholder-slate-400"
          />
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-150 border-t-indigo-600"></div>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-1">
              <Building2 className="h-7 w-7 stroke-[1.5]" />
              <p className="text-[12px] font-bold">No partner brands found</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-3">Company Name</th>
                  <th className="pb-3">Industry</th>
                  <th className="pb-3">Contact Email</th>
                  <th className="pb-3 text-center">Active Campaigns</th>
                  <th className="pb-3 text-right">Total Budget</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/50">
                {filteredBrands.map((b) => {
                  const isActive = b.status === "active";
                  return (
                    <tr 
                      key={b.id} 
                      className={`text-[12px] font-semibold text-slate-700 transition border-l-4 ${
                        isActive 
                          ? "border-l-emerald-500 bg-emerald-50/10 hover:bg-emerald-50/20" 
                          : "border-l-slate-300 bg-slate-50/20 hover:bg-slate-50/30"
                      }`}
                    >
                    <td className="py-4 pl-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{b.name}</span>
                          {b.website && (
                            <a href={b.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5 mt-0.5">
                              <Globe className="h-3 w-3" /> Visit website
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-slate-500">{b.industry}</td>
                    <td className="py-4 font-mono text-[11px]">{b.email}</td>
                    <td className="py-4 text-center font-bold text-slate-900">{b.campaign_count}</td>
                    <td className="py-4 text-right font-bold text-slate-900">₹{b.total_budget.toLocaleString()}</td>
                    <td className="py-4 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        b.status === "active" 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                          : "bg-slate-100 border-slate-150 text-slate-500"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 text-center pr-3">
                      <button className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Partner Brand Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 md:p-10 shadow-2xl flex flex-col">
            <h3 className="text-lg font-black text-slate-900 mb-2">Onboard Partner Brand</h3>
            <p className="text-[11px] text-slate-400 font-semibold mb-6">Create credentials for the brand manager to access the Self-Serve portal.</p>

            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[11px] font-bold rounded-2xl p-3">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Brand Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Nike India, Inc."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Industry Segment</label>
                <input
                  required
                  type="text"
                  name="industry"
                  placeholder="Sports & Performance"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Website URL</label>
                <input
                  type="text"
                  name="website"
                  placeholder="https://nike.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Manager Email</label>
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="nike@wecollab.in"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Password</label>
                  <input
                    required
                    type="password"
                    name="password"
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-slate-700 outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3.5 mt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold py-2.5 px-4 rounded-xl text-[12px] transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-[12px] transition flex items-center justify-center gap-1.5 shadow-md"
                >
                  Onboard Brand
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
