import { NextResponse } from "next/server";
import { instaloaderService } from "../../../../lib/instagram/instaloader";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Set a timeout limit (e.g., 60 seconds)
export const maxDuration = 60; 

const fallbackFilePath = path.join(process.cwd(), 'data/fallback-db.json');

export async function GET(request: Request) {
  const startTime = Date.now();
  console.log("[CRON_SYNC] Started weekly creator auto-refresh check...");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let creatorsToSync: string[] = [];
  let isFallback = false;

  try {
    // 1. Attempt to fetch creators needing sync from Supabase
    const { data: profiles, error } = await supabase
      .from("creator_profiles")
      .select("username, last_sync_at")
      .or(`last_sync_at.lt.${sevenDaysAgo},last_sync_at.is.null`)
      .order("last_sync_at", { ascending: true })
      .limit(3);

    if (error) throw error;

    if (profiles && profiles.length > 0) {
      creatorsToSync = profiles.map(p => p.username);
    }
  } catch (e: any) {
    console.warn(`[CRON_SYNC] Supabase query failed (${e.message}). Fetching from fallback JSON database...`);
    isFallback = true;
    
    // 2. Fetch from fallback JSON
    if (fs.existsSync(fallbackFilePath)) {
      try {
        const content = fs.readFileSync(fallbackFilePath, 'utf8');
        const db = JSON.parse(content);
        const profiles = db.creator_profiles || [];
        
        const outdated = profiles.filter((p: any) => {
          if (!p.last_sync_at) return true;
          return new Date(p.last_sync_at).getTime() < Date.now() - 7 * 24 * 60 * 60 * 1000;
        });

        // Sort ascending by last_sync_at (oldest first or nulls first)
        outdated.sort((a: any, b: any) => {
          const tA = a.last_sync_at ? new Date(a.last_sync_at).getTime() : 0;
          const tB = b.last_sync_at ? new Date(b.last_sync_at).getTime() : 0;
          return tA - tB;
        });

        creatorsToSync = outdated.slice(0, 3).map((p: any) => p.username);
      } catch (jsonErr) {
        console.error("[CRON_SYNC] Error reading fallback database:", jsonErr);
      }
    }
  }

  if (creatorsToSync.length === 0) {
    console.log("[CRON_SYNC] No creators require syncing at this time.");
    return NextResponse.json({
      message: "No creator profiles require syncing at this time. All profiles are fresh (synced within the last 7 days).",
      synced: [],
      duration_ms: Date.now() - startTime
    });
  }

  console.log(`[CRON_SYNC] Identified ${creatorsToSync.length} outdated profiles to refresh: ${creatorsToSync.join(", ")}`);

  const results: { username: string; status: "success" | "failed"; error?: string }[] = [];

  // Run sequentially to respect rate limit queueing and cooling
  for (const username of creatorsToSync) {
    try {
      console.log(`[CRON_SYNC] Syncing @${username}...`);
      await instaloaderService.analyzeProfile(username);
      results.push({ username, status: "success" });
    } catch (err: any) {
      console.error(`[CRON_SYNC] Failed to sync @${username}:`, err.message);
      results.push({ username, status: "failed", error: err.message });
    }
  }

  const durationMs = Date.now() - startTime;
  console.log(`[CRON_SYNC] Auto-refresh completed in ${durationMs}ms. Results:`, results);

  return NextResponse.json({
    message: "Auto-refresh cycle completed.",
    results,
    duration_ms: durationMs,
    source: isFallback ? "fallback_json" : "supabase"
  });
}
