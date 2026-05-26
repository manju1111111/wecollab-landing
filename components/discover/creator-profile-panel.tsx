"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, CheckCircle2, Heart, Eye, Activity, ExternalLink, BarChart3, TrendingUp } from "lucide-react";
import Image from "next/image";
import { Creator } from "@/data/mock-creators";

export function CreatorProfilePanel({
  creator,
  isOpen,
  onClose,
}: {
  creator: Creator | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!creator) return null;

  // Utility to format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: "100%", boxShadow: "-20px 0 25px -5px rgba(0, 0, 0, 0)" }}
            animate={{ x: 0, boxShadow: "-20px 0 25px -5px rgba(0, 0, 0, 0.1)" }}
            exit={{ x: "100%", boxShadow: "-20px 0 25px -5px rgba(0, 0, 0, 0)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[450px] flex-col bg-slate-50 overflow-y-auto"
          >
            {/* Close Button Floating */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/50 backdrop-blur text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header / Avatar */}
            <div className="relative h-48 w-full bg-gradient-to-br from-violet-500 to-indigo-600">
              <div className="absolute -bottom-12 left-6">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-slate-50 bg-white shadow-md">
                  <Image src={creator.avatar} alt={creator.name} fill className="object-cover" />
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="mt-14 px-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{creator.name}</h2>
                {creator.verified && <CheckCircle2 className="h-5 w-5 fill-blue-500 text-white" />}
              </div>
              <div className="text-sm font-medium text-slate-500">{creator.handle}</div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  {creator.category}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                  <MapPin className="h-3 w-3" /> {creator.location}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                {creator.bio}
              </p>
            </div>

            {/* Stats Grid */}
            <div className="mt-6 px-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs font-medium">Total Followers</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">{formatNumber(creator.totalFollowers)}</div>
                </div>
                
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-medium">Engagement Rate</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">{creator.engagementRate}%</div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Heart className="h-4 w-4" />
                    <span className="text-xs font-medium">Avg Likes</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">{creator.avgLikes}</div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs font-medium">Avg Reel Views</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">{creator.avgReelViews}</div>
                </div>
              </div>
            </div>

            {/* Platform Breakdown */}
            <div className="mt-6 px-6 pb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Platforms</h3>
              <div className="flex flex-col gap-2">
                {creator.platforms.map((platform) => (
                  <div key={platform.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                        {platform.name === "Instagram" ? "📸" : platform.name === "YouTube" ? "▶️" : platform.name === "TikTok" ? "🎵" : "🐦"}
                      </div>
                      <span className="font-medium text-slate-700">{platform.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">{formatNumber(platform.followers)}</span>
                      <a href={platform.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-violet-600">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto border-t border-slate-200 bg-white p-4 sticky bottom-0">
              <div className="flex gap-3">
                <button className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                  View Full Report
                </button>
                <button className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">
                  Contact Creator
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
