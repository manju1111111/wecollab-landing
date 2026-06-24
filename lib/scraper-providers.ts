import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// Data Provider Interface & Abstraction Layer
export interface CreatorScrapedData {
  username: string;
  name: string;
  bio: string;
  followers: number;
  following: number;
  website: string;
  captions: string[];
  hashtags: string[];
  profilePicture: string;
  posting_patterns?: {
    frequency: string;
    avg_days_between_posts: number;
    posts_analyzed: number;
  };
  posts_data?: any[];
}

export interface ScrapeProvider {
  scrape(username: string): Promise<CreatorScrapedData>;
}

// Python Instaloader Provider
export class InstaloaderProvider implements ScrapeProvider {
  async scrape(username: string): Promise<CreatorScrapedData> {
    const scriptPath = path.join(process.cwd(), "scripts", "categorize-pipeline.py");
    const command = `python "${scriptPath}" "${username}"`;
    
    console.log(`[PIPELINE_EXTRACTION] Executing Instaloader scraper script on handle: @${username}`);
    
    // Inject system credentials securely
    const env = { 
      ...process.env,
      INSTAGRAM_USERNAME: process.env.INSTAGRAM_USERNAME || "",
      INSTAGRAM_PASSWORD: process.env.INSTAGRAM_PASSWORD || ""
    };
    
    const { stdout, stderr } = await execAsync(command, { env, timeout: 60000 }); // 60s timeout
    
    if (stderr && stderr.trim()) {
      console.warn("[Instaloader Scraper warnings/logs]:", stderr);
    }
    
    const result = JSON.parse(stdout);
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  }
}

// RapidAPI Instagram Looter Provider
export class RapidApiProvider implements ScrapeProvider {
  async scrape(username: string): Promise<CreatorScrapedData> {
    const cleanUsername = username.replace("@", "").trim();
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    
    if (!rapidApiKey) {
      throw new Error("RAPIDAPI_KEY is missing in environment variables.");
    }

    console.log(`[PIPELINE_EXTRACTION] Fetching profile: @${cleanUsername} using RapidAPI (Looter)...`);

    const response = await fetch(`https://instagram-looter2.p.rapidapi.com/profile?username=${encodeURIComponent(cleanUsername)}`, {
      headers: {
        "x-rapidapi-key": rapidApiKey,
        "x-rapidapi-host": "instagram-looter2.p.rapidapi.com",
      },
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      throw new Error(`Scraper API failed with status ${response.status}.`);
    }

    const item = await response.json();

    if (!item || item.status === false || !item.username) {
      throw new Error("Profile not found or scraper returned empty response.");
    }

    if (item.is_private === true) {
      throw new Error("Private profile: WeCollab only supports public profiles.");
    }

    const followers = item.edge_followed_by?.count || 0;
    const follows = item.edge_follow?.count || 0;
    const postsCount = item.edge_owner_to_timeline_media?.count || 0;

    const posts: any[] = item.edge_owner_to_timeline_media?.edges || [];
    const captions: string[] = [];
    const hashtagsSet = new Set<string>();
    const postsData: any[] = [];

    posts.forEach((p: any) => {
      const node = p.node || {};
      const captionText = node.edge_media_to_caption?.edges?.[0]?.node?.text || "";
      if (captionText) {
        captions.push(captionText);
        // Extract hashtags from caption
        const tags = captionText.match(/#\w+/g);
        if (tags) {
          tags.forEach((t: string) => hashtagsSet.add(t.replace("#", "")));
        }
      }

      postsData.push({
        post_id: node.id || "",
        shortcode: node.shortcode || "",
        caption: captionText,
        date: node.taken_at_timestamp ? new Date(node.taken_at_timestamp * 1000).toISOString() : null,
        likes: node.edge_liked_by?.count || node.edge_media_preview_like?.count || 0,
        comments: node.edge_media_to_comment?.count || 0,
        is_video: !!node.is_video,
        views: node.video_view_count || 0,
        url: node.shortcode ? `https://www.instagram.com/p/${node.shortcode}/` : ""
      });
    });

    // Determine posting patterns frequency
    let frequency = "Weekly";
    if (postsData.length >= 2) {
      const dates = postsData.map(p => new Date(p.date).getTime()).filter(t => !isNaN(t));
      if (dates.length >= 2) {
        dates.sort((a, b) => b - a); // descending
        const diffs = [];
        for (let i = 0; i < dates.length - 1; i++) {
          const diffDays = Math.abs(dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
          diffs.push(diffDays);
        }
        const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        if (avgDiff <= 1.5) frequency = "Daily or near-daily";
        else if (avgDiff <= 4) frequency = "Multiple times a week";
        else if (avgDiff <= 8) frequency = "Weekly";
        else frequency = "Irregular";
      }
    }

    return {
      username: item.username,
      name: item.full_name || item.username,
      bio: item.biography || "",
      followers: followers,
      following: follows,
      website: item.external_url || "",
      captions: captions,
      hashtags: Array.from(hashtagsSet),
      profilePicture: item.profile_pic_url_hd || item.profile_pic_url || "",
      posting_patterns: {
        frequency: frequency,
        avg_days_between_posts: 0,
        posts_analyzed: postsData.length
      },
      posts_data: postsData
    };
  }
}

// YouTube Data API Provider
export class YouTubeProvider implements ScrapeProvider {
  async scrape(username: string): Promise<CreatorScrapedData> {
    const cleanUsername = username.replace("@", "").trim();
    const apiKey = process.env.YOUTUBE_API_KEY;
    
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY is missing in environment variables.");
    }

    console.log(`[PIPELINE_EXTRACTION] Fetching YouTube profile for @${cleanUsername}...`);
    
    const searchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(cleanUsername)}&key=${apiKey}`;
    const response = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
    
    if (!response.ok) {
      throw new Error(`YouTube API failed with status ${response.status}`);
    }

    const data = await response.json();
    const channel = data.items?.[0];

    if (!channel) {
      throw new Error(`YouTube channel not found for handle: @${cleanUsername}`);
    }

    const stats = channel.statistics;
    const snippet = channel.snippet;

    const subscribers = parseInt(stats.subscriberCount || "0");
    const totalViews = parseInt(stats.viewCount || "0");
    const videoCount = parseInt(stats.videoCount || "0");

    // Perform averages calculations
    const avgViews = videoCount > 0 ? Math.round(totalViews / videoCount) : 0;
    const avgLikes = Math.round(avgViews * 0.04);
    const avgComments = Math.round(avgViews * 0.003);

    // Prepare simulated post details to conform with standard calculation logic
    const postsData = [
      {
        date: new Date().toISOString(),
        likes: avgLikes,
        comments: avgComments,
        is_video: true,
        views: avgViews
      }
    ];

    return {
      username: cleanUsername,
      name: snippet.title || cleanUsername,
      bio: snippet.description || "",
      followers: subscribers,
      following: 0,
      website: `https://youtube.com/@${cleanUsername}`,
      captions: [],
      hashtags: [],
      profilePicture: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
      posting_patterns: {
        frequency: "Weekly",
        avg_days_between_posts: 0,
        posts_analyzed: videoCount
      },
      posts_data: postsData
    };
  }
}

// Provider Factory
export function getScrapeProvider(providerName = "rapidapi"): ScrapeProvider {
  if (providerName === "instaloader") {
    return new InstaloaderProvider();
  }
  if (providerName === "rapidapi") {
    return new RapidApiProvider();
  }
  if (providerName === "youtube") {
    return new YouTubeProvider();
  }
  throw new Error(`Unsupported provider: ${providerName}`);
}
