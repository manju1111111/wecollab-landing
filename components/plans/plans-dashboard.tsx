"use client";

import { useState } from "react";
import { Plus, Search, MoreVertical, X } from "lucide-react";
import { createPlan } from "@/app/plans/actions";
import { useRouter } from "next/navigation";

export function PlansDashboard({ initialPlans }: { initialPlans: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

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

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Plans & Lists</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#eb5b3c] hover:bg-[#d64e31] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={3} /> New Plan
        </button>
      </header>

      {/* Tabs & Controls */}
      <div className="px-8 py-6 flex items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button className="bg-slate-900 text-white px-5 py-1.5 rounded-md text-[13px] font-bold tracking-wide shadow-sm">
            ACTIVE ({initialPlans.length})
          </button>
          <button className="text-slate-500 hover:text-slate-900 px-5 py-1.5 rounded-md text-[13px] font-bold tracking-wide transition-colors">
            ARCHIVED
          </button>
        </div>

        <div className="flex items-center gap-4">
          <select className="bg-white border border-slate-200 text-slate-700 text-[13px] font-medium rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20">
            <option>Owned by anyone</option>
            <option>Owned by me</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search plans"
              className="bg-white border border-slate-200 text-slate-900 text-[13px] rounded-lg pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
            />
          </div>

          <div className="text-[13px] text-slate-500 font-medium ml-2">
            Sort by : <span className="text-slate-900 font-bold">Recently Opened</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-[12px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-4 font-bold">Plan Name</th>
              <th className="py-4 font-bold text-center">Platforms</th>
              <th className="py-4 font-bold text-center">Total Influencers</th>
              <th className="py-4 font-bold text-center">Total Lists</th>
              <th className="py-4 font-bold">Created By</th>
              <th className="py-4 font-bold">Created On</th>
              <th className="py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {initialPlans.map((plan) => (
              <tr 
                key={plan.id} 
                className="group hover:bg-slate-50/80 cursor-pointer transition-colors"
                onClick={() => router.push(`/plans/${plan.id}`)}
              >
                <td className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 shadow-sm flex items-center justify-center text-white font-bold text-lg">
                      {plan.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-[15px]">{plan.name}</p>
                      <p className="text-[12px] text-slate-400 font-medium mt-0.5">{plan.brand || "None"}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <div className="flex justify-center gap-1.5">
                    {plan.platforms.length > 0 ? (
                      plan.platforms.map((p: string) => (
                        <div key={p} className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 text-white shadow-sm">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </div>
                </td>
                <td className="py-4 text-center">
                  <span className="text-[14px] font-semibold text-slate-700">{plan.totalInfluencers}</span>
                </td>
                <td className="py-4 text-center">
                  <span className="text-[14px] font-semibold text-slate-700">{plan.totalLists}</span>
                </td>
                <td className="py-4 text-[14px] font-medium text-slate-700">
                  {plan.created_by}
                </td>
                <td className="py-4 text-[13px] font-medium text-slate-500">
                  {new Date(plan.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="py-4 text-right">
                  <button className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition-colors" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[550px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Create Plan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Plan Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter plan name"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-[14px] outline-none focus:border-[#7c829e] focus:ring-1 focus:ring-[#7c829e]"
                  />
                </div>
                
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1.5">Brand <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      name="brand"
                      required
                      placeholder="Select brand"
                      className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-[14px] outline-none focus:border-[#7c829e] focus:ring-1 focus:ring-[#7c829e]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[13px] font-semibold text-slate-500 mb-3">I want to add influencers by</p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="method" value="search" defaultChecked className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900" />
                      <span className="text-[14px] font-bold text-slate-700">Searching Influencers From Qoruz</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" name="method" value="manual" className="w-4 h-4 text-slate-900 border-slate-300 focus:ring-slate-900" />
                      <span className="text-[14px] font-medium text-slate-500">Adding Influencers Manually</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#7c829e] hover:bg-[#6b718b] text-white px-6 py-2.5 rounded-lg text-[14px] font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
