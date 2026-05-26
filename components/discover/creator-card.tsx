"use client";

import Image from "next/image";
import { Creator } from "@/data/mock-creators";
import { Star, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export function CreatorCard({ creator, index }: { creator: Creator; index: number }) {
  // Utility to format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getPlatformIcon = (platformName: string) => {
    switch (platformName) {
      case "Instagram":
        return (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        );
      case "YouTube":
        return (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
            <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
          </svg>
        );
      case "X":
        return (
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4l16 16M20 4L4 20" />
          </svg>
        );
      case "TikTok":
        return (
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10"
    >
      {/* Top Banner / Avatar area */}
      <div className="relative h-24 bg-gradient-to-br from-violet-100 to-indigo-50">
        <div className="absolute -bottom-10 left-6">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-sm">
            <Image
              src={creator.avatar}
              alt={creator.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="80px"
            />
          </div>
        </div>
        <div className="absolute right-4 top-4 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
          {creator.category}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-12">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{creator.name}</h3>
            <p className="text-[13px] font-medium text-slate-500">{creator.handle}</p>
          </div>
          <div className="flex items-center gap-1 rounded-md bg-yellow-50 px-1.5 py-0.5 text-[12px] font-bold text-yellow-700">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            {creator.rating}
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-slate-600">
          {creator.bio}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {creator.location}
        </div>

        {/* Stats & Platforms */}
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Audience
            </p>
            <p className="mt-0.5 text-lg font-bold text-slate-900">
              {formatNumber(creator.totalFollowers)}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {creator.platforms.map((p) => (
              <div
                key={p.name}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-colors group-hover:bg-violet-50 group-hover:text-violet-600"
                title={`${formatNumber(p.followers)} on ${p.name}`}
              >
                {getPlatformIcon(p.name)}
              </div>
            ))}
          </div>
        </div>

        <button className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-[14px] font-semibold text-white transition hover:bg-violet-600">
          View Profile
        </button>
      </div>
    </motion.div>
  );
}
