"use client";

import { useState, useEffect } from "react";
import { DiscoverHeader } from "@/components/discover/discover-header";
import { DiscoverFilters, FilterState } from "@/components/discover/discover-filters";
import { CreatorTable } from "@/components/discover/creator-table";
import { PlansSidebar } from "@/components/discover/plans-sidebar";
import { CreatorProfilePanel } from "@/components/discover/creator-profile-panel";
import { Creator } from "@/data/mock-creators";
import { SaveToListModal } from "@/components/discover/save-to-list-modal";
import { createClient } from "@/lib/supabase/client";

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    platform: "All Platforms",
    location: "All",
    gender: "All",
    followers: "all",
    hasContact: false,
    subCategories: [],
  });

  // Interactivity States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  
  // Real Plans State
  const [plans, setPlans] = useState<any[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Fetch real plans on mount
  useEffect(() => {
    import("@/app/plans/actions").then((mod) => {
      mod.getPlans().then(setPlans);
    });
  }, []);

  const refreshPlans = () => {
    import("@/app/plans/actions").then((mod) => {
      mod.getPlans().then(setPlans);
    });
  };

  useEffect(() => {
    async function fetchCreators() {
      setIsLoading(true);
      setPage(1);
      try {
        const res = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            platform: filters.platform,
            location: filters.location,
            followers: filters.followers,
            subCategories: filters.subCategories,
            limit: 20,
            page: 1,
          }),
        });
        const data = await res.json();
        setCreators(data.hits || []);
        setHasMore(data.page < data.totalPages);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    const timeoutId = setTimeout(() => {
      fetchCreators();
    }, 300);

    // CORE SYSTEM RULE: Real-time Auto Refresh Engine
    const supabase = createClient();
    const channel = supabase
      .channel('discovery-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'creators' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setCreators(prev => prev.filter(c => c.id !== payload.old.id && (c as any).objectID !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as any;
            
            // Strictly evaluate Golden Rule Visibility
            const isVisible = 
              row.creator_status === 'active' && 
              row.visibility === 'public' && 
              row.profile_completed === true && 
              row.verification_passed === true && 
              row.is_deleted === false &&
              row.admin_override !== 'hidden' &&
              row.admin_override !== 'banned';

            if (!isVisible) {
              // INSTANT REMOVAL (Vanish without refresh)
              setCreators(prev => prev.filter(c => c.id !== row.id && (c as any).objectID !== row.id));
              
              // If the banned/hidden creator is currently selected in the profile panel, close it!
              setSelectedCreator(current => {
                if (current && (current.id === row.id || (current as any).objectID === row.id)) {
                  return null;
                }
                return current;
              });
            } else {
              // INSTANT UPDATE
              setCreators(prev => prev.map(c => {
                if (c.id === row.id || (c as any).objectID === row.id) {
                  return { ...c, ...row, id: row.id, objectID: row.id };
                }
                return c;
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [searchQuery, filters]);

  const loadMore = async () => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    const nextPage = page + 1;
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          platform: filters.platform,
          location: filters.location,
          followers: filters.followers,
          subCategories: filters.subCategories,
          limit: 20,
          page: nextPage,
        }),
      });
      const data = await res.json();
      setCreators(prev => {
        // filter out dupes just in case
        const existingIds = new Set(prev.map(c => c.id || (c as any).objectID));
        const newHits = (data.hits || []).filter((h: any) => !existingIds.has(h.id || h.objectID));
        return [...prev, ...newHits];
      });
      setPage(nextPage);
      setHasMore(data.page < data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const toggleSelectedId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden bg-white relative">
        <DiscoverHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <DiscoverFilters filters={filters} setFilters={setFilters} />
        
        {selectedIds.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-full bg-slate-900 px-6 py-3 shadow-xl ring-1 ring-slate-800 animate-in slide-in-from-bottom-5">
            <span className="text-sm font-semibold text-white">
              {selectedIds.length} creator{selectedIds.length > 1 ? "s" : ""} selected
            </span>
            <div className="h-4 w-px bg-slate-700"></div>
            <button
              onClick={() => setSelectedIds([])}
              className="text-sm font-medium text-slate-400 hover:text-white"
            >
              Clear
            </button>
            <button
              onClick={() => setIsSaveModalOpen(true)}
              className="rounded-full bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 transition"
            >
              Add to Plan 👉
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto relative">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"></div>
            </div>
          )}
          <CreatorTable
            creators={creators}
            selectedIds={selectedIds}
            onToggleId={toggleSelectedId}
            onSelectAll={setSelectedIds}
            onCreatorClick={setSelectedCreator}
            onLoadMore={loadMore}
            hasMore={hasMore}
          />
        </div>
      </div>

      <PlansSidebar plans={plans} />

      <CreatorProfilePanel
        creator={selectedCreator}
        isOpen={!!selectedCreator}
        onClose={() => setSelectedCreator(null)}
      />
      <SaveToListModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        selectedCreatorIds={selectedIds}
        onSuccess={() => {
          setSelectedIds([]);
          refreshPlans();
        }}
      />
    </div>
  );
}
