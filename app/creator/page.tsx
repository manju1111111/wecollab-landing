import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { Sparkles, Users, Award, AlertCircle, HeartHandshake, Eye, MapPin } from "lucide-react";
import React from "react";

export default async function CreatorDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("creator_session");

  if (!sessionCookie) {
    redirect("/creator/login");
  }

  const session = JSON.parse(sessionCookie.value);

  const supabase = await createAdminClient();

  // 1. Fetch Creator Profile
  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", session.id)
    .single();

  if (!creator) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-1.5">
        <AlertCircle className="h-8 w-8 text-rose-500" />
        <p className="text-[14px] font-bold text-white">Profile not found</p>
        <p className="text-[12px]">Please contact support to sync your profile.</p>
      </div>
    );
  }

  // 2. Fetch Creator proposals
  const { data: proposals } = await supabase
    .from("campaign_creators")
    .select("id, campaign_id, deal_status, price, notes")
    .eq("creator_id", creator.id);

  const activeProposals = proposals || [];
  const approvedCampaigns = activeProposals.filter(p => p.deal_status === "approved");
  const proposedCampaigns = activeProposals.filter(p => p.deal_status === "proposed");

  // Fetch campaign names
  const campaignIds = activeProposals.map(p => p.campaign_id);
  let campaignNamesMap = new Map();
  if (campaignIds.length > 0) {
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, name")
      .in("id", campaignIds);
    (campaigns || []).forEach(c => campaignNamesMap.set(c.id, c.name));
  }

  const isVerified = creator.verification_status === "Verified";

  return (
    <div className="flex flex-col gap-8 w-full font-sans text-slate-200">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Welcome back, {creator.name}! <Sparkles className="h-6 w-6 text-violet-400 animate-pulse" />
          </h1>
          <p className="text-[13px] text-slate-400 font-semibold mt-1">
            Track your campaign offers, manage collaboration metrics, and view real-time sponsorships.
          </p>
        </div>
      </div>

      {/* Metrics Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-xl flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">
              Audience
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">
            {creator.followers >= 1000000 
              ? `${(creator.followers / 1000000).toFixed(1)}M` 
              : `${(creator.followers / 1000).toFixed(0)}K`}
          </h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Reach</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
              Engagement
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">{creator.engagement_rate || "3.5"}%</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Average Rate</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
              Reel Views
            </span>
          </div>
          <h3 className="text-3xl font-black text-white">
            {parseInt(creator.avg_reel_views) >= 1000 
              ? `${(parseInt(creator.avg_reel_views) / 1000).toFixed(0)}K` 
              : creator.avg_reel_views || "5K"}
          </h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Views</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
              isVerified ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
            }`}>
              <Award className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
              Account Status
            </span>
          </div>
          <h3 className="text-2xl font-black text-white truncate leading-none pt-1">
            {isVerified ? "Verified ✅" : "Under Review"}
          </h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Audit Queue</p>
        </div>
      </div>

      {/* Main Complex Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Direct Campaign Invites / Proposals (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6 bg-slate-900 border border-slate-800/80 rounded-[32px] p-6 shadow-xl">
          <div>
            <h3 className="text-[15px] font-black text-white flex items-center gap-2">
              Sponsorship & Collaboration Invitations
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Review exclusive briefs and pricing parameters proposed directly to your portfolio.
            </p>
          </div>

          <div className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-1">
            {proposedCampaigns.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-1.5">
                <HeartHandshake className="h-8 w-8 stroke-[1.5]" />
                <p className="text-[12px] font-bold">No active invitations</p>
                <p className="text-[10px]">Verify your profile to help B2B brands discover you.</p>
              </div>
            ) : (
              proposedCampaigns.map(prop => (
                <div 
                  key={prop.id}
                  className="bg-slate-950/40 border border-slate-800/85 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-800"
                >
                  <div>
                    <span className="text-[9px] font-black bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded-md">
                      Pending Approval
                    </span>
                    <h4 className="text-[14px] font-black text-white mt-1.5">
                      {campaignNamesMap.get(prop.campaign_id) || "New Campaign Brief"}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">
                      Brief Parameters: <span className="italic">"{prop.notes || "Sponsorship proposal details."}"</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[15px] font-black text-violet-400">₹{Number(prop.price).toLocaleString()}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sponsorship payout</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Profile Overview Card (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6 bg-slate-900 border border-slate-800/80 rounded-[32px] p-6 shadow-xl justify-between">
          <div>
            <h3 className="text-[15px] font-black text-white">Media Kit Showcase</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Live view verified categories and niches.</p>
          </div>

          <div className="flex flex-col gap-4 py-4 border-y border-slate-800/50 my-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500">Niche Segment</span>
              <span className="text-white font-bold bg-slate-800 px-2.5 py-1 rounded-lg">{creator.category || "General"}</span>
            </div>
            
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500">Location Base</span>
              <span className="text-white font-bold flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-violet-400" />
                {creator.location || "India"}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-500">Active Deals</span>
              <span className="text-emerald-400 font-bold">{approvedCampaigns.length} Projects locked</span>
            </div>
          </div>

          <div className="bg-violet-600/5 border border-violet-500/10 rounded-2xl p-4 flex flex-col gap-1">
            <h5 className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Audit Notification</h5>
            <p className="text-[11px] text-slate-400 font-semibold leading-normal">
              Ensure your Instagram and YouTube handles are correct. Admins verify demographics manually within 24 hours.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
