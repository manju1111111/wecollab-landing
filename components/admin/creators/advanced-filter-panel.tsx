"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, SlidersHorizontal, Search } from "lucide-react";

import { CREATOR_CATEGORIES } from "@/data/creator-categories";

export const CATEGORY_GROUPS = CREATOR_CATEGORIES.map((g) => ({
  title: g.groupName,
  items: g.subCategories,
}));


export function AdvancedFilterPanel({ 
  onFilterChange 
}: { 
  onFilterChange: (filters: any) => void 
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,
    performance: false,
    business: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-80 shrink-0 h-full border-r border-slate-200 bg-white flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-indigo-600" />
          <h2 className="text-[14px] font-bold text-slate-900">Advanced Filters</h2>
        </div>
        <button className="text-[12px] font-semibold text-slate-500 hover:text-indigo-600">
          Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {/* 1. BASIC FILTERS */}
        <div className="mb-1">
          <button 
            onClick={() => toggleSection("basic")}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">1. Basic Filters</span>
            {openSections["basic"] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>
          
          {openSections["basic"] && (
            <div className="p-2 space-y-3">
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1 block">Name / Username</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input type="text" className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Search..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[12px] font-medium text-slate-600 mb-1 block">Gender</label>
                  <select className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <option>Any</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-slate-600 mb-1 block">Country</label>
                  <select className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                    <option>Any</option>
                    <option>India</option>
                    <option>USA</option>
                    <option>UK</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1 block">City / Location</label>
                <input type="text" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[13px] outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Mumbai" />
              </div>
            </div>
          )}
        </div>

        {/* 2. CATEGORY FILTERS */}
        <div className="mb-1 border-t border-slate-100 pt-1">
          <div className="px-2 py-1.5 text-[13px] font-bold text-slate-800 uppercase tracking-wide mt-2">
            2. Category Filters
          </div>
          <div className="mt-1">
            {CATEGORY_GROUPS.map((group) => (
              <div key={group.title} className="mb-1">
                <button 
                  onClick={() => toggleSection(`cat_${group.title}`)}
                  className="w-full flex items-center justify-between p-2 pl-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[13px] font-medium text-slate-700">{group.title}</span>
                  {openSections[`cat_${group.title}`] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </button>
                {openSections[`cat_${group.title}`] && (
                  <div className="pl-6 pr-2 py-1 space-y-1.5 bg-slate-50/50 rounded-b-lg border-l-2 border-indigo-100 ml-3">
                    {group.items.map((item) => (
                      <label key={item} className="flex items-start gap-2 cursor-pointer group/item">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input type="checkbox" className="peer sr-only" />
                          <div className="h-3.5 w-3.5 rounded-sm border border-slate-300 bg-white transition-colors peer-checked:border-indigo-600 peer-checked:bg-indigo-600"></div>
                        </div>
                        <span className="text-[12px] text-slate-600 group-hover/item:text-slate-900 leading-snug">{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. PERFORMANCE FILTERS */}
        <div className="mb-1 border-t border-slate-100 pt-1">
          <button 
            onClick={() => toggleSection("performance")}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">3. Performance</span>
            {openSections["performance"] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>
          {openSections["performance"] && (
            <div className="p-2 space-y-4">
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1 flex justify-between">
                  <span>Followers Range</span>
                  <span className="text-indigo-600 font-bold">10k - 500k+</span>
                </label>
                <input type="range" className="w-full accent-indigo-600" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1 flex justify-between">
                  <span>Avg Views</span>
                  <span className="text-indigo-600 font-bold">5k+</span>
                </label>
                <input type="range" className="w-full accent-indigo-600" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-600 mb-1 flex justify-between">
                  <span>Engagement Rate</span>
                  <span className="text-indigo-600 font-bold">2%+</span>
                </label>
                <input type="range" className="w-full accent-indigo-600" />
              </div>
            </div>
          )}
        </div>

        {/* 4. BUSINESS FILTERS */}
        <div className="mb-1 border-t border-slate-100 pt-1">
          <button 
            onClick={() => toggleSection("business")}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span className="text-[13px] font-bold text-slate-800 uppercase tracking-wide">4. Business</span>
            {openSections["business"] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
          </button>
          {openSections["business"] && (
            <div className="p-2 space-y-2">
              {[
                "Has email available",
                "Has manager / agency",
                "Verified creator",
                "Brand safe",
                "Worked with brands before"
              ].map((label) => (
                <label key={label} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-3.5 w-3.5" />
                  <span className="text-[12px] text-slate-600">{label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
