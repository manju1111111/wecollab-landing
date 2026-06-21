import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getScrapeProvider } from "@/lib/scraper-providers";
import { searchEngine } from "@/lib/search-client";
import { sendWebhookNotification } from "@/lib/webhook-notifier";

// This is triggered securely via Vercel Cron or a schedule trigger
export async function GET(request: Request) {
  // Authorization check (Optional but highly recommended for production)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[CRON] Unauthorized attempt to trigger sync creators.");
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log("[CRON] Starting daily creator sync...");

    // Create Supabase Admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all creators from the database
    const { data: creators, error: dbError } = await supabase
      .from("creators")
      .select("id, name, username, followers, engagement_rate, avg_reel_views, following, posts, platforms");

    if (dbError) {
      console.error("[CRON_ERROR] Failed to fetch creators from DB:", dbError);
      throw new Error(`DB Fetch failed: ${dbError.message}`);
    }

    if (!creators || creators.length === 0) {
      console.log("[CRON] No creators found in database to sync.");
      return NextResponse.json({ success: true, message: "No creators to sync." });
    }

    console.log(`[CRON] Found ${creators.length} creators to sync.`);

    let successCount = 0;
    let failCount = 0;
    const results: any[] = [];

    for (const creator of creators) {
      const username = creator.username;
      
      // Determine platform and corresponding provider dynamically
      let activeProvider = "rapidapi";
      let platformName = "Instagram";
      let profileUrl = `https://instagram.com/${username}`;

      if (Array.isArray(creator.platforms)) {
        const hasYoutube = creator.platforms.some(
          (p: any) => p.name?.toLowerCase() === "youtube"
        );
        if (hasYoutube) {
          activeProvider = "youtube";
          platformName = "YouTube";
          profileUrl = `https://youtube.com/@${username}`;
        }
      }

      console.log(`[CRON] Syncing creator: @${username} (ID: ${creator.id}) on platform: ${platformName}`);

      try {
        const scraper = getScrapeProvider(activeProvider);
        
        // Scrape latest profile metrics
        const scrapedData = await scraper.scrape(username);

        const newFollowers = scrapedData.followers || 0;
        const postsCount = scrapedData.posts_data ? scrapedData.posts_data.length : 0;
        
        let avgViews = 0;
        let engagementRate = 0;

        if (scrapedData.posts_data && scrapedData.posts_data.length > 0) {
          let totalLikes = 0;
          let totalComments = 0;
          let totalVideoViews = 0;
          let videoCount = 0;

          scrapedData.posts_data.forEach((p) => {
            totalLikes += p.likes || 0;
            totalComments += p.comments || 0;
            if (p.is_video && p.views) {
              totalVideoViews += p.views;
              videoCount++;
            }
          });

          avgViews = videoCount > 0 ? Math.round(totalVideoViews / videoCount) : 0;

          const avgLikes = totalLikes / scrapedData.posts_data.length;
          const avgComments = totalComments / scrapedData.posts_data.length;
          if (newFollowers > 0) {
            engagementRate = parseFloat((((avgLikes + avgComments) / newFollowers) * 100).toFixed(2));
          }
        }

        console.log(
          `[CRON] Scraped @${username}. Followers: ${creator.followers} -> ${newFollowers}, ER: ${creator.engagement_rate}% -> ${engagementRate}%, Views: ${creator.avg_reel_views} -> ${avgViews}`
        );

        // Update database record
        const { error: updateError } = await supabase
          .from("creators")
          .update({
            followers: newFollowers,
            following: scrapedData.following || 0,
            posts: postsCount || 0,
            engagement_rate: engagementRate,
            avg_reel_views: String(avgViews),
            last_fetched_at: new Date().toISOString(),
          })
          .eq("id", creator.id);

        if (updateError) {
          throw new Error(`DB update failed: ${updateError.message}`);
        }

        // Update Algolia Search index
        await searchEngine.updateObject(creator.id, {
          followers: newFollowers,
          totalFollowers: newFollowers,
          avg_reel_views: String(avgViews),
          avgReelViews: String(avgViews),
          engagement_rate: engagementRate,
          engagementRate: engagementRate,
          platforms: [
            {
              name: platformName,
              followers: newFollowers,
              url: profileUrl,
            },
          ],
        } as any);

        console.log(`[CRON] Successfully synchronized creator @${username}`);
        successCount++;
        results.push({ username, status: "success" });

      } catch (err: any) {
        console.error(`[CRON_ERROR] Failed to sync creator @${username}:`, err);
        failCount++;
        results.push({ username, status: "failed", error: err.message || "Unknown error" });
      }

      // Add a small delay (1 second) between requests to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`[CRON] Sync execution finished. Success: ${successCount}, Failures: ${failCount}`);

    // Dispatch Slack/Discord Webhook notification for free status reports
    const reportMsg = `Daily metrics synchronization completed.\n` +
      `• *Total Creators:* ${creators.length}\n` +
      `• *Successful Updates:* ${successCount}\n` +
      `• *Failures:* ${failCount}`;
    
    try {
      await sendWebhookNotification(reportMsg, failCount > 0);
    } catch (whError) {
      console.error("[CRON_WEBHOOK_NOTIFICATION_FAILED]", whError);
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: creators.length,
        successful: successCount,
        failed: failCount,
      },
      details: results,
    });

  } catch (error: any) {
    console.error("[CRON_CRITICAL_ERROR]", error);
    return new NextResponse("Internal Cron Error", { status: 500 });
  }
}
