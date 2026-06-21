"use client";

import { useState, useMemo } from "react";
import { Mail, Check, AlertCircle, Play, FileText, Send, Layers, CheckCircle2, ChevronRight, User } from "lucide-react";
import { updateCreatorOutreachStatus } from "@/app/plans/actions";

interface OutreachViewProps {
  plan: any;
  activeList: any;
  listCreators: any[];
  onRefresh: () => void;
}

const templates = [
  {
    id: "initial_collab",
    name: "Collaboration Invitation Pitch",
    subject: "Collaboration Request: {Brand Client} Campaign Integration",
    body: "Hi {Creator Name},\n\nHope this email finds you well!\n\nI am reaching out from WeCollab on behalf of our client, {Brand Client}.\n\nWe have been following your profile on {Platform} and absolutely love your creative direction and engagement. We would love to collaborate with you for our upcoming product campaign.\n\nWe have earmarked a negotiated payout of ₹{Negotiated Cost} for this integration. Let us know if you are interested, and we can share the full campaign brief!\n\nBest regards,\nCampaign Operations\nWeCollab Team"
  },
  {
    id: "gifting",
    name: "Product Gifting & Review Offer",
    subject: "Exclusive Gifting: Free {Brand Client} PR Box",
    body: "Hi {Creator Name},\n\nHope you're having a wonderful week!\n\nWe're launching a new product line with {Brand Client} and would love to send you our exclusive PR box for you to try out!\n\nIn exchange, we'd love to get a dedicated {Platform} Story showing your unboxing experience. We've also factored in a production support budget of ₹{Negotiated Cost} for your post.\n\nLet us know your shipping details if you'd like to participate!\n\nCheers,\nPR & Gifting Team\nWeCollab"
  },
  {
    id: "formal_brief",
    name: "Formal Paid Campaign Brief",
    subject: "Final Campaign Brief: {Brand Client} Sponsored Integration",
    body: "Hi {Creator Name},\n\nThanks for confirming your interest in collaborating with {Brand Client}!\n\nThis is a formal campaign brief for your upcoming sponsored integration on {Platform}.\n\n- Deliverables: 1x Dedicated post/reel\n- Negotiated Fee: ₹{Negotiated Cost} (as agreed in list ledger)\n- Timeline: Content draft review due in 5 days\n\nPlease find the detailed creative brief attached, and confirm your receipt of this integration details.\n\nBest,\nCampaign Curation Manager\nWeCollab"
  }
];

export function OutreachView({ plan, activeList, listCreators, onRefresh }: OutreachViewProps) {
  const costLedger = activeList?.cost_per_creator || {};

  // Component State
  const [selectedCreatorIds, setSelectedCreatorIds] = useState<string[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>("initial_collab");
  const [pitchBody, setPitchBody] = useState<string>(templates[0].body);
  const [pitchSubject, setPitchSubject] = useState<string>(templates[0].subject);
  
  // Batch Sending Simulator State
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendLogs, setSendLogs] = useState<string[]>([]);

  // 1. Get creator email outreach status from costLedger object schema
  const creatorStatuses = useMemo(() => {
    return listCreators.reduce((acc, c) => {
      const creatorData = costLedger[c.id];
      const status = typeof creatorData === "object" && creatorData !== null ? creatorData.outreach_status : "not_contacted";
      acc[c.id] = status || "not_contacted";
      return acc;
    }, {} as Record<string, string>);
  }, [listCreators, costLedger]);

  // 2. Parse Mail Merge parameters for a given creator
  const compileMailMerge = (subjectTemplate: string, bodyTemplate: string, creator: any) => {
    if (!creator) return { subject: subjectTemplate, body: bodyTemplate };
    const creatorData = costLedger[creator.id];
    const cost = typeof creatorData === "object" && creatorData !== null ? creatorData.cost : creatorData;
    const finalCost = (Number(cost) || 0).toLocaleString();

    const replacements = {
      "{Creator Name}": creator.name,
      "{Brand Client}": plan.brand || "our brand client",
      "{Platform}": activeList.platform || "Instagram",
      "{Negotiated Cost}": finalCost
    };

    let subject = subjectTemplate;
    let body = bodyTemplate;

    Object.entries(replacements).forEach(([key, val]) => {
      subject = subject.replaceAll(key, val);
      body = body.replaceAll(key, val);
    });

    return { subject, body };
  };

  // Compile preview based on the first selected creator (or the first creator in list if none selected)
  const firstSelectedCreator = useMemo(() => {
    const activeId = selectedCreatorIds[0] || listCreators[0]?.id;
    return listCreators.find(c => c.id === activeId);
  }, [selectedCreatorIds, listCreators]);

  const compiledPreview = useMemo(() => {
    const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];
    return compileMailMerge(pitchSubject, pitchBody, firstSelectedCreator);
  }, [pitchSubject, pitchBody, activeTemplateId, firstSelectedCreator, plan, activeList]);

  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    const selected = templates.find(t => t.id === templateId);
    if (selected) {
      setActiveTemplateId(templateId);
      setPitchSubject(selected.subject);
      setPitchBody(selected.body);
    }
  };

  // Toggle Selection
  const toggleSelectCreator = (id: string) => {
    setSelectedCreatorIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCreatorIds.length === listCreators.length) {
      setSelectedCreatorIds([]);
    } else {
      setSelectedCreatorIds(listCreators.map(c => c.id));
    }
  };

  // Simulated Dispatch Process
  const handleBatchSend = async () => {
    if (selectedCreatorIds.length === 0) {
      alert("Please select at least one creator to pitch.");
      return;
    }

    setIsSending(true);
    setSendProgress(0);
    setSendLogs(["Initializing SMTP gateway connection...", "Handshake completed with port 587 (TLS v1.3)..."]);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < selectedCreatorIds.length; i++) {
      const creatorId = selectedCreatorIds[i];
      const creator = listCreators.find(c => c.id === creatorId);
      if (!creator) continue;

      const progressPct = Math.round(((i) / selectedCreatorIds.length) * 100);
      setSendProgress(progressPct);

      setSendLogs(prev => [
        ...prev,
        `Drafting personalized pitch template for ${creator.name}...`,
        `Rendering merge variables: Cost Ledger ₹${((costLedger[creatorId]?.cost || costLedger[creatorId]) || 0).toLocaleString()}`
      ]);
      await delay(600);

      setSendLogs(prev => [...prev, `SMTP sending to pitch+${creator.username}@wecollab.in...`]);
      await delay(500);

      // Save status to DB
      try {
        await updateCreatorOutreachStatus(activeList.id, creatorId, "pitched");
      } catch (err) {
        console.error("Failed to update status", err);
      }

      setSendLogs(prev => [...prev, `✓ Success: Pitch dispatched and delivered to ${creator.name}!`]);
      await delay(400);
    }

    setSendProgress(100);
    setSendLogs(prev => [...prev, "All dispatches completed! Redirecting statuses..."]);
    await delay(500);

    setIsSending(false);
    setSelectedCreatorIds([]);
    onRefresh();
  };

  // Manual status pipeline tuner
  const handleAdvanceStatus = async (creatorId: string, currentStatus: string) => {
    const pipeline = ["not_contacted", "pitched", "negotiating", "confirmed"];
    const currentIdx = pipeline.indexOf(currentStatus);
    const nextIdx = (currentIdx + 1) % pipeline.length;
    const nextStatus = pipeline[nextIdx];

    try {
      await updateCreatorOutreachStatus(activeList.id, creatorId, nextStatus);
      onRefresh();
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pitched":
        return "bg-amber-50 border-amber-200 text-amber-600";
      case "negotiating":
        return "bg-indigo-50 border-indigo-200 text-indigo-600";
      case "confirmed":
        return "bg-emerald-50 border-emerald-200 text-emerald-600";
      default:
        return "bg-slate-50 border-slate-200 text-slate-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pitched":
        return "Pitched ✉";
      case "negotiating":
        return "Negotiating 💬";
      case "confirmed":
        return "Confirmed ✓";
      default:
        return "Not Contacted";
    }
  };

  // Aggregate Pipeline statistics
  const pipelineStats = useMemo(() => {
    const stats = { not_contacted: 0, pitched: 0, negotiating: 0, confirmed: 0 };
    listCreators.forEach(c => {
      const status = creatorStatuses[c.id] || "not_contacted";
      if (status in stats) {
        stats[status as keyof typeof stats]++;
      }
    });
    return stats;
  }, [listCreators, creatorStatuses]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#fafbff] overflow-hidden">
      
      {/* Left Panel: Creator Checklist & Pitch Pipeline (60% Width) */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto border-r border-slate-200/60 gap-6">
        
        {/* Pipeline funnel metric strip */}
        <div className="grid grid-cols-4 gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm shrink-0">
          <div className="text-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Not Contacted</span>
            <span className="text-lg font-black text-slate-700 block mt-0.5">{pipelineStats.not_contacted}</span>
          </div>
          <div className="text-center border-l border-slate-100">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">Pitched</span>
            <span className="text-lg font-black text-amber-600 block mt-0.5">{pipelineStats.pitched}</span>
          </div>
          <div className="text-center border-l border-slate-100">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">Negotiating</span>
            <span className="text-lg font-black text-indigo-600 block mt-0.5">{pipelineStats.negotiating}</span>
          </div>
          <div className="text-center border-l border-slate-100">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block">Confirmed</span>
            <span className="text-lg font-black text-emerald-600 block mt-0.5">{pipelineStats.confirmed}</span>
          </div>
        </div>

        {/* Creator List Checklist */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col flex-1 min-h-[300px]">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4 shrink-0">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Campaign Influencer Outreach List</h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Select creators to send bulk outreach pitches.</p>
            </div>
            <button 
              onClick={toggleSelectAll}
              className="text-[11px] font-black text-indigo-600 hover:text-indigo-800 transition"
            >
              {selectedCreatorIds.length === listCreators.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {listCreators.map((creator) => {
              const status = creatorStatuses[creator.id] || "not_contacted";
              const isSelected = selectedCreatorIds.includes(creator.id);
              const cost = typeof costLedger[creator.id] === "object" && costLedger[creator.id] !== null ? costLedger[creator.id].cost : costLedger[creator.id];
              const formattedCost = (Number(cost) || 0).toLocaleString();

              return (
                <div 
                  key={creator.id} 
                  className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                    isSelected 
                      ? "bg-indigo-50/20 border-indigo-200" 
                      : "bg-slate-50/50 border-slate-150/40 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectCreator(creator.id)}
                      className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                    <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0 bg-slate-200 border border-slate-200/50">
                      <img src={creator.avatar} alt={creator.name} className="object-cover h-full w-full" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">{creator.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold leading-none">
                        @{creator.username} • {activeList.platform} • Payout: ₹{formattedCost}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(creator.id, status)}
                      className={`inline-flex rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border cursor-pointer hover:shadow-xs transition ${getStatusStyle(status)}`}
                      title="Click to cycle status stage"
                    >
                      {getStatusLabel(status)}
                    </button>
                  </div>
                </div>
              );
            })}

            {listCreators.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs font-semibold">
                No creators available in this blueprint list to manage outreach.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Right Panel: Template Selection & Live Preview (40% Width) */}
      <div className="w-full lg:w-96 p-6 border-t lg:border-t-0 border-slate-200 bg-white flex flex-col shrink-0 gap-5 overflow-y-auto">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Mail className="h-4.5 w-4.5 text-indigo-500" /> OUTREACH ASSISTANT
          </h3>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Select a template and preview your pitch.</p>
        </div>

        {/* Template Select Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PITCH TEMPLATE</label>
          <select
            value={activeTemplateId}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full h-10 border border-slate-250 bg-slate-50 rounded-xl px-3 text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Subject Composer input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">EMAIL SUBJECT</label>
          <input
            type="text"
            value={pitchSubject}
            onChange={(e) => setPitchSubject(e.target.value)}
            className="w-full h-9 border border-slate-250 bg-slate-50 rounded-xl px-3 text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Body Composer text area */}
        <div className="flex flex-col gap-1.5 flex-1 min-h-[160px]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">EMAIL BODY</label>
          <textarea
            value={pitchBody}
            onChange={(e) => setPitchBody(e.target.value)}
            className="w-full flex-1 border border-slate-250 bg-slate-50 rounded-xl p-3 text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none resize-none"
          />
        </div>

        {/* Live Merge Preview box */}
        <div className="bg-[#fcfdff] border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-inner shrink-0">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Live Mail-Merge Preview</span>
            <span className="text-[8px] font-bold text-slate-400 normal-case">
              {firstSelectedCreator ? `showing merge for ${firstSelectedCreator.name}` : "no creator selected"}
            </span>
          </div>
          <div className="text-[11px] leading-relaxed text-slate-600 space-y-2 select-text font-mono max-h-36 overflow-y-auto pr-1 no-scrollbar">
            <p className="font-extrabold text-slate-900">Subject: {compiledPreview.subject}</p>
            <div className="whitespace-pre-wrap mt-2">{compiledPreview.body}</div>
          </div>
        </div>

        {/* Bulk Action Pitch trigger */}
        <button
          onClick={handleBatchSend}
          disabled={selectedCreatorIds.length === 0}
          className="w-full h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20 shrink-0 transition"
        >
          <Send className="h-4 w-4" /> Send Pitch to ({selectedCreatorIds.length}) Creators
        </button>

      </div>

      {/* circular Dispatch Progress Modal popup overlay */}
      {isSending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 p-8 flex flex-col items-center">
            
            {/* Animated progress ring */}
            <div className="relative h-24 w-24 flex items-center justify-center mb-6 shrink-0">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#4f46e5" strokeWidth="6" strokeDasharray={2 * Math.PI * 40} strokeDashoffset={2 * Math.PI * 40 - (sendProgress / 100) * 2 * Math.PI * 40} strokeLinecap="round" className="transition-all duration-300" />
              </svg>
              <span className="text-lg font-black text-slate-800">{sendProgress}%</span>
            </div>

            <h3 className="text-md font-black text-slate-900 tracking-tight mb-1">
              Dispatched Batch Pitching Sequence
            </h3>
            <p className="text-[11px] text-slate-455 font-bold mb-6">
              Transmitting campaign briefs via WeCollab SMTP relays...
            </p>

            {/* Live logs container */}
            <div className="w-full bg-slate-950 text-[10px] font-mono text-slate-400 p-4 rounded-2xl border border-slate-800 max-h-36 overflow-y-auto flex flex-col gap-1 text-left leading-normal select-all">
              {sendLogs.map((log, i) => (
                <div key={i} className={log.startsWith("✓") ? "text-emerald-400" : log.startsWith("SMTP") ? "text-indigo-400" : ""}>{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
