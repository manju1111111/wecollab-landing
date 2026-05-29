import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: "Username is required." },
        { status: 400 }
      );
    }

    const cleanUsername = username.replace("@", "").trim();
    if (!cleanUsername) {
      return NextResponse.json(
        { success: false, error: "Invalid username format." },
        { status: 400 }
      );
    }

    const token = process.env.APIFY_TOKEN;
    if (!token) {
      console.error("[INSTAGRAM_FETCH_ERROR] APIFY_TOKEN is missing in environment variables.");
      return NextResponse.json(
        { success: false, error: "Apify API configuration error. Missing APIFY_TOKEN." },
        { status: 500 }
      );
    }

    console.log(`[INSTAGRAM_FETCH] Scraping profile: @${cleanUsername} using Apify Instagram Scraper...`);

    const runUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}`;

    const scraperInput = {
      resultsType: "details",
      directUrls: [`https://www.instagram.com/${cleanUsername}/`],
      resultsLimit: 1,
      addParentData: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

    const response = await fetch(runUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scraperInput),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[INSTAGRAM_FETCH_ERROR] Apify returned status ${response.status}:`, errorText);
      return NextResponse.json(
        { success: false, error: `Apify scraper failed with status ${response.status}.` },
        { status: response.status }
      );
    }

    const items = await response.json();

    if (!Array.isArray(items) || items.length === 0) {
      console.error("[INSTAGRAM_FETCH_ERROR] Apify dataset items are empty or malformed.");
      return NextResponse.json(
        { success: false, error: "Profile not found or scraper failed to extract data. Make sure the username is correct." },
        { status: 404 }
      );
    }

    const item = items[0];

    // Check for rate limit or scraping failure flags
    if (item.error || item.message?.includes("block") || item.message?.includes("rate limit")) {
      console.error("[INSTAGRAM_FETCH_ERROR] Scraper encountered blocks/limits:", item);
      return NextResponse.json(
        { success: false, error: "Instagram has rate limited or blocked the scraper temporarily. Please try again later." },
        { status: 429 }
      );
    }

    // Strict validation for public profiles only
    if (item.private === true || item.isPrivate === true) {
      console.warn(`[INSTAGRAM_FETCH] Attempted to scrape private profile: @${cleanUsername}`);
      return NextResponse.json(
        { success: false, error: "Private profile: WeCollab only supports importing public profiles." },
        { status: 400 }
      );
    }

    // Extract metrics and calculate averages
    const followers = item.followersCount || 0;
    const follows = item.followsCount || 0;
    const postsCount = item.postsCount || 0;

    let avgViews = 0;
    let engagementRate = 0;

    const posts = item.latestPosts || item.posts || [];
    if (posts.length > 0) {
      let totalLikes = 0;
      let totalComments = 0;
      let videoPostCount = 0;
      let totalVideoViews = 0;

      posts.forEach((p: any) => {
        totalLikes += p.likesCount || p.likes || 0;
        totalComments += p.commentsCount || p.comments || 0;

        const views = p.videoPlayCount || p.videoViewCount || p.playCount || p.views || 0;
        if (views > 0) {
          totalVideoViews += views;
          videoPostCount++;
        }
      });

      // Average views for videos
      avgViews = videoPostCount > 0 ? Math.round(totalVideoViews / videoPostCount) : 0;

      // Engagement Rate calculation based on latest posts
      const avgLikes = totalLikes / posts.length;
      const avgComments = totalComments / posts.length;

      if (followers > 0) {
        engagementRate = parseFloat((((avgLikes + avgComments) / followers) * 100).toFixed(2));
      }
    }

    // Attempt to parse location from biography or use default if missing
    let location = "Mumbai, India"; // Standard fallback/default if not found
    if (item.biography && typeof item.biography === "string") {
      const match = item.biography.match(/(Mumbai|Delhi|Bangalore|NYC|New York|London|Paris|Dubai|Singapore|Sydney)/i);
      if (match) {
        location = match[0] + (match[0].toLowerCase() === "nyc" || match[0].toLowerCase() === "new york" ? ", USA" : ", India");
      }
    }

    let base64ProfilePic = "";
    const imgUrl = item.profilePicUrlHD || item.profilePicUrl;
    if (imgUrl) {
      try {
        console.log(`[INSTAGRAM_FETCH] Fetching profile image for base64 conversion: ${imgUrl}`);
        const imgResponse = await fetch(imgUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
          }
        });
        if (imgResponse.ok) {
          const arrayBuffer = await imgResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
          base64ProfilePic = `data:${contentType};base64,${buffer.toString("base64")}`;
          console.log(`[INSTAGRAM_FETCH] Successfully converted profile image to Base64 (length: ${base64ProfilePic.length})`);
        } else {
          console.warn(`[INSTAGRAM_FETCH_WARN] Failed to download profile image. Status: ${imgResponse.status}`);
        }
      } catch (e) {
        console.warn("[INSTAGRAM_FETCH_WARN] Failed to convert profile image to base64:", e);
      }
    }

    console.log(`[INSTAGRAM_FETCH_SUCCESS] Successfully scraped @${cleanUsername}. Followers: ${followers}, ER: ${engagementRate}%, Avg Views: ${avgViews}`);

    return NextResponse.json({
      success: true,
      username: item.username || cleanUsername,
      fullName: item.fullName || item.username || cleanUsername,
      biography: item.biography || "",
      followersCount: followers,
      followsCount: follows,
      postsCount: postsCount,
      // profilePicUrl = original CDN URL (lightweight — stored in Supabase profile_image & Algolia)
      // This persists because the base64 conversion already proved the URL was accessible.
      profilePicUrl: item.profilePicUrlHD || item.profilePicUrl || "",
      // profilePicBase64 = base64 blob only for in-browser admin preview rendering
      // (Instagram CDN URLs work server-side but may have CORS issues in browser)
      profilePicBase64: base64ProfilePic || "",
      verified: !!item.verified,
      engagementRate: engagementRate,
      avgViews: avgViews,
      location: location,
    });
  } catch (error: any) {
    console.error("[INSTAGRAM_FETCH_CATCH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred during profile retrieval." },
      { status: 500 }
    );
  }
}
