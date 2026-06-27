import * as dotenv from "dotenv";
import path from "path";

// Load local environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import { instaloaderService } from "../lib/instagram/instaloader";
import { createClient } from "@supabase/supabase-js";
import { syncCreatorFilterAssignments } from "../lib/instagram/classifier";
import { searchEngine } from "../lib/search-client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function recategorize(username: string) {
  console.log(`=== RECATEGORIZING CREATOR @${username} ===`);
  try {
    // 1. Fetch current creator record
    const { data: creator, error: fetchErr } = await supabase
      .from("creators")
      .select("*")
      .eq("username", username)
      .single();

    if (fetchErr || !creator) {
      throw new Error(`Failed to find creator: ${fetchErr?.message}`);
    }

    console.log("Found creator in DB. Fetching latest profile data and running AI classifier...");
    
    // 2. Run instaloader/Gemini classification
    const syncResult = await instaloaderService.analyzeProfile(username);
    const tags = syncResult.profile.tags || [];
    const category = syncResult.profile.category || "General";

    console.log("Classification result:", { category, tagsCount: tags.length, tags });

    if (tags.length === 0) {
      console.warn("AI returned 0 tags. Keeping existing data.");
      return;
    }

    // 3. Update Supabase
    console.log("Updating creators table in Supabase...");
    const { error: updateErr } = await supabase
      .from("creators")
      .update({
        tags,
        category,
        followers: syncResult.profile.followers || creator.followers,
        avg_reel_views: String(syncResult.metrics.avg_reel_views || creator.avg_reel_views),
        engagement_rate: syncResult.metrics.engagement_rate || creator.engagement_rate,
      })
      .eq("id", creator.id);

    if (updateErr) {
      throw new Error(`Failed to update creators table: ${updateErr.message}`);
    }

    console.log("Syncing filter assignments in database...");
    await syncCreatorFilterAssignments(supabase, creator.id, tags);

    // 4. Update Algolia
    console.log("Updating Algolia search index...");
    await searchEngine.updateObject(creator.id, {
      followers: syncResult.profile.followers || creator.followers,
      totalFollowers: syncResult.profile.followers || creator.followers,
      avg_reel_views: String(syncResult.metrics.avg_reel_views || creator.avg_reel_views),
      avgReelViews: String(syncResult.metrics.avg_reel_views || creator.avg_reel_views),
      engagement_rate: syncResult.metrics.engagement_rate || creator.engagement_rate,
      engagementRate: syncResult.metrics.engagement_rate || creator.engagement_rate,
      tags,
      categories: tags,
      category,
    } as any);

    console.log(`=== SUCCESSFULLY RECATEGORIZED @${username}! ===`);
  } catch (e: any) {
    console.error("Recategorization failed:", e.message);
  }
}

recategorize("_naman_gulati");
