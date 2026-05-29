"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle2, MapPin, TrendingUp, Users, Eye, MessageSquare, Save, ChevronDown, ExternalLink, Mail, Sparkles, Check, Phone, ShieldCheck } from "lucide-react";
import { resolveCreatorImage } from "@/lib/avatar-utils";
import { saveCreatorNote } from "@/app/employee/creator-actions";
import { PitchModal } from "./pitch-modal";
import { PitchHistoryList } from "./pitch-history-list";

const DEAL_STATUSES = [
  { value: "new",             label: "New",            color: "bg-slate-100 text-slate-600" },
  { value: "contacted",       label: "Contacted",      color: "bg-blue-100 text-blue-700" },
  { value: "negotiating",     label: "Negotiating",    color: "bg-amber-100 text-amber-700" },
  { value: "deal_closed",     label: "Deal Closed",    color: "bg-emerald-100 text-emerald-700" },
  { value: "not_interested",  label: "Not Interested", color: "bg-rose-100 text-rose-700" },
] as const;

type DealStatus = typeof DEAL_STATUSES[number]["value"];

interface CreatorQuickViewProps {
  creator: any | null;
  employeeId: string;
  onClose: () => void;
}

function Avatar({ src, name }: { src?: string; name: string }) {
  const [err, setErr] = useState(false);
  const safeSrc = resolveCreatorImage({ profile_image: src });
  const initials = name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["from-violet-400 to-indigo-500", "from-rose-400 to-pink-500", "from-fuchsia-400 to-primary", "from-emerald-400 to-teal-500"];
  const grad = colors[name.charCodeAt(0) % colors.length];

  if (!safeSrc || err) {
    return (
      <div className={`h-20 w-20 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-2xl shrink-0`}>
        {initials || "?"}
      </div>
    );
  }
  return <img src={safeSrc} alt={name} loading="lazy" referrerPolicy="no-referrer" onError={() => setErr(true)} className="h-20 w-20 rounded-full object-cover shrink-0" />;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function CreatorQuickView({ creator, employeeId, onClose }: CreatorQuickViewProps) {
  const [note, setNote] = useState("");
  const [dealStatus, setDealStatus] = useState<DealStatus>("new");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Editable Profile Enrichment States
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editFollowers, setEditFollowers] = useState(0);
  const [editCategory, setEditCategory] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(false);

  // Email Pitching state
  const [isPitchOpen, setIsPitchOpen] = useState(false);
  const [pitchRefresh, setPitchRefresh] = useState(0);
  const [employeeName, setEmployeeName] = useState("Team Member");

  useEffect(() => {
    if (creator) {
      setNote(creator._note || "");
      setDealStatus((creator._deal_status as DealStatus) || "new");
      setSaved(false);

      // Hydrate editable fields
      setEditName(creator.name || "");
      setEditEmail(creator.email || "");
      setEditPhone(creator.phone || "");
      setEditLocation(creator.location || "");
      setEditFollowers(creator.followers || 0);
      setEditCategory(creator.category || "General");
      setSubmittedReview(false);

      // Extract employee name client side from browser cookie
      try {
        const sessionCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("employee_session="))
          ?.split("=")[1];
        
        if (sessionCookie) {
          const session = JSON.parse(decodeURIComponent(sessionCookie));
          setEmployeeName(session.full_name || "Team Member");
        }
      } catch (e) {
        // Fallback
      }
    }
  }, [creator?.id]);

  if (!creator) return null;

  const currentStatus = DEAL_STATUSES.find(s => s.value === dealStatus) || DEAL_STATUSES[0];

  const handleSave = async () => {
    setSaving(true);
    await saveCreatorNote({ employeeId, creatorId: creator.id, noteText: note, dealStatus });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSubmitForReview = async () => {
    setSubmittingReview(true);
    try {
      const { submitCreatorForReview } = await import("@/app/employee/creator-actions");
      const res = await submitCreatorForReview({
        employeeId,
        creatorId: creator.id,
        updatedFields: {
          name: editName,
          email: editEmail || undefined,
          phone: editPhone || undefined,
          location: editLocation || undefined,
          followers: editFollowers,
          category: editCategory,
        }
      });
      if (res.success) {
        setSubmittedReview(true);
        creator.verification_status = "Ready for Review";
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const platforms: { name: string; icon: string; url?: string }[] = [
    ...(creator.username ? [{ name: "Instagram", icon: "📸", url: `https://instagram.com/${creator.username}` }] : []),
    ...((creator.platforms || []).filter((p: any) => p.name !== "Instagram").map((p: any) => ({
      name: p.name,
      icon: p.name === "YouTube" ? "▶️" : p.name === "TikTok" ? "🎵" : "🐦",
      url: p.url || "#",
    }))),
  ];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[420px] bg-white shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header banner */}
        <div className="relative h-36 bg-gradient-to-br from-indigo-500 to-violet-600 shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 backdrop-blur hover:bg-white/40 flex items-center justify-center text-white transition cursor-pointer">
            <X className="h-4 w-4" />
          </button>
          <div className="absolute -bottom-10 left-6">
            <div className="ring-4 ring-white rounded-full">
              <Avatar src={creator.profile_image} name={creator.name} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Identity */}
          <div className="pt-14 px-6 pb-4 border-b border-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-bold text-slate-900">{creator.name}</h2>
                  {creator.verified && <CheckCircle2 className="h-4 w-4 fill-blue-500 text-white shrink-0" />}
                </div>
                <p className="text-sm text-indigo-600 font-medium">@{creator.username}</p>
              </div>

              {/* Deal status pill */}
              <div className="relative mt-1">
                <button
                  onClick={() => setShowStatusMenu(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold ${currentStatus.color} transition cursor-pointer`}
                >
                  {currentStatus.label}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {showStatusMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden min-w-[160px]">
                    {DEAL_STATUSES.map(s => (
                      <button
                        key={s.value}
                        onClick={() => { setDealStatus(s.value); setShowStatusMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[13px] font-semibold hover:bg-slate-50 transition cursor-pointer ${s.color.includes("text") ? s.color.split(" ")[1] : "text-slate-700"}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {creator.category || "General"}
              </span>
              {creator.location && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  <MapPin className="h-3 w-3" /> {creator.location}
                </span>
              )}
            </div>
            {creator.bio && <p className="text-[13px] text-slate-500 mt-3 leading-relaxed">{creator.bio}</p>}
          </div>

          {/* Profile Curation & Enrichment Form */}
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Curation & Verification</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Full Name</label>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Followers Count</label>
                  <input
                    type="number"
                    value={editFollowers}
                    onChange={e => setEditFollowers(parseInt(e.target.value) || 0)}
                    className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Email</label>
                  <input
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="email@partner.com"
                    className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Phone</label>
                  <input
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+91 9999999999"
                    className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Niche Category</label>
                  <input
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider pl-1">Location</label>
                  <input
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    className="h-8.5 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Submit for Review Action Button */}
              {creator.verification_status !== "Verified" && (
                <button
                  onClick={handleSubmitForReview}
                  disabled={submittingReview || creator.verification_status === "Ready for Review"}
                  className="mt-1 h-9.5 rounded-xl border border-primary/25 hover:bg-primary-soft/30 text-primary font-black text-[12px] flex items-center justify-center gap-1.5 transition disabled:opacity-60 cursor-pointer w-full"
                >
                  {submittingReview ? (
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : submittedReview || creator.verification_status === "Ready for Review" ? (
                    <><Check className="h-4 w-4 text-emerald-500" /> Submitted for Review!</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Submit to Admin for Review</>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="px-6 py-4 border-b border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Key Stats</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Users,    label: "Followers",   val: fmt(creator.followers || 0) },
                { icon: TrendingUp, label: "Eng. Rate", val: `${creator.engagement_rate || 0}%` },
                { icon: Eye,      label: "Avg Views",   val: creator.avg_reel_views || "—" },
              ].map(stat => (
                <div key={stat.label} className="bg-slate-50 rounded-xl p-3 text-center">
                  <stat.icon className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                  <div className="text-[15px] font-bold text-slate-900">{stat.val}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Platforms */}
          {platforms.length > 0 && (
            <div className="px-6 py-4 border-b border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Platforms</p>
              <div className="flex flex-col gap-2">
                {platforms.map(p => (
                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition group">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{p.icon}</span>
                      <span className="text-[13px] font-semibold text-slate-700">{p.name}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-500 transition" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes & Pitches */}
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">My Notes</p>
            </div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add private notes about this creator — pricing discussed, preferences, follow-up reminders..."
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-none transition"
            />

            {/* Outgoing Pitching Timeline */}
            <PitchHistoryList creatorId={creator.id} refreshTrigger={pitchRefresh} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 bg-white shrink-0 flex gap-3">
          <button
            onClick={() => setIsPitchOpen(true)}
            className="flex-1 h-11 rounded-xl border border-indigo-200 hover:bg-indigo-50/50 text-indigo-650 font-bold text-[13px] flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Mail className="h-4.5 w-4.5" /> Pitch Creator
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-[13px] flex items-center justify-center gap-2 transition disabled:opacity-60 shrink-0 cursor-pointer"
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <><CheckCircle2 className="h-4 w-4" /> Saved!</>
            ) : (
              <><Save className="h-4 w-4" /> Save Notes</>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Pitching Outbox Modal */}
      <PitchModal
        isOpen={isPitchOpen}
        onClose={() => setIsPitchOpen(false)}
        employeeId={employeeId}
        employeeName={employeeName}
        creatorId={creator.id}
        creatorName={creator.name}
        onSuccess={() => setPitchRefresh(prev => prev + 1)}
      />
    </>
  );
}
