"use client";

import { useState, useMemo } from "react";
import { 
  X, 
  Check, 
  Search, 
  Lock, 
  User, 
  Heart, 
  Eye, 
  Clock, 
  Zap, 
  ShieldCheck, 
  DollarSign, 
  Sparkles, 
  Users, 
  Briefcase 
} from "lucide-react";

export type ColumnOption = {
  id: string;
  label: string;
  checked: boolean;
  isEstimated?: boolean;
};

export type ColumnCategory = {
  id: string;
  title: string;
  options: ColumnOption[];
  locked?: boolean;
};

export function ColumnsModal({
  isOpen,
  onClose,
  categories,
  onToggleColumn,
  onToggleCategory,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: ColumnCategory[];
  onToggleColumn: (categoryId: string, optionId: string) => void;
  onToggleCategory: (categoryId: string, selectAll: boolean) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("profile");
  const [searchQuery, setSearchQuery] = useState("");

  const categoryIcons: Record<string, any> = {
    profile: User,
    engagement: Heart,
    reach: Eye,
    performance: Clock,
    virality: Zap,
    authenticity: ShieldCheck,
    commercial: DollarSign,
    ai_scores: Sparkles,
    audience_insights: Users,
    brand_intelligence: Briefcase,
  };

  const lockedCategories = useMemo<ColumnCategory[]>(() => [
    {
      id: "audience_insights",
      title: "Audience Metrics (Estimated)",
      locked: true,
      options: [
        { id: "audience_gender", label: "Audience Gender", checked: false },
        { id: "audience_age_groups", label: "Audience Age Groups", checked: false },
        { id: "audience_cities", label: "Audience Cities", checked: false },
        { id: "audience_states", label: "Audience States", checked: false },
        { id: "audience_countries", label: "Audience Countries", checked: false },
        { id: "audience_interests", label: "Audience Interests", checked: false },
        { id: "audience_languages", label: "Audience Languages", checked: false },
      ]
    },
    {
      id: "brand_intelligence",
      title: "Brand Intelligence",
      locked: true,
      options: [
        { id: "brand_affinity", label: "Brand Affinity", checked: false },
        { id: "competitor_affinity", label: "Competitor Affinity", checked: false },
        { id: "brand_safety", label: "Brand Safety", checked: false },
        { id: "audience_dna", label: "Audience DNA", checked: false },
        { id: "content_dna", label: "Content DNA", checked: false },
        { id: "collaboration_suitability", label: "Collaboration Suitability", checked: false },
      ]
    }
  ], []);

  const allCategories = useMemo<ColumnCategory[]>(() => {
    return [...categories, ...lockedCategories];
  }, [categories, lockedCategories]);

  // Filtered categories/options based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return allCategories;
    const query = searchQuery.toLowerCase();
    return allCategories.map(cat => ({
      ...cat,
      options: cat.options.filter(opt => opt.label.toLowerCase().includes(query))
    })).filter(cat => cat.options.length > 0);
  }, [allCategories, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Qoruz Slide-over panel */}
      <div className="relative w-full max-w-3xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 border-l border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Columns Visible</h2>
            <p className="text-[11px] text-slate-400 font-bold mt-0.5">Customize your workspace columns to compare and audit creators.</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-500 transition-colors cursor-pointer">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-[#fafafa]/80 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search columns (e.g. Followers, ER, Cost)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-white border border-slate-200 rounded-xl pl-9 pr-4 text-[12.5px] font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Category Menu Sidebar */}
          <aside className="w-56 bg-slate-50/50 border-r border-slate-200 overflow-y-auto p-3 flex flex-col justify-between select-none">
            <div className="space-y-1">
              <span className="px-2 pb-2 block text-[9.5px] font-black text-slate-400 uppercase tracking-widest">CATEGORIES</span>
              {categories.map((cat) => {
                const Icon = categoryIcons[cat.id] || User;
                const isSelected = searchQuery ? true : activeCategory === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      if (searchQuery) setSearchQuery("");
                      setActiveCategory(cat.id);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition text-[12px] font-extrabold cursor-pointer ${
                      isSelected 
                        ? "bg-slate-800 text-white shadow-sm" 
                        : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-slate-400"}`} />
                    <span className="truncate">{cat.title.replace(" Metrics", "")}</span>
                  </button>
                );
              })}

              <div className="h-[1px] bg-slate-200/60 my-3" />

              <span className="px-2 pb-2 block text-[9.5px] font-black text-slate-400 uppercase tracking-widest">ADD-ONS</span>
              
              {/* Locked Section 1 */}
              <button
                type="button"
                onClick={() => {
                  if (searchQuery) setSearchQuery("");
                  setActiveCategory("audience_insights");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition text-[12px] font-extrabold cursor-pointer ${
                  activeCategory === "audience_insights" && !searchQuery
                    ? "bg-purple-900 text-white shadow-sm" 
                    : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Users className={`h-4 w-4 shrink-0 ${activeCategory === "audience_insights" && !searchQuery ? "text-white" : "text-slate-455"}`} />
                  <span className="truncate text-[11.5px]">Audience Metrics (Est)</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Lock className={`h-3 w-3 ${activeCategory === "audience_insights" && !searchQuery ? "text-purple-200" : "text-slate-400"}`} />
                  <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full uppercase scale-90 ${activeCategory === "audience_insights" && !searchQuery ? "bg-purple-800 text-purple-255" : "bg-purple-50 text-purple-600 border border-purple-100"}`}>Soon</span>
                </div>
              </button>

              {/* Locked Section 2 */}
              <button
                type="button"
                onClick={() => {
                  if (searchQuery) setSearchQuery("");
                  setActiveCategory("brand_intelligence");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition text-[12px] font-extrabold cursor-pointer ${
                  activeCategory === "brand_intelligence" && !searchQuery
                    ? "bg-purple-900 text-white shadow-sm" 
                    : "text-slate-650 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Briefcase className={`h-4 w-4 shrink-0 ${activeCategory === "brand_intelligence" && !searchQuery ? "text-white" : "text-slate-450"}`} />
                  <span className="truncate">Brand Intel</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Lock className={`h-3 w-3 ${activeCategory === "brand_intelligence" && !searchQuery ? "text-purple-200" : "text-slate-400"}`} />
                  <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-full uppercase scale-90 ${activeCategory === "brand_intelligence" && !searchQuery ? "bg-purple-800 text-purple-255" : "bg-purple-50 text-purple-600 border border-purple-100"}`}>Soon</span>
                </div>
              </button>
            </div>

            <div className="bg-slate-100 border border-slate-200/50 p-3 rounded-2xl">
              <span className="text-[10px] font-black text-slate-450 block uppercase tracking-wider">Premium Insights</span>
              <p className="text-[9.5px] text-slate-500 font-bold mt-1 leading-normal">Upgrade list to access full demographic breakdown and client overlap metrics.</p>
            </div>
          </aside>

          {/* Right Column Checkbox List Pane */}
          <main className="flex-1 overflow-y-auto p-6 bg-white">
            {searchQuery ? (
              <div className="space-y-8 animate-in fade-in duration-150">
                {filteredCategories.map((category) => {
                  const isLocked = !!category.locked;
                  return (
                    <div key={category.id} className="space-y-3">
                      <h3 className="text-xs font-black text-indigo-605 uppercase tracking-wider flex items-center gap-2">
                        {category.title}
                        {isLocked && <span className="bg-purple-50 text-purple-750 border border-purple-100 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Coming Soon</span>}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {category.options.map((option) => {
                          if (isLocked) {
                            return (
                              <label key={option.id} className="flex items-center gap-3 cursor-not-allowed group select-none opacity-60">
                                <input 
                                  type="checkbox"
                                  disabled
                                  checked={false}
                                  className="h-4.5 w-4.5 rounded border-slate-300 text-purple-600 cursor-not-allowed accent-purple-600"
                                />
                                <span className="text-[12.5px] font-bold text-slate-500 flex items-center gap-1.5">
                                  {option.label}
                                  <Lock className="h-3 w-3 text-purple-400 shrink-0" />
                                  <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[8.5px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">Coming Soon</span>
                                </span>
                              </label>
                            );
                          }
                          return (
                            <label key={option.id} className="flex items-center gap-3 cursor-pointer group select-none">
                              <input 
                                type="checkbox"
                                checked={option.checked}
                                onChange={() => onToggleColumn(category.id, option.id)}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                              />
                              <span className="text-[12.5px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                                {option.label}
                                {option.isEstimated && (
                                  <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[8.5px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">⚠ Est</span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {filteredCategories.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs font-bold">
                    No columns found matching "{searchQuery}"
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-150">
                {allCategories.filter(c => c.id === activeCategory).map((category) => {
                  const isLocked = !!category.locked;
                  const allSelected = !isLocked && category.options.every(o => o.checked);
                  
                  return (
                    <div key={category.id} className="space-y-6">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2">
                          {category.title}
                          {isLocked && <span className="bg-purple-50 text-purple-750 border border-purple-100 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Coming Soon</span>}
                        </h3>
                        {!isLocked && (
                          <button 
                            onClick={() => onToggleCategory(category.id, !allSelected)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-indigo-650 hover:bg-indigo-50 transition border border-indigo-100 cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            {allSelected ? "Deselect All" : "Select All"}
                          </button>
                        )}
                        {isLocked && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-150 px-2 py-1 rounded-lg">
                            <Lock className="h-3.5 w-3.5 text-slate-400" /> Premium Add-on
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {category.options.map((option) => {
                          if (isLocked) {
                            return (
                              <label key={option.id} className="flex items-center gap-3 cursor-not-allowed group select-none opacity-60">
                                <input 
                                  type="checkbox"
                                  disabled
                                  checked={false}
                                  className="h-4.5 w-4.5 rounded border-slate-350 text-purple-600 cursor-not-allowed accent-purple-600"
                                />
                                <span className="text-[12.5px] font-bold text-slate-500 flex items-center gap-1.5">
                                  {option.label}
                                  <Lock className="h-3 w-3 text-purple-400 shrink-0" />
                                  <span className="bg-purple-50 text-purple-750 border border-purple-100 text-[8.5px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">Coming Soon</span>
                                </span>
                              </label>
                            );
                          }
                          return (
                            <label key={option.id} className="flex items-center gap-3 cursor-pointer group select-none">
                              <input 
                                type="checkbox"
                                checked={option.checked}
                                onChange={() => onToggleColumn(category.id, option.id)}
                                className="h-4.5 w-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                              />
                              <span className="text-[12.5px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                                {option.label}
                                {option.isEstimated && (
                                  <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[8.5px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-90">⚠ Est</span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-150 bg-[#fafafa]/50 shrink-0">
          <button 
            onClick={onClose}
            className="flex-1 bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-[12px] font-black shadow-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white px-4 py-2.5 rounded-xl text-[12px] font-black shadow-sm transition cursor-pointer"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

