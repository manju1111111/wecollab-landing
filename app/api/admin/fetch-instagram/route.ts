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

    const rapidApiKey = process.env.RAPIDAPI_KEY;
    console.log("RAPIDAPI_KEY inside API Route:", rapidApiKey ? "EXISTS" : "MISSING");
    if (!rapidApiKey) {
      console.error("[INSTAGRAM_FETCH_ERROR] RAPIDAPI_KEY is missing in environment variables.");
      return NextResponse.json(
        { success: false, error: "RapidAPI configuration error. Missing RAPIDAPI_KEY." },
        { status: 500 }
      );
    }

    console.log(`[INSTAGRAM_FETCH] Scraping profile: @${cleanUsername} using Instagram Looter 2...`);

    const response = await fetch(`https://instagram-looter2.p.rapidapi.com/profile?username=${encodeURIComponent(cleanUsername)}`, {
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": "instagram-looter2.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[INSTAGRAM_FETCH_ERROR] RapidAPI returned status ${response.status}:`, errorText);
      return NextResponse.json(
        { success: false, error: `Scraper API failed with status ${response.status}.` },
        { status: response.status }
      );
    }

    const item = await response.json();

    if (!item || item.status === false || !item.username) {
      console.error("[INSTAGRAM_FETCH_ERROR] Profile not found or empty response from API:", item);
      return NextResponse.json(
        { success: false, error: "Profile not found or scraper failed to extract data. Make sure the username is correct and public." },
        { status: 404 }
      );
    }

    // Strict validation for public profiles only
    if (item.is_private === true) {
      console.warn(`[INSTAGRAM_FETCH] Attempted to scrape private profile: @${cleanUsername}`);
      return NextResponse.json(
        { success: false, error: "Private profile: WeCollab only supports importing public profiles." },
        { status: 400 }
      );
    }

    // Extract metrics and calculate averages
    const followers = item.edge_followed_by?.count || 0;
    const follows = item.edge_follow?.count || 0;
    const postsCount = item.edge_owner_to_timeline_media?.count || 0;

    let avgViews = 0;
    let engagementRate = 0;

    const posts: any[] = item.edge_owner_to_timeline_media?.edges || [];
    const captionsList: string[] = [];

    if (posts.length > 0) {
      let totalLikes = 0;
      let totalComments = 0;
      let videoPostCount = 0;
      let totalVideoViews = 0;

      posts.forEach((p: any) => {
        const node = p.node || {};
        totalLikes += node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0;
        totalComments += node.edge_media_to_comment?.count || 0;

        const views = node.video_view_count || 0;
        if (node.is_video === true || views > 0) {
          totalVideoViews += views;
          videoPostCount++;
        }

        // Extract caption text
        const captionText = node.edge_media_to_caption?.edges?.[0]?.node?.text || "";
        if (captionText) {
          captionsList.push(captionText);
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
    const imgUrl = item.profile_pic_url_hd || item.profile_pic_url;
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
      fullName: item.full_name || item.username || cleanUsername,
      biography: item.biography || "",
      followersCount: followers,
      followsCount: follows,
      postsCount: postsCount,
      // profilePicUrl = original CDN URL (lightweight — stored in Supabase profile_image & Algolia)
      profilePicUrl: item.profile_pic_url_hd || item.profile_pic_url || "",
      // profilePicBase64 = base64 blob only for in-browser admin preview rendering
      profilePicBase64: base64ProfilePic || "",
      verified: !!item.is_verified,
      engagementRate: engagementRate,
      avgViews: avgViews,
      location: location,
      captions: captionsList,
    });
  } catch (error: any) {
    console.error("[INSTAGRAM_FETCH_CATCH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred during profile retrieval." },
      { status: 500 }
    );
  }
}
