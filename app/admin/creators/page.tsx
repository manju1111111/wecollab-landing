"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sparkles, Check, CheckCircle2, Search } from "lucide-react";
import { AdminTopFilters, AdminFilterState } from "@/components/admin/creators/admin-top-filters";
import { CreatorDataGrid } from "@/components/admin/creators/creator-data-grid";
import { QuickPreviewDrawer } from "@/components/admin/creators/quick-preview-drawer";
import { AddCreatorModal } from "@/components/admin/creators/add-creator-modal";
import { BulkAssignModal } from "@/components/admin/creators/bulk-assign-modal";
import { createClient } from "@/lib/supabase/client";
import { syncCreatorFilterAssignments } from "@/lib/instagram/classifier";

function AdminCreatorsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [creators, setCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const PAGE_SIZE = 20;

  // Queue Review Tabs: all | pending (Ready for Review) | draft (Pending Verification) | approved (Verified)
  const [queueTab, setQueueTab] = useState<"all" | "pending" | "draft" | "approved">("all");

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
  const [editingCreator, setEditingCreator] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);

  // Fetch initial data
  const fetchCreators = async (pageNum = 0, isLoadMore = false) => {
    if (!isLoadMore) setIsLoading(true);
    else setIsFetchingMore(true);
    
    const supabase = createClient();
    
    const start = pageNum * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    // Apply filters and status queues to query
    let query = supabase.from("creators").select("*", { count: "exact" }).order("created_at", { ascending: false });

    if (searchQuery.trim()) {
      const searchPattern = `%${searchQuery.trim()}%`;
      query = query.or(`name.ilike.${searchPattern},username.ilike.${searchPattern}`);
    }

    // Platform
    if (filters.platform && filters.platform !== "All Platforms") {
      query = query.contains("platforms", `[{"name":"${filters.platform}"}]`);
    }

    // Queue status filtering
    if (queueTab === "pending") {
      query = query.eq("verification_status", "Ready for Review");
    } else if (queueTab === "draft") {
      query = query.eq("verification_status", "Pending Verification");
    } else if (queueTab === "approved") {
      query = query.eq("verification_status", "Verified");
    }

    // Verified
    if (filters.verified) query = query.eq("verified", true);
    // Has Manager
    if (filters.hasManager) query = query.eq("has_manager", true);
    // Brand Safe
    if (filters.brandSafe) query = query.eq("brand_safe", true);

    const { data, error } = await query.range(start, end);
      
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
    const timer = setTimeout(() => {
      fetchCreators(0, false);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters, queueTab, searchQuery]);

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

    // Sync deletion to Algolia index in real-time
    try {
      await fetch("/api/admin/sync-algolia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
    } catch (e) {
      console.error("Failed to sync deletion to Algolia:", e);
    }

    // Broadcast deletion to other tabs instantly
    try {
      const bc = new BroadcastChannel("wecollab-creators");
      bc.postMessage({ type: "DELETE", old: { id } });
      bc.close();
    } catch (e) {
      console.warn("[BROADCAST_WARN] BroadcastChannel not supported:", e);
    }
  };

  const handleApprove = async (id: string) => {
    const supabase = createClient();

    // 1-click Approve and Settle visibility database states
    const { data: updated, error } = await supabase
      .from("creators")
      .update({ verification_status: "Verified", visibility_status: true })
      .eq("id", id)
      .select()
      .single();

    if (updated) {
      setCreators(prev => prev.map(c => c.id === id ? updated : c));
      if (previewCreator?.id === id) {
        setPreviewCreator(updated);
      }

      // Sync verified record to Algolia discovery index
      try {
        await fetch("/api/admin/sync-algolia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", creator: updated }),
        });
      } catch (e) {
        console.error("Failed to sync verified creator to Algolia:", e);
      }

      // Broadcast update to other tabs instantly
      try {
        const bc = new BroadcastChannel("wecollab-creators");
        bc.postMessage({ type: "UPDATE", new: updated });
        bc.close();
      } catch (e) {
        console.warn("[BROADCAST_WARN] BroadcastChannel not supported:", e);
      }
    } else if (error) {
      console.error("[APPROVE_ERROR]", error.message);
      alert(`Approval error: ${error.message}`);
    }
  };

  const handleAddSubmit = async (data: any) => {
    const supabase = createClient();
    
    // Explicitly map inputs to exact Postgres database columns
    const newCreator = {
      name: data.name,
      username: data.username,
      bio: data.bio || "",
      profile_image: data.profile_image || "",
      followers: parseInt(data.followers_count) || 0,
      avg_reel_views: String(data.avg_views || 0),
      engagement_rate: parseFloat(data.engagement_rate) || 0,
      collaboration_pricing: parseFloat(data.collaboration_pricing) || null,
      has_manager: data.has_manager === "true",
      verified: data.verified === "true",
      brand_safe: data.brand_safe === "true",
      location: data.location || "",
      tags: data.tags || [],
      category: data.category || "General",
      email: data.email || null,
      assigned_employee: data.assigned_employee || null,
      verification_status: "Verified", // Admin-added creators are auto-verified
      visibility_status: true, // Admin-added creators are auto-visible
    };

    const { data: inserted, error } = await supabase
      .from("creators")
      .insert(newCreator)
      .select()
      .single();
      
    if (inserted) {
      setCreators(prev => [inserted, ...prev]);
      
      // Sync manual creator taxonomy filter assignments
      await syncCreatorFilterAssignments(supabase, inserted.id, inserted.tags || []);

      // Trigger notification if assigned to an employee
      if (inserted.assigned_employee) {
        try {
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create",
              payload: {
                userId: inserted.assigned_employee,
                userType: "employee",
                type: "assignment",
                title: "New Creator Assigned 👤",
                body: `Admin assigned a new creator to you: @${inserted.username || inserted.name}.`,
                link: "/employee/creators",
              }
            })
          });
        } catch (e) {
          console.error("Failed to send assignment notification:", e);
        }
      }

      // Sync insertion to Algolia index in real-time
      try {
        await fetch("/api/admin/sync-algolia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", creator: inserted }),
        });
      } catch (e) {
        console.error("Failed to sync insertion to Algolia:", e);
      }

      // Broadcast insertion to other tabs instantly
      try {
        const bc = new BroadcastChannel("wecollab-creators");
        bc.postMessage({ type: "INSERT", new: inserted });
        bc.close();
      } catch (e) {
        console.warn("[BROADCAST_WARN] BroadcastChannel not supported:", e);
      }

      // 🔄 Fire background Instagram metrics sync (non-blocking)
      // This populates creator_metrics, creator_profiles, creator_ai_scores etc.
      // so all Plan Workspace columns and Discover page metrics are available.
      if (inserted.username) {
        fetch("/api/admin/background-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: inserted.username }),
        }).then(res => {
          if (!res.ok) {
            res.json().then(d => console.warn(`[BACKGROUND_SYNC_WARN] Metrics sync for @${inserted.username} failed:`, d.error));
          } else {
            console.log(`[BACKGROUND_SYNC] Metrics sync kicked off for @${inserted.username}`);
          }
        }).catch(e => {
          console.warn(`[BACKGROUND_SYNC_WARN] Could not start metrics sync for @${inserted.username}:`, e.message);
        });
      }
    }
    if (error) {
      console.error("[DATABASE_INSERT_ERROR]", error);
      alert(`Failed to add creator: ${error.message || "Unknown database error"}`);
    }
  };

  const handleEditSubmit = async (data: any) => {
    if (!editingCreator) return;
    
    const supabase = createClient();
    
    // Explicitly map inputs to exact Postgres database columns
    const updatedCreator = {
      name: data.name,
      username: data.username,
      bio: data.bio || "",
      profile_image: data.profile_image || "",
      followers: parseInt(data.followers_count) || 0,
      avg_reel_views: String(data.avg_views || 0),
      engagement_rate: parseFloat(data.engagement_rate) || 0,
      collaboration_pricing: parseFloat(data.collaboration_pricing) || null,
      has_manager: data.has_manager === "true",
      verified: data.verified === "true",
      brand_safe: data.brand_safe === "true",
      location: data.location || "",
      tags: data.tags || [],
      category: data.category || "General",
      email: data.email || null,
      assigned_employee: data.assigned_employee || null,
    };

    const { data: updated, error } = await supabase
      .from("creators")
      .update(updatedCreator)
      .eq("id", editingCreator.id)
      .select()
      .single();
      
    if (updated) {
      setCreators(prev => prev.map(c => c.id === updated.id ? updated : c));
      setPreviewCreator(updated);

      // Trigger notification if assignment changed
      if (updated.assigned_employee && updated.assigned_employee !== editingCreator.assigned_employee) {
        try {
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "create",
              payload: {
                userId: updated.assigned_employee,
                userType: "employee",
                type: "assignment",
                title: "New Creator Assigned 👤",
                body: `Admin assigned a creator to you: @${updated.username || updated.name}.`,
                link: "/employee/creators",
              }
            })
          });
        } catch (e) {
          console.error("Failed to send assignment notification:", e);
        }
      }

      // Sync update to Algolia index in real-time
      try {
        await fetch("/api/admin/sync-algolia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", creator: updated }),
        });
      } catch (e) {
        console.error("Failed to sync update to Algolia:", e);
      }

      // Broadcast update to other tabs instantly
      try {
        const bc = new BroadcastChannel("wecollab-creators");
        bc.postMessage({ type: "UPDATE", new: updated });
        bc.close();
      } catch (e) {
        console.warn("[BROADCAST_WARN] BroadcastChannel not supported:", e);
      }
    }
    if (error) {
      console.error("[DATABASE_UPDATE_ERROR]", error);
      alert(`Failed to update creator: ${error.message || "Unknown database error"}`);
    }
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-full">
      {/* Top Filter Bar */}
      <AdminTopFilters filters={filters} setFilters={setFilters} />
      
      {/* Main Grid Area */}
      <div className="flex flex-col px-6 py-3">
        
        {/* Top Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Creator Database</h1>
            <p className="text-[13px] text-slate-500 font-medium hidden sm:block">Audit curation queues and manage influencer records.</p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name or @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-[13px] rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Queue Tab Toggles */}
          <div className="flex bg-slate-100 rounded-xl p-0.5 text-[11px] font-extrabold max-w-fit shrink-0">
            <button
              onClick={() => setQueueTab("all")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                queueTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setQueueTab("draft")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                queueTab === "draft" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Draft Imports
            </button>
            <button
              onClick={() => setQueueTab("pending")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                queueTab === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-750"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-650" />
              Review Queue
            </button>
            <button
              onClick={() => setQueueTab("approved")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                queueTab === "approved" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Approved & Live
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {selectedIds.length > 0 && (
              <button
                onClick={() => setIsBulkAssignOpen(true)}
                className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-slate-700 text-[13px] font-bold shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Assign to Employee ({selectedIds.length})
              </button>
            )}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white text-[13px] font-bold shadow-sm shadow-indigo-200 transition-colors cursor-pointer"
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
            onApprove={handleApprove}
          />
        </div>
      </div>

      <QuickPreviewDrawer 
        creator={previewCreator}
        onClose={() => setPreviewCreator(null)}
        onEdit={(c) => {
          setEditingCreator(c);
          setIsEditModalOpen(true);
        }}
      />
      
      <AddCreatorModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />

      <AddCreatorModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCreator(null);
        }}
        onSubmit={handleEditSubmit}
        creator={editingCreator}
      />

      <BulkAssignModal
        isOpen={isBulkAssignOpen}
        onClose={() => { setIsBulkAssignOpen(false); setSelectedIds([]); }}
        selectedCount={selectedIds.length}
        onAssign={async (employeeId: string) => {
          const supabase = createClient();
          const { error } = await supabase
            .from("creators")
            .update({ assigned_employee: employeeId })
            .in("id", selectedIds);
          if (error) throw error;

          // Trigger bulk assignment notification
          try {
            fetch("/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "create",
                payload: {
                  userId: employeeId,
                  userType: "employee",
                  type: "assignment",
                  title: "Creators Assigned 👤",
                  body: `Admin assigned ${selectedIds.length} creators to your portfolio.`,
                  link: "/employee/creators",
                }
              })
            });
          } catch (e) {
            console.error("Failed to send bulk assignment notification:", e);
          }

          // Update local state
          setCreators(prev => prev.map(c =>
            selectedIds.includes(c.id) ? { ...c, assigned_employee: employeeId } : c
          ));
          setSelectedIds([]);
        }}
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
