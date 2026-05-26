"use client";

import Image from "next/image";
import { Creator } from "@/data/mock-creators";
import { Info, ArrowDown, ArrowUp, CheckCircle2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";

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
}: {
  creators: Creator[];
  selectedIds: string[];
  onToggleId: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onCreatorClick: (creator: Creator) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
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
      // Deselect all
      onSelectAll(selectedIds.filter(id => !sortedCreators.find(c => (c.id || (c as any).objectID) === id)));
    } else {
      // Select all
      const newIds = new Set([...selectedIds, ...sortedCreators.map((c) => c.id || (c as any).objectID)]);
      onSelectAll(Array.from(newIds));
    }
  };

  // Utility to format large numbers
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
        <table className="w-full min-w-[1000px] text-left text-[13px]">
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
                  Qoruz Score <SortIcon col="score" /> {!sortCol || sortCol !== "score" ? <Info className="h-3.5 w-3.5 text-slate-300" /> : null}
                </div>
              </th>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedCreators.map((creator) => {
              const creatorId = creator.id || (creator as any).objectID;
              const isSelected = selectedIds.includes(creatorId);
              return (
                <tr
                  key={creatorId}
                  className={`group transition-colors ${
                    isSelected ? "bg-violet-50/50" : "hover:bg-slate-50/50"
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
                        <Image src={(creator as any).avatar_url || (creator as any).profile_image || creator.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"} alt={creator.name || "Creator"} fill className="object-cover" />
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
                        <span key={cat} className="inline-flex rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 border border-slate-200 shadow-sm truncate max-w-[120px]">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {/* Infinite Scroll Target */}
            {hasMore && (
              <tr ref={observerTarget}>
                <td colSpan={9} className="py-6 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600"></div>
                    <span className="text-sm">Loading more creators...</span>
                  </div>
                </td>
              </tr>
            )}
            {creators.length === 0 && (
              <tr>
                <td colSpan={9} className="py-20 text-center">
                  <div className="text-[14px] font-bold text-slate-900">No creators found</div>
                  <p className="text-[13px] text-slate-500 mt-1">Try adjusting your filters.</p>
                </td>
              </tr>
            )}

            {/* Spacer row for comfortable scrolling */}
            <tr>
              <td colSpan={9} className="h-32"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
