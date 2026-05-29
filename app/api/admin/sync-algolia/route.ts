import { NextResponse } from "next/server";
import { algoliasearch } from "algoliasearch";

export async function POST(req: Request) {
  try {
    const { action, creator, id } = await req.json();

    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const adminKey = process.env.ALGOLIA_ADMIN_KEY;

    if (!appId || !adminKey) {
      console.error("[ALGOLIA_SYNC_ERROR] Algolia keys are missing in environment variables.");
      return NextResponse.json(
        { success: false, error: "Algolia configuration keys are missing on the server." },
        { status: 500 }
      );
    }

    const adminClient = algoliasearch(appId, adminKey);
    const INDEX_NAME = "creators";

    if (action === "save") {
      if (!creator) {
        return NextResponse.json({ success: false, error: "Creator data is required for save action" }, { status: 400 });
      }

      console.log(`[ALGOLIA_SYNC] Syncing creator "${creator.name}" (@${creator.username}) to Algolia index...`);

      // CRITICAL: Strip base64 data URLs — they exceed Algolia's 10KB record size limit.
      // Also enforce HTTPS to prevent mixed-content warnings on the Discovery page.
      const safeImage = (img: string | null | undefined): string => {
        if (!img) return "";
        const s = img.trim();
        if (s.startsWith("data:")) return "";              // strip base64 — too large for Algolia
        if (s.startsWith("http://")) return s.replace("http://", "https://"); // force HTTPS
        if (s.startsWith("https://")) return s;           // keep valid CDN URLs
        return "";
      };

      // Format creator structure for Algolia search schema (requires objectID and discovery facets)
      const objectToSave = {
        id: creator.id,
        objectID: creator.id,
        name: creator.name || "",
        username: creator.username || "",
        bio: (creator.bio || "").slice(0, 500), // cap bio to keep record under 10KB
        // Use profile_image_url (original CDN URL) for Algolia — it's lightweight.
        // profile_image in Supabase is base64 (~10-30KB) which exceeds Algolia's 10KB limit.
        profile_image: safeImage(creator.profile_image_url || creator.profile_image),
        followers: creator.followers || 0,
        totalFollowers: creator.followers || 0,
        avg_reel_views: creator.avg_reel_views || "0",
        engagement_rate: creator.engagement_rate || 0,
        engagementRate: creator.engagement_rate || 0,
        collaboration_pricing: creator.collaboration_pricing || null,
        has_manager: !!creator.has_manager,
        verified: !!creator.verified,
        brand_safe: !!creator.brand_safe,
        location: creator.location || "India",
        tags: (creator.tags || []).slice(0, 20),
        categories: (creator.tags || []).slice(0, 20), // support both tags and categories naming
        category: creator.category || "General",
        email: creator.email || null,
        score: creator.score || 8.5, // Default score for new entries
        
        // Golden Rule Facet Filters — REQUIRED for creator to appear on Discover Page
        // These MUST match the attributesForFaceting in the Algolia index settings
        creator_status: "active",
        visibility: "public",
        profile_completed: true,
        verification_passed: true,
        is_deleted: false,

        // Platforms list mapping (used for platform facet filtering on Discover)
        platforms: [
          {
            name: "Instagram",
            handle: creator.username,
            followers: creator.followers || 0
          }
        ]
      };

      await adminClient.saveObjects({
        indexName: INDEX_NAME,
        objects: [objectToSave]
      });

      console.log(`[ALGOLIA_SYNC_SUCCESS] Creator "${creator.name}" successfully indexed.`);
      return NextResponse.json({ success: true, message: `Successfully indexed ${creator.name} in Algolia.` });
    } 
    
    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ success: false, error: "Creator ID is required for delete action" }, { status: 400 });
      }

      console.log(`[ALGOLIA_SYNC] Deleting creator ID: ${id} from Algolia index...`);

      await adminClient.deleteObject({
        indexName: INDEX_NAME,
        objectID: id
      });

      console.log(`[ALGOLIA_SYNC_SUCCESS] Creator ID: ${id} successfully removed from index.`);
      return NextResponse.json({ success: true, message: `Successfully removed ID: ${id} from Algolia.` });
    }

    return NextResponse.json({ success: false, error: `Unsupported sync action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[ALGOLIA_SYNC_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to synchronize creator record with Search Engine." },
      { status: 500 }
    );
  }
}
