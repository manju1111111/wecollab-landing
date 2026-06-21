"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Award, 
  User, 
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { QuickPreviewDrawer } from "@/components/admin/creators/quick-preview-drawer";

interface Creator {
  id: string;
  name: string;
  username: string;
  profile_image: string | null;
  followers: number;
  engagement_rate: number;
  category: string;
  verification_status: "Pending Verification" | "Ready for Review" | "Verified" | "Rejected";
  assigned_employee: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
}

function AdminApprovalsInner() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewCreator, setPreviewCreator] = useState<any | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState<Creator["verification_status"]>("Ready for Review");

  const fetchData = async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      // Fetch all creators
      const { data: creats } = await supabase
        .from("creators")
        .select("*")
        .order("created_at", { ascending: false });

      // Fetch all employees
      const { data: emps } = await supabase
        .from("employees")
        .select("id, full_name");

      setCreators((creats as Creator[]) || []);
      setEmployees((emps as Employee[]) || []);
    } catch (e) {
      console.error("[ADMIN_APPROVALS_FETCH]", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    const supabase = createClient();

    // Set verification to Verified and visibility to True
    const { data: updated, error } = await supabase
      .from("creators")
      .update({ verification_status: "Verified", visibility_status: true })
      .eq("id", id)
      .select()
      .single();

    if (updated) {
      setCreators(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      if (previewCreator?.id === id) setPreviewCreator(updated);

      // Trigger notification for assigned employee if exists
      if (updated.assigned_employee) {
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
                title: "Creator Approved! 🎉",
                body: `Creator @${updated.username || updated.name} has been approved by Admin and is now live.`,
                link: "/employee/creators",
              }
            })
          });
        } catch (e) {
          console.error("Failed to send notification:", e);
        }
      }

      // Sync to Algolia discovery index
      try {
        await fetch("/api/admin/sync-algolia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", creator: updated }),
        });
      } catch (e) {
        console.error("Failed to sync to Algolia:", e);
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
      alert(`Approval error: ${error.message}`);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Are you sure you want to reject this creator profile?")) return;
    const supabase = createClient();

    // Set verification to Rejected and visibility to False
    const { data: updated, error } = await supabase
      .from("creators")
      .update({ verification_status: "Rejected", visibility_status: false })
      .eq("id", id)
      .select()
      .single();

    if (updated) {
      setCreators(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      if (previewCreator?.id === id) setPreviewCreator(updated);

      // Sync to Algolia discovery index
      try {
        await fetch("/api/admin/sync-algolia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", creator: updated }),
        });
      } catch (e) {
        console.error("Failed to sync to Algolia:", e);
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
      alert(`Rejection error: ${error.message}`);
    }
  };

  const handleResetToReview = async (id: string) => {
    const supabase = createClient();
    const { data: updated, error } = await supabase
      .from("creators")
      .update({ verification_status: "Ready for Review" })
      .eq("id", id)
      .select()
      .single();

    if (updated) {
      setCreators(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
      if (previewCreator?.id === id) setPreviewCreator(updated);
    } else if (error) {
      alert(`Error resetting status: ${error.message}`);
    }
  };

  // Filter logic
  const filtered = creators.filter(c => {
    const emp = employees.find(e => e.id === c.assigned_employee);
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      c.name.toLowerCase().includes(searchLower) ||
      (c.username && c.username.toLowerCase().includes(searchLower)) ||
      (c.category && c.category.toLowerCase().includes(searchLower)) ||
      (emp && emp.full_name.toLowerCase().includes(searchLower));

    const matchesStatus = c.verification_status === statusTab;

    return matchesSearch && matchesStatus;
  });

  // Count summaries
  const pendingCount = creators.filter(c => c.verification_status === "Ready for Review").length;
  const draftCount = creators.filter(c => c.verification_status === "Pending Verification").length;
  const verifiedCount = creators.filter(c => c.verification_status === "Verified").length;
  const rejectedCount = creators.filter(c => c.verification_status === "Rejected").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Approvals & Curation</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">
            Review submitted influencer profiles and verify database entries.
          </p>
        </div>
        <button
          onClick={fetchData}
          title="Refresh database"
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition active:scale-95 shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Ready for Review", value: pendingCount, icon: Sparkles, color: "text-purple-650", bg: "bg-purple-50" },
          { label: "Pending Verification", value: draftCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Verified & Live", value: verifiedCount, icon: Award, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Rejected Profiles", value: rejectedCount, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl border border-slate-200 p-4 flex items-center gap-3`}>
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-xl font-black text-slate-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creators by name, username, or researcher..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>

        {/* Tab Selection Switcher */}
        <div className="flex bg-slate-100 rounded-xl p-0.5 text-[11px] font-extrabold shrink-0 w-full sm:w-auto overflow-x-auto justify-start">
          {[
            { id: "Ready for Review", label: `Review Queue (${pendingCount})` },
            { id: "Pending Verification", label: `Drafts (${draftCount})` },
            { id: "Verified", label: `Verified (${verifiedCount})` },
            { id: "Rejected", label: `Rejected (${rejectedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                statusTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Creators Approvals List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Clock className="h-10 w-10 text-slate-200 mb-3" />
            <h3 className="font-bold text-slate-700 mb-1">Queue is Empty</h3>
            <p className="text-[13px] text-slate-400 max-w-xs">
              No creator profiles are currently in this status tab.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Creator</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Followers</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Engagement</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Researcher</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => {
                  const emp = employees.find(e => e.id === c.assigned_employee);
                  const isVerified = c.verification_status === "Verified";
                  const isReadyForReview = c.verification_status === "Ready for Review";
                  const isPending = c.verification_status === "Pending Verification";
                  const isRejected = c.verification_status === "Rejected";

                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => setPreviewCreator(c)}
                      className={`transition group cursor-pointer border-l-4 ${
                        isVerified 
                          ? "border-l-emerald-500 bg-emerald-50/10 hover:bg-emerald-50/20" 
                          : isReadyForReview 
                            ? "border-l-purple-500 bg-purple-50/10 hover:bg-purple-50/20" 
                            : isPending 
                              ? "border-l-amber-500 bg-amber-50/10 hover:bg-amber-50/20" 
                              : "border-l-rose-500 bg-rose-50/20 hover:bg-rose-50/30"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden border border-slate-100 shrink-0 bg-slate-50">
                            {c.profile_image ? (
                              <Image 
                                src={c.profile_image}
                                alt={c.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold text-xs">
                                {c.name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                              {c.name}
                            </p>
                            {c.username && (
                              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">@{c.username}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-800">
                        {c.followers >= 1000000 
                          ? `${(c.followers / 1000000).toFixed(1)}M` 
                          : c.followers >= 1000 
                            ? `${(c.followers / 1000).toFixed(0)}k` 
                            : c.followers}
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-600">
                        {c.engagement_rate ? `${c.engagement_rate}%` : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <span className="bg-slate-50 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-100">
                          {c.category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 font-medium">
                        {emp ? emp.full_name : <span className="text-slate-450 italic">— Unassigned</span>}
                      </td>
                      <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {c.verification_status === "Ready for Review" && (
                            <>
                              <button
                                onClick={() => handleApprove(c.id)}
                                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-100 transition flex items-center gap-1 cursor-pointer"
                              >
                                <ThumbsUp className="h-3 w-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleReject(c.id)}
                                className="h-8 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-100 transition flex items-center gap-1 cursor-pointer"
                              >
                                <ThumbsDown className="h-3 w-3" /> Reject
                              </button>
                            </>
                          )}
                          {c.verification_status === "Pending Verification" && (
                            <button
                              onClick={() => handleApprove(c.id)}
                              className="h-8 px-3 rounded-lg bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold shadow-sm shadow-indigo-100 transition flex items-center gap-1 cursor-pointer"
                            >
                              Verify Profile
                            </button>
                          )}
                          {(c.verification_status === "Verified" || c.verification_status === "Rejected") && (
                            <button
                              onClick={() => handleResetToReview(c.id)}
                              className="h-8 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer"
                            >
                              Reset to Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QuickPreviewDrawer 
        creator={previewCreator}
        onClose={() => setPreviewCreator(null)}
        onEdit={(c) => {
          // Approvals can close preview and approve directly
          handleApprove(c.id);
          setPreviewCreator(null);
        }}
      />
    </div>
  );
}

export default function AdminApprovalsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    }>
      <AdminApprovalsInner />
    </Suspense>
  );
}
