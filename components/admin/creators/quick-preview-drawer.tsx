"use client";

import { useState } from "react";
import { X, ExternalLink, Mail, MessageSquare, Briefcase, MapPin, TrendingUp, MoreVertical, Edit, UserX, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { CreatorAvatar } from "./creator-data-grid";

export function QuickPreviewDrawer({ 
  creator, 
  onClose,
  onEdit
}: { 
  creator: any | null; 
  onClose: () => void;
  onEdit: (creator: any) => void;
}) {
  const [isRecategorizing, setIsRecategorizing] = useState(false);

  const handleRecategorize = async () => {
    if (!creator) return;
    setIsRecategorizing(true);
    try {
      const res = await fetch("/api/admin/categorize-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: creator.username, creatorId: creator.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Creator successfully re-categorized!");
        window.location.reload();
      } else {
        alert("Failed to re-categorize: " + data.error);
      }
    } catch (e: any) {
      alert("Error occurred: " + e.message);
    } finally {
      setIsRecategorizing(false);
    }
  };

  if (!creator) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-slate-900">Creator Preview</h2>
            {creator.verified && (
              <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Verified</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <MoreVertical className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* Profile Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="relative h-20 w-20 rounded-full overflow-hidden border border-slate-200 shrink-0">
              <CreatorAvatar src={creator.profile_image} name={creator.name} className="h-20 w-20" />
            </div>
            <div className="flex-1 pt-1">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{creator.name}</h1>
              <a href={`https://instagram.com/${creator.username}`} target="_blank" rel="noreferrer" className="text-[14px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 mt-0.5">
                @{creator.username} <ExternalLink className="h-3 w-3" />
              </a>
              
              <div className="flex items-center gap-3 mt-3">
                <button className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[13px] font-bold rounded-lg transition-colors">
                  <Mail className="h-3.5 w-3.5" /> Email
                </button>
                <button className="flex-1 flex items-center justify-center gap-1.5 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold rounded-lg transition-colors">
                  <MessageSquare className="h-3.5 w-3.5" /> DMs
                </button>
              </div>
            </div>
          </div>

          <p className="text-[14px] text-slate-600 leading-relaxed mb-6">
            {creator.bio || "No bio provided. This creator focuses on lifestyle, beauty and travel content creating high-quality cinematic reels."}
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Followers</div>
              <div className="text-[16px] font-bold text-slate-900">{formatNumber(creator.followers || 0)}</div>
              {creator.growth_percent > 0 && (
                <div className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center justify-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> {creator.growth_percent}%
                </div>
              )}
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Avg Views</div>
              <div className="text-[16px] font-bold text-slate-900">{creator.avg_reel_views || "0"}</div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Eng. Rate</div>
              <div className="text-[16px] font-bold text-slate-900">{creator.engagement_rate || "0.0"}%</div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-2">Creator Details</h3>
            
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-[12px] font-medium text-slate-500">Location</div>
                <div className="text-[14px] font-medium text-slate-900">{creator.location || "Unknown"}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <div className="text-[12px] font-medium text-slate-500">Business</div>
                <div className="text-[14px] font-medium text-slate-900 flex items-center gap-2">
                  {creator.has_manager ? "Managed" : "Independent"}
                  {creator.collaboration_pricing && (
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] px-2 py-0.5 rounded font-bold">~${creator.collaboration_pricing}/post</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 pt-2">
              <div className="w-4 h-4 text-slate-400 mt-0.5 text-center text-xs font-bold">#</div>
              <div className="flex-1">
                <div className="text-[12px] font-medium text-slate-500 mb-1.5">Categories</div>
                <div className="flex flex-wrap gap-1.5">
                  {(creator.tags || ['Lifestyle', 'Fashion']).map((cat: string) => (
                    <span key={cat} className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] px-2 py-0.5 rounded-full font-semibold">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
          <button 
            onClick={handleRecategorize}
            disabled={isRecategorizing}
            className="flex-1 flex items-center justify-center gap-2 h-10 bg-indigo-650 hover:bg-indigo-750 text-white disabled:opacity-50 text-[13px] font-bold rounded-xl transition-all shadow-sm"
          >
            <Sparkles className="h-4 w-4" /> {isRecategorizing ? "Categorizing..." : "Re-categorize"}
          </button>
          <button 
            onClick={() => {
              onEdit(creator);
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 h-10 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 text-[13px] font-bold rounded-xl transition-colors"
          >
            <Edit className="h-4 w-4" /> Edit Profile
          </button>
          <button className="h-10 px-4 flex items-center justify-center bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[13px] font-bold rounded-xl transition-colors">
            <UserX className="h-4 w-4" />
          </button>
        </div>
        
      </div>
    </>
  );
}
