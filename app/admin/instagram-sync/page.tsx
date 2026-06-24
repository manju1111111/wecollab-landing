"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  MessageSquare, 
  Heart, 
  Play, 
  Calendar, 
  ArrowUpRight, 
  Award, 
  Activity, 
  Gauge,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  Clock,
  BookOpen,
  PieChart,
  Tag
} from "lucide-react";

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error" | "warn";
}

export default function InstagramSyncPage() {
  const [username, setUsername] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [syncStep, setSyncStep] = useState<number>(0); // 0: idle, 1: profile, 2: posts, 3: metrics, 4: saving, 5: completed
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // Scraped Data State
  const [syncedData, setSyncedData] = useState<any | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (message: string, type: "info" | "success" | "error" | "warn" = "info") => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [...prev, entry]);
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const cleanUsername = username.replace("@", "").trim();
    setIsSyncing(true);
    setSyncError(null);
    setSyncedData(null);
    setLogs([]);
    setSyncStep(1);

    addLog(`Initiating Instagram sync for @${cleanUsername}...`, "info");
    addLog("Acquiring lock on scraper queue...", "info");

    try {
      addLog(`Invoking Instaloader for @${cleanUsername}... (might take up to 30s due to rate limit protective delays)`, "info");
      
      const response = await fetch("/api/instagram/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const result = await response.json();
      
      setSyncStep(2);
      addLog(`Profile info fetched successfully for @${cleanUsername}.`, "success");
      addLog(`Followers: ${result.profile.followers.toLocaleString()} | Following: ${result.profile.following.toLocaleString()}`, "info");
      
      setSyncStep(3);
      addLog(`Scraped latest ${result.posts.length} posts successfully.`, "success");
      
      setSyncStep(4);
      addLog("Analyzing posts and running Creator Metrics Engine...", "info");
      addLog(`Engagement Rate: ${result.metrics.engagement_rate}%`, "info");
      addLog(`Consistency Score: ${result.metrics.consistency_score}/100`, "info");
      addLog(`Creator Quality Score: ${result.metrics.creator_quality_score}/100`, "success");
      addLog(`Discovery Ranking Score: ${result.metrics.discovery_ranking_score}/100`, "success");

      setSyncStep(5);
      addLog(`Persisting records to backend...`, "info");
      if (result.source === "supabase") {
        addLog("Data successfully saved to Supabase database (creator_profiles, creator_posts, creator_metrics, creator_ai_scores).", "success");
      } else {
        addLog("Supabase write failed or tables not ready. Safely fell back and wrote to local JSON database (data/fallback-db.json).", "warn");
      }

      setSyncedData(result);
      setSyncStep(6); // Completed
      addLog(`Instagram sync completed successfully for @${cleanUsername}!`, "success");

    } catch (error: any) {
      console.error("[SYNC_UI_ERROR]", error);
      setSyncError(error.message || "An unexpected error occurred during the synchronization process.");
      addLog(`Sync failed: ${error.message}`, "error");
      setSyncStep(0);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#f8fafc] min-h-screen p-6 font-sans">
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 p-2.5 rounded-2xl text-white shadow-md shadow-orange-100">
              <Instagram className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Creator Intelligence Engine</h1>
          </div>
          <p className="text-[13.5px] text-slate-500 mt-1.5 font-semibold">
            Calculate, store, and display advanced creator analytics from public Instagram data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Sync Input, Stepper & Logs */}
        <div className="xl:col-span-1 flex flex-col gap-6">
          
          {/* Form Card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-[15px] font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Search className="h-4.5 w-4.5 text-indigo-500" /> Start Engine
            </h2>
            <form onSubmit={handleSync} className="flex flex-col gap-3">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                <input
                  type="text"
                  placeholder="instagram_username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSyncing}
                  className="w-full pl-9 pr-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSyncing || !username.trim()}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-300 text-white rounded-2xl text-sm font-extrabold shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" /> Fetching Creator...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4.5 w-4.5" /> Analyze Creator
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Stepper Progress */}
          {(isSyncing || syncStep > 0) && (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
              <h2 className="text-[14px] font-extrabold text-slate-800 flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-indigo-500" /> Engine Steps
              </h2>
              
              <div className="flex flex-col gap-3.5">
                {[
                  { label: "Scraping Profile Level Data", step: 1 },
                  { label: "Scraping Post Level Data (Last 50)", step: 2 },
                  { label: "Calculating Engine Metrics", step: 3 },
                  { label: "Generating AI Scores & Scores Table", step: 4 },
                  { label: "Sync Complete & Saved", step: 5 }
                ].map((s) => {
                  let status: "pending" | "running" | "done" = "pending";
                  if (syncStep > s.step) status = "done";
                  else if (syncStep === s.step) status = "running";
                  
                  return (
                    <div key={s.step} className="flex items-center gap-3.5">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        status === "done" ? "bg-emerald-500 text-white" :
                        status === "running" ? "bg-indigo-600 text-white animate-pulse" :
                        "bg-slate-100 text-slate-400"
                      }`}>
                        {status === "done" ? "✓" : s.step}
                      </div>
                      <span className={`text-[12.5px] font-bold ${
                        status === "done" ? "text-slate-500 line-through" :
                        status === "running" ? "text-indigo-600 font-extrabold" :
                        "text-slate-400"
                      }`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Log Console */}
          {logs.length > 0 && (
            <div className="bg-slate-900 rounded-3xl p-5 shadow-inner flex flex-col flex-1 min-h-[300px] border border-slate-800">
              <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-800">
                <span className="text-[11px] font-black text-slate-500 tracking-wider uppercase font-mono">Sync Logs</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto max-h-[350px] font-mono text-[11.5px] leading-relaxed flex flex-col gap-1.5 scrollbar-thin"
              >
                {logs.map((log, idx) => (
                  <div key={idx} className={`whitespace-pre-wrap ${
                    log.type === "success" ? "text-emerald-400" :
                    log.type === "error" ? "text-rose-400 font-bold" :
                    log.type === "warn" ? "text-amber-400" : "text-slate-300"
                  }`}>
                    <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {syncError && (
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-800">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-black">Scraper Error</span>
                <span className="text-[11.5px] font-bold leading-normal">{syncError}</span>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Detailed Creator Intelligence Dashboard */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          
          {syncedData ? (
            <>
              {/* Profile Header Block */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
                <img 
                  src={syncedData.profile.profile_pic_url || "/assets/logo.jpg"} 
                  alt={syncedData.profile.username}
                  className="h-20 w-20 rounded-3xl object-cover border-2 border-slate-100 shadow-sm shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop";
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">@{syncedData.profile.username}</h2>
                    {syncedData.profile.is_verified && (
                      <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">Verified</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-500 mt-0.5">{syncedData.profile.full_name || "@" + syncedData.profile.username}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-2 line-clamp-2 max-w-xl">
                    {syncedData.profile.biography || "No biography provided."}
                  </p>
                  {syncedData.profile.external_url && (
                    <a 
                      href={syncedData.profile.external_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline text-xs font-bold inline-flex items-center gap-1 mt-2.5"
                    >
                      {syncedData.profile.external_url} <ArrowUpRight className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Discovery Rank Badge */}
                <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-indigo-100 rounded-3xl p-4 flex flex-col items-center justify-center shrink-0 w-full md:w-40 text-center shadow-sm">
                  <span className="text-[10px] font-black text-indigo-500 tracking-widest uppercase flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Discovery Rank
                  </span>
                  <div className="flex items-baseline gap-0.5 mt-1.5">
                    <span className="text-3xl font-black text-indigo-700">{syncedData.metrics.discovery_ranking_score}</span>
                    <span className="text-xs font-black text-indigo-400">/100</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 mt-1">Controls creator search order</span>
                </div>
              </div>

              {/* AI Scores Grid */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-indigo-500" /> Composite AI Scores
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Creator Quality", value: syncedData.metrics.creator_quality_score, desc: "Quality composite", icon: Sparkles, color: "from-amber-500 to-orange-500", bg: "bg-amber-50 text-amber-600" },
                    { label: "Influence Score", value: syncedData.metrics.influence_score, desc: "Reach & followers", icon: Zap, color: "from-indigo-500 to-violet-500", bg: "bg-indigo-50 text-indigo-600" },
                    { label: "Audience Trust", value: syncedData.metrics.audience_trust_score, desc: "Comment ratios", icon: ShieldCheck, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 text-emerald-600" },
                    { label: "Reliability Score", value: syncedData.metrics.reliability_score, desc: "Consistency standard", icon: CheckCircle2, color: "from-cyan-500 to-blue-500", bg: "bg-cyan-50 text-cyan-600" },
                  ].map((score, idx) => {
                    const Icon = score.icon;
                    return (
                      <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase leading-none">{score.label}</span>
                          <div className={`p-1.5 rounded-lg ${score.bg}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                        </div>
                        <div className="flex items-baseline mt-2">
                          <span className="text-2xl font-black text-slate-800">{score.value}</span>
                          <span className="text-[10px] font-bold text-slate-400 ml-0.5">/100</span>
                        </div>
                        <p className="text-[9.5px] font-semibold text-slate-400 mt-1">{score.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Engagement & Reach Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {[
                  { label: "Followers", value: syncedData.profile.followers.toLocaleString(), detail: `Following: ${syncedData.profile.following.toLocaleString()}`, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                  { label: "Engagement Rate", value: `${syncedData.metrics.engagement_rate}%`, detail: `Likes: ${syncedData.metrics.like_rate}% | Comments: ${syncedData.metrics.comment_rate}%`, icon: Gauge, color: "text-rose-500", bg: "bg-rose-50" },
                  { label: "Engagement by Views", value: `${syncedData.metrics.engagement_by_views}%`, detail: "Likes & comments per view", icon: Play, color: "text-pink-500", bg: "bg-pink-50" },
                  { label: "Reach Efficiency", value: `${(syncedData.metrics.reach_efficiency * 100).toFixed(1)}%`, detail: `Category: ${syncedData.metrics.reach_category.toUpperCase()}`, icon: Activity, color: "text-violet-500", bg: "bg-violet-50" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase leading-none">{item.label}</span>
                        <div className={`${item.bg} ${item.color} p-2 rounded-xl`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-xl font-black text-slate-800">{item.value}</span>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 leading-normal">{item.detail}</p>
                      </div>
                    </div>
                  );
                })}

              </div>

              {/* Detailed Breakdown Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Column 1: Consistency, Virality & Health */}
                <div className="flex flex-col gap-6">
                  
                  {/* Consistency & Virality */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-indigo-500" /> Posting & Virality Engine
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Posting Frequency</span>
                        <span className="text-xs font-black text-slate-800">{syncedData.metrics.posting_frequency}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Avg Posting Gap</span>
                        <span className="text-xs font-black text-slate-800">{syncedData.metrics.avg_gap_days} Days</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Weekly Output (Posts/Week)</span>
                        <span className="text-xs font-black text-slate-800">{syncedData.metrics.posts_per_week} posts/wk</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Viral Hit Rate</span>
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">{syncedData.metrics.viral_hit_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Viral Post Count</span>
                        <span className="text-xs font-black text-slate-800">{syncedData.metrics.viral_post_count} posts</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-500">Viral Threshold (2x Avg Views)</span>
                        <span className="text-xs font-bold text-slate-400">&gt; {syncedData.metrics.viral_threshold.toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Health & Averages */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Gauge className="h-4.5 w-4.5 text-indigo-500" /> Health & Performance Averages
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div className="bg-slate-50 rounded-2xl p-3 text-center">
                        <span className="text-[9px] font-black text-slate-450 uppercase block">Activity Score</span>
                        <span className="text-lg font-black text-slate-850 block mt-1">{syncedData.metrics.account_activity_score}</span>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 text-center">
                        <span className="text-[9px] font-black text-slate-455 uppercase block">Follower/Following</span>
                        <span className="text-lg font-black text-slate-850 block mt-1">{syncedData.metrics.follower_following_ratio}x</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-550">Average Views</span>
                        <span className="text-xs font-black text-slate-800">{syncedData.metrics.average_views.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-550">Median Views</span>
                        <span className="text-xs font-black text-slate-850">{syncedData.metrics.median_views.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-550">Median Likes</span>
                        <span className="text-xs font-black text-slate-850">{syncedData.metrics.median_likes.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-550">Median Comments</span>
                        <span className="text-xs font-black text-slate-850">{syncedData.metrics.median_comments.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Column 2: Authenticity, Momentum & Content Analysis */}
                <div className="flex flex-col gap-6">
                  
                  {/* Authenticity & Momentum */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="h-4.5 w-4.5 text-indigo-500" /> Authenticity & Momentum
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Comment/Like Ratio</span>
                        <span className="text-xs font-black text-slate-800">{(syncedData.metrics.comment_like_ratio * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Authenticity Band</span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          syncedData.metrics.authenticity_score === "High" ? "bg-emerald-50 text-emerald-700" :
                          syncedData.metrics.authenticity_score === "Medium" ? "bg-indigo-50 text-indigo-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>{syncedData.metrics.authenticity_score} Rating</span>
                      </div>
                      
                      {/* Bot Risk Indicators */}
                      <div className="flex flex-col pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 mb-1.5">Bot Risk Assessment</span>
                        {syncedData.metrics.bot_risk_indicators.length === 0 ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50/50 p-2 rounded-xl">
                            <ShieldCheck className="h-4 w-4" /> Healthy engagement profile (no anomalies detected).
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {syncedData.metrics.bot_risk_indicators.map((indicator: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-1.5 text-xs text-amber-750 bg-amber-50/50 p-2 rounded-xl font-bold">
                                <AlertCircle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{indicator}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Momentum */}
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Momentum Indicator</span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                          syncedData.metrics.momentum_score === "Growing" ? "bg-emerald-50 text-emerald-700" :
                          syncedData.metrics.momentum_score === "Stable" ? "bg-slate-100 text-slate-700" :
                          "bg-rose-50 text-rose-700"
                        }`}>{syncedData.metrics.momentum_score}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Momentum Growth Rate</span>
                        <span className={`text-xs font-black ${syncedData.metrics.momentum >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {syncedData.metrics.momentum >= 0 ? "+" : ""}{(syncedData.metrics.momentum * 100).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-500">Views Growth (Recent vs Old 10)</span>
                        <span className="text-xs font-bold text-slate-400">
                          {Math.round(syncedData.metrics.last_10_posts_avg_views).toLocaleString()} vs {Math.round(syncedData.metrics.previous_10_posts_avg_views).toLocaleString()}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Content & Hashtag Analysis */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Tag className="h-4.5 w-4.5 text-indigo-500" /> Content & Tag Analysis
                    </h3>
                    <div className="flex flex-col gap-3">
                      {/* Content Type Distribution */}
                      <div>
                        <span className="text-xs font-semibold text-slate-500">Content Type Split</span>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-2.5 rounded-full bg-indigo-550" style={{ width: `${syncedData.metrics.content_type_distribution.reels}%` }} title={`Reels: ${syncedData.metrics.content_type_distribution.reels}%`}></div>
                          <div className="h-2.5 rounded-full bg-pink-500" style={{ width: `${syncedData.metrics.content_type_distribution.images}%` }} title={`Images: ${syncedData.metrics.content_type_distribution.images}%`}></div>
                          <div className="h-2.5 rounded-full bg-amber-400" style={{ width: `${syncedData.metrics.content_type_distribution.carousels}%` }} title={`Carousels: ${syncedData.metrics.content_type_distribution.carousels}%`}></div>
                        </div>
                        <div className="flex items-center gap-4 mt-2.5 text-[10px] font-extrabold text-slate-500">
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-550"></span> Reels {syncedData.metrics.content_type_distribution.reels}%</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-pink-500"></span> Images {syncedData.metrics.content_type_distribution.images}%</span>
                          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400"></span> Carousel {syncedData.metrics.content_type_distribution.carousels}%</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 pt-1.5">
                        <span className="text-xs font-semibold text-slate-500">Hashtag Usage Rate</span>
                        <span className="text-xs font-black text-slate-800">{syncedData.metrics.hashtag_usage_rate}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-xs font-semibold text-slate-500">Avg Caption Character Count</span>
                        <span className="text-xs font-black text-slate-800">{syncedData.metrics.avg_caption_length} chars</span>
                      </div>

                      {/* Top 20 Hashtags */}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-500 mb-1.5">Most Used Hashtags</span>
                        {syncedData.metrics.most_used_hashtags.length === 0 ? (
                          <span className="text-xs text-slate-400 italic font-bold">No hashtags used in scanned posts.</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {syncedData.metrics.most_used_hashtags.slice(0, 10).map((tag: string, i: number) => (
                              <span key={i} className="bg-indigo-50/70 border border-indigo-100/50 text-indigo-700 text-[10.5px] font-extrabold px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Scrape History snap shot log */}
              <div className="bg-slate-50 border border-slate-150 rounded-3xl p-5 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>Database Synced at {new Date(syncedData.lastSyncTimestamp).toLocaleDateString()} {new Date(syncedData.lastSyncTimestamp).toLocaleTimeString()}</span>
                <span>Source: {syncedData.source === "supabase" ? "Supabase Table Write" : "Fallback JSON Cache"}</span>
              </div>

              {/* Recent Scrapes Content Grid */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-black text-slate-850 mb-4 flex items-center gap-2">
                  <Instagram className="h-4.5 w-4.5 text-indigo-500" /> Recent Content Scrape (Latest {syncedData.posts.length} Posts)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {syncedData.posts.slice(0, 12).map((post: any, idx: number) => (
                    <div key={idx} className="border border-slate-150 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all gap-3 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-mono text-slate-400">#{post.shortcode}</span>
                        {post.is_video ? (
                          <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5"><Play className="h-2 w-2" /> Reel</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">Image</span>
                        )}
                      </div>
                      
                      <p className="text-[11.5px] font-bold text-slate-650 line-clamp-3 leading-relaxed">
                        {post.caption || <span className="text-slate-450 italic">No caption</span>}
                      </p>

                      <div className="flex items-center gap-4 border-t border-slate-100 pt-3 mt-1.5 text-slate-500 font-extrabold text-[11.5px]">
                        <span className="flex items-center gap-1 animate-pulse-hover"><Heart className="h-3.5 w-3.5 text-rose-500" /> {post.likes.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5 text-indigo-500" /> {post.comments.toLocaleString()}</span>
                        {post.views > 0 && (
                          <span className="flex items-center gap-1"><Play className="h-3.5 w-3.5 text-slate-500" /> {post.views.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 shadow-sm text-center flex flex-col items-center justify-center min-h-[500px]">
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full mb-4">
                <Instagram className="h-8 w-8 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-slate-800">No Creator Synced</h3>
              <p className="text-[12.5px] text-slate-400 mt-2 max-w-sm font-bold">
                Enter an Instagram handle on the left to activate the Creator Intelligence Engine.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
