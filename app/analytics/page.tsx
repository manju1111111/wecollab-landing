"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { 
  CheckCircle2, 
  ArrowRight, 
  Share2, 
  Download,
  Heart,
  MessageSquare,
  Eye,
  BarChart3,
  Calendar,
  Users2,
  Sparkles,
  Info,
  ShieldCheck,
  Zap,
  Check,
  Wifi,
  Database,
  AlertTriangle,
  Copy,
  CheckCheck,
  Lock
} from "lucide-react";
import { getCreatorAnalytics, type CreatorReport } from "./actions";
import { downloadCreatorPDF } from "./pdf";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

// Custom SVG Brand Icons matching the visual reference
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.37z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

// CreatorReport type is imported from actions.ts

// Helper: proxy external image URLs to avoid CORS
function proxyImage(url?: string): string {
  if (!url) return "/assets/jannat_profile.png";
  if (url.startsWith("/")) return url; // local asset
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Great";
  if (score >= 55) return "Good";
  return "Average";
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-violet-650";
  if (score >= 70) return "text-indigo-600";
  if (score >= 55) return "text-blue-600";
  return "text-slate-500";
}

const loadingSteps = [
  "Fetching followers and profiles...",
  "Calculating historical engagement rates...",
  "AI model detecting niche and category...",
  "Audience quality index checklist...",
  "Generating final creator score..."
];

function AnalyticsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportRef = useRef<HTMLDivElement>(null);

  const [platform, setPlatform] = useState<"Instagram" | "YouTube" | "LinkedIn" | "X">("Instagram");
  const [username, setUsername] = useState("@jannat_zubair29");
  const [isSearching, setIsSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState<CreatorReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  // Read URL params on mount and auto-trigger search
  useEffect(() => {
    const qParam = searchParams.get("q");
    const platformParam = searchParams.get("platform") as typeof platform | null;
    if (qParam) {
      setUsername(qParam);
      if (platformParam && ["Instagram", "YouTube", "LinkedIn", "X"].includes(platformParam)) {
        setPlatform(platformParam);
      }
      // Auto-trigger search
      const autoSearch = async () => {
        setError(null);
        setIsSearching(true);
        setCurrentStep(0);
        const res = await getCreatorAnalytics(platformParam || "Instagram", qParam);
        setTimeout(() => {
          if (res.error) {
            setError(res.error);
            setIsRateLimited(!!res.limitReached);
            setIsSearching(false);
          } else if (res.data) {
            setReport(res.data);
            setIsSearching(false);
            setTimeout(() => {
              document.getElementById("report-section")?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        }, 4200);
      };
      autoSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isSearching) return;
    setCurrentStep(0);
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= loadingSteps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [isSearching]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setError(null);
    setIsRateLimited(false);
    setIsSearching(true);
    setReport(null);

    // Update URL state for sharing
    const cleanHandle = username.replace(/^@/, "").trim();
    router.replace(`/analytics?q=${encodeURIComponent(cleanHandle)}&platform=${platform}`, { scroll: false });

    const res = await getCreatorAnalytics(platform, username);

    setTimeout(() => {
      if (res.error) {
        setError(res.error);
        setIsRateLimited(!!res.limitReached);
        setIsSearching(false);
      } else if (res.data) {
        setReport(res.data);
        setIsSearching(false);
        setTimeout(() => {
          document.getElementById("report-section")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }, 4200);
  }

  const handleShare = () => {
    if (!report) return;
    const shareUrl = `${window.location.origin}/analytics?q=${encodeURIComponent(report.username)}&platform=${report.platform}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPDF = useCallback(() => {
    if (!report) return;
    setIsPdfDownloading(true);
    try {
      downloadCreatorPDF(report);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setTimeout(() => setIsPdfDownloading(false), 1000);
    }
  }, [report]);




  const formatNumber = (num: number) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen w-full bg-[#05070f] text-slate-100 flex flex-col items-center overflow-x-hidden relative font-sans">
      
      {/* Decorative Hero Background Glows */}
      <div className="absolute top-0 left-0 w-full h-[850px] bg-grid-white/[0.02] pointer-events-none" />
      <div className="absolute top-20 left-0 w-[45vw] h-[600px] rounded-full bg-violet-850/15 blur-[160px] pointer-events-none" />
      <div className="absolute top-20 right-0 w-[45vw] h-[600px] rounded-full bg-indigo-900/15 blur-[160px] pointer-events-none" />

      {/* SVG Glowing Curved Arcs */}
      <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1440px] h-[800px] pointer-events-none z-0" viewBox="0 0 1440 800" fill="none">
        {/* Left Arc */}
        <path d="M 600,60 C 300,100 30,300 30,550 C 30,720 180,820 450,860" stroke="url(#arc-left)" strokeWidth="1.5" opacity="0.45" />
        <path d="M 600,60 C 300,100 30,300 30,550 C 30,720 180,820 450,860" stroke="#8b5cf6" strokeWidth="8" filter="url(#blur-filter)" opacity="0.15" />
        
        {/* Right Arc */}
        <path d="M 840,60 C 1140,100 1410,300 1410,550 C 1410,720 1260,820 990,860" stroke="url(#arc-right)" strokeWidth="1.5" opacity="0.45" />
        <path d="M 840,60 C 1140,100 1410,300 1410,550 C 1410,720 1260,820 990,860" stroke="#8b5cf6" strokeWidth="8" filter="url(#blur-filter)" opacity="0.15" />

        <defs>
          <linearGradient id="arc-left" x1="600" y1="60" x2="450" y2="860" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="40%" stopColor="#a855f7" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="arc-right" x1="840" y1="60" x2="990" y2="860" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0" />
            <stop offset="40%" stopColor="#a855f7" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#6366f1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <filter id="blur-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
          </filter>
        </defs>
      </svg>

      {/* Floating Header Navigation */}
      <header className="w-full max-w-6xl flex items-center justify-between z-50 px-6 sm:px-8 py-5 absolute top-0 left-1/2 -translate-x-1/2">
        <Link href="/" className="flex items-center gap-2">
          {/* Original Logo */}
          <div className="relative h-8 w-8 overflow-hidden rounded-xl shadow-md shrink-0">
            <Image src="/assets/logo.jpg" alt="Wecollab Logo" fill className="object-cover" />
          </div>
          <span className="font-extrabold text-[17px] tracking-tight text-white">wecollab</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          {["Product", "Solutions", "Resources", "Pricing", "For Creators"].map((link) => (
            <Link 
              key={link} 
              href="#" 
              className="text-[13.5px] font-semibold text-slate-350 hover:text-white transition-colors"
            >
              {link}
            </Link>
          ))}
        </nav>
        <Link 
          href="/brand/login" 
          className="text-[13px] font-semibold text-slate-300 hover:text-white border border-slate-700 bg-transparent hover:bg-slate-900/40 px-5.5 py-2 rounded-xl transition-all"
        >
          Login
        </Link>
      </header>

      {/* Hero Content Section */}
      <section className="w-full max-w-4xl flex flex-col items-center text-center pt-14 sm:pt-18 pb-10 px-6 z-10">
        
        {/* Micro-pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 rounded-full mb-3.5"
        >
          <span className="text-[10px] font-extrabold text-violet-400 uppercase tracking-widest flex items-center gap-1">
            <span>✨</span> Free Creator Analytics
          </span>
        </motion.div>
 
        {/* Hero Headline (exactly 3 lines layout) */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-[2.75rem] lg:text-[3rem] font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto text-center"
        >
          Check any creator's <br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Engagement Rate
          </span>, Audience Quality <br />
          & Brand Score.
        </motion.h1>
  
        {/* Hero Subheading */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[14px] sm:text-[15px] text-slate-400 max-w-xl mt-2.5 font-semibold leading-relaxed mx-auto text-center"
        >
          Instant AI-powered analytics for Instagram, YouTube, LinkedIn & X Creators.
        </motion.p>
 
        {/* Glassmorphic Search Card Container with Glow behind it */}
        <div className="relative w-full max-w-2xl mt-6 mx-auto z-10">
          {/* Card glow layer */}
          <div className="absolute inset-2 rounded-[30px] bg-gradient-to-r from-violet-600/20 via-indigo-650/15 to-purple-600/20 blur-3xl pointer-events-none z-0" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative w-full bg-[#090b16]/75 border border-slate-850 backdrop-blur-2xl rounded-[28px] p-4.5 sm:p-5.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] z-10"
          >
          {/* Platform Selector Toggles */}
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 bg-slate-950/60 border border-slate-900 rounded-full p-1.5 mb-3.5 mx-auto w-fit">
            {[
              { id: "Instagram", icon: InstagramIcon, label: "Instagram", color: "text-pink-500" },
              { id: "YouTube", icon: YoutubeIcon, label: "YouTube", color: "text-red-500" },
              { id: "LinkedIn", icon: LinkedinIcon, label: "LinkedIn", color: "text-sky-500" },
              { id: "X", icon: TwitterIcon, label: "X (Twitter)", color: "text-slate-200" }
            ].map((p) => {
              const isSelected = platform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id as any)}
                  className={`flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-full text-[12px] font-black transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-[#0c0e1e] text-white shadow-sm border border-violet-500/60" 
                      : "text-slate-350 hover:text-white border border-transparent"
                  }`}
                >
                  <p.icon className={`w-4 h-4 ${p.color}`} />
                  <span className="hidden sm:inline">{p.label}</span>
                </button>
              );
            })}
          </div>
  
          {/* Search Field Action Form */}
          <form onSubmit={handleSearch} className="w-full flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute left-4.5 top-1/2 -translate-y-1/2">
                {platform === "Instagram" && <InstagramIcon className="w-4.5 h-4.5 text-pink-500" />}
                {platform === "YouTube" && <YoutubeIcon className="w-4.5 h-4.5 text-red-500" />}
                {platform === "LinkedIn" && <LinkedinIcon className="w-4.5 h-4.5 text-sky-500" />}
                {platform === "X" && <TwitterIcon className="w-4.5 h-4.5 text-slate-200" />}
              </div>
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username or Profile URL"
                className="w-full h-11 bg-slate-950/65 border border-slate-900 focus:border-violet-550 rounded-full py-2 pl-12 pr-4 text-[13.5px] font-semibold text-white outline-none focus:ring-4 focus:ring-violet-650/10 transition placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="h-11 bg-[#6366f1] hover:bg-[#5053e3] text-white font-bold px-7 rounded-full text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-indigo-700/15"
            >
              <span>Analyze</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
 
          {/* Value Highlights (Yellow Gold checks) */}
          <div className="flex justify-center gap-7 text-[11px] text-slate-450 font-bold select-none mt-3.5">
            <span className="flex items-center gap-1.5">
              <span className="text-white/80">✓</span> Free
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-white/80">✓</span> No Login Required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-white/80">✓</span> Instant Report
            </span>
          </div>
 
        </motion.div>
      </div>

        {/* Error / Rate Limit notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-5 w-full max-w-md border rounded-2xl p-4 flex items-start gap-3 ${
              isRateLimited
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {isRateLimited ? (
              <Lock className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <div>
              <h5 className="font-bold text-white text-[12.5px]">
                {isRateLimited ? "Search Limit Reached" : "Analysis Failed"}
              </h5>
              <p className="mt-0.5 leading-normal text-[11.5px]">{error}</p>
              {isRateLimited && (
                <Link
                  href="/brand/login"
                  className="mt-2 inline-flex items-center gap-1 text-violet-400 font-bold text-[11px] hover:underline"
                >
                  Sign up for unlimited access <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </motion.div>
        )}

      </section>

      {/* Loading Sequence Section (Visible when searching) */}
      <AnimatePresence>
        {isSearching && (
          <div className="w-full max-w-md bg-[#090b16]/75 border border-slate-850 backdrop-blur-md rounded-[28px] p-7 flex flex-col gap-5 text-center mb-10 z-10 animate-in fade-in scale-in-95 duration-200">
            <div>
              <h3 className="text-[16px] font-bold text-white tracking-tight">Analyzing Profile...</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Scanning profile database values</p>
            </div>
            <div className="flex flex-col gap-3.5 text-left">
              {loadingSteps.map((step, idx) => {
                const isCompleted = currentStep > idx;
                const isActive = currentStep === idx;
                return (
                  <div key={idx} className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                    ) : isActive ? (
                      <div className="w-4.5 h-4.5 border-2 border-violet-550 border-t-transparent animate-spin rounded-full shrink-0" />
                    ) : (
                      <div className="w-4.5 h-4.5 rounded-full border border-slate-850 shrink-0" />
                    )}
                    <span className={`text-[12px] font-bold ${
                      isCompleted ? "text-slate-200" :
                      isActive ? "text-violet-400 animate-pulse" : "text-slate-600"
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Social Proof Row */}
      <div className="w-full max-w-5xl px-6 py-6 border-t border-slate-900/60 select-none z-10 shrink-0 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 text-center md:text-left">
          
          {/* Col 1 */}
          <div className="flex items-center justify-center md:justify-start gap-4 flex-1">
            <div className="flex -space-x-2.5 overflow-hidden">
              <div className="relative w-8 h-8 rounded-full border border-slate-950 overflow-hidden bg-slate-800">
                <Image src="/assets/discover-creator-1.png" alt="Avatar 1" fill className="object-cover" />
              </div>
              <div className="relative w-8 h-8 rounded-full border border-slate-950 overflow-hidden bg-slate-800">
                <Image src="/assets/discover-creator-2.png" alt="Avatar 2" fill className="object-cover" />
              </div>
              <div className="relative w-8 h-8 rounded-full border border-slate-950 overflow-hidden bg-slate-800">
                <Image src="/assets/discover-creator-3.png" alt="Avatar 3" fill className="object-cover" />
              </div>
            </div>
            <p className="text-[12.5px] text-slate-400 font-bold">
              Trusted by <span className="text-white font-black">500+</span> Brands
            </p>
          </div>

          {/* Vertical divider */}
          <div className="hidden md:block w-px h-8 bg-slate-800/60" />

          {/* Col 2 */}
          <div className="flex flex-col items-center justify-center flex-1">
            <h4 className="text-[19px] font-black text-white tracking-tight leading-none">20,000+</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">Creator Profiles Indexed</p>
          </div>

          {/* Vertical divider */}
          <div className="hidden md:block w-px h-8 bg-slate-800/60" />

          {/* Col 3 */}
          <div className="flex flex-col items-center justify-center md:items-end flex-1">
            <h4 className="text-[19px] font-black text-white tracking-tight leading-none">4.9/5</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">Average Rating</p>
          </div>

        </div>
      </div>

      {/* Analytics Dashboard Card Section (White Background Theme) */}
      <AnimatePresence>
        {report && !isSearching && (
          <section id="report-section" className="w-full bg-[#f8fafc] text-slate-900 py-16 px-6 flex flex-col items-center z-20 border-t border-slate-200">
            {/* PDF capture wrapper */}
            <div ref={reportRef} className="w-full max-w-5xl flex flex-col gap-8">
              
              {/* Report Title Header */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-1 text-left">
                  <span className="inline-flex items-center gap-1.5 bg-violet-100/70 text-violet-750 px-3.5 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                    Analysis Complete
                  </span>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 mt-2">
                    Here's your Creator Analytics Report
                  </h2>
                  <p className="text-[13px] text-slate-500 font-semibold mt-1">
                    AI-generated insights from 30+ data points.
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Data Source Badge */}
                  {report.data_source === "live" && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider">
                      <Wifi className="w-3 h-3" /> Live Data
                    </span>
                  )}
                  {report.data_source === "cached" && (
                    <span className="inline-flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 px-3 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider">
                      <Database className="w-3 h-3" /> Cached
                    </span>
                  )}
                  {report.data_source === "estimated" && (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> AI Estimated
                    </span>
                  )}

                  <button 
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-[12.5px] font-extrabold shadow-sm transition-colors cursor-pointer"
                  >
                    {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Link Copied!" : "Share Report"}</span>
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isPdfDownloading}
                    className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-[12.5px] font-extrabold shadow-sm transition-all shadow-violet-200/50 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isPdfDownloading ? "Generating..." : "Download PDF"}</span>
                  </button>
                </div>
              </div>

              {/* Creator Profile Header Summary Card */}
              <div className="bg-white border border-slate-200/90 rounded-[24px] p-6 sm:p-8 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  
                  {/* Portrait Avatar with Instagram-style gradient border */}
                  <div className="relative shrink-0">
                    <div className="w-22 h-22 bg-gradient-to-tr from-yellow-500 via-pink-500 to-violet-600 p-[3px] rounded-full shadow-md">
                      <div className="relative w-full h-full rounded-full overflow-hidden bg-slate-100 border border-white">
                        {/* Use proxy for external images, local fallback for known handles */}
                        <img
                          src={proxyImage(report.profile_pic_url)}
                          alt={report.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/assets/jannat_profile.png"; }}
                        />
                      </div>
                    </div>
                    {/* Tiny Platform Overlay */}
                    <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md border border-slate-100 flex items-center justify-center">
                      {report.platform === "Instagram" && <InstagramIcon className="w-4 h-4 text-pink-600" />}
                      {report.platform === "YouTube" && <YoutubeIcon className="w-4 h-4 text-red-600" />}
                      {report.platform === "LinkedIn" && <LinkedinIcon className="w-4 h-4 text-sky-600" />}
                      {report.platform === "X" && <TwitterIcon className="w-4 h-4 text-slate-700" />}
                    </div>
                  </div>

                  {/* Profile Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      <h3 className="text-[22px] font-black tracking-tight text-slate-900 leading-none">{report.name}</h3>
                      <span className="bg-[#58a6ff] text-white rounded-full p-0.5 flex items-center justify-center w-4 h-4 shrink-0" title="Verified Creator">
                        <Check className="w-2.5 h-2.5 stroke-[4]" />
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-450 font-bold select-all">@{report.username}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
                      <span className="bg-slate-100/90 text-slate-700 px-3.5 py-1 rounded-full text-[11px] font-extrabold">
                        {report.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                        <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        {report.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Engagement Core followers counts */}
                <div className="flex items-center gap-8 sm:gap-12 text-center md:pr-6">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 leading-none">{formatNumber(report.followers)}</h4>
                    <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-2">Followers</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 leading-none">{report.following.toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-2">Following</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200" />
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 leading-none">{report.posts.toLocaleString()}</h4>
                    <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-2">Posts</p>
                  </div>
                </div>

              </div>

              {/* Main Scorecard Metrics Section Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
                
                {/* Left panel: Metric cards (8 Cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                  <h3 className="text-[15px] font-black text-slate-900 tracking-tight select-none">
                    Performance Overview
                  </h3>
                  
                  {/* Grid of 6 Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Avg Likes", val: formatNumber(report.avg_likes), pct: "↑ 12.4%", icon: Heart, iconColor: "text-red-500 bg-red-50/70" },
                      { label: "Avg Comments", val: report.avg_comments.toLocaleString(), pct: "↑ 8.7%", icon: MessageSquare, iconColor: "text-purple-600 bg-purple-50/70" },
                      { label: "Avg Views", val: formatNumber(report.avg_views), pct: "↑ 15.3%", icon: Eye, iconColor: "text-blue-600 bg-blue-50/70" },
                      { label: "Engagement Rate", val: `${report.engagement_rate}%`, highlight: "Excellent", highlightColor: "text-emerald-650", icon: BarChart3, iconColor: "text-indigo-650 bg-indigo-50/70" },
                      { label: "Posting Frequency", val: report.posting_frequency, highlight: "Consistent", highlightColor: "text-indigo-650", icon: Calendar, iconColor: "text-orange-600 bg-orange-50/70" },
                      { label: "Audience Quality", val: `${report.quality_score}%`, highlight: "Excellent", highlightColor: "text-emerald-650", icon: Users2, iconColor: "text-emerald-600 bg-emerald-50/70" }
                    ].map((m, idx) => (
                      <div key={idx} className="bg-white border border-slate-200/90 rounded-[20px] p-5.5 shadow-[0_4px_12px_rgba(15,23,42,0.01)] flex flex-col justify-between h-34 select-all">
                        <div className="flex items-start justify-between">
                          <span className="text-[11.5px] text-slate-450 font-bold uppercase tracking-wider leading-none">
                            {m.label}
                          </span>
                          <span className={`p-1.5 rounded-lg ${m.iconColor}`}>
                            <m.icon className="w-4 h-4" />
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-[23px] font-black text-slate-900 leading-none">{m.val}</h4>
                          <div className="flex items-center gap-1">
                            {m.pct ? (
                              <span className="text-[11px] font-extrabold text-emerald-650 flex items-center leading-none">
                                {m.pct}
                              </span>
                            ) : (
                              <span className={`text-[11px] font-extrabold ${m.highlightColor} leading-none`}>
                                {m.highlight}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right panel: Semicircle Score gauge (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <h3 className="text-[15px] font-black text-slate-900 tracking-tight select-none">
                    AI Creator Score
                  </h3>
                  
                  {/* Gauge Card */}
                  <div className="bg-white border border-slate-200/90 rounded-[24px] p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] flex-1 flex flex-col items-center justify-center relative overflow-hidden select-none min-h-[240px]">
                    
                    {/* Semicircle circular progress bar */}
                    <div className="relative w-44 h-24 flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 100 50">
                        <defs>
                          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                        {/* Track ring */}
                        <path
                          className="text-slate-100"
                          strokeWidth="8.5"
                          stroke="currentColor"
                          fill="none"
                          d="M 10,50 A 40,40 0 0,1 90,50"
                        />
                        {/* Progress ring */}
                        <motion.path
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: report.creator_score / 100 }}
                          transition={{ duration: 1.4, ease: "easeOut" }}
                          stroke="url(#gaugeGradient)"
                          strokeWidth="9"
                          strokeLinecap="round"
                          fill="none"
                          d="M 10,50 A 40,40 0 0,1 90,50"
                        />
                      </svg>
                      {/* Text in center */}
                      <div className="absolute bottom-1.5 flex items-baseline gap-0.5 justify-center">
                        <span className="text-4xl font-black text-slate-900 leading-none">{report.creator_score}</span>
                        <span className="text-[12.5px] text-slate-400 font-extrabold">/100</span>
                      </div>
                    </div>

                    <div className="text-center mt-5 space-y-1.5">
                      <h4 className={`text-[14.5px] font-black uppercase tracking-widest leading-none ${getScoreColor(report.creator_score)}`}>
                        {getScoreLabel(report.creator_score)}
                      </h4>
                      <p className="text-[11.5px] text-slate-500 font-bold flex items-center gap-1.5 justify-center leading-none">
                        <span>
                          {report.creator_score >= 85 ? "Top 15%" : report.creator_score >= 70 ? "Top 30%" : "Top 50%"} of Creators
                        </span>
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                      </p>
                    </div>

                  </div>
                </div>

              </div>

              {/* Bottom Cards Section (AI Insights + Pricing + Content thumbnails layout) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 mt-2">
                
                {/* 1. AI Insights (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <h3 className="text-[13.5px] font-black uppercase tracking-wider text-slate-400 select-none">
                    AI Insights
                  </h3>
                  <div className="bg-white border border-slate-200/90 rounded-[22px] p-5.5 shadow-[0_4px_16px_rgba(15,23,42,0.015)] flex-1 flex flex-col justify-between gap-5 select-all">
                    
                    {/* Row 1 Niche */}
                    <div className="flex gap-3.5 items-start">
                      <div className="p-2 bg-violet-50 rounded-xl text-violet-650 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Niche</span>
                        <span className="text-[13.5px] font-bold text-slate-900 block">{report.niche}</span>
                      </div>
                    </div>

                    {/* Row 2 Audience */}
                    <div className="flex gap-3.5 items-start">
                      <div className="p-2 bg-emerald-50 rounded-xl text-emerald-650 shrink-0">
                        <Users2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Audience</span>
                        <span className="text-[13.5px] font-bold text-slate-900 block">{report.audience}</span>
                        <span className="text-[11px] font-semibold text-slate-450 block mt-0.5">
                          Female {report.audience_demographics.female} | Male {report.audience_demographics.male}
                        </span>
                      </div>
                    </div>

                    {/* Row 3 Brand Safety */}
                    <div className="flex gap-3.5 items-start">
                      <div className="p-2 bg-blue-50 rounded-xl text-blue-650 shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Brand Safety</span>
                        <span className="text-[13.5px] font-bold text-slate-900 block">{report.brand_safety_score}%</span>
                        <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">Very Safe</span>
                      </div>
                    </div>

                    {/* Row 4 Collab Potential */}
                    <div className="flex gap-3.5 items-start">
                      <div className="p-2 bg-purple-50 rounded-xl text-purple-650 shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Collaboration Potential</span>
                        <span className="text-[13.5px] font-bold text-slate-900 block">High</span>
                        <span className="text-[11px] font-semibold text-violet-650 block mt-0.5">Highly Recommended</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. Pricing Overview Card (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <h3 className="text-[13.5px] font-black uppercase tracking-wider text-slate-400 select-none">
                    Estimated Collaboration Pricing
                  </h3>
                  <div className="bg-white border border-slate-200/90 rounded-[22px] p-5.5 shadow-[0_4px_16px_rgba(15,23,42,0.015)] flex-1 flex flex-col gap-5 select-all justify-center">
                    
                    {/* Story card */}
                    <div className="bg-slate-50/80 border border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl text-slate-450 shadow-sm flex items-center justify-center border border-slate-100">
                          <InstagramIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9.5px] text-slate-450 font-bold block uppercase tracking-wide">Instagram Story</span>
                          <h4 className="text-[16px] font-black text-slate-900 block mt-1">{report.estimated_rates.story}</h4>
                        </div>
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-bold">per story</span>
                    </div>

                    {/* Reel card */}
                    <div className="bg-slate-50/80 border border-slate-100 p-4.5 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl text-pink-600 shadow-sm flex items-center justify-center border border-slate-100">
                          <InstagramIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9.5px] text-slate-450 font-bold block uppercase tracking-wide">Instagram Reel</span>
                          <h4 className="text-[16px] font-black text-slate-900 block mt-1">{report.estimated_rates.reel}</h4>
                        </div>
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-bold">per reel</span>
                    </div>

                  </div>
                </div>

                {/* 3. Content Thumbnails feed (Stacked Layout) */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <h3 className="text-[13.5px] font-black uppercase tracking-wider text-slate-400 select-none">
                    Best Performing Content
                  </h3>
                  <div className="bg-white border border-slate-200/90 rounded-[22px] p-5.5 shadow-[0_4px_16px_rgba(15,23,42,0.015)] flex-1 flex flex-col justify-center gap-5">
                    
                    {/* Stacked layout for spacing optimization */}
                    <div className="flex flex-col gap-4.5 w-full">
                      
                      {/* Top: 4 Reels side-by-side using full card width */}
                      <div className="grid grid-cols-4 gap-2 w-full">
                        {report.recent_content.thumbnails?.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm bg-slate-900 group">
                            <img
                              src={proxyImage(img)}
                              alt={`Post ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `/assets/reel_thumb_${idx + 1}.png`;
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-1">
                              <span className="text-[9px] font-black text-white flex items-center gap-0.5 leading-none">
                                <span className="text-[6.5px]">▶</span>
                                {idx === 0 ? report.recent_content.top_views : idx === 1 ? report.recent_content.avg_reach : idx === 2 ? report.recent_content.avg_saves : "—"}
                              </span>
                            </div>
                          </div>
                        ))}
                        {/* Fill empty slots with placeholder */}
                        {(report.recent_content.thumbnails?.length || 0) < 4 &&
                          Array.from({ length: 4 - (report.recent_content.thumbnails?.length || 0) }).map((_, idx) => (
                            <div key={`ph-${idx}`} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm bg-slate-100 flex items-center justify-center">
                              <span className="text-slate-300 text-[10px]">No post</span>
                            </div>
                          ))
                        }
                      </div>
 
                      {/* Bottom: Metrics in 2x2 grid with top divider */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-slate-100/90 text-left select-all">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-450 font-bold uppercase block tracking-wider">Top Reel Views</span>
                          <span className="text-[12.5px] text-slate-900 font-black">{report.recent_content.top_views}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-450 font-bold uppercase block tracking-wider">Average Reach</span>
                          <span className="text-[12.5px] text-slate-900 font-black">{report.recent_content.avg_reach}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-450 font-bold uppercase block tracking-wider">Average Saves</span>
                          <span className="text-[12.5px] text-slate-900 font-black">{report.recent_content.avg_saves}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-450 font-bold uppercase block tracking-wider">Best Posting Time</span>
                          <span className="text-[12.5px] text-slate-900 font-black">{report.recent_content.best_time}</span>
                        </div>
                      </div>
 
                    </div>
 
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </AnimatePresence>

      {/* Final Growth Flywheel CTA Banner */}
      <section className="w-full max-w-5xl px-6 py-12 z-10 shrink-0">
        <div className="w-full bg-gradient-to-br from-[#0c0d1b] via-[#090815] to-[#120d2b] border border-violet-850/20 rounded-[32px] p-8 sm:p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden select-none">
          
          <div className="absolute inset-0 bg-grid-white/[0.01] pointer-events-none" />

          {/* Left Checklist Details */}
          <div className="space-y-5 max-w-md">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              Want deeper analytics?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 text-[12.5px] text-slate-400 font-bold">
              {[
                "Fake follower detection",
                "Audience demographics",
                "Brand match score",
                "Similar creators",
                "Detailed performance history",
                "Competitor analysis"
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <span className="text-violet-400 shrink-0">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center Button and Text */}
          <div className="flex flex-col items-center text-center space-y-4">
            <h4 className="text-md sm:text-[17px] font-extrabold text-white leading-snug">
              Unlock the full power of WeCollab
            </h4>
            <p className="text-[12px] text-slate-450 font-bold leading-normal max-w-[280px]">
              Join 10,000+ brands & creators already growing together.
            </p>
            <Link 
              href="/brand/login"
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-555 hover:to-indigo-555 text-white font-bold py-3.5 px-7 rounded-2xl text-[12.5px] transition-all shadow-md shadow-violet-750/10 active:scale-[0.99] cursor-pointer shrink-0"
            >
              <span>Unlock Full Report</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <span className="text-[10px] text-slate-500 font-bold block tracking-wide select-none">
              Free to join • Cancel anytime
            </span>
          </div>

          {/* Right Panel Image */}
          <div className="relative w-64 h-44 hidden lg:block border border-slate-900 rounded-2xl overflow-hidden shadow-2xl shrink-0">
            <Image src="/assets/neon_dashboard.png" alt="3D Dashboard" fill className="object-cover" />
          </div>

        </div>
      </section>

      {/* Brand Logos Footer */}
      <footer className="w-full max-w-5xl px-6 py-10 select-none z-10 text-center border-t border-slate-900/60 mt-4">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block mb-6">
          Trusted by leading brands & agencies
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 grayscale opacity-35 hover:opacity-60 transition duration-300">
          {["zomato", "SWIGGY", "boAt", "mamaearth", "NYKAA", "PHILIPS", "OYO", "Paytm"].map((brand) => (
            <span 
              key={brand} 
              className="text-base sm:text-lg font-black tracking-tighter text-slate-350 italic"
            >
              {brand}
            </span>
          ))}
        </div>
        
        <div className="text-[10.5px] text-slate-650 font-bold pt-12 border-t border-slate-950 mt-10">
          © {new Date().getFullYear()} WeCollab Inc. Built for viral creative flywheel intelligence.
        </div>
      </footer>

    </div>
  );
}

export default function FreeCreatorAnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <AnalyticsPageInner />
    </Suspense>
  );
}
