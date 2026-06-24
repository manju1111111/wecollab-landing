import { NextResponse } from "next/server";
import { instaloaderService } from "@/lib/instagram/instaloader";
import { createClient } from "@supabase/supabase-js";

// Allow up to 120 seconds for the sync to complete
export const maxDuration = 120;

function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * POST /api/admin/background-sync
 * Triggers a full Instagram profile analysis for a given creator username.
 * Writes results to:
 *   - creator_profiles
 *   - creator_posts
 *   - creator_metrics
 *   - creator_ai_scores
 *   - creator_scores
 *   - creator_metrics_history
 *   - creator_sync_logs
 * Also back-populates the main `creators` table with fresh metrics so the
 * Discover page and Plan Workspace columns are immediately available.
 *
 * This route is called fire-and-forget after a creator is added so the
 * UI never waits for the scrape.
 */
export async function POST(request: Request) {
  let username = "";
  try {
    const body = await request.json();
    username = (body.username || "").replace("@", "").trim();

    if (!username) {
      return NextResponse.json(
        { success: false, error: "username is required" },
        { status: 400 }
      );
    }

    console.log(`[BACKGROUND_SYNC] Starting full metrics sync for @${username}...`);

    // Run the full analysis (scrape + metrics engine + DB writes)
    const result = await instaloaderService.analyzeProfile(username);

    // Back-populate the main `creators` table with the freshly calculated metrics
    // so Plan Workspace columns and Discover filters work immediately.
    const supabase = getSupabaseServer();
    const { profile, metrics } = result;

    const creatorsUpdate: Record<string, any> = {
      followers: profile.followers,
      following: profile.following ?? null,
      engagement_rate: metrics.engagement_rate ?? null,
      avg_reel_views: metrics.avg_reel_views != null ? String(Math.round(metrics.avg_reel_views)) : null,
      bio: profile.biography || null,
      verified: profile.is_verified ?? false,
      last_fetched_at: result.lastSyncTimestamp,
    };

    // Only update profile_image if we got a real URL
    if (profile.profile_pic_url) {
      creatorsUpdate.profile_image = profile.profile_pic_url;
    }

    const { error: updateErr } = await supabase
      .from("creators")
      .update(creatorsUpdate)
      .eq("username", username);

    if (updateErr) {
      console.warn(`[BACKGROUND_SYNC] Failed to back-populate creators table for @${username}:`, updateErr.message);
    } else {
      console.log(`[BACKGROUND_SYNC] Successfully back-populated creators table for @${username}`);
    }

    // Also update the Algolia index with the refreshed data
    try {
      const { data: updatedCreator } = await supabase
        .from("creators")
        .select("*")
        .eq("username", username)
        .single();

      if (updatedCreator) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        await fetch(`${appUrl}/api/admin/sync-algolia`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", creator: updatedCreator }),
        });
      }
    } catch (algoliaErr: any) {
      console.warn(`[BACKGROUND_SYNC] Algolia sync failed for @${username}:`, algoliaErr.message);
    }

    console.log(`[BACKGROUND_SYNC] Completed sync for @${username}. Source: ${result.source}`);

    return NextResponse.json({
      success: true,
      username,
      source: result.source,
      metrics: {
        followers: profile.followers,
        engagement_rate: metrics.engagement_rate,
        avg_reel_views: metrics.avg_reel_views,
        creator_quality_score: metrics.creator_quality_score,
      },
    });
  } catch (err: any) {
    console.error(`[BACKGROUND_SYNC_ERROR] For @${username}:`, err.message);
    return NextResponse.json(
      { success: false, error: err.message || "Sync failed" },
      { status: 500 }
    );
  }
}
