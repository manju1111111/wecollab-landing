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

async function runTest() {
  const username = "therock";
  console.log(`=== STARTING E2E PIPELINE VERIFICATION FOR @${username} ===`);

  // 1. Fetch Instagram Data & run AI Classification
  console.log("\n[STAGE 1] Triggering Instaloader analyzeProfile...");
  const syncResult = await instaloaderService.analyzeProfile(username);
  console.log("PASS: Sync completed.");
  console.log("Source:", syncResult.source);

  // 2. Show categories/tags from Gemini
  console.log("\n[STAGE 2] Gemini generated classification:");
  console.log("Category:", syncResult.profile.category);
  console.log("Tags:", syncResult.profile.tags);
  console.log("Filters Count:", syncResult.profile.filters?.length || 0);

  if (!syncResult.profile.tags || syncResult.profile.tags.length === 0) {
    console.error("FAIL: Gemini returned no tags.");
    return;
  }

  // 3. Save to Supabase
  console.log("\n[STAGE 3] Saving to Supabase creators table...");
  const newCreator = {
    name: syncResult.profile.full_name || syncResult.profile.username,
    username: syncResult.profile.username,
    bio: syncResult.profile.biography || "",
    profile_image: syncResult.profile.profile_pic_url || "",
    profile_pic_url: syncResult.profile.profile_pic_url || "",
    followers: syncResult.profile.followers || 0,
    avg_reel_views: String(syncResult.metrics.avg_reel_views || 0),
    engagement_rate: syncResult.metrics.engagement_rate || 0,
    verified: syncResult.profile.is_verified || false,
    verification_status: "Verified",
    visibility_status: true,
    category: syncResult.profile.category || "General",
    location: "US",
    has_manager: false,
    brand_safe: true,
    tags: syncResult.profile.tags || [],
  };

  const { data: creatorDb, error: dbErr } = await supabase
    .from("creators")
    .upsert(newCreator, { onConflict: "username" })
    .select()
    .single();

  if (dbErr || !creatorDb) {
    console.error("FAIL: Supabase insert failed:", dbErr?.message);
    return;
  }

  console.log("PASS: Stored in creators table. Stored Category:", creatorDb.category);
  console.log("Stored Tags:", creatorDb.tags);

  console.log("Syncing filter assignments in database...");
  await syncCreatorFilterAssignments(supabase, creatorDb.id, syncResult.profile.tags);

  // Verify stored filter assignments
  const { data: assignments, error: assignErr } = await supabase
    .from("creator_filter_assignments")
    .select("filter_id, filter_name, filter_group")
    .eq("creator_id", creatorDb.id);

  if (assignErr) {
    console.error("FAIL: Reading assignments failed:", assignErr.message);
    return;
  }
  console.log("PASS: Stored Assignments in database:", assignments);

  // 4. Index in Algolia
  console.log("\n[STAGE 4] Indexing to Algolia...");
  const objectToSave = {
    id: creatorDb.id,
    objectID: creatorDb.id,
    name: creatorDb.name,
    username: creatorDb.username,
    bio: creatorDb.bio,
    profile_image: creatorDb.profile_pic_url || creatorDb.profile_image || "",
    profile_pic_url: creatorDb.profile_pic_url || creatorDb.profile_image || "",
    followers: creatorDb.followers,
    totalFollowers: creatorDb.followers,
    avg_reel_views: creatorDb.avg_reel_views,
    engagement_rate: creatorDb.engagement_rate,
    engagementRate: creatorDb.engagement_rate,
    has_manager: creatorDb.has_manager,
    verified: creatorDb.verified,
    brand_safe: creatorDb.brand_safe,
    location: creatorDb.location,
    tags: creatorDb.tags,
    categories: creatorDb.tags,
    category: creatorDb.category,
    creator_status: "active",
    visibility: "public",
    profile_completed: true,
    verification_passed: true,
    is_deleted: false,
    platforms: [
      {
        name: "Instagram",
        handle: creatorDb.username,
        followers: creatorDb.followers,
      }
    ]
  };

  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_ADMIN_KEY;
  if (!appId || !adminKey) {
    console.error("FAIL: Algolia env vars missing.");
    return;
  }

  // Setup Algolia client & update
  const { algoliasearch } = await import("algoliasearch");
  const adminClient = algoliasearch(appId, adminKey);
  await adminClient.saveObjects({
    indexName: "creators",
    objects: [objectToSave]
  });
  console.log("PASS: Indexed to Algolia.");

  // 5. Search Algolia using Discovery Page search query
  console.log("\n[STAGE 5] Verifying Discovery Page query filtering...");
  const filterToTest = syncResult.profile.tags[0];
  console.log(`Searching Algolia creators index with subcategory filter: "${filterToTest}"`);

  // Wait 2 seconds for eventual consistency in Algolia indexing
  await new Promise(r => setTimeout(r, 2000));

  const searchResult = await searchEngine.search({
    subCategories: [filterToTest],
    limit: 10
  });

  const matchedHits = (searchResult.hits as any[]).filter(h => h.username === username);
  if (matchedHits.length > 0) {
    console.log("PASS: Creator was found in Discovery search using the filter!");
    console.log("Matched Hit:", {
      username: matchedHits[0].username,
      name: matchedHits[0].name,
      category: matchedHits[0].category,
      tags: matchedHits[0].tags
    });
  } else {
    console.error(`FAIL: Creator @${username} was NOT found in search results with filter "${filterToTest}".`);
    console.log("Returned hits:", (searchResult.hits as any[]).map(h => ({ username: h.username, tags: h.tags })));
  }

  console.log("\n=== E2E PIPELINE VERIFICATION COMPLETE ===");
}

runTest().catch(console.error);
