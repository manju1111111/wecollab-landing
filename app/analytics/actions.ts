"use server";

import { createAdminClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreatorReport {
  name: string;
  username: string;
  platform: string;
  profile_url: string;
  profile_pic_url?: string;
  followers: number;
  following: number;
  posts: number;
  engagement_rate: number;
  category: string;
  bio: string;
  location: string;
  avg_likes: number;
  avg_comments: number;
  avg_views: number;
  posting_frequency: string;
  brand_safety_score: number;
  quality_score: number;
  estimated_rates: { story: string; reel: string };
  creator_score: number;
  recent_content: {
    thumbnails: string[];
    top_views: string;
    avg_reach: string;
    avg_saves: string;
    best_time: string;
  };
  niche: string;
  audience: string;
  audience_demographics: { female: string; male: string };
  data_source: "live" | "cached" | "estimated";
  last_fetched_at?: string;
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function cleanUsername(input: string): string {
  let clean = input.trim();
  clean = clean.replace(/https?:\/\/(www\.)?/, "");
  clean = clean.replace(/(instagram\.com|youtube\.com\/@?|linkedin\.com\/in\/|twitter\.com|x\.com)\/?/, "");
  clean = clean.split("/")[0].split("?")[0];
  clean = clean.replace(/^@/, "");
  return clean.toLowerCase();
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toLocaleString();
}

// ─── Real Score Formula (Phase 6) ─────────────────────────────────────────────

function calculateCreatorScore({
  engagement_rate,
  brand_safety_score,
  quality_score,
  followers,
  posting_frequency,
}: {
  engagement_rate: number;
  brand_safety_score: number;
  quality_score: number;
  followers: number;
  posting_frequency: string;
}): number {
  // Engagement rate score (35%): normalize against industry benchmarks
  // Good: >3%, Excellent: >5%, Viral: >8%
  const erScore = Math.min(100, (engagement_rate / 8) * 100);

  // Brand safety (20%)
  const safetyScore = brand_safety_score;

  // Audience quality (20%)
  const aqScore = quality_score;

  // Follower bracket score (10%): tiered by size
  let followerScore = 50;
  if (followers >= 10_000_000) followerScore = 100;
  else if (followers >= 1_000_000) followerScore = 85;
  else if (followers >= 500_000) followerScore = 75;
  else if (followers >= 100_000) followerScore = 65;
  else if (followers >= 10_000) followerScore = 55;

  // Posting consistency (15%): parse frequency string
  const freqMatch = posting_frequency.match(/[\d.]+/);
  const postsPerWeek = freqMatch ? parseFloat(freqMatch[0]) : 2;
  const consistencyScore = Math.min(100, (postsPerWeek / 7) * 100);

  const score =
    erScore * 0.35 +
    safetyScore * 0.20 +
    aqScore * 0.20 +
    followerScore * 0.10 +
    consistencyScore * 0.15;

  return Math.round(Math.min(99, Math.max(30, score)));
}

function getScoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Great";
  if (score >= 55) return "Good";
  return "Average";
}

function estimateRates(followers: number, platform: string): { story: string; reel: string } {
  // Indian market CPM-based rate estimation
  const baseStoryMin = Math.round((followers * 0.06) / 1000) * 1000;
  const baseStoryMax = Math.round((followers * 0.10) / 1000) * 1000;
  const baseReelMin = Math.round((followers * 0.20) / 1000) * 1000;
  const baseReelMax = Math.round((followers * 0.35) / 1000) * 1000;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  return {
    story: `${fmt(Math.max(1000, baseStoryMin))} - ${fmt(Math.max(2000, baseStoryMax))}`,
    reel: `${fmt(Math.max(3000, baseReelMin))} - ${fmt(Math.max(5000, baseReelMax))}`,
  };
}

// ─── Instagram Data via RapidAPI (Primary) ────────────────────────────────────
// Uses "Instagram Looter 2" on RapidAPI — free tier
// Host: instagram-looter2.p.rapidapi.com

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const RAPIDAPI_HOST = "instagram-looter2.p.rapidapi.com";

async function rapidApiGet(endpoint: string): Promise<any> {
  const res = await fetch(`https://${RAPIDAPI_HOST}${endpoint}`, {
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": RAPIDAPI_HOST,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RapidAPI ${endpoint} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchInstagramProfile(handle: string): Promise<Partial<CreatorReport> | null> {
  // If no RapidAPI key, return null so we fall through to estimated data
  if (!RAPIDAPI_KEY) {
    console.warn("[INSTAGRAM] No RAPIDAPI_KEY set — using estimated data");
    return null;
  }

  try {
    // Fetch profile and posts in a single call to /profile endpoint
    const profile = await rapidApiGet(`/profile?username=${encodeURIComponent(handle)}`);

    if (!profile || profile.status === false || !profile.username) {
      console.error("[INSTAGRAM] Profile fetch returned invalid status or empty username:", profile);
      return null;
    }

    const followers = profile.edge_followed_by?.count || 0;
    const following = profile.edge_follow?.count || 0;
    const totalPosts = profile.edge_owner_to_timeline_media?.count || 0;
    const posts: any[] = profile.edge_owner_to_timeline_media?.edges || [];

    console.log(`[INSTAGRAM] ✅ Profile: ${profile.full_name}, followers=${followers}, posts fetched=${posts.length}`);

    // ── Calculate REAL averages from actual post data ──────────────────────
    const getLikes = (p: any) => p.node?.edge_liked_by?.count || p.node?.edge_media_preview_like?.count || 0;
    const getComments = (p: any) => p.node?.edge_media_to_comment?.count || 0;
    const getViews = (p: any) => p.node?.video_view_count || 0;

    const postsWithLikes = posts.filter((p: any) => getLikes(p) > 0);
    const videoPosts = posts.filter((p: any) => p.node?.is_video === true || getViews(p) > 0);

    let avgLikes: number;
    let avgComments: number;
    let avgViews: number;

    if (postsWithLikes.length > 0) {
      avgLikes = Math.round(postsWithLikes.reduce((s: number, p: any) => s + getLikes(p), 0) / postsWithLikes.length);
      avgComments = Math.round(postsWithLikes.reduce((s: number, p: any) => s + getComments(p), 0) / postsWithLikes.length);
      avgViews = videoPosts.length > 0
        ? Math.round(videoPosts.reduce((s: number, p: any) => s + getViews(p), 0) / videoPosts.length)
        : Math.round(avgLikes * 6);
    } else {
      // Fallback estimate from follower count
      avgLikes = Math.round(followers * 0.03);
      avgComments = Math.round(avgLikes * 0.04);
      avgViews = Math.round(avgLikes * 8);
    }

    // Log first 3 posts for debugging
    posts.slice(0, 3).forEach((p: any, i: number) => {
      console.log(`  [POST ${i}] likes=${getLikes(p)} comments=${getComments(p)} views=${getViews(p)} type=${p.node?.__typename}`);
    });
    console.log(`  [COMPUTED] avgLikes=${avgLikes}, avgComments=${avgComments}, avgViews=${avgViews}`);

    // Top performing post
    const topPost = [...posts].sort((a: any, b: any) => getViews(b) - getViews(a))[0];
    const topViews = topPost ? getViews(topPost) : Math.round(avgViews * 1.5);

    // Thumbnails from real posts
    const thumbnails: string[] = posts
      .slice(0, 4)
      .map((p: any) => p.node?.thumbnail_src || p.node?.display_url || "")
      .filter(Boolean);

    const er = followers > 0
      ? parseFloat(((avgLikes + avgComments * 8) / followers * 100).toFixed(2))
      : 3.0;
    const brandSafety = 95;
    const qualityScore = Math.min(99, 80 + Math.round((er / 10) * 15));
    const rates = estimateRates(followers, "Instagram");
    const postsPerWeek = totalPosts > 0
      ? Math.min(14, Math.round((totalPosts / 52) * 10) / 10) + "/week"
      : "3/week";

    return {
      name: profile.full_name || handle,
      username: profile.username || handle,
      platform: "Instagram",
      profile_url: `https://instagram.com/${profile.username || handle}`,
      profile_pic_url: profile.profile_pic_url_hd || profile.profile_pic_url || undefined,
      followers,
      following,
      posts: totalPosts,
      engagement_rate: er,
      category: profile.category_name || profile.overall_category_name || "Creator",
      bio: profile.biography || "",
      location: profile.city_name || "India",
      avg_likes: avgLikes,
      avg_comments: avgComments,
      avg_views: avgViews,
      posting_frequency: postsPerWeek,
      brand_safety_score: brandSafety,
      quality_score: qualityScore,
      estimated_rates: rates,
      recent_content: {
        thumbnails,
        top_views: formatNumber(topViews),
        avg_reach: formatNumber(Math.round(avgViews * 0.85)),
        avg_saves: formatNumber(Math.round(avgLikes * 0.12)),
        best_time: "7PM - 9PM",
      },
      niche: profile.category_name || profile.overall_category_name || "Lifestyle",
      audience: "Urban India (18-30)",
      audience_demographics: { female: "62%", male: "38%" },
      data_source: "live",
      last_fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[INSTAGRAM_RAPIDAPI_ERROR]", err);
    return null;
  }
}

// ─── YouTube Data API v3 ───────────────────────────────────────────────────────

async function fetchYouTubeProfile(handle: string): Promise<Partial<CreatorReport> | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    // Try @handle lookup
    const searchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`YT API error: ${res.status}`);
    const data = await res.json();

    const channel = data.items?.[0];
    if (!channel) return null;

    const stats = channel.statistics;
    const snippet = channel.snippet;

    const subscribers = parseInt(stats.subscriberCount || "0");
    const totalViews = parseInt(stats.viewCount || "0");
    const videoCount = parseInt(stats.videoCount || "0");

    const avgViews = videoCount > 0 ? Math.round(totalViews / videoCount) : 0;
    const avgLikes = Math.round(avgViews * 0.04);
    const avgComments = Math.round(avgViews * 0.003);
    const er = subscribers > 0
      ? parseFloat(((avgLikes + avgComments * 8) / subscribers * 100).toFixed(2))
      : 2.5;

    // Fetch recent video thumbnails
    const channelId = channel.id;
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=4&order=date&type=video&key=${apiKey}`;
    const vRes = await fetch(videosUrl, { signal: AbortSignal.timeout(10000) });
    const vData = vRes.ok ? await vRes.json() : { items: [] };
    const thumbnails: string[] = (vData.items || [])
      .map((v: any) => v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || "")
      .filter(Boolean);

    const rates = estimateRates(subscribers, "YouTube");
    const brandSafety = 95;
    const qualityScore = Math.min(99, 80 + Math.round((er / 10) * 15));

    return {
      name: snippet.title,
      username: handle,
      platform: "YouTube",
      profile_url: `https://youtube.com/@${handle}`,
      profile_pic_url: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
      followers: subscribers,
      following: 0,
      posts: videoCount,
      engagement_rate: er,
      category: snippet.topic || "Creator",
      bio: snippet.description?.slice(0, 200) || "",
      location: snippet.country || "India",
      avg_likes: avgLikes,
      avg_comments: avgComments,
      avg_views: avgViews,
      posting_frequency: "2/week",
      brand_safety_score: brandSafety,
      quality_score: qualityScore,
      estimated_rates: rates,
      recent_content: {
        thumbnails,
        top_views: formatNumber(Math.round(avgViews * 2.5)),
        avg_reach: formatNumber(Math.round(avgViews * 0.8)),
        avg_saves: formatNumber(Math.round(avgLikes * 0.15)),
        best_time: "6PM - 9PM",
      },
      niche: "YouTube Creator",
      audience: "India (18-35)",
      audience_demographics: { female: "40%", male: "60%" },
      data_source: "live",
      last_fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[YOUTUBE_API_ERROR]", err);
    return null;
  }
}

// ─── Deterministic Fallback Generator ─────────────────────────────────────────

function generateMockupReport(platform: string, handle: string): CreatorReport {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) {
    hash = handle.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const followers = 50000 + (hash % 950000);
  const following = 150 + (hash % 1500);
  const posts = 80 + (hash % 2000);
  const er = parseFloat((2.0 + ((hash % 80) / 10)).toFixed(2));
  const avgLikes = Math.round(followers * (er / 100));
  const avgComments = Math.round(avgLikes * 0.035);
  const avgViews = Math.round(avgLikes * 9);
  const categories = ["Fashion", "Tech", "Lifestyle", "Gaming", "Fitness", "Travel", "Beauty", "Food"];
  const category = categories[hash % categories.length];
  const brandSafety = 92 + (hash % 8);
  const qualityScore = 82 + (hash % 15);
  const rates = estimateRates(followers, platform);

  const score = calculateCreatorScore({
    engagement_rate: er,
    brand_safety_score: brandSafety,
    quality_score: qualityScore,
    followers,
    posting_frequency: `${3 + (hash % 3)}/week`,
  });

  return {
    name: (handle.charAt(0).toUpperCase() + handle.slice(1)).replace(/[._-]/g, " "),
    username: handle,
    platform,
    profile_url: `https://${platform.toLowerCase() === "youtube" ? "youtube.com/@" : platform.toLowerCase() + ".com/"}${handle}`,
    profile_pic_url: undefined,
    followers,
    following,
    posts,
    engagement_rate: er,
    category,
    bio: `Content creator sharing ${category.toLowerCase()} content. Open for collaborations!`,
    location: "India",
    avg_likes: avgLikes,
    avg_comments: avgComments,
    avg_views: avgViews,
    posting_frequency: `${3 + (hash % 3)}/week`,
    brand_safety_score: brandSafety,
    quality_score: qualityScore,
    estimated_rates: rates,
    creator_score: score,
    recent_content: {
      thumbnails: [
        "/assets/reel_thumb_1.png",
        "/assets/reel_thumb_2.png",
        "/assets/reel_thumb_3.png",
        "/assets/reel_thumb_4.png",
      ],
      top_views: formatNumber(Math.round(avgViews * 2)),
      avg_reach: formatNumber(Math.round(avgViews * 0.85)),
      avg_saves: formatNumber(Math.round(avgLikes * 0.12)),
      best_time: "7PM - 9PM",
    },
    niche: `${category} & Lifestyle`,
    audience: "Urban India (18-30)",
    audience_demographics: {
      female: `${55 + (hash % 30)}%`,
      male: `${15 + (hash % 20)}%`,
    },
    data_source: "estimated",
  };
}

// ─── Rate Limiting (via search_logs) ──────────────────────────────────────────

async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const supabase = await createAdminClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("search_logs")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", oneHourAgo);
    return (count || 0) < 10; // 10 searches per hour per IP
  } catch {
    return true; // fail open
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function getCreatorAnalytics(
  platform: string,
  searchInput: string,
  ip?: string
): Promise<{ data?: CreatorReport; error?: string; limitReached?: boolean }> {
  try {
    const handle = cleanUsername(searchInput);
    if (!handle) {
      return { error: "Please enter a valid username or profile URL." };
    }

    const supabase = await createAdminClient();

    // ── Rate limit check ──
    if (ip) {
      const allowed = await checkRateLimit(ip);
      if (!allowed) {
        return {
          error: "You've reached the free search limit (10/hour). Sign up for unlimited access.",
          limitReached: true,
        };
      }
    }

    // ── Telemetry ──
    try {
      await supabase.from("search_logs").insert({
        query: handle,
        platform,
        ip_address: ip || null,
      });
    } catch (e) {
      console.warn("[SEARCH_LOG_FAIL]", e);
    }

    // ── Check DB cache (fresh if < 7 days old) ──
    const { data: cachedCreator } = await supabase
      .from("creators")
      .select("*")
      .eq("username", handle)
      .maybeSingle();

    if (cachedCreator) {
      const lastFetched = cachedCreator.last_fetched_at
        ? new Date(cachedCreator.last_fetched_at)
        : null;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const isFresh = lastFetched && lastFetched > sevenDaysAgo;

      if (isFresh) {
        // Return cached live/estimated data
        const score = calculateCreatorScore({
          engagement_rate: cachedCreator.engagement_rate || 3.0,
          brand_safety_score: cachedCreator.brand_safety_score || 92,
          quality_score: cachedCreator.quality_score || 85,
          followers: cachedCreator.followers || 0,
          posting_frequency: cachedCreator.posting_frequency || "3/week",
        });

        return {
          data: {
            name: cachedCreator.name,
            username: cachedCreator.username,
            platform,
            profile_url: cachedCreator.profile_url || `https://${platform.toLowerCase()}.com/${cachedCreator.username}`,
            profile_pic_url: cachedCreator.profile_pic_url || undefined,
            followers: cachedCreator.followers || 0,
            following: cachedCreator.following || 0,
            posts: cachedCreator.posts || cachedCreator.posts_count || 0,
            engagement_rate: cachedCreator.engagement_rate || 3.0,
            category: cachedCreator.category || "Creator",
            bio: cachedCreator.bio || "",
            location: cachedCreator.location || "India",
            avg_likes: cachedCreator.avg_likes || 0,
            avg_comments: cachedCreator.avg_comments || 0,
            avg_views: parseInt(cachedCreator.avg_views) || parseInt(cachedCreator.avg_reel_views) || 0,
            posting_frequency: cachedCreator.posting_frequency || "3/week",
            brand_safety_score: cachedCreator.brand_safety_score || 92,
            quality_score: cachedCreator.quality_score || 85,
            estimated_rates: cachedCreator.estimated_rates || estimateRates(cachedCreator.followers || 0, platform),
            creator_score: score,
            recent_content: cachedCreator.recent_content || {
              thumbnails: [],
              top_views: "—",
              avg_reach: "—",
              avg_saves: "—",
              best_time: "7PM - 9PM",
            },
            niche: cachedCreator.niche || cachedCreator.category || "Creator",
            audience: cachedCreator.audience || "India (18-35)",
            audience_demographics: cachedCreator.audience_demographics || { female: "55%", male: "45%" },
            data_source: "cached",
            last_fetched_at: cachedCreator.last_fetched_at,
          },
        };
      }
    }

    // ── Fetch fresh data from real APIs ──
    let freshData: Partial<CreatorReport> | null = null;

    if (platform === "Instagram") {
      freshData = await fetchInstagramProfile(handle);
    } else if (platform === "YouTube") {
      freshData = await fetchYouTubeProfile(handle);
    }
    // LinkedIn & X: no affordable API — use estimated

    // ── Build final report ──
    let report: CreatorReport;

    if (freshData) {
      // Complete the report with calculated score
      const score = calculateCreatorScore({
        engagement_rate: freshData.engagement_rate || 3.0,
        brand_safety_score: freshData.brand_safety_score || 92,
        quality_score: freshData.quality_score || 85,
        followers: freshData.followers || 0,
        posting_frequency: freshData.posting_frequency || "3/week",
      });

      report = {
        ...(generateMockupReport(platform, handle)), // base
        ...freshData, // override with real data
        creator_score: score,
      } as CreatorReport;
    } else {
      // Fallback to generated mockup
      report = generateMockupReport(platform, handle);
    }

    // ── Upsert to DB ──
    try {
      const upsertPayload = {
        name: report.name,
        username: handle,
        email: `${handle}@wecollab-leads.in`,
        platforms: [{ name: platform, handle: `@${handle}`, url: report.profile_url }],
        location: report.location,
        category: report.category,
        bio: report.bio,
        followers: report.followers,
        following: report.following,
        posts: report.posts,
        profile_url: report.profile_url,
        profile_pic_url: report.profile_pic_url || null,
        avg_reel_views: String(report.avg_views),
        avg_likes: report.avg_likes,
        avg_comments: report.avg_comments,
        engagement_rate: report.engagement_rate,
        posting_frequency: report.posting_frequency,
        brand_safety_score: report.brand_safety_score,
        quality_score: report.quality_score,
        estimated_rates: report.estimated_rates,
        creator_score: report.creator_score,
        recent_content: report.recent_content,
        niche: report.niche,
        audience: report.audience,
        audience_demographics: report.audience_demographics,
        verification_status: freshData ? "Verified" : "Ready for Review",
        visibility_status: false,
        last_fetched_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from("creators")
        .upsert(upsertPayload, { onConflict: "username" });

      if (upsertErr) {
        console.warn("[DB_UPSERT_WARN]", upsertErr.message);
      }
    } catch (dbErr) {
      console.warn("[DB_UPSERT_FAIL]", dbErr);
    }

    return { data: report };
  } catch (err: any) {
    console.error("[GET_ANALYTICS_CRITICAL]", err);
    return { error: err.message || "An error occurred fetching analytics." };
  }
}
