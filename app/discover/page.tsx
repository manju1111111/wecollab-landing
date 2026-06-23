"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { DiscoverHeader } from "@/components/discover/discover-header";
import { DiscoverFilters, FilterState } from "@/components/discover/discover-filters";
import { CreatorTable } from "@/components/discover/creator-table";
import { PlansSidebar } from "@/components/discover/plans-sidebar";
import { CreatorProfilePanel } from "@/components/discover/creator-profile-panel";
import { Creator } from "@/data/mock-creators";
import { SaveToListModal } from "@/components/discover/save-to-list-modal";
import { createClient } from "@/lib/supabase/client";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns true for any creator that should be visible on the Discover page.
 *  Intentionally permissive for new rows that don't have these columns yet. */
function isCreatorVisible(row: any): boolean {
  return (
    (row.creator_status === "active" || !row.creator_status) &&
    (row.visibility === "public" || !row.visibility) &&
    (row.profile_completed === true || row.profile_completed === undefined) &&
    (row.verification_passed === true || row.verification_passed === undefined) &&
    row.is_deleted !== true &&
    row.admin_override !== "hidden" &&
    row.admin_override !== "banned"
  );
}

function formatRow(row: any) {
  return { ...row, id: row.id, objectID: row.id ?? row.objectID };
}

// ─── Component ──────────────────────────────────────────────────────────────

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

  // Interactivity
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  // Plans
  const [plans, setPlans] = useState<any[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Creators list
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Session cache: creators added via admin in this browser session.
  // Used to instantly merge new creators before Algolia's index catches up.
  const [sessionCreators, setSessionCreators] = useState<any[]>([]);
  const sessionCreatorsRef = useRef<any[]>([]);
  // Keep ref in sync so closures inside effects can read the latest value
  useEffect(() => {
    sessionCreatorsRef.current = sessionCreators;
  }, [sessionCreators]);

  // Keep latest query/filters in refs so real-time handlers can access them
  // without needing to be in the dependency array
  const searchQueryRef = useRef(searchQuery);
  const filtersRef = useRef(filters);
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  // ── Plans ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    import("@/app/plans/actions").then((mod) => mod.getPlans().then(setPlans));
  }, []);

  const refreshPlans = () => {
    import("@/app/plans/actions").then((mod) => mod.getPlans().then(setPlans));
  };

  // ── Algolia Search (reruns when query or filters change) ───────────────────
  useEffect(() => {
    let cancelled = false;

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
        if (cancelled) return;
        const data = await res.json();

        let hits: any[] = data.hits || [];

        // Merge any session-created creators that match current query/filters.
        // This gives instant 0ms visibility for newly-added creators before
        // Algolia's index propagates the change (~1-3s eventual consistency).
        const currentSession = sessionCreatorsRef.current;
        if (currentSession.length > 0) {
          const q = searchQuery.toLowerCase();
          const matchingSession = currentSession.filter((sc) => {
            const queryMatch =
              !q ||
              sc.name?.toLowerCase().includes(q) ||
              sc.username?.toLowerCase().includes(q) ||
              sc.bio?.toLowerCase().includes(q);

            const platformMatch =
              filters.platform === "All Platforms" ||
              sc.platforms?.some((p: any) => p.name === filters.platform) ||
              sc.category === filters.platform;

            const locationMatch =
              filters.location === "All" ||
              sc.location?.toLowerCase().includes(filters.location.toLowerCase());

            return queryMatch && platformMatch && locationMatch;
          });

          const hitIds = new Set(hits.map((h: any) => h.id ?? h.objectID));
          const uniqueSession = matchingSession.filter((sc) => !hitIds.has(sc.id));
          hits = [...uniqueSession, ...hits];
        }

        setCreators(hits);
        setHasMore(data.page < data.totalPages);
      } catch (err) {
        if (!cancelled) console.error("[DISCOVER_FETCH_ERROR]", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    // 300ms debounce for search-as-you-type
    const timer = setTimeout(fetchCreators, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, filters]);

  // ── Supabase Real-time Subscription (mounted once, never torn down) ─────────
  // Listens to Postgres INSERT/UPDATE/DELETE events directly from the database.
  // This is the most reliable layer — it fires even when BroadcastChannel
  // is not available (e.g. cross-origin iframes, Safari private mode).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("discovery-realtime-v2")
      .on("postgres_changes", { event: "*", schema: "public", table: "creators" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const removedId = payload.old.id;
          setCreators((prev) =>
            prev.filter((c) => c.id !== removedId && (c as any).objectID !== removedId)
          );
          setSessionCreators((prev) => prev.filter((c) => c.id !== removedId));
          setSelectedCreator((cur) =>
            cur && (cur.id === removedId || (cur as any).objectID === removedId) ? null : cur
          );
        } else if (payload.eventType === "INSERT") {
          const row = payload.new as any;
          if (!isCreatorVisible(row)) return;
          const formatted = formatRow(row);
          setCreators((prev) => {
            if (prev.some((c) => c.id === row.id || (c as any).objectID === row.id)) return prev;
            return [formatted as Creator, ...prev];
          });
          setSessionCreators((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [formatted, ...prev];
          });
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new as any;
          const formatted = formatRow(row);
          if (!isCreatorVisible(row)) {
            // Creator was hidden/banned — remove immediately
            setCreators((prev) =>
              prev.filter((c) => c.id !== row.id && (c as any).objectID !== row.id)
            );
            setSessionCreators((prev) => prev.filter((c) => c.id !== row.id));
            setSelectedCreator((cur) =>
              cur && (cur.id === row.id || (cur as any).objectID === row.id) ? null : cur
            );
          } else {
            setCreators((prev) =>
              prev.map((c) =>
                c.id === row.id || (c as any).objectID === row.id ? (formatted as Creator) : c
              )
            );
            setSessionCreators((prev) =>
              prev.map((c) => (c.id === row.id ? formatted : c))
            );
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // ← empty dep array: subscribe once, stay connected forever

  // ── BroadcastChannel Sync (same-browser cross-tab 0ms updates) ────────────
  // When admin adds/edits/deletes a creator in another tab of the same browser,
  // this fires immediately — before Supabase or Algolia propagate the change.
  // This is the "0ms latency" layer for the admin workflow.
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("wecollab-creators");
      bc.onmessage = (event) => {
        const payload = event.data;
        console.log("[BROADCAST] Creator event:", payload.type, payload.new?.name ?? payload.old?.id);

        if (payload.type === "DELETE") {
          const deleteId = payload.old.id;
          setSessionCreators((prev) => prev.filter((c) => c.id !== deleteId));
          setCreators((prev) =>
            prev.filter((c) => c.id !== deleteId && (c as any).objectID !== deleteId)
          );
          setSelectedCreator((cur) =>
            cur && (cur.id === deleteId || (cur as any).objectID === deleteId) ? null : cur
          );
        } else if (payload.type === "INSERT") {
          const row = payload.new as any;
          if (!isCreatorVisible(row)) return;
          const formatted = formatRow(row);
          setSessionCreators((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [formatted, ...prev];
          });
          setCreators((prev) => {
            if (prev.some((c) => c.id === row.id || (c as any).objectID === row.id)) return prev;
            return [formatted as Creator, ...prev];
          });
        } else if (payload.type === "UPDATE") {
          const row = payload.new as any;
          const formatted = formatRow(row);
          setSessionCreators((prev) => {
            if (!isCreatorVisible(row)) return prev.filter((c) => c.id !== row.id);
            return prev.some((c) => c.id === row.id)
              ? prev.map((c) => (c.id === row.id ? formatted : c))
              : [formatted, ...prev];
          });
          if (!isCreatorVisible(row)) {
            setCreators((prev) =>
              prev.filter((c) => c.id !== row.id && (c as any).objectID !== row.id)
            );
            setSelectedCreator((cur) =>
              cur && (cur.id === row.id || (cur as any).objectID === row.id) ? null : cur
            );
          } else {
            setCreators((prev) =>
              prev.map((c) =>
                c.id === row.id || (c as any).objectID === row.id ? (formatted as Creator) : c
              )
            );
          }
        }
      };
    } catch (e) {
      console.warn("[BROADCAST_WARN] BroadcastChannel not supported:", e);
    }
    return () => {
      if (bc) bc.close();
    };
  }, []); // ← empty dep array: connect once, stay connected forever

  // ── Load More ──────────────────────────────────────────────────────────────
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
      setCreators((prev) => {
        const existingIds = new Set(prev.map((c) => c.id ?? (c as any).objectID));
        const newHits = (data.hits || []).filter(
          (h: any) => !existingIds.has(h.id ?? h.objectID)
        );
        return [...prev, ...newHits];
      });
      setPage(nextPage);
      setHasMore(data.page < data.totalPages);
    } catch (err) {
      console.error("[LOAD_MORE_ERROR]", err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const toggleSelectedId = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden bg-white relative">
        <DiscoverHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <DiscoverFilters 
          filters={filters} 
          setFilters={setFilters} 
          plans={plans}
          activePlanId={activePlanId}
          setActivePlanId={setActivePlanId}
        />

        {selectedIds.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-4 rounded-full bg-slate-900 px-4 py-2.5 sm:px-6 sm:py-3 shadow-xl ring-1 ring-slate-800 animate-in slide-in-from-bottom-5 w-auto max-w-[90vw] sm:max-w-none whitespace-nowrap">
            <span className="text-[12px] sm:text-sm font-semibold text-white">
              {selectedIds.length} select
            </span>
            <div className="h-4 w-px bg-slate-700" />
            <button
              onClick={() => setSelectedIds([])}
              className="text-[12px] sm:text-sm font-medium text-slate-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => setIsSaveModalOpen(true)}
              className="rounded-full bg-primary px-3 py-1 sm:px-4 sm:py-1.5 text-[12px] sm:text-sm font-semibold text-white hover:bg-primary-hover transition cursor-pointer"
            >
              Add to Plan
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto relative">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
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
            plans={plans}
            activePlanId={activePlanId}
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
