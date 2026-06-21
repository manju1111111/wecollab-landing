"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, CheckCircle2, Heart, Eye, Activity, ExternalLink, BarChart3, TrendingUp } from "lucide-react";
import { Creator } from "@/data/mock-creators";
import { useState, useEffect } from "react";

import { sanitizeImageSrc, getInitials, resolveCreatorImage } from "@/lib/avatar-utils";

// ─── RadarChart Pentagon Component ───────────────────────────────────────────
const RadarChart = () => {
  const reach = 82;
  const authenticity = 92;
  const pricing = 78;
  const niche = 95;
  const er = 85;

  const cx = 80;
  const cy = 80;
  const r = 50;

  const getPoints = (scale: number) => {
    return [0, 72, 144, 216, 288].map(deg => {
      const rad = (deg * Math.PI) / 180 - Math.PI / 2;
      const x = cx + r * scale * Math.cos(rad);
      const y = cy + r * scale * Math.sin(rad);
      return `${x},${y}`;
    }).join(" ");
  };

  const getActivePoints = () => {
    const scores = [reach, authenticity, pricing, niche, er];
    return [0, 72, 144, 216, 288].map((deg, idx) => {
      const rad = (deg * Math.PI) / 180 - Math.PI / 2;
      const dist = r * (scores[idx] / 100);
      const x = cx + dist * Math.cos(rad);
      const y = cy + dist * Math.sin(rad);
      return `${x},${y}`;
    }).join(" ");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
      <div className="w-[120px] h-[120px] relative shrink-0">
        <svg className="w-full h-full" viewBox="0 0 160 160">
          <polygon points={getPoints(1.0)} fill="transparent" stroke="#e2e8f0" strokeWidth="1" />
          <polygon points={getPoints(0.75)} fill="transparent" stroke="#f1f5f9" strokeWidth="1" />
          <polygon points={getPoints(0.5)} fill="transparent" stroke="#f8fafc" strokeWidth="1" />
          
          {[0, 72, 144, 216, 288].map(deg => {
            const rad = (deg * Math.PI) / 180 - Math.PI / 2;
            return (
              <line key={deg} x1={cx} y1={cy} x2={cx + r * Math.cos(rad)} y2={cy + r * Math.sin(rad)} stroke="#e2e8f0" strokeWidth="1" />
            );
          })}
          
          <polygon points={getActivePoints()} fill="rgba(124, 58, 237, 0.12)" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" />
          
          {getActivePoints().split(" ").map((pt, i) => {
            const [x, y] = pt.split(",");
            return (
              <circle key={i} cx={x} cy={y} r="3" fill="#7c3aed" />
            );
          })}
        </svg>
      </div>
      <div className="flex-1 space-y-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
        <div className="flex items-center justify-between border-b border-slate-50 pb-1 mb-1">
          <span className="text-slate-800">🎯 Fit Index</span>
          <span className="text-primary font-black">90%</span>
        </div>
        <div className="space-y-0.5 text-[9px] font-bold text-slate-400 normal-case">
          <div className="flex justify-between"><span>Reach Index</span><span className="text-slate-700">82%</span></div>
          <div className="flex justify-between"><span>Authenticity</span><span className="text-slate-700">92%</span></div>
          <div className="flex justify-between"><span>Cost Efficiency</span><span className="text-slate-700">78%</span></div>
          <div className="flex justify-between"><span>Niche Depth</span><span className="text-slate-700">95%</span></div>
          <div className="flex justify-between"><span>Engagement</span><span className="text-slate-700">85%</span></div>
        </div>
      </div>
    </div>
  );
};

// ─── RecentPostsGallery Component ─────────────────────────────────────────────
const RecentPostsGallery = ({ category }: { category: string }) => {
  const images = {
    Food: [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=150&h=150&fit=crop&q=80"
    ],
    Fashion: [
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=150&h=150&fit=crop&q=80"
    ],
    Tech: [
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&h=150&fit=crop&q=80"
    ],
    Travel: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=150&h=150&fit=crop&q=80",
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=150&h=150&fit=crop&q=80"
    ]
  } as Record<string, string[]>;

  const defaultImages = [
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop&q=80"
  ];

  const pool = images[category] || defaultImages;

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {pool.map((src, i) => (
        <div key={src + i} className="group/post relative aspect-square overflow-hidden rounded-xl bg-slate-100 shadow-sm border border-slate-150">
          <img src={src} alt="Recent post" className="h-full w-full object-cover transition duration-300 group-hover/post:scale-105" loading="lazy" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover/post:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-black text-white gap-1 select-none pointer-events-none">
            <span className="flex items-center gap-1">❤️ {Math.floor(25 + Math.random() * 40)}k</span>
            <span className="flex items-center gap-1">💬 {Math.floor(100 + Math.random() * 300)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── PitchComposerCard Component ─────────────────────────────────────────────
const PitchComposerCard = ({ creatorName }: { creatorName: string }) => {
  const [copied, setCopied] = useState(false);

  const pitchText = `Hi ${creatorName},\n\nHope you are doing great! I'm reaching out from WeCollab. We love your creative style and alignment with our client's upcoming brand campaign. We think you'd be a perfect fit.\n\nLet us know if you'd be open to discussing a collaboration blueprint!\n\nBest regards,\nCampaign Curation Team\nWeCollab`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pitchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#fcfdff] rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-wider">⚡ outreach pitch composer</h4>
        <button
          onClick={handleCopy}
          className="text-[10px] font-bold text-primary hover:text-primary-hover border border-primary/20 hover:bg-primary-soft px-2.5 py-0.5 rounded-lg transition cursor-pointer"
        >
          {copied ? "Copied! ✓" : "Copy Pitch Template"}
        </button>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-500 font-mono leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap select-all no-scrollbar">
        {pitchText}
      </div>
    </div>
  );
};

// ─── CreatorAvatarPanel ───────────────────────────────────────────────────────
// Hardened panel-size avatar (96×96) with:
//  • HTTPS enforcement + base64 rejection via sanitizeImageSrc
//  • Lazy loading + async decoding
//  • Broken-image infinite retry prevention
//  • Deterministic gradient fallback keyed to creator name
//  • referrerPolicy="no-referrer" for Instagram CDN CORS
function CreatorAvatarPanel({ src, name, className = "h-24 w-24" }: { src?: string; name: string; className?: string }) {
  const safeSrc = sanitizeImageSrc(src);
  const [loadedSrc, setLoadedSrc] = useState(safeSrc);
  const [error, setError] = useState(false);

  // Reset ONLY when src actually changes — prevents infinite retry loops
  useEffect(() => {
    const nextSafe = sanitizeImageSrc(src);
    if (nextSafe !== loadedSrc) {
      setLoadedSrc(nextSafe);
      setError(false);
    }
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  const initials = getInitials(name);

  const colorClasses = [
    "from-violet-400 to-indigo-500",
    "from-rose-400 to-pink-500",
    "from-fuchsia-400 to-primary",
    "from-emerald-400 to-teal-500",
    "from-sky-400 to-blue-500",
    "from-fuchsia-400 to-purple-500",
  ];
  const colorIdx = name ? name.charCodeAt(0) % colorClasses.length : 0;

  if (!loadedSrc || error) {
    return (
      <div
        className={`${className} rounded-full bg-gradient-to-br ${colorClasses[colorIdx]} flex items-center justify-center text-white font-bold text-2xl select-none`}
        aria-label={`${name} avatar initials`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={loadedSrc}
      alt={`${name} profile photo`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setError(true)}
      className={`${className} rounded-full object-cover`}
    />
  );
}

function getEstimatedRates(followers: number, er: number, category: string) {
  const erFactor = Math.max(0.7, Math.min(1.5, er / 3.0));
  let story = 1500;
  let post = 3000;
  let reel = 4500;

  if (followers > 500000) {
    story = Math.round(followers * 0.05 * erFactor);
    post = Math.round(followers * 0.08 * erFactor);
    reel = Math.round(followers * 0.12 * erFactor);
  } else if (followers > 100000) {
    story = Math.round(followers * 0.07 * erFactor);
    post = Math.round(followers * 0.11 * erFactor);
    reel = Math.round(followers * 0.16 * erFactor);
  } else if (followers > 10000) {
    story = Math.round(followers * 0.10 * erFactor);
    post = Math.round(followers * 0.15 * erFactor);
    reel = Math.round(followers * 0.22 * erFactor);
  } else {
    story = Math.round(followers * 0.15 * erFactor);
    post = Math.round(followers * 0.25 * erFactor);
    reel = Math.round(followers * 0.35 * erFactor);
  }

  story = Math.max(800, Math.round(story / 100) * 100);
  post = Math.max(1500, Math.round(post / 100) * 100);
  reel = Math.max(2000, Math.round(reel / 100) * 100);

  return { story, post, reel };
}

const WecollabScoreMeter = ({ score, er, followers }: { score: number; er: number; followers: number }) => {
  const normalizedScore = Number(score.toFixed(1));
  const strokeDashoffset = 2 * Math.PI * 40 - (normalizedScore / 10) * 2 * Math.PI * 40;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-6">
      <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
          <circle 
            cx="50" cy="50" 
            r="40" 
            fill="transparent" 
            stroke="url(#scoreGradient)" 
            strokeWidth="8" 
            strokeDasharray={2 * Math.PI * 40} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round" 
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="text-center relative z-10 flex flex-col leading-none">
          <span className="text-xl font-black text-slate-800">{normalizedScore}</span>
          <span className="text-[8px] font-black text-slate-400 mt-0.5">/10</span>
        </div>
      </div>
      
      <div className="flex-1 space-y-1.5 text-[10px] font-black text-slate-500 uppercase tracking-wider">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
          <span className="text-slate-800 font-extrabold">⚡ WECOLLAB PERF SCORE</span>
          <span className="text-violet-600 font-extrabold normal-case">Excellent</span>
        </div>
        <div className="space-y-0.5 text-[9px] font-bold text-slate-405 normal-case">
          <div className="flex justify-between">
            <span>Reach Factor</span>
            <span className="text-slate-700">{followers > 500000 ? "9.8" : followers > 100000 ? "8.5" : "7.2"}/10</span>
          </div>
          <div className="flex justify-between">
            <span>Engagement Quotient</span>
            <span className="text-slate-700">{(er >= 5 ? 9.5 : er >= 3 ? 8.2 : 6.8).toFixed(1)}/10</span>
          </div>
          <div className="flex justify-between">
            <span>Consistency Rating</span>
            <span className="text-slate-700">9.1/10</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DemographicsMeter = ({ category }: { category: string }) => {
  let femalePct = 52;
  let malePct = 48;
  
  if (category === "Fashion" || category === "Beauty" || category === "Lifestyle") {
    femalePct = 76;
    malePct = 24;
  } else if (category === "Gaming" || category === "Tech" || category === "Automotive") {
    femalePct = 22;
    malePct = 78;
  } else if (category === "Fitness" || category === "Sports") {
    femalePct = 40;
    malePct = 60;
  } else if (category === "Food" || category === "Travel") {
    femalePct = 58;
    malePct = 42;
  }

  const ageData = [
    { range: "13-17", pct: 8 },
    { range: "18-24", pct: 46 },
    { range: "25-34", pct: 32 },
    { range: "35-44", pct: 10 },
    { range: "45+", pct: 4 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="space-y-1.5">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gender Distribution</h4>
        <div className="flex justify-between text-[11px] font-bold text-slate-750">
          <span className="text-blue-500">Male {malePct}%</span>
          <span className="text-pink-500">Female {femalePct}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500" style={{ width: `${malePct}%` }} />
          <div className="h-full bg-gradient-to-r from-pink-400 to-pink-500" style={{ width: `${femalePct}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Age Groups</h4>
        <div className="space-y-1.5">
          {ageData.map(item => (
            <div key={item.range} className="flex items-center gap-3">
              <span className="w-10 text-[10px] font-bold text-slate-550 shrink-0">{item.range}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" 
                  style={{ width: `${item.pct}%` }} 
                />
              </div>
              <span className="w-8 text-right text-[10px] font-bold text-slate-700 shrink-0">{item.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-slate-50 shadow-md">
                  <CreatorAvatarPanel
                    src={resolveCreatorImage(creator)}
                    name={creator.name}
                    className="h-24 w-24"
                  />
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="mt-14 px-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{creator.name}</h2>
                {creator.verified && <CheckCircle2 className="h-5 w-5 fill-blue-500 text-white" />}
              </div>
              <div className="text-sm font-medium text-slate-500">
                @{(creator as any).username || creator.handle}
              </div>
              
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

            {/* Wecollab performance score */}
            <div className="mt-6 px-6">
              <WecollabScoreMeter 
                score={creator.engagementRate > 5 ? 9.2 : creator.engagementRate > 3 ? 8.4 : 7.1} 
                er={creator.engagementRate} 
                followers={creator.totalFollowers} 
              />
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
            {/* Estimated Rates Brief */}
            <div className="mt-6 px-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Estimated Pricing Brief</h3>
              <div className="bg-white rounded-2xl border border-slate-205 p-4 shadow-sm grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Instagram Story</span>
                  <span className="text-xs font-extrabold text-slate-800">₹{getEstimatedRates(creator.totalFollowers, creator.engagementRate, creator.category).story.toLocaleString()}</span>
                </div>
                <div className="border-l border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Instagram Post</span>
                  <span className="text-xs font-extrabold text-slate-800">₹{getEstimatedRates(creator.totalFollowers, creator.engagementRate, creator.category).post.toLocaleString()}</span>
                </div>
                <div className="border-l border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Instagram Reel</span>
                  <span className="text-xs font-extrabold text-slate-800">₹{getEstimatedRates(creator.totalFollowers, creator.engagementRate, creator.category).reel.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Audience Demographics */}
            <div className="mt-6 px-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Audience Demographics</h3>
              <DemographicsMeter category={creator.category} />
            </div>

            {/* Recent Posts Visual Grid Mockup */}
            <div className="mt-6 px-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Portfolio Showcase</h3>
              <RecentPostsGallery category={creator.category} />
            </div>

            {/* outreach template cards */}
            <div className="mt-6 px-6 pb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Outreach Assistant</h3>
              <PitchComposerCard creatorName={creator.name} />
            </div>

            {/* Footer Actions */}
            <div className="mt-auto border-t border-slate-200 bg-white p-4 sticky bottom-0">
              <div className="flex gap-3">
                <button className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
                  View Full Report
                </button>
                <button className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover">
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
