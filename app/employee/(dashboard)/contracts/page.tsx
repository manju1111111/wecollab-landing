"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, CheckCircle2, DollarSign, Target, Sparkles, FolderPen } from "lucide-react";
import { createContract } from "@/app/brand/billing-actions";
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
  status: "draft" | "sent" | "signed";
}

export default function EmployeeContractsPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [creators, setCreators] = useState<CreatorOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [employeeId, setEmployeeId] = useState("guest");
  const [isDemo, setIsDemo] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadContractPDF = async (contract: ContractRecord) => {
    try {
      setDownloadingId(contract.id);
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      // Design a premium legal agreement format matching WeCollab identity
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(124, 58, 237); // #7c3aed (WeCollab Violet)
      doc.text("WECOLLAB CREATOR COLLABORATION AGREEMENT", 20, 25);
      
      doc.setDrawColor(226, 232, 240); // border-slate-200
      doc.setLineWidth(1);
      doc.line(20, 32, 190, 32);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // text-slate-500
      doc.text(`Agreement Reference: WC-${contract.id.slice(0, 8).toUpperCase()}`, 20, 40);
      doc.text(`Generated Date: ${new Date().toLocaleDateString("en-IN")}`, 20, 45);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42); // text-slate-900
      doc.text("1. PARTIES & ENGAGEMENT", 20, 60);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); // text-slate-700
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
      doc.setTextColor(124, 58, 237); // WeCollab signature violet
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
      doc.text("The Creator Partner agrees to deliver designated content items in compliance with", 20, 156);
      doc.text("campaign briefs. Exclusivity remains active for a window of 30 days following the", 20, 163);
      doc.text("final broadcast, during which competitor brand placements are strictly restricted.", 20, 170);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text("4. SIGNATURES & E-AUTHORIZATION", 20, 188);
      
      // Draw signature boxes
      doc.setDrawColor(203, 213, 225); // border-slate-300
      doc.line(20, 220, 90, 220);
      doc.line(110, 220, 180, 220);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Authorized Representative, WeCollab", 20, 226);
      doc.text("Creator Partner Acceptance", 110, 226);
      
      doc.setFont("courier", "bolditalic");
      doc.setFontSize(11);
      doc.setTextColor(124, 58, 237); // WeCollab Signature
      doc.text("WECOLLAB SECURE E-SIGN", 22, 215);
      
      if (contract.status === "signed") {
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.text("E-SIGNATURE COMPLETED", 112, 215);
      } else {
        doc.setTextColor(148, 163, 184); // slate-400
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
      setEmployeeId(session.id);

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

      // 3. Fetch contracts
      let campaignIds = (camps || []).map(c => c.id);
      let creatorIds = (creats || []).map(c => c.id);

      const { data: contractsData, error: contractsErr } = await supabase
        .from("contracts")
        .select("id, campaign_id, creator_id, payout_amount, status")
        .in("creator_id", creatorIds);

      if (contractsErr || !contractsData || contractsData.length === 0) {
        triggerMockFallback();
        return;
      }

      const creatorMap = new Map((creats || []).map(c => [c.id, c.name]));
      const campaignMap = new Map((camps || []).map(c => [c.id, c.name]));

      const enriched = contractsData.map(c => ({
        id: c.id,
        campaign_name: campaignMap.get(c.campaign_id) || "Campaign Project",
        creator_name: creatorMap.get(c.creator_id) || "Creator Partner",
        payout_amount: Number(c.payout_amount),
        status: c.status as any,
      }));

      setCampaigns(camps || []);
      setCreators(creats || []);
      setContracts(enriched);
      setLoading(false);
    } catch (e) {
      triggerMockFallback();
    }
  };

  const triggerMockFallback = () => {
    setIsDemo(true);
    setCampaigns([
      { id: "camp-mock-1", name: "Summer Activewear 2026" },
      { id: "camp-mock-2", name: "Nike Air Max Launch" }
    ]);
    setCreators([
      { id: "creat-mock-1", name: "Virat Kohli" },
      { id: "creat-mock-2", name: "Katrina Kaif" },
      { id: "creat-mock-3", name: "Ranveer Singh" }
    ]);
    setContracts([
      {
        id: "contr-mock-1",
        campaign_name: "Summer Activewear 2026",
        creator_name: "Virat Kohli",
        payout_amount: 1250000,
        status: "signed"
      },
      {
        id: "contr-mock-2",
        campaign_name: "Summer Activewear 2026",
        creator_name: "Katrina Kaif",
        payout_amount: 650000,
        status: "sent"
      },
      {
        id: "contr-mock-3",
        campaign_name: "Nike Air Max Launch",
        creator_name: "Ranveer Singh",
        payout_amount: 450000,
        status: "signed"
      }
    ]);
    setLoading(false);
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
      const res = await createContract({
        campaignId,
        creatorId,
        payoutAmount,
        terms
      });

      if (res.error) {
        setError(res.error);
      } else {
        const campaignName = campaigns.find(c => c.id === campaignId)?.name || "Campaign Project";
        const creatorName = creators.find(c => c.id === creatorId)?.name || "Creator Partner";

        const newContr: ContractRecord = {
          id: res.contract.id,
          campaign_name: campaignName,
          creator_name: creatorName,
          payout_amount: payoutAmount,
          status: "sent"
        };

        setContracts(prev => [newContr, ...prev]);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed":
        return "bg-emerald-50 border-emerald-100 text-emerald-600";
      case "draft":
        return "bg-slate-100 border-slate-150 text-slate-500";
      default:
        return "bg-indigo-50 border-indigo-100 text-indigo-600";
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-800">
      
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaign Contracts</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">
            Compile agreement briefs, track payout invoices, and audit creator e-signatures.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2.5 px-4 rounded-2xl text-[12px] flex items-center gap-1.5 transition shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" /> Draft Contract
        </button>
      </div>

      {/* Main List Table Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col p-6 gap-6">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-150 border-t-indigo-600"></div>
            </div>
          ) : contracts.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-1.5 bg-slate-50/50 rounded-2xl border border-slate-100/60">
              <FolderPen className="h-7 w-7 stroke-[1.5]" />
              <p className="text-[12px] font-bold text-slate-500">No contracts compiled</p>
              <p className="text-[10px]">Click "Draft Contract" above to configure campaign terms.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-3">Campaign Project</th>
                  <th className="pb-3">Creator Partner</th>
                  <th className="pb-3 text-right">Payout Amount</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-right pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/50">
                {contracts.map((c) => (
                  <tr key={c.id} className="text-[12px] font-semibold text-slate-700 hover:bg-slate-50/50 transition">
                    <td className="py-4 pl-3">
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4" />
                        </span>
                        <span>{c.campaign_name}</span>
                      </div>
                    </td>
                    <td className="py-4 font-bold text-slate-900">{c.creator_name}</td>
                    <td className="py-4 text-right font-bold text-slate-900">₹{c.payout_amount.toLocaleString()}</td>
                    <td className="py-4 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-3">
                      <button
                        onClick={() => downloadContractPDF(c)}
                        disabled={downloadingId === c.id}
                        className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-650 hover:text-indigo-800 bg-indigo-50/50 border border-indigo-100 hover:border-indigo-200 px-3 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {downloadingId === c.id ? (
                          <div className="h-3 w-3 border border-indigo-650/30 border-t-indigo-650 rounded-full animate-spin" />
                        ) : null}
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Draft Contract Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 md:p-10 shadow-2xl flex flex-col">
            <h3 className="text-lg font-black text-slate-900 mb-2">Draft Campaign Contract</h3>
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

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Campaign brief</label>
                  <select
                    name="campaign_id"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3 text-[12px] font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Creator Partner</label>
                  <select
                    name="creator_id"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3 text-[12px] font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    {creators.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Payout Price (INR)</label>
                  <input
                    required
                    type="number"
                    name="payout_amount"
                    placeholder="450000"
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3 text-[12px] font-bold text-slate-700 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">Exclusivity & Guidelines Terms</label>
                  <textarea
                    required
                    name="terms"
                    rows={3}
                    placeholder="Write active collaboration terms (deliverables, schedules, exclusivity)..."
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3.5 text-[12px] font-bold text-slate-700 outline-none resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-3.5 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-slate-50 border border-slate-150 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-bold py-2.5 px-4 rounded-xl text-[12px] transition text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2.5 px-4 rounded-xl text-[12px] transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    Send Agreement
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
