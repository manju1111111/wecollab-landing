"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, ExternalLink, MessageSquare, CheckCircle2, AlertCircle, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { formatNumber } from "@/lib/utils";

export function CreatorDataGrid({
  creators,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onRowClick,
  onDelete,
  onLoadMore,
  hasMore
}: {
  creators: any[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onRowClick: (creator: any) => void;
  onDelete: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}) {
  const allSelected = creators.length > 0 && selectedIds.length === creators.length;
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

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(creators.map(c => c.id));
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="w-full text-left whitespace-nowrap min-w-max">
          <thead className="sticky top-0 bg-slate-50 z-10 shadow-[0_1px_0_#e2e8f0]">
            <tr className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-12">
                <input 
                  type="checkbox" 
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" 
                />
              </th>
              <th className="py-3 px-4">Creator</th>
              <th className="py-3 px-4">Performance</th>
              <th className="py-3 px-4">Categories</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {creators.map((creator) => {
              const isSelected = selectedIds.includes(creator.id);
              return (
                <tr 
                  key={creator.id} 
                  className={`group transition-colors cursor-pointer ${isSelected ? "bg-indigo-50/50" : "hover:bg-slate-50"}`}
                  onClick={(e) => {
                    // Prevent row click if clicking checkbox or action buttons
                    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName.toLowerCase() === 'input') {
                      return;
                    }
                    onRowClick(creator);
                  }}
                >
                  <td className="py-2.5 px-4 w-12">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => onToggleSelect(creator.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4" 
                    />
                  </td>
                  
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                        <Image 
                          src={creator.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"} 
                          alt={creator.name} 
                          fill 
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-bold text-slate-900">{creator.name}</span>
                          {creator.verified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />}
                        </div>
                        <a 
                          href={`https://instagram.com/${creator.username}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[12px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-0.5"
                          onClick={e => e.stopPropagation()}
                        >
                          @{creator.username} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">Followers</div>
                        <div className="text-[13px] font-bold text-slate-900 mt-0.5">{formatNumber(creator.followers || 0)}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">Avg Views</div>
                        <div className="text-[13px] font-bold text-slate-900 mt-0.5">{creator.avg_reel_views || 0}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500 uppercase">ER</div>
                        <div className="text-[13px] font-bold text-slate-900 mt-0.5">{creator.engagement_rate || 0}%</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-4">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {(creator.tags || []).slice(0, 2).map((cat: string) => (
                        <span key={cat} className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px] px-2 py-0.5 rounded-md font-semibold truncate max-w-[120px]">
                          {cat}
                        </span>
                      ))}
                      {(creator.tags || []).length > 2 && (
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[11px] px-2 py-0.5 rounded-md font-semibold">
                          +{(creator.tags || []).length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      {creator.email ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[11px] font-bold">
                          <CheckCircle2 className="h-3 w-3" /> Contact Info
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-[11px] font-bold">
                          <AlertCircle className="h-3 w-3" /> Missing Info
                        </span>
                      )}
                      
                      {creator.has_manager && (
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-[11px] font-bold">
                          Managed
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // trigger email action
                        }}
                        className="h-8 w-8 flex items-center justify-center rounded bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-indigo-600 transition-colors"
                        title="Send Message"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(creator.id);
                        }}
                        className="h-8 w-8 flex items-center justify-center rounded bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete Creator"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {hasMore && (
              <tr ref={observerTarget}>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600"></div>
                    <span className="text-[13px] font-bold">Loading more creators...</span>
                  </div>
                </td>
              </tr>
            )}

            {creators.length === 0 && (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="text-[14px] font-bold text-slate-900">No creators found</div>
                  <p className="text-[13px] text-slate-500 mt-1">Try adjusting your filters.</p>
                </td>
              </tr>
            )}

            {/* Spacer row for comfortable scrolling */}
            <tr>
              <td colSpan={6} className="h-32"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
