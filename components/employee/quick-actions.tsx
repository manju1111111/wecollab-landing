"use client";

import { useState } from "react";
import { Mail, FileText, Bell, Link2, CheckCircle2, Clock } from "lucide-react";

const ACTIONS = [
  {
    id: "email",
    icon: Mail,
    label: "Email Creator",
    desc: "Compose an outreach email",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    hoverColor: "hover:bg-blue-100",
  },
  {
    id: "note",
    icon: FileText,
    label: "Log a Note",
    desc: "Quick note on any creator",
    color: "bg-violet-50 text-violet-600 border-violet-100",
    hoverColor: "hover:bg-violet-100",
  },
  {
    id: "followup",
    icon: Bell,
    label: "Set Follow-up",
    desc: "Remind yourself to follow up",
    color: "bg-amber-50 text-amber-600 border-amber-100",
    hoverColor: "hover:bg-amber-100",
  },
  {
    id: "share",
    icon: Link2,
    label: "Copy Profile Link",
    desc: "Share a creator's profile",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    hoverColor: "hover:bg-emerald-100",
  },
];

interface QuickActionsProps {
  creators: { id: string; name: string; username: string }[];
}

export function QuickActions({ creators }: QuickActionsProps) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [noteText, setNoteText] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [followupNote, setFollowupNote] = useState("");

  const close = () => {
    setActiveAction(null);
    setSelectedCreator("");
    setCopied(false);
    setEmailSubject("");
    setNoteText("");
    setFollowupDate("");
    setFollowupNote("");
  };

  const handleAction = (id: string) => {
    if (id === "share") {
      const creator = creators.find(c => c.id === selectedCreator) || creators[0];
      if (creator) {
        navigator.clipboard.writeText(`https://www.wecollab.in/discover?creator=${creator.username}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      return;
    }
    setActiveAction(id === activeAction ? null : id);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-[15px]">Quick Actions</h3>
        <p className="text-[12px] text-slate-400 font-medium mt-0.5">One-click shortcuts for common tasks</p>
      </div>

      <div className="p-4 flex flex-col gap-2">
        {ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => handleAction(action.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition text-left w-full ${action.color} ${action.hoverColor}`}
          >
            <div className="h-8 w-8 rounded-lg bg-white/70 flex items-center justify-center shrink-0 shadow-sm">
              <action.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold">{action.label}</p>
              <p className="text-[11px] opacity-70 font-medium">{action.desc}</p>
            </div>
            {action.id === "share" && copied && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Inline sub-panels */}
      {activeAction === "email" && (
        <div className="mx-4 mb-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-[12px] font-bold text-blue-700 mb-2">Compose Email</p>
          <select value={selectedCreator} onChange={e => setSelectedCreator(e.target.value)}
            className="w-full mb-2 h-9 px-3 rounded-lg border border-blue-200 bg-white text-[13px] focus:outline-none">
            <option value="">Select creator...</option>
            {creators.map(c => <option key={c.id} value={c.id}>@{c.username} — {c.name}</option>)}
          </select>
          <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
            placeholder="Subject line..."
            className="w-full h-9 px-3 rounded-lg border border-blue-200 bg-white text-[13px] focus:outline-none mb-2" />
          <a
            href={selectedCreator && emailSubject
              ? `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(`Hi, I'm reaching out regarding a collaboration opportunity.`)}`
              : "#"}
            className="block w-full h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold flex items-center justify-center transition"
            onClick={close}
          >
            Open Email Client
          </a>
        </div>
      )}

      {activeAction === "note" && (
        <div className="mx-4 mb-4 p-4 bg-violet-50 rounded-xl border border-violet-100">
          <p className="text-[12px] font-bold text-violet-700 mb-2">Log a Note</p>
          <select value={selectedCreator} onChange={e => setSelectedCreator(e.target.value)}
            className="w-full mb-2 h-9 px-3 rounded-lg border border-violet-200 bg-white text-[13px] focus:outline-none">
            <option value="">Select creator...</option>
            {creators.map(c => <option key={c.id} value={c.id}>@{c.username} — {c.name}</option>)}
          </select>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Write your note..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-violet-200 bg-white text-[13px] focus:outline-none resize-none mb-2" />
          <button
            onClick={() => { alert("Note saved! (Open the creator's quick view to see it)"); close(); }}
            className="w-full h-9 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold transition">
            Save Note
          </button>
        </div>
      )}

      {activeAction === "followup" && (
        <div className="mx-4 mb-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-[12px] font-bold text-amber-700 mb-2">Set Follow-up Reminder</p>
          <select value={selectedCreator} onChange={e => setSelectedCreator(e.target.value)}
            className="w-full mb-2 h-9 px-3 rounded-lg border border-amber-200 bg-white text-[13px] focus:outline-none">
            <option value="">Select creator...</option>
            {creators.map(c => <option key={c.id} value={c.id}>@{c.username} — {c.name}</option>)}
          </select>
          <input type="date" value={followupDate} onChange={e => setFollowupDate(e.target.value)}
            className="w-full mb-2 h-9 px-3 rounded-lg border border-amber-200 bg-white text-[13px] focus:outline-none" />
          <input value={followupNote} onChange={e => setFollowupNote(e.target.value)}
            placeholder="What to follow up on..."
            className="w-full h-9 px-3 rounded-lg border border-amber-200 bg-white text-[13px] focus:outline-none mb-2" />
          <button
            onClick={() => { alert(`Follow-up set for ${followupDate}! Add it as a Task to track it.`); close(); }}
            className="w-full h-9 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-bold transition">
            Set Reminder
          </button>
        </div>
      )}
    </div>
  );
}
