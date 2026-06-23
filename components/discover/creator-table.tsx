"use client";

import { Creator } from "@/data/mock-creators";
import { Info, ArrowDown, ArrowUp, CheckCircle2, Check, Sparkles } from "lucide-react";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { sanitizeImageSrc, getInitials, resolveCreatorImage } from "@/lib/avatar-utils";
import Image from "next/image";

// ─── CreatorAvatar ────────────────────────────────────────────────────────────
function CreatorAvatar({ src, name, className = "h-11 w-11" }: { src?: string; name: string; className?: string }) {
  const safeSrc = sanitizeImageSrc(src);
  const [loadedSrc, setLoadedSrc] = useState(safeSrc);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sanitizeImageSrc(src) !== loadedSrc) {
      setLoadedSrc(sanitizeImageSrc(src));
      setError(false);
    }
  }, [src]);

  const initials = getInitials(name);

  const colorClasses = [
    "from-violet-400 to-indigo-500",
    "from-rose-400 to-pink-500",
    "from-fuchsia-400 to-primary",
    "from-emerald-400 to-teal-500",
    "from-sky-400 to-blue-500",
    "from-fuchsia-400 to-purple-500",
  ];
  const colorIdx = name ? name.charCodeAt(0) % colorClasses.length : 0;
  const gradientClass = colorClasses[colorIdx];

  if (!loadedSrc || error) {
    return (
      <div
        className={`${className} rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-bold text-[13px] shrink-0 select-none`}
        aria-label={`${name} avatar initials`}
      >
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={loadedSrc}
      alt={`${name} profile photo`}
      fill
      sizes="44px"
      unoptimized
      onError={() => setError(true)}
      className="object-cover"
    />
  );
}

// ─── RowSaveButton Component for 1-Click Quick Saving ──────────────────────
function RowSaveButton({ creator, plans }: { creator: Creator; plans: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedListName, setSavedListName] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const creatorId = creator.id || (creator as any).objectID;

  // Check if already saved in any list on mount or plans change
  useEffect(() => {
    for (const plan of plans) {
      for (const list of plan.lists) {
        if ((list.creator_ids || []).includes(creatorId)) {
          setSavedListName(list.name);
          return;
        }
      }
    }
    setSavedListName(null);
  }, [plans, creatorId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveToList = async (listId: string, listName: string) => {
    setIsSaving(true);
    setIsOpen(false);
    try {
      const { addCreatorsToList } = await import("@/app/plans/actions");
      await addCreatorsToList(listId, [creatorId]);
      setSavedListName(listName);
    } catch (err) {
      console.error("[QUICK_SAVE_ERROR]", err);
      alert("Failed to save creator.");
    } finally {
      setIsSaving(false);
    }
  };

  if (savedListName) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1 select-none animate-in fade-in duration-200">
        <Check className="h-3.5 w-3.5" strokeWidth={3} /> {savedListName}
      </span>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={isSaving}
        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 md:px-3 md:py-1.5 rounded-lg text-[12px] flex items-center gap-1 transition shadow-sm cursor-pointer min-h-[40px] md:min-h-0"
      >
        {isSaving ? "Saving..." : "+ Save"}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl ring-1 ring-slate-100 z-50 p-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
            Choose Campaign List
          </div>
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {plans.map(plan => (
              <div key={plan.id} className="space-y-0.5">
                <div className="px-2.5 py-1 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50/50 rounded-md">
                  💼 {plan.name}
                </div>
                {plan.lists.map((list: any) => (
                  <button
                    key={list.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveToList(list.id, list.name);
                    }}
                    className="w-full text-left text-[11px] font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-750 px-4 py-1.5 rounded-md transition"
                  >
                    ↳ {list.name}
                  </button>
                ))}
              </div>
            ))}
            {plans.length === 0 && (
              <div className="px-2.5 py-3 text-[11px] text-slate-400 text-center font-medium">
                No active plans.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type SortCol = "followers" | "score" | "er";
type SortDir = "asc" | "desc";

export function CreatorTable({
  creators,
  selectedIds,
  onToggleId,
  onSelectAll,
  onCreatorClick,
  onLoadMore,
  hasMore,
  plans = [],
  activePlanId = null,
}: {
  creators: Creator[];
  selectedIds: string[];
  onToggleId: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onCreatorClick: (creator: Creator) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  plans?: any[];
  activePlanId?: string | null;
}) {
  const [sortCol, setSortCol] = useState<SortCol>("followers");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const observerTarget = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  // Dynamic Blueprint Fit Score matching logic
  const activePlan = useMemo(() => {
    return plans.find(p => p.id === activePlanId);
  }, [plans, activePlanId]);

  const getFitScore = useCallback((creator: Creator) => {
    if (!activePlan) return 100;
    
    const planNameLower = (activePlan.name || "").toLowerCase();
    const planBrandLower = (activePlan.brand || "").toLowerCase();
    
    const creatorCategories: string[] = (creator as any).categories || (creator as any).tags || [creator.category || ""];
    const catLower = creatorCategories.map(c => c.toLowerCase());
    
    let baseScore = 75; // Starting score
    
    const niches = ["fitness", "activewear", "sport", "beauty", "fashion", "cosmetics", "tech", "gaming", "lifestyle", "food", "travel"];
    
    niches.forEach(niche => {
      const isNicheInPlan = planNameLower.includes(niche) || planBrandLower.includes(niche);
      const isNicheInCreator = catLower.some(c => c.includes(niche));
      
      if (isNicheInPlan && isNicheInCreator) {
        baseScore += 20; // High niche match bonus
      } else if (isNicheInPlan && !isNicheInCreator) {
        baseScore -= 10; // Niche mismatch penalty
      }
    });

    const followers = (creator as any).followers || (creator as any).followers_count || creator.totalFollowers || 10000;
    if (followers > 500000 && (planNameLower.includes("celebrity") || planNameLower.includes("macro"))) {
      baseScore += 5;
    } else if (followers < 100000 && planNameLower.includes("micro")) {
      baseScore += 5;
    }
    
    return Math.min(100, Math.max(60, baseScore));
  }, [activePlan]);

  // Sort logic
  const sortedCreators = useMemo(() => {
    return [...creators].sort((a, b) => {
      let aVal = 0;
      let bVal = 0;
      
      if (sortCol === "followers") {
        aVal = a.totalFollowers || (a as any).followers_count || (a as any).followers || 0;
        bVal = b.totalFollowers || (b as any).followers_count || (b as any).followers || 0;
      } else if (sortCol === "score") {
        aVal = a.score || (a as any).rating || 0;
        bVal = b.score || (b as any).rating || 0;
      } else if (sortCol === "er") {
        aVal = a.engagementRate || (a as any).engagement_rate || 0;
        bVal = b.engagementRate || (b as any).engagement_rate || 0;
      }

      if (sortDir === "asc") return aVal - bVal;
      return bVal - aVal;
    });
  }, [creators, sortCol, sortDir]);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const isAllSelected =
    sortedCreators.length > 0 &&
    sortedCreators.every((c) => selectedIds.includes(c.id || (c as any).objectID));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      onSelectAll(selectedIds.filter(id => !sortedCreators.find(c => (c.id || (c as any).objectID) === id)));
    } else {
      const newIds = new Set([...selectedIds, ...sortedCreators.map((c) => c.id || (c as any).objectID)]);
      onSelectAll(Array.from(newIds));
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return null;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="flex h-full flex-col w-full bg-white">
      <div className="flex-1 overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left text-[13px]">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-t border-slate-200 text-slate-500">
              <th className="w-12 py-3 pl-6 pr-2 font-medium">
                <button
                  onClick={toggleSelectAll}
                  className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                    isAllSelected
                      ? "border-violet-500 bg-violet-500 text-white"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                >
                  {isAllSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                </button>
              </th>
              <th className="py-3 pr-4 font-medium">Instagram Profiles</th>
              <th
                className="py-3 px-2 font-medium cursor-pointer hover:text-slate-900 transition"
                onClick={() => handleSort("score")}
              >
                <div className="flex items-center gap-1.5">
                  WeCollab Score <SortIcon col="score" /> {!sortCol || sortCol !== "score" ? <Info className="h-3.5 w-3.5 text-slate-300" /> : null}
                </div>
              </th>
              
              {/* Dynamic Blueprint Fit matchmaker column */}
              {activePlanId && (
                <th className="py-3 px-2 font-medium">Blueprint Fit</th>
              )}

              <th
                className="py-3 px-2 font-medium cursor-pointer hover:text-slate-900 transition"
                onClick={() => handleSort("followers")}
              >
                <div className="flex items-center gap-1">
                  Followers <SortIcon col="followers" />
                </div>
              </th>
              <th className="py-3 px-2 font-medium">Avg Likes</th>
              <th className="py-3 px-2 font-medium">Avg Reel Views</th>
              <th
                className="py-3 px-2 font-medium cursor-pointer hover:text-slate-900 transition"
                onClick={() => handleSort("er")}
              >
                <div className="flex items-center gap-1.5">
                  ER <SortIcon col="er" />
                </div>
              </th>
              <th className="py-3 px-2 font-medium">Location</th>
              <th className="py-3 px-6 font-medium">Categories</th>
              <th className="py-3 px-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedCreators.map((creator) => {
              const creatorId = creator.id || (creator as any).objectID;
              const isSelected = selectedIds.includes(creatorId);
              const fitScore = getFitScore(creator);

              return (
                <tr
                  key={creatorId}
                  className={`group transition-all duration-300 ${
                    isSelected ? "bg-primary-soft/30" : "hover:bg-primary-soft/10"
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-4 pl-6 pr-2">
                    <button
                      onClick={() => onToggleId(creatorId)}
                      className={`flex h-4 w-4 items-center justify-center rounded border transition ${
                        isSelected
                          ? "border-violet-500 bg-violet-500 text-white"
                          : "border-slate-300 bg-white hover:border-slate-400 group-hover:border-slate-400"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </button>
                  </td>
                  
                  {/* Profile */}
                  <td className="py-4 pr-4">
                    <div
                      className="flex items-center gap-3 cursor-pointer group/profile"
                      onClick={() => onCreatorClick(creator)}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-transparent transition group-hover/profile:ring-violet-200 bg-slate-100">
                        <CreatorAvatar src={resolveCreatorImage(creator)} name={creator.name || "Creator"} className="h-11 w-11" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#1e2330] group-hover/profile:text-violet-700 transition">
                            {creator.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[12px] text-[#2563eb]">
                          @{(creator as any).username || creator.handle}
                          {creator.verified && (
                            <CheckCircle2 className="h-3.5 w-3.5 fill-[#2563eb] text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="py-4 px-2 font-semibold text-[#ef4444]">
                    {((creator as any).score || (creator as any).rating || 8.5).toFixed(2)}
                  </td>

                  {/* Dynamic Blueprint Fit Score Badge */}
                  {activePlanId && (
                    <td className="py-4 px-2 font-bold">
                      <span className={`inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 py-0.5 text-[11px] font-black border transition-all ${
                        fitScore >= 90
                          ? "bg-emerald-50 border-emerald-250 text-emerald-600 shadow-sm shadow-emerald-50"
                          : fitScore >= 80
                          ? "bg-primary-soft border-primary/20 text-primary shadow-sm shadow-primary/5"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}>
                        <svg className="h-3.5 w-3.5 -rotate-90" viewBox="0 0 16 16">
                          <circle cx="8" cy="8" r="6" fill="transparent" stroke={fitScore >= 90 ? "#a7f3d0" : fitScore >= 80 ? "#ddd6fe" : "#cbd5e1"} strokeWidth="2" />
                          <circle cx="8" cy="8" r="6" fill="transparent" stroke={fitScore >= 90 ? "#059669" : fitScore >= 80 ? "#7c3aed" : "#94a3b8"} strokeWidth="2" strokeDasharray={2 * Math.PI * 6} strokeDashoffset={2 * Math.PI * 6 - (fitScore / 100) * 2 * Math.PI * 6} strokeLinecap="round" />
                        </svg>
                        {fitScore}% Match
                      </span>
                    </td>
                  )}

                  {/* Followers */}
                  <td className="py-4 px-2 text-slate-700">
                    {formatNumber((creator as any).followers_count || (creator as any).followers || creator.totalFollowers || 0)}
                  </td>

                  {/* Avg Likes */}
                  <td className="py-4 px-2 text-slate-700">
                    {formatNumber((creator as any).avg_likes || creator.avgLikes || 0)}
                  </td>

                  {/* Avg Reel Views */}
                  <td className="py-4 px-2 text-slate-700">
                    {formatNumber((creator as any).avg_views || (creator as any).avg_reel_views || creator.avgReelViews || 0)}
                  </td>

                  {/* ER */}
                  <td className="py-4 px-2 text-slate-700">
                    {((creator as any).engagement_rate || creator.engagementRate || 0)}%
                  </td>

                  {/* Location */}
                  <td className="py-4 px-2 text-slate-700 truncate max-w-[100px]">
                    {((creator as any).location || creator.location || "Unknown").split(",")[0]}
                  </td>

                  {/* Categories */}
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5">
                      {((creator as any).categories || (creator as any).tags || [creator.category || "Lifestyle"]).slice(0,2).map((cat: string) => (
                        <span key={cat} className="inline-flex rounded-lg bg-primary-soft/40 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/10 shadow-sm truncate max-w-[120px]">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Quick-Save Action Button */}
                  <td className="py-4 px-6 text-right relative">
                    <RowSaveButton creator={creator} plans={plans} />
                  </td>
                </tr>
              );
            })}
            
            {/* Infinite Scroll Target */}
            {hasMore && (
              <tr ref={observerTarget}>
                <td colSpan={activePlanId ? 11 : 10} className="py-6 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600"></div>
                    <span className="text-sm">Loading more creators...</span>
                  </div>
                </td>
              </tr>
            )}
            {creators.length === 0 && (
              <tr className="border-none">
                <td colSpan={activePlanId ? 11 : 10} className="py-20 text-center">
                  <div className="text-[14px] font-bold text-slate-900">No creators found</div>
                  <p className="text-[13px] text-slate-500 mt-1">Try adjusting your filters.</p>
                </td>
              </tr>
            )}

            {/* Spacer row for comfortable scrolling */}
            <tr className="border-none">
              <td colSpan={activePlanId ? 11 : 10} className="h-32 border-none"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
