"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  CheckCircle2,
  FolderPen,
  Trash2,
  Pencil,
  PenLine,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  createContract,
  signContract,
  deleteContract,
  updateContract,
} from "@/app/brand/billing-actions";
import { createClient } from "@/lib/supabase/client";
import { getEmployeeSession } from "@/app/employee/actions";

interface CreatorOption {
  id: string;
  name: string;
}

interface CampaignOption {
  id: string;
  name: string;
}

interface ContractRecord {
  id: string;
  campaign_name: string;
  creator_name: string;
  payout_amount: number;
  terms?: string;
  status: "draft" | "sent" | "signed";
}

export default function EmployeeContractsPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [creators, setCreators] = useState<CreatorOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editContract, setEditContract] = useState<ContractRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContractRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadContractPDF = async (contract: ContractRecord) => {
    try {
      setDownloadingId(contract.id);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(124, 58, 237);
      doc.text("WECOLLAB CREATOR COLLABORATION AGREEMENT", 20, 25);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(20, 32, 190, 32);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Agreement Reference: WC-${contract.id.slice(0, 8).toUpperCase()}`, 20, 40);
      doc.text(`Generated Date: ${new Date().toLocaleDateString("en-IN")}`, 20, 45);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("1. PARTIES & ENGAGEMENT", 20, 60);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`This Collaboration Agreement ("Agreement") is made between:`, 20, 68);
      doc.text(`- Platform / Agency: WeCollab Marketing Operations Network`, 25, 76);
      doc.text(`- Creator Partner: ${contract.creator_name}`, 25, 83);
      doc.text(`- Campaign Assignment: ${contract.campaign_name}`, 25, 90);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("2. COMPENSATION & PAYOUT STATEMENT", 20, 108);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`WeCollab agrees to pay the Creator Partner a total campaign contract fee of:`, 20, 116);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(124, 58, 237);
      doc.text(`INR ${contract.payout_amount.toLocaleString("en-IN")}/-`, 20, 126);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("(*Payout will be released within 14 days post delivery verification and brand approval.)", 20, 133);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("3. SCOPE OF SERVICES & EXCLUSIVITY", 20, 148);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      const termsText = contract.terms || "Exclusivity remains active for a window of 30 days following the final broadcast.";
      const termsLines = doc.splitTextToSize(termsText, 165);
      doc.text(termsLines, 20, 156);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("4. SIGNATURES & E-AUTHORIZATION", 20, 188);

      doc.setDrawColor(203, 213, 225);
      doc.line(20, 220, 90, 220);
      doc.line(110, 220, 180, 220);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Authorized Representative, WeCollab", 20, 226);
      doc.text("Creator Partner Acceptance", 110, 226);

      doc.setFont("courier", "bolditalic");
      doc.setFontSize(11);
      doc.setTextColor(124, 58, 237);
      doc.text("WECOLLAB SECURE E-SIGN", 22, 215);

      if (contract.status === "signed") {
        doc.setTextColor(16, 185, 129);
        doc.text("E-SIGNATURE COMPLETED", 112, 215);
      } else {
        doc.setTextColor(148, 163, 184);
        doc.text("PENDING SIGNATURE", 112, 215);
      }

      doc.save(`WeCollab_Agreement_${contract.campaign_name.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchInitialData = async () => {
    try {
      const supabase = createClient();

      const session = await getEmployeeSession();
      if (!session) return;

      // 1. Fetch campaigns
      const { data: camps } = await supabase
        .from("campaigns")
        .select("id, name")
        .eq("status", "active");

      // 2. Fetch assigned creators
      const { data: creats } = await supabase
        .from("creators")
        .select("id, name")
        .eq("assigned_employee", session.id);

      // 3. Fetch contracts for these creators
      const creatorIds = (creats || []).map((c) => c.id);

      if (creatorIds.length === 0) {
        setCampaigns(camps || []);
        setCreators([]);
        setContracts([]);
        setLoading(false);
        return;
      }

      const { data: contractsData } = await supabase
        .from("contracts")
        .select("id, campaign_id, creator_id, payout_amount, status, terms")
        .in("creator_id", creatorIds)
        .order("created_at", { ascending: false });

      const creatorMap = new Map((creats || []).map((c) => [c.id, c.name]));
      const campaignMap = new Map((camps || []).map((c) => [c.id, c.name]));

      const enriched = (contractsData || []).map((c) => ({
        id: c.id,
        campaign_name: campaignMap.get(c.campaign_id) || "Campaign Project",
        creator_name: creatorMap.get(c.creator_id) || "Creator Partner",
        payout_amount: Number(c.payout_amount),
        terms: c.terms || "",
        status: c.status as "draft" | "sent" | "signed",
      }));

      setCampaigns(camps || []);
      setCreators(creats || []);
      setContracts(enriched);
      setLoading(false);
    } catch (e) {
      console.error("[CONTRACTS_FETCH_ERROR]", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const campaignId = formData.get("campaign_id") as string;
    const creatorId = formData.get("creator_id") as string;
    const payoutAmount = parseFloat(formData.get("payout_amount") as string) || 0;
    const terms = formData.get("terms") as string;

    if (!campaignId || !creatorId || !payoutAmount || !terms) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      const res = await createContract({ campaignId, creatorId, payoutAmount, terms });

      if (res.error) {
        setError(res.error);
      } else {
        const campaignName = campaigns.find((c) => c.id === campaignId)?.name || "Campaign Project";
        const creatorName = creators.find((c) => c.id === creatorId)?.name || "Creator Partner";

        const newContr: ContractRecord = {
          id: res.contract.id,
          campaign_name: campaignName,
          creator_name: creatorName,
          payout_amount: payoutAmount,
          terms,
          status: "sent",
        };

        setContracts((prev) => [newContr, ...prev]);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setIsAddModalOpen(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleSign(contract: ContractRecord) {
    if (contract.status === "signed") return;
    setSigningId(contract.id);
    try {
      const res = await signContract(contract.id);
      if (res.error) {
        alert(`Sign error: ${res.error}`);
      } else {
        setContracts((prev) =>
          prev.map((c) => (c.id === contract.id ? { ...c, status: "signed" } : c))
        );
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSigningId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await deleteContract(deleteTarget.id);
      if (res.error) {
        alert(`Delete error: ${res.error}`);
      } else {
        setContracts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editContract) return;
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payoutAmount = parseFloat(formData.get("payout_amount") as string);
    const terms = formData.get("terms") as string;

    if (!payoutAmount || !terms) {
      setError("Payout amount and terms are required.");
      return;
    }

    try {
      const res = await updateContract(editContract.id, { payout_amount: payoutAmount, terms });
      if (res.error) {
        setError(res.error);
      } else {
        setContracts((prev) =>
          prev.map((c) =>
            c.id === editContract.id ? { ...c, payout_amount: payoutAmount, terms } : c
          )
        );
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setEditContract(null);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "signed":
        return { classes: "bg-emerald-50 border-emerald-200 text-emerald-700", label: "Signed" };
      case "draft":
        return { classes: "bg-slate-100 border-slate-200 text-slate-500", label: "Draft" };
      default:
        return { classes: "bg-violet-50 border-violet-100 text-violet-700", label: "Sent" };
    }
  };

  const totalPayout = contracts.reduce((acc, c) => acc + c.payout_amount, 0);
  const signedCount = contracts.filter((c) => c.status === "signed").length;

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800">

      {/* Header */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaign Contracts</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">
            Manage agreement briefs, track payout invoices, and collect e-signatures.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-2xl text-[12px] flex items-center gap-1.5 transition shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> Draft Contract
        </button>
      </div>

      {/* Stats Bar */}
      {contracts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Contracts", value: contracts.length, sub: "All time" },
            { label: "Signed & Binding", value: signedCount, sub: `${contracts.length > 0 ? Math.round((signedCount / contracts.length) * 100) : 0}% signed` },
            { label: "Total Committed", value: `₹${totalPayout.toLocaleString("en-IN")}`, sub: "Aggregate payout" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-xl font-black text-slate-900 mt-1">{stat.value}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/40">
              <FolderPen className="h-8 w-8 stroke-[1.5] text-slate-300" />
              <p className="text-[13px] font-bold text-slate-500">No contracts yet</p>
              <p className="text-[11px] text-slate-400">Click &quot;Draft Contract&quot; to create your first agreement.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50/60 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pt-4 pl-6">Campaign Project</th>
                  <th className="pb-3 pt-4">Creator Partner</th>
                  <th className="pb-3 pt-4 text-right">Payout Amount</th>
                  <th className="pb-3 pt-4 text-center">Status</th>
                  <th className="pb-3 pt-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/70">
                {contracts.map((c) => {
                  const statusConfig = getStatusConfig(c.status);
                  return (
                    <tr key={c.id} className="text-[12px] font-semibold text-slate-700 hover:bg-slate-50/50 transition">
                      <td className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <span className="h-7 w-7 rounded-lg bg-violet-50 border border-violet-100 text-violet-500 flex items-center justify-center shrink-0">
                            <FileText className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-slate-800 font-semibold">{c.campaign_name}</span>
                        </div>
                      </td>
                      <td className="py-4 font-bold text-slate-900">{c.creator_name}</td>
                      <td className="py-4 text-right font-bold text-slate-900">₹{c.payout_amount.toLocaleString("en-IN")}</td>
                      <td className="py-4 text-center">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusConfig.classes}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* PDF Download */}
                          <button
                            onClick={() => downloadContractPDF(c)}
                            disabled={downloadingId === c.id}
                            title="Download PDF"
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold text-violet-600 hover:text-violet-800 bg-violet-50/50 border border-violet-100 hover:border-violet-200 px-2.5 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                          >
                            {downloadingId === c.id ? (
                              <div className="h-3 w-3 border border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                            ) : null}
                            PDF
                          </button>

                          {/* Edit (only if not signed) */}
                          {c.status !== "signed" && (
                            <button
                              onClick={() => { setEditContract(c); setError(null); setSuccess(false); }}
                              title="Edit contract"
                              className="h-7 w-7 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          )}

                          {/* Sign */}
                          {c.status !== "signed" && (
                            <button
                              onClick={() => handleSign(c)}
                              disabled={signingId === c.id}
                              title="Mark as signed"
                              className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:border-emerald-300 px-2.5 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                            >
                              {signingId === c.id ? (
                                <div className="h-3 w-3 border border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                              ) : (
                                <PenLine className="h-3 w-3" />
                              )}
                              Sign
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => setDeleteTarget(c)}
                            title="Delete contract"
                            className="h-7 w-7 flex items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Draft Contract Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-slate-900">Draft Campaign Contract</h3>
              <button onClick={() => { setIsAddModalOpen(false); setError(null); setSuccess(false); }} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mb-6">Allocate pricing targets and establish delivery conditions.</p>

            {success ? (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-14 w-14 text-emerald-500 mb-4 animate-bounce" />
                <h3 className="text-base font-black text-slate-900 mb-1">Contract Drafted!</h3>
                <p className="text-[12px] text-slate-400">Invoice statement auto-generated.</p>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-bold rounded-2xl p-3">
                    ⚠️ {error}
                  </div>
                )}

                {campaigns.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-100 text-amber-600 text-[11px] font-bold rounded-2xl p-3">
                    No active campaigns found. An admin must create a campaign first.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Campaign Brief</label>
                    <select
                      name="campaign_id"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-[12px] font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {creators.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-100 text-amber-600 text-[11px] font-bold rounded-2xl p-3">
                    No creators assigned to you yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Creator Partner</label>
                    <select
                      name="creator_id"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-[12px] font-bold text-slate-700 outline-none cursor-pointer"
                    >
                      {creators.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Payout Amount (₹)</label>
                  <input
                    required
                    type="number"
                    name="payout_amount"
                    placeholder="450000"
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-[12px] font-bold text-slate-700 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Terms & Conditions</label>
                  <textarea
                    required
                    name="terms"
                    rows={3}
                    placeholder="Write collaboration terms (deliverables, schedules, exclusivity)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-slate-700 outline-none resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-3.5 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setIsAddModalOpen(false); setError(null); }}
                    className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold py-2.5 px-4 rounded-xl text-[12px] transition text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={campaigns.length === 0 || creators.length === 0}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold py-2.5 px-4 rounded-xl text-[12px] transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    Send Agreement
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Edit Contract Modal */}
      {editContract && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-slate-900">Edit Contract</h3>
              <button onClick={() => { setEditContract(null); setError(null); setSuccess(false); }} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mb-1">
              {editContract.creator_name} — {editContract.campaign_name}
            </p>
            <p className="text-[10px] text-slate-400 mb-6">Only unsigned contracts can be edited.</p>

            {success ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-3 animate-bounce" />
                <h3 className="text-base font-black text-slate-900 mb-1">Contract Updated!</h3>
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                {error && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-500 text-[11px] font-bold rounded-2xl p-3">
                    ⚠️ {error}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Payout Amount (₹)</label>
                  <input
                    required
                    type="number"
                    name="payout_amount"
                    defaultValue={editContract.payout_amount}
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-[12px] font-bold text-slate-700 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Terms & Conditions</label>
                  <textarea
                    required
                    name="terms"
                    rows={4}
                    defaultValue={editContract.terms || ""}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-slate-700 outline-none resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-3.5 mt-4">
                  <button
                    type="button"
                    onClick={() => { setEditContract(null); setError(null); }}
                    className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold py-2.5 px-4 rounded-xl text-[12px] transition text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-4 rounded-xl text-[12px] transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-sm w-full p-8 shadow-2xl flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-rose-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Delete Contract?</h3>
            <p className="text-[12px] text-slate-500 font-medium mb-1">
              <strong>{deleteTarget.creator_name}</strong> — {deleteTarget.campaign_name}
            </p>
            <p className="text-[11px] text-slate-400 mb-6">
              This will permanently delete the contract and its associated invoice. This action cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl text-[12px] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deletingId}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-[12px] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingId ? (
                  <div className="h-4 w-4 border-2 border-rose-300 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
