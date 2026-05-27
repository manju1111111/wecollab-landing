"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AdminTopFilters, AdminFilterState } from "@/components/admin/creators/admin-top-filters";
import { CreatorDataGrid } from "@/components/admin/creators/creator-data-grid";
import { QuickPreviewDrawer } from "@/components/admin/creators/quick-preview-drawer";
import { AddCreatorModal } from "@/components/admin/creators/add-creator-modal";
import { createClient } from "@/lib/supabase/client";

function AdminCreatorsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [creators, setCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const PAGE_SIZE = 20;

  const [filters, setFilters] = useState<AdminFilterState>({
    platform: "All Platforms",
    location: "All",
    gender: "All",
    followers: "all",
    verified: false,
    hasManager: false,
    brandSafe: false,
    subCategories: [],
  });
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewCreator, setPreviewCreator] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch initial data
  const fetchCreators = async (pageNum = 0, isLoadMore = false) => {
    if (!isLoadMore) setIsLoading(true);
    else setIsFetchingMore(true);
    
    const supabase = createClient();
    
    const start = pageNum * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    // Apply filters to query
    let query = supabase.from("creators").select("*", { count: "exact" }).order("created_at", { ascending: false });

    // Platform
    if (filters.platform && filters.platform !== "All Platforms") {
      query = query.contains("platforms", `[{"name":"${filters.platform}"}]`); // Simple JSON array check
    }
    
    // Gender
    if (filters.gender && filters.gender !== "All") {
      // Handle male/female filtering if we had a gender column. Currently we don't.
    }

    // Verified
    if (filters.verified) query = query.eq("verified", true);
    // Has Manager
    if (filters.hasManager) query = query.eq("has_manager", true);
    // Brand Safe
    if (filters.brandSafe) query = query.eq("brand_safe", true);

    const { data, error, count } = await query.range(start, end);
      
    if (data) {
      if (isLoadMore) {
        setCreators(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const newHits = data.filter(h => !existingIds.has(h.id));
          return [...prev, ...newHits];
        });
      } else {
        setCreators(data);
      }
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNum);
    }
    
    if (!isLoadMore) setIsLoading(false);
    else setIsFetchingMore(false);
  };

  const loadMore = () => {
    if (isFetchingMore || !hasMore) return;
    fetchCreators(page + 1, true);
  };

  useEffect(() => {
    fetchCreators(0, false);
  }, [filters]);

  useEffect(() => {
    const handleOpenModal = () => setIsAddModalOpen(true);
    window.addEventListener("openAddCreatorModal", handleOpenModal);
    return () => window.removeEventListener("openAddCreatorModal", handleOpenModal);
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      setIsAddModalOpen(true);
      router.replace("/admin/creators");
    }
  }, [searchParams, router]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this creator?")) return;
    
    const supabase = createClient();
    await supabase.from("creators").delete().eq("id", id);
    setCreators(prev => prev.filter(c => c.id !== id));
    if (previewCreator?.id === id) setPreviewCreator(null);
  };

  const handleAddSubmit = async (data: any) => {
    const supabase = createClient();
    
    // Clean up numerical fields
    const newCreator = {
      ...data,
      followers_count: parseInt(data.followers_count) || 0,
      avg_views: parseInt(data.avg_views) || 0,
      engagement_rate: parseFloat(data.engagement_rate) || 0,
      collaboration_pricing: parseFloat(data.collaboration_pricing) || null,
      has_manager: data.has_manager === "true",
      verified: data.verified === "true",
      brand_safe: data.brand_safe === "true",
    };

    const { data: inserted, error } = await supabase
      .from("creators")
      .insert(newCreator)
      .select()
      .single();
      
    if (inserted) {
      setCreators(prev => [inserted, ...prev]);
    }
    if (error) {
      console.error(error);
      alert("Failed to add creator");
    }
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-full">
      {/* Top Filter Bar */}
      <AdminTopFilters filters={filters} setFilters={setFilters} />
      
      {/* Main Grid Area */}
      <div className="flex flex-col px-6 py-3">
        
        {/* Top Actions */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Creator Database</h1>
            <p className="text-[13px] text-slate-500 font-medium hidden sm:block">Manage and discover influencers.</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <button className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-bold shadow-sm hover:bg-slate-50 transition-colors">
                Bulk Actions ({selectedIds.length})
              </button>
            )}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold shadow-sm shadow-indigo-200 transition-colors"
            >
              + Add Creator
            </button>
          </div>
        </div>

        {/* Data Grid Wrapper */}
        <div className="flex-1 relative min-h-0">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          )}
          
          <CreatorDataGrid 
            creators={creators}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={setSelectedIds}
            onRowClick={setPreviewCreator}
            onDelete={handleDelete}
            onLoadMore={loadMore}
            hasMore={hasMore}
          />
        </div>
      </div>

      <QuickPreviewDrawer 
        creator={previewCreator}
        onClose={() => setPreviewCreator(null)}
        onEdit={(c) => {
          // Open edit modal (to be implemented)
          console.log("Edit", c);
        }}
      />
      
      <AddCreatorModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
}

export default function AdminCreatorsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    }>
      <AdminCreatorsInner />
    </Suspense>
  );
}
