"use client";

import { useState } from "react";
import { ChevronLeft, MoreHorizontal, Download, MessageSquare, Plus, Check } from "lucide-react";
import { CreateListModal } from "./create-list-modal";
import { ColumnsModal, ColumnCategory } from "./columns-modal";
import Image from "next/image";
import Link from "next/link";
import { mockCreators } from "@/data/mock-creators";

// The categories matching the screenshots
const initialCategories: ColumnCategory[] = [
  {
    id: "plan",
    title: "Plan Metrics",
    options: [
      { id: "cbf", label: "CBF Index", checked: false },
      { id: "total_cost", label: "Total Cost", checked: false },
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
  },
  {
    id: "messenger",
    title: "Influencer Messenger Response Metrics",
    options: [
      { id: "msg_acc", label: "Msgr Acceptance", checked: false },
      { id: "msg_wa", label: "Msgr Whatsapp Number", checked: false },
      { id: "msg_phone", label: "Msgr Phone Number", checked: false },
      { id: "msg_email", label: "Msgr Email", checked: false },
    ]
  }
];

export function PlanWorkspace({ plan, creatorsMap }: { plan: any, creatorsMap: any }) {
  const [activeListId, setActiveListId] = useState<string | null>(plan.lists[0]?.id || null);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [categories, setCategories] = useState(initialCategories);

  const activeList = plan.lists.find((l: any) => l.id === activeListId);
  
  // Connect the real creators mapped from the database via the server component
  const listCreators = activeList 
    ? (activeList.creator_ids || []).map((id: string) => creatorsMap[id]).filter(Boolean)
    : [];

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

  // Helper to check if a column is visible
  const isColVisible = (id: string) => {
    for (const cat of categories) {
      const opt = cat.options.find(o => o.id === id);
      if (opt && opt.checked) return true;
    }
    return false;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/plans" className="text-slate-400 hover:text-slate-900 transition p-1">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {plan.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 leading-tight">{plan.name}</h1>
              <div className="flex items-center gap-2 text-[12px] text-slate-400 font-medium">
                <span>{plan.brand}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>Created on {new Date(plan.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="h-9 w-9 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button className="h-9 w-9 flex items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            <Download className="h-4 w-4" />
          </button>
          <button className="h-9 px-4 flex items-center gap-2 rounded border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition">
            Set CBF Index <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[10px]">NEW</span>
          </button>
          <button className="h-9 px-5 rounded bg-[#eb5b3c] hover:bg-[#d64e31] text-white text-[13px] font-bold transition">
            Add Influencers
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Lists */}
        <aside className="w-64 border-r border-slate-200 bg-[#fafafa] flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">Lists</span>
            <button 
              onClick={() => setIsCreateListOpen(true)}
              className="text-[13px] font-bold text-slate-600 flex items-center gap-1 hover:text-slate-900"
            >
              <Plus className="h-4 w-4" /> New List
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {plan.lists.map((list: any) => (
              <button
                key={list.id}
                onClick={() => setActiveListId(list.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition ${
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
              <div className="flex bg-slate-100 p-0.5 rounded-md">
                <button className="bg-slate-800 text-white px-4 py-1.5 rounded text-[12px] font-bold shadow-sm">
                  ☰ List
                </button>
                <button className="text-slate-500 hover:text-slate-900 px-4 py-1.5 rounded text-[12px] font-bold transition">
                  Summary
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsColumnsOpen(true)}
                className="h-9 px-4 rounded border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
              >
                ⊞ Columns Visible <span>▼</span>
              </button>
              <button className="h-9 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold flex items-center gap-2 transition">
                <MessageSquare className="h-4 w-4" /> Message All
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto">
            {activeList ? (
              <table className="w-full text-left whitespace-nowrap min-w-max">
                <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_#f1f5f9]">
                  <tr className="text-[12px] font-bold text-slate-500 border-b border-slate-100">
                    <th className="py-4 px-6">Influencer Name</th>
                    <th className="py-4 px-4">On HashFame?</th>
                    <th className="py-4 px-4">Location</th>
                    
                    {/* Platform Metrics */}
                    {isColVisible("followers") && <th className="py-4 px-4">Followers</th>}
                    {isColVisible("avg_likes") && <th className="py-4 px-4">Likes (Avg)</th>}
                    {isColVisible("avg_comments") && <th className="py-4 px-4">Comments (Avg)</th>}
                    {isColVisible("er") && <th className="py-4 px-4">ER %</th>}
                    
                    {/* Mocked Audience Metrics */}
                    {isColVisible("aud_gender") && <th className="py-4 px-4">Audience Gender</th>}
                    {isColVisible("aud_age") && <th className="py-4 px-4">Audience Age</th>}
                    {isColVisible("aud_cities") && <th className="py-4 px-4">Top Cities</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {listCreators.map((creator: any) => (
                    <tr key={creator.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0">
                            <Image src={creator.avatar} alt={creator.name} fill className="object-cover" />
                          </div>
                          <span className="text-[13px] font-bold text-slate-900">{creator.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                          <X className="h-3.5 w-3.5" /> Not-In
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[13px] text-slate-700">
                        {creator.location.split(',')[0]}
                      </td>

                      {/* Real Data Metrics */}
                      {isColVisible("followers") && <td className="py-4 px-4 text-[13px] text-slate-700 font-medium">{(creator.totalFollowers / 1000).toFixed(1)}k</td>}
                      {isColVisible("avg_likes") && <td className="py-4 px-4 text-[13px] text-slate-700">{creator.avgLikes}</td>}
                      {isColVisible("avg_comments") && <td className="py-4 px-4 text-[13px] text-slate-700">{(creator.engagementRate * 12).toFixed(0)}</td>}
                      {isColVisible("er") && <td className="py-4 px-4 text-[13px] text-slate-700">{creator.engagementRate}%</td>}

                      {/* Mocked Data Metrics (Because our DB doesn't have this yet, to match screenshot) */}
                      {isColVisible("aud_gender") && <td className="py-4 px-4 text-[12px] text-slate-500">Male: 39.42%, Fe...</td>}
                      {isColVisible("aud_age") && <td className="py-4 px-4 text-[12px] text-slate-500">13-17: 3.48%, 18-2...</td>}
                      {isColVisible("aud_cities") && <td className="py-4 px-4 text-[12px] text-slate-500">Delhi, Mumbai</td>}
                    </tr>
                  ))}
                  
                  {listCreators.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-20 text-center">
                        <div className="text-[14px] font-bold text-slate-900">No Influencers in This List</div>
                        <p className="text-[13px] text-slate-500 mt-1">Start building your list by adding influencers.</p>
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
          
          {/* Footer */}
          {activeList && (
            <div className="h-12 border-t border-slate-200 bg-white px-6 flex items-center text-[12px] font-bold text-slate-500 shrink-0">
              Showing 1-{listCreators.length} Influencers of {listCreators.length}
            </div>
          )}
        </main>
      </div>

      <CreateListModal 
        isOpen={isCreateListOpen} 
        onClose={() => setIsCreateListOpen(false)} 
        planId={plan.id}
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
