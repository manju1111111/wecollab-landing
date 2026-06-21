"use client";

import { useState, useEffect } from "react";
import { Sparkles, Terminal, CheckCircle2, AlertTriangle, Play, RefreshCw, Eye, Tag, Calendar, Database, Check, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CategorizationLogsClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [tableExists, setTableExists] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [activeTab, setActiveTab] = useState<"logs" | "tools">("tools");
  
  // Single re-categorize input state
  const [targetUsername, setTargetUsername] = useState("");
  const [isSingleRunning, setIsSingleRunning] = useState(false);
  const [singleMessage, setSingleMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bulk re-categorize state
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentName: "" });
  const [bulkMessage, setBulkMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Selected log for inspection modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/categorize-pipeline/logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTableExists(data.tableExists !== false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSingleRecategorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername.trim()) return;
    
    setIsSingleRunning(true);
    setSingleMessage(null);
    const username = targetUsername.replace("@", "").trim();

    try {
      const res = await fetch("/api/admin/categorize-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (data.success) {
        setSingleMessage({
          type: "success",
          text: `Successfully re-categorized @${username}! New tags: ${data.creator?.tags?.join(", ") || "None"}`
        });
        setTargetUsername("");
        fetchLogs();
      } else {
        setSingleMessage({ type: "error", text: data.error || "Execution failed." });
      }
    } catch (err: any) {
      setSingleMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setIsSingleRunning(false);
    }
  };

  const handleBulkRecategorize = async () => {
    if (isBulkRunning) return;
    if (!confirm("Are you sure you want to re-categorize ALL creators in the database? This might take several minutes depending on the database size.")) {
      return;
    }

    setIsBulkRunning(true);
    setBulkMessage(null);
    setBulkProgress({ current: 0, total: 0, currentName: "" });

    try {
      // 1. Fetch all creators to get a list
      const creatorsRes = await fetch("/api/admin/creators");
      const creatorsData = await creatorsRes.json();
      
      if (!creatorsData.creators || creatorsData.creators.length === 0) {
        setBulkMessage({ type: "error", text: "No creators found in the database to process." });
        setIsBulkRunning(false);
        return;
      }

      const creatorsList = creatorsData.creators;
      const totalCount = creatorsList.length;
      setBulkProgress({ current: 0, total: totalCount, currentName: "Starting..." });

      // 2. Loop through and call pipeline for each creator sequentially
      let processedCount = 0;
      for (const creator of creatorsList) {
        if (!creator.username) continue;
        
        setBulkProgress(prev => ({
          ...prev,
          current: processedCount,
          currentName: `@${creator.username} (${creator.name || "Unnamed"})`
        }));

        try {
          await fetch("/api/admin/categorize-pipeline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: creator.username, creatorId: creator.id }),
          });
        } catch (singleErr) {
          console.error(`Error categorizing creator @${creator.username}:`, singleErr);
        }

        processedCount++;
      }

      setBulkProgress(prev => ({ ...prev, current: totalCount, currentName: "Finished!" }));
      setBulkMessage({ type: "success", text: `Bulk categorization complete! Processed ${processedCount} creators.` });
      fetchLogs();
    } catch (err: any) {
      setBulkMessage({ type: "error", text: err.message || "Bulk processing failed." });
    } finally {
      setIsBulkRunning(false);
    }
  };

  const sqlMigrationCode = `CREATE TABLE IF NOT EXISTS public.creator_categorization_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id   UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  username     TEXT NOT NULL,
  status       TEXT NOT NULL, -- 'success', 'failed'
  provider     TEXT NOT NULL, -- 'instaloader', 'apify', etc.
  raw_data     JSONB,          -- Raw scraped Instagram data
  ai_output    JSONB,          -- Raw Gemini output
  mapped_tags  TEXT[],         -- Tags mapped by the engine
  error        TEXT,           -- Error message if failed
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cat_logs_creator ON public.creator_categorization_logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_cat_logs_created ON public.creator_categorization_logs(created_at);`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-15 pointer-events-none transform translate-x-12 -translate-y-8 scale-150">
          <Sparkles className="w-96 h-96 text-indigo-400" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="bg-indigo-500/20 text-indigo-300 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/30">Admin Curation Utilities</span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-3 text-white">AI Creator Categorization Pipeline</h1>
          <p className="text-slate-300 mt-2 text-sm leading-relaxed">
            Monitor and execute background workflows that scrape Instagram handles, analyze bio and content via Gemini AI, and map tags to WeCollab's official taxonomy.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-slate-100 rounded-2xl p-1 text-[13px] font-extrabold max-w-fit shadow-sm">
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "tools" ? "bg-white text-slate-900 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Play className="h-4 w-4" /> AI Pipelines & Tools
        </button>
        <button
          onClick={() => { setActiveTab("logs"); fetchLogs(); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "logs" ? "bg-white text-slate-900 shadow-md scale-[1.02]" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Terminal className="h-4 w-4" /> Pipeline Logs & Audits
          {logs.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full shrink-0 font-extrabold">
              {logs.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
        
        {/* TAB 1: AI TOOLS */}
        {activeTab === "tools" && (
          <div className="space-y-10">
            {/* Tool 1: Single Creator Pipeline */}
            <section className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Re-categorize Single Creator on Demand
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                Trigger Instagram data fetching, profile bio intelligence, and filter tagging for a specific influencer username.
              </p>
              
              <form onSubmit={handleSingleRecategorize} className="mt-4 flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                  <input
                    type="text"
                    required
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    disabled={isSingleRunning}
                    placeholder="enter_username"
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSingleRunning || !targetUsername.trim()}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-100"
                >
                  {isSingleRunning ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Categorizing...</span>
                    </>
                  ) : (
                    <span>Onboard / Re-categorize</span>
                  )}
                </button>
              </form>

              {singleMessage && (
                <div className={`mt-4 p-4 rounded-xl text-xs font-semibold max-w-xl ${
                  singleMessage.type === "success" 
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-800" 
                    : "bg-rose-50 border border-rose-100 text-rose-800"
                }`}>
                  <p className="font-bold flex items-center gap-1.5">
                    {singleMessage.type === "success" ? "✓ Successfully Scraped & Mapped" : "✕ Pipeline Failed"}
                  </p>
                  <p className="mt-1 font-medium text-slate-600/90 leading-relaxed">{singleMessage.text}</p>
                </div>
              )}
            </section>

            {/* Tool 2: Bulk Database Recategorization */}
            <section className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-500" />
                Bulk Database Re-categorization
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Iterate through all creators currently registered in your database, execute the scraping engine, run Gemini content mapping, and update their tags and search indices in real-time.
              </p>

              {!isBulkRunning ? (
                <div className="mt-5">
                  <button
                    onClick={handleBulkRecategorize}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="h-4 w-4 fill-white" /> Launch Bulk Re-categorization
                  </button>
                </div>
              ) : (
                <div className="mt-6 space-y-4 max-w-xl bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                      Processing: <span className="text-indigo-600 font-extrabold">{bulkProgress.currentName}</span>
                    </span>
                    <span>{bulkProgress.current} / {bulkProgress.total}</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {bulkMessage && (
                <div className={`mt-4 p-4 rounded-xl text-xs font-semibold max-w-xl ${
                  bulkMessage.type === "success" 
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-800" 
                    : "bg-rose-50 border border-rose-100 text-rose-800"
                }`}>
                  <p className="font-bold">{bulkMessage.type === "success" ? "✓ Bulk Success" : "✕ Bulk Failed"}</p>
                  <p className="mt-1 font-medium">{bulkMessage.text}</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: PIPELINE LOGS */}
        {activeTab === "logs" && (
          <div className="space-y-6">
            
            {/* Warning if logs database table is missing */}
            {!tableExists && (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-rose-700 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-rose-800">Database Table Missing</h3>
                    <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                      The logs table <code>creator_categorization_logs</code> does not exist in your database. 
                      Copy and run the SQL below in your **Supabase Dashboard → SQL Editor** to create it:
                    </p>
                  </div>
                </div>
                
                {/* Code Block */}
                <div className="relative bg-slate-900 text-slate-300 rounded-xl p-4 font-mono text-[11px] overflow-auto max-h-48 scrollbar-thin">
                  <pre>{sqlMigrationCode}</pre>
                </div>
              </div>
            )}

            {isLoadingLogs ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600 mb-3"></div>
                <span className="text-xs font-bold">Retrieving execution logs...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                <Terminal className="h-10 w-10 text-slate-300 mb-2" />
                <span className="text-xs font-bold">No execution logs found.</span>
                <span className="text-[11px] text-slate-400 max-w-xs mt-1">Logs are automatically recorded when running the creator categorization pipeline.</span>
              </div>
            ) : (
              <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-slate-100 text-[13px] font-semibold text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3 text-left">Creator</th>
                      <th className="px-6 py-3 text-left">Timestamp</th>
                      <th className="px-6 py-3 text-left">Provider</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
                    {logs.map((log) => {
                      const date = new Date(log.created_at).toLocaleString();
                      const isSuccess = log.status === "success";
                      const displayName = log.creators?.name || "New Import";
                      
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-bold text-slate-900">{displayName}</div>
                              <div className="text-[11px] text-slate-450 font-medium">@{log.username}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 flex items-center gap-1.5 text-slate-500 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {date}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-650 text-[10px] px-2 py-0.5 rounded font-extrabold uppercase">
                              {log.provider}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              isSuccess 
                                ? "bg-emerald-50 text-emerald-750" 
                                : "bg-rose-50 text-rose-750"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-rose-500"}`} />
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 border border-indigo-100"
                            >
                              <Eye className="h-3.5 w-3.5" /> Inspect Outputs
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INSPECTION MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Inspection Log: <span className="text-indigo-600">@{selectedLog.username}</span>
                  </h3>
                  <p className="text-xs text-slate-450 font-semibold mt-0.5">
                    Executed via {selectedLog.provider} on {new Date(selectedLog.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                
                {selectedLog.error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-semibold leading-relaxed">
                    <p className="font-bold flex items-center gap-1 text-rose-900">
                      <AlertTriangle className="h-4 w-4" /> Scraping/AI Pipeline Error:
                    </p>
                    <p className="mt-1 font-medium">{selectedLog.error}</p>
                  </div>
                )}

                {/* Grid of details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Mapped Tags */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Tag className="h-4.5 w-4.5 text-indigo-500" />
                      <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">AI Mapped Niche Filters</h4>
                    </div>

                    {selectedLog.mapped_tags && selectedLog.mapped_tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 bg-slate-50/40 p-4 border border-slate-150 rounded-xl max-h-56 overflow-y-auto">
                        {selectedLog.mapped_tags.map((tag: string) => (
                          <span key={tag} className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 text-[11.5px] font-bold px-3 py-1 rounded-full shadow-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 font-medium italic bg-slate-50/50 p-4 border border-slate-200/50 rounded-xl">
                        No subcategory filters mapped for this creator.
                      </div>
                    )}

                    {/* Gemini raw JSON Output */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 pt-2">
                        <Sparkles className="h-4.5 w-4.5 text-purple-500" />
                        <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">Gemini Raw Attributes</h4>
                      </div>
                      <div className="bg-slate-900 text-slate-300 font-mono text-[11px] p-4 rounded-xl overflow-auto max-h-52 scrollbar-thin">
                        <pre>{JSON.stringify(selectedLog.ai_output || {}, null, 2)}</pre>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Scraped Data */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
                      <Eye className="h-4.5 w-4.5 text-indigo-500" />
                      <h4 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">Raw Instagram Scraped Metrics</h4>
                    </div>
                    
                    {selectedLog.raw_data ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-200/50">
                            <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Followers</div>
                            <div className="text-[14px] font-bold text-slate-900">{selectedLog.raw_data.followers?.toLocaleString() || 0}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-200/50">
                            <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Following</div>
                            <div className="text-[14px] font-bold text-slate-900">{selectedLog.raw_data.following?.toLocaleString() || 0}</div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg text-center border border-slate-200/50">
                            <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Website</div>
                            <div className="text-[11px] font-bold text-slate-800 truncate" title={selectedLog.raw_data.website}>
                              {selectedLog.raw_data.website ? "Linked" : "None"}
                            </div>
                          </div>
                        </div>

                        {/* Recent Captions List */}
                        <div className="space-y-2">
                          <h5 className="text-[11.5px] font-extrabold text-slate-450 uppercase tracking-wider">Sample Instagram Captions</h5>
                          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl max-h-56 overflow-y-auto space-y-2.5 custom-scrollbar">
                            {selectedLog.raw_data.captions && selectedLog.raw_data.captions.length > 0 ? (
                              selectedLog.raw_data.captions.map((cap: string, i: number) => (
                                <div key={i} className="text-[11.5px] text-slate-650 leading-relaxed bg-white border border-slate-150 p-2.5 rounded-lg">
                                  {cap || <span className="italic text-slate-400">No caption content.</span>}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-slate-400 font-medium italic text-center py-2">No caption texts scraped.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 font-medium italic bg-slate-50/50 p-4 border border-slate-200/50 rounded-xl">
                        No raw scraper metadata logs.
                      </div>
                    )}
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end shrink-0">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
