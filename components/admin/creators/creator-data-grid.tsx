"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, ExternalLink, MessageSquare, CheckCircle2, AlertCircle, Edit, Trash2, Sparkles, Check, Send } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export function CreatorAvatar({ src, name, className = "h-10 w-10" }: { src: string; name: string; className?: string }) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  // Extract initials
  const initials = name
    ? name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  if (!src || error) {
    return (
      <div className={`${className} rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[13px] shrink-0 uppercase`}>
        {initials}
      </div>
    );
  }

  // Proxy Instagram CDN images to avoid hotlink blocks and CORS errors
  const isInstagramUrl = src.includes("cdninstagram.com") || src.includes("fbcdn.net") || src.includes("instagram.com");
  const displaySrc = (src.startsWith("http") && isInstagramUrl)
    ? `/api/proxy-image?url=${encodeURIComponent(src)}`
    : src;

  return (
    <img
      src={displaySrc}
      alt={name}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
      className="object-cover h-full w-full"
    />
  );
}

export function CreatorDataGrid({
  creators,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onRowClick,
  onDelete,
  onLoadMore,
  hasMore,
  onApprove
}: {
  creators: any[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onRowClick: (creator: any) => void;
  onDelete: (id: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onApprove?: (id: string) => void;
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

  const getStatusBadge = (creator: any) => {
    const status = creator.verification_status || "Pending Verification";
    if (status === "Verified") {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
          <CheckCircle2 className="h-3 w-3" /> Live
        </span>
      );
    }
    if (status === "Ready for Review") {
      return (
        <span className="inline-flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider animate-pulse">
          <Sparkles className="h-3 w-3" /> Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
        <AlertCircle className="h-3 w-3" /> Draft
      </span>
    );
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
              <th className="py-3 px-4">Verification Status</th>
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
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 h-4 w-4 animate-scaleIn" 
                    />
                  </td>
                  
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0 border border-slate-200">
                        <CreatorAvatar src={creator.profile_image} name={creator.name} className="h-10 w-10" />
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
                          className="text-[12px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-0.5 font-semibold"
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
                    {getStatusBadge(creator)}
                  </td>

                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      {/* Interactive 1-click Approve Button for pending approvals */}
                      {creator.verification_status === "Ready for Review" && onApprove && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(creator.id);
                          }}
                          className="h-8 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold flex items-center gap-1 transition shadow-sm cursor-pointer"
                          title="Approve & Publish to Discover"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          Approve
                        </button>
                      )}

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // trigger email action placeholder
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
