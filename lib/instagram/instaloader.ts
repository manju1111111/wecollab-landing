import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { calculateCreatorMetrics, type InstagramPost, type CalculatedMetrics } from "./metrics-engine";
import { getScrapeProvider } from "../scraper-providers";
import { classifyCreatorFilters } from "./classifier";

const execAsync = promisify(exec);

export interface InstagramProfileData {
  username: string;
  full_name: string;
  biography: string;
  followers: number;
  following: number;
  posts_count: number;
  profile_pic_url: string;
  is_verified: boolean;
  external_url: string;
  tags?: string[];
  category?: string;
  filters?: any[];
}

export interface InstagramSyncResult {
  profile: InstagramProfileData;
  posts: InstagramPost[];
  metrics: CalculatedMetrics;
  lastSyncTimestamp: string;
  source: "supabase" | "fallback_json";
}

// -------------------------------------------------------------
// REQUEST QUEUEING (Sequential Processing to Prevent Blocks)
// -------------------------------------------------------------
class ScraperQueue {
  private queue: { task: () => Promise<any>; resolve: (value: any) => void; reject: (reason: any) => void }[] = [];
  private running = false;

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.running || this.queue.length === 0) return;
    this.running = true;

    const item = this.queue.shift();
    if (item) {
      try {
        const result = await item.task();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      } finally {
        // Add 3 seconds cooling delay to protect IP/accounts from consecutive scans
        await new Promise(resolve => setTimeout(resolve, 3000));
        this.running = false;
        this.processNext();
      }
    }
  }
}

const scraperQueue = new ScraperQueue();

// -------------------------------------------------------------
// DUAL-WRITE DATABASE FALLBACK FUNCTIONS
// -------------------------------------------------------------
const fallbackFilePath = path.join(process.cwd(), 'data/fallback-db.json');

function initFallbackDb() {
  if (!fs.existsSync(fallbackFilePath)) {
    const dir = path.dirname(fallbackFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      fallbackFilePath,
      JSON.stringify({ 
        instagram_profiles: [],
        instagram_posts: [],
        creator_profiles: [],
        creator_posts: [],
        creator_metrics: [],
        creator_ai_scores: [],
        creator_sync_logs: [],
        creator_metrics_history: []
      }, null, 2),
      'utf8'
    );
  }
}

function readFallbackDb() {
  initFallbackDb();
  try {
    const content = fs.readFileSync(fallbackFilePath, 'utf8');
    const parsed = JSON.parse(content);
    parsed.instagram_profiles = parsed.instagram_profiles || [];
    parsed.instagram_posts = parsed.instagram_posts || [];
    parsed.creator_profiles = parsed.creator_profiles || [];
    parsed.creator_posts = parsed.creator_posts || [];
    parsed.creator_metrics = parsed.creator_metrics || [];
    parsed.creator_ai_scores = parsed.creator_ai_scores || [];
    parsed.creator_sync_logs = parsed.creator_sync_logs || [];
    parsed.creator_metrics_history = parsed.creator_metrics_history || [];
    return parsed;
  } catch (e) {
    return {
      instagram_profiles: [],
      instagram_posts: [],
      creator_profiles: [],
      creator_posts: [],
      creator_metrics: [],
      creator_ai_scores: [],
      creator_sync_logs: [],
      creator_metrics_history: []
    };
  }
}

function writeFallbackDb(data: any) {
  try {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Failed to write to fallback DB:", e);
  }
}

// -------------------------------------------------------------
// INSTAGRAM SCRAPER SERVICE
// -------------------------------------------------------------
export class InstaloaderService {
  /**
   * Internal execution wrapper for Python scraper with retries and env variables
   */
  private async executeScraper(action: "profile" | "posts" | "both", username: string): Promise<any> {
    const cleanUsername = username.replace("@", "").trim();
    const scriptPath = path.join(process.cwd(), "scripts", "instaloader_sync.py");
    const command = `python "${scriptPath}" "${action}" "${cleanUsername}"`;
    
    const env = {
      ...process.env,
      INSTAGRAM_USERNAME: process.env.INSTAGRAM_USERNAME || "",
      INSTAGRAM_PASSWORD: process.env.INSTAGRAM_PASSWORD || ""
    };

    let lastError: any = null;
    let delay = 5000; // start with 5s delay on rate limit retry

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[INSTAGRAM_SERVICE] Running command (Attempt ${attempt}/3): ${command}`);
        const { stdout, stderr } = await execAsync(command, { env, timeout: 120000 }); // 2 min timeout
        
        if (stderr && stderr.trim()) {
          console.warn("[instaloader python logs]:", stderr);
        }

        const result = JSON.parse(stdout);
        if (result.error) {
          if (result.code === "RATE_LIMIT" || result.code === "CONNECTION_ERROR") {
            throw new Error(`Instagram rate limit or connection block: ${result.error}`);
          }
          // Other logical errors (e.g., PROFILE_NOT_FOUND, PRIVATE_ACCOUNT) should fail immediately
          return result;
        }

        return result;
      } catch (e: any) {
        lastError = e;
        console.warn(`[INSTAGRAM_SERVICE] Execution attempt ${attempt} failed: ${e.message}`);
        
        if (attempt < 3) {
          console.log(`[INSTAGRAM_SERVICE] Retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // exponential backoff
        }
      }
    }

    throw lastError || new Error("Failed to execute Instaloader scraper after 3 attempts.");
  }

  /**
   * Fetch Instagram Profile Details
   */
  async fetchProfile(username: string): Promise<InstagramProfileData> {
    return scraperQueue.enqueue(async () => {
      const data = await this.executeScraper("profile", username);
      if (data.error) {
        throw new Error(data.error);
      }
      return data.profile;
    });
  }

  /**
   * Fetch latest 50 posts of Instagram Profile
   */
  async fetchPosts(username: string): Promise<InstagramPost[]> {
    return scraperQueue.enqueue(async () => {
      const data = await this.executeScraper("posts", username);
      if (data.error) {
        throw new Error(data.error);
      }
      return data.posts;
    });
  }

  /**
   * Internal helper: scrape via RapidAPI and normalize output into the same
   * shape that the rest of analyzeProfile expects (matching Instaloader output format).
   */
  private async _scrapeViaRapidAPI(cleanUsername: string): Promise<{ profile: InstagramProfileData; posts: InstagramPost[] }> {
    const rapidApi = getScrapeProvider("rapidapi");
    const scraped = await rapidApi.scrape(cleanUsername);

    return {
      profile: {
        username: scraped.username,
        full_name: scraped.name,
        biography: scraped.bio,
        followers: scraped.followers,
        following: scraped.following,
        posts_count: scraped.posts_data?.length || 0,
        profile_pic_url: scraped.profilePicture,
        is_verified: false,
        external_url: scraped.website,
      },
      posts: (scraped.posts_data || []).map((p: any, idx: number) => ({
        post_id: p.post_id || `rapidapi-${idx}-${Date.now()}`,
        shortcode: p.shortcode || `rapidapi-${idx}`,
        caption: p.caption || "",
        likes: p.likes || 0,
        comments: p.comments || 0,
        views: p.views || 0,
        timestamp: p.date || new Date().toISOString(),
        is_video: !!p.is_video,
        url: p.url || (p.shortcode ? `https://www.instagram.com/p/${p.shortcode}/` : ""),
      })),
    };
  }


  /**
   * Performs full analysis: Scrapes profile & posts, runs Metrics Engine, saves results.
   *
   * ARCHITECTURE NOTE: Python/Instaloader is NOT available on Vercel serverless.
   * This method uses the getScrapeProvider() abstraction (RapidAPI by default) which
   * is the exact same path used by the creator enrichment pipeline. The Python subprocess
   * is only viable in local dev environments with Python installed.
   */

  async analyzeProfile(username: string): Promise<InstagramSyncResult> {
    const startTime = Date.now();
    const cleanUsername = username.replace("@", "").trim();

    // Determine provider: use Instaloader only in local dev when INSTAGRAM_USERNAME is set
    // AND we are not running on Vercel (no `VERCEL` env var). Otherwise always use RapidAPI.
    const isVercel = !!process.env.VERCEL;
    const hasInstaloaderCreds = !!(process.env.INSTAGRAM_USERNAME && process.env.INSTAGRAM_PASSWORD);
    const useInstaloader = !isVercel && hasInstaloaderCreds;

    let data;

    if (useInstaloader) {
      // Local dev path: attempt Python subprocess, fall back to RapidAPI on failure
      try {
        data = await scraperQueue.enqueue(async () => {
          const result = await this.executeScraper("both", cleanUsername);
          if (result.error) {
            throw new Error(result.error);
          }
          return result;
        });
        console.log(`[INSTAGRAM_SERVICE] Instaloader sync succeeded for @${cleanUsername}`);
      } catch (scraperErr: any) {
        console.warn(`[INSTAGRAM_SERVICE] Instaloader failed (${scraperErr.message}). Falling back to RapidAPI...`);
        data = await this._scrapeViaRapidAPI(cleanUsername);
      }
    } else {
      // Production / Vercel path: use RapidAPI directly — no Python dependency
      console.log(`[INSTAGRAM_SERVICE] Using RapidAPI provider for @${cleanUsername} (Vercel=${isVercel})`);
      data = await this._scrapeViaRapidAPI(cleanUsername);
    }

    const profile: InstagramProfileData & { tags?: string[]; category?: string; filters?: any[] } = data.profile;
    const posts: InstagramPost[] = data.posts || [];
    const metrics: CalculatedMetrics = calculateCreatorMetrics(posts, profile.followers, profile.following);
    
    // Auto-select filters using the shared AI engine
    try {
      console.log(`[INSTAGRAM_SERVICE] Starting AI classification check for @${profile.username}...`);
      console.log(`[INSTAGRAM_SERVICE] GEMINI_API_KEY present: ${!!process.env.GEMINI_API_KEY}`);
      if (process.env.GEMINI_API_KEY) {
        const captions = posts.map(p => p.caption).filter(Boolean);
        console.log(`[INSTAGRAM_SERVICE] Calling classifyCreatorFilters for @${profile.username} with ${captions.length} captions...`);
        const classification = await classifyCreatorFilters(profile.username, profile.biography || "", captions);
        profile.tags = classification.tags;
        profile.category = classification.category;
        profile.filters = classification.filters;
        console.log(`[INSTAGRAM_SERVICE] Classification completed successfully for @${profile.username}!`);
      } else {
        console.warn(`[INSTAGRAM_SERVICE] GEMINI_API_KEY is not defined - skipping classification.`);
      }
    } catch (e: any) {
      console.error(`[INSTAGRAM_SERVICE] AI classification error for @${profile.username}:`, {
        message: e.message,
        stack: e.stack,
        error: e
      });
    }

    const lastSyncTimestamp = new Date().toISOString();

    const syncResult: InstagramSyncResult = {
      profile,
      posts,
      metrics,
      lastSyncTimestamp,
      source: "supabase"
    };

    // -------------------------------------------------------------
    // DUAL-WRITE STRATEGY (Supabase or JSON Fallback)
    // -------------------------------------------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    try {
      console.log(`[INSTAGRAM_SERVICE] Writing synced data for @${cleanUsername} to Supabase...`);
      
      // 1. Save Profile (to both old & new tables for full compatibility)
      const { error: profileErr } = await supabase
        .from("creator_profiles")
        .upsert({
          username: profile.username,
          full_name: profile.full_name,
          biography: profile.biography,
          followers: profile.followers,
          following: profile.following,
          posts_count: profile.posts_count,
          profile_pic_url: profile.profile_pic_url,
          is_verified: profile.is_verified,
          external_url: profile.external_url,
          last_sync_at: lastSyncTimestamp,
          raw_data: profile
        }, { onConflict: "username" });

      if (profileErr) throw profileErr;

      // Backward compatible profile table write (don't fail sync if this secondary write fails)
      try {
        await supabase
          .from("instagram_profiles")
          .upsert({
            username: profile.username,
            full_name: profile.full_name,
            biography: profile.biography,
            followers: profile.followers,
            following: profile.following,
            posts_count: profile.posts_count,
            profile_pic_url: profile.profile_pic_url,
            is_verified: profile.is_verified,
            external_url: profile.external_url,
            last_sync_at: lastSyncTimestamp,
            raw_data: profile
          }, { onConflict: "username" });
      } catch (e) {
        console.warn("[INSTAGRAM_SERVICE] Failed to update legacy instagram_profiles table", e);
      }

      // 2. Save Posts
      if (posts.length > 0) {
        // Clear previous posts to avoid orphaned or outdated items
        await supabase.from("creator_posts").delete().eq("username", profile.username);
        try {
          await supabase.from("instagram_posts").delete().eq("username", profile.username);
        } catch {}

        const postsPayload = posts.map(p => {
          const hashtags = p.caption.match(/#[a-zA-Z0-9_\u00C0-\u00FF]+/g) || [];
          const post_type = p.is_video ? "reel" : "image";
          return {
            username: profile.username,
            post_id: String(p.post_id),
            shortcode: p.shortcode,
            caption: p.caption,
            likes: p.likes,
            comments: p.comments,
            views: p.views,
            timestamp: p.timestamp,
            is_video: p.is_video,
            post_type,
            hashtags,
            url: p.url
          };
        });

        const { error: postsErr } = await supabase
          .from("creator_posts")
          .insert(postsPayload);

        if (postsErr) {
          console.warn("[INSTAGRAM_SERVICE] Failed to save posts to creator_posts:", postsErr.message);
        }

        // Backward compatible posts insert
        try {
          const legacyPosts = posts.map(p => ({
            username: profile.username,
            post_id: String(p.post_id),
            shortcode: p.shortcode,
            caption: p.caption,
            likes: p.likes,
            comments: p.comments,
            views: p.views,
            timestamp: p.timestamp,
            is_video: p.is_video,
            url: p.url
          }));
          await supabase.from("instagram_posts").insert(legacyPosts);
        } catch {}
      }

      // 3. Save Calculated Metrics
      const { error: metricsErr } = await supabase
        .from("creator_metrics")
        .upsert({
          username: profile.username,
          average_likes: metrics.average_likes,
          average_comments: metrics.average_comments,
          average_views: metrics.average_views,
          engagement_rate: metrics.engagement_rate,
          engagement_by_views: metrics.engagement_by_views,
          comment_rate: metrics.comment_rate,
          like_rate: metrics.like_rate,
          view_follower_ratio: metrics.view_follower_ratio,
          reach_efficiency: metrics.reach_efficiency,
          reach_category: metrics.reach_category,
          avg_gap_days: metrics.avg_gap_days,
          posts_per_week: metrics.posts_per_week,
          consistency_score: metrics.consistency_score,
          best_performing_post_id: metrics.best_performing_post_id,
          worst_performing_post_id: metrics.worst_performing_post_id,
          median_views: metrics.median_views,
          median_likes: metrics.median_likes,
          median_comments: metrics.median_comments,
          viral_threshold: metrics.viral_threshold,
          viral_post_count: metrics.viral_post_count,
          viral_hit_rate: metrics.viral_hit_rate,
          virality_score: metrics.virality_score,
          comment_like_ratio: metrics.comment_like_ratio,
          authenticity_score: metrics.authenticity_score,
          bot_risk_indicators: metrics.bot_risk_indicators,
          follower_following_ratio: metrics.follower_following_ratio,
          account_activity_score: metrics.account_activity_score,
          last_10_posts_avg_views: metrics.last_10_posts_avg_views,
          previous_10_posts_avg_views: metrics.previous_10_posts_avg_views,
          momentum: metrics.momentum,
          momentum_score: metrics.momentum_score,
          most_used_hashtags: metrics.most_used_hashtags,
          avg_caption_length: metrics.avg_caption_length,
          hashtag_usage_rate: metrics.hashtag_usage_rate,
          content_type_distribution: metrics.content_type_distribution,
          // New expansion columns
          avg_reel_likes: metrics.avg_reel_likes,
          avg_reel_comments: metrics.avg_reel_comments,
          avg_reel_views: metrics.avg_reel_views,
          avg_post_likes: metrics.avg_post_likes,
          avg_post_comments: metrics.avg_post_comments,
          reel_engagement_rate: metrics.reel_engagement_rate,
          post_engagement_rate: metrics.post_engagement_rate,
          image_engagement_rate: metrics.image_engagement_rate,
          estimated_reach: metrics.estimated_reach,
          avg_reach_multiple: metrics.avg_reach_multiple,
          recent_performance_score: metrics.recent_performance_score,
          growth_trend: metrics.growth_trend,
          best_post_views: metrics.best_post_views,
          worst_post_views: metrics.worst_post_views,
          creator_value_score: metrics.creator_value_score,
          roi_potential_score: metrics.roi_potential_score,
          estimated_reel_reach: metrics.estimated_reel_reach,
          estimated_story_reach: metrics.estimated_story_reach,
          estimated_campaign_reach: metrics.estimated_campaign_reach,
          suggested_reel_price: metrics.suggested_reel_price,
          suggested_story_price: metrics.suggested_story_price,
          suggested_campaign_price: metrics.suggested_campaign_price,
          last_calculated_at: lastSyncTimestamp,
          raw_metrics: metrics
        }, { onConflict: "username" });

      if (metricsErr) throw metricsErr;

      // 4. Save AI Scores
      const { error: aiScoresErr } = await supabase
        .from("creator_ai_scores")
        .upsert({
          username: profile.username,
          creator_quality_score: metrics.creator_quality_score,
          reliability_score: metrics.reliability_score,
          audience_trust_score: metrics.audience_trust_score,
          influence_score: metrics.influence_score,
          discovery_ranking_score: metrics.discovery_ranking_score,
          updated_at: lastSyncTimestamp
        }, { onConflict: "username" });

      if (aiScoresErr) {
        console.warn("[INSTAGRAM_SERVICE] Failed to save AI scores to Supabase:", aiScoresErr.message);
      }

      // 4.5 Save to creator_scores
      try {
        await supabase
          .from("creator_scores")
          .upsert({
            username: profile.username,
            creator_quality_score: metrics.creator_quality_score,
            reliability_score: metrics.reliability_score,
            audience_trust_score: metrics.audience_trust_score,
            influence_score: metrics.influence_score,
            discovery_ranking_score: metrics.discovery_ranking_score,
            discovery_rank: Math.round(metrics.discovery_ranking_score),
            authenticity_score: metrics.authenticity_score,
            authenticity_score_num: metrics.authenticity_score_num,
            virality_score: metrics.virality_score,
            updated_at: lastSyncTimestamp
          }, { onConflict: "username" });
      } catch (err: any) {
        console.warn("[INSTAGRAM_SERVICE] Failed to update creator_scores table:", err.message);
      }

      // 5. Save Metrics History Snapshot
      try {
        await supabase
          .from("creator_metrics_history")
          .insert({
            username: profile.username,
            followers: profile.followers,
            engagement_rate: metrics.engagement_rate,
            average_views: metrics.average_views,
            creator_quality_score: metrics.creator_quality_score,
            recorded_at: lastSyncTimestamp,
            raw_metrics: metrics
          });
      } catch (histErr: any) {
        console.warn("[INSTAGRAM_SERVICE] Failed to write historical snapshot to Supabase:", histErr.message);
      }

      // 6. Save Sync Log
      const durationMs = Date.now() - startTime;
      await supabase
        .from("creator_sync_logs")
        .insert({
          username: profile.username,
          status: "success",
          steps_completed: ["fetch_profile", "fetch_posts", "run_metrics_engine", "calculate_ai_scores", "store_data"],
          duration_ms: durationMs
        });
      
      console.log(`[INSTAGRAM_SERVICE] Supabase write successful for @${cleanUsername}!`);

    } catch (e: any) {
      console.warn(`[INSTAGRAM_SERVICE] Supabase write failed (${e.message}). Falling back to local JSON database...`);
      
      // FALLBACK DB WRITE
      const db = readFallbackDb();
      
      // Update legacy profile
      db.instagram_profiles = db.instagram_profiles.filter((p: any) => p.username !== profile.username);
      db.instagram_profiles.push({
        username: profile.username,
        full_name: profile.full_name,
        biography: profile.biography,
        followers: profile.followers,
        following: profile.following,
        posts_count: profile.posts_count,
        profile_pic_url: profile.profile_pic_url,
        is_verified: profile.is_verified,
        external_url: profile.external_url,
        last_sync_at: lastSyncTimestamp,
        raw_data: profile
      });

      // Update creator profile
      db.creator_profiles = db.creator_profiles.filter((p: any) => p.username !== profile.username);
      db.creator_profiles.push({
        username: profile.username,
        full_name: profile.full_name,
        biography: profile.biography,
        followers: profile.followers,
        following: profile.following,
        posts_count: profile.posts_count,
        profile_pic_url: profile.profile_pic_url,
        is_verified: profile.is_verified,
        external_url: profile.external_url,
        last_sync_at: lastSyncTimestamp,
        raw_data: profile
      });

      // Update legacy posts
      db.instagram_posts = db.instagram_posts.filter((p: any) => p.username !== profile.username);
      posts.forEach(p => {
        db.instagram_posts.push({
          username: profile.username,
          post_id: String(p.post_id),
          shortcode: p.shortcode,
          caption: p.caption,
          likes: p.likes,
          comments: p.comments,
          views: p.views,
          timestamp: p.timestamp,
          is_video: p.is_video,
          url: p.url,
          created_at: lastSyncTimestamp
        });
      });

      // Update creator posts
      db.creator_posts = db.creator_posts.filter((p: any) => p.username !== profile.username);
      posts.forEach(p => {
        const hashtags = p.caption.match(/#[a-zA-Z0-9_\u00C0-\u00FF]+/g) || [];
        const post_type = p.is_video ? "reel" : "image";
        db.creator_posts.push({
          username: profile.username,
          post_id: String(p.post_id),
          shortcode: p.shortcode,
          caption: p.caption,
          likes: p.likes,
          comments: p.comments,
          views: p.views,
          timestamp: p.timestamp,
          is_video: p.is_video,
          post_type,
          hashtags,
          url: p.url,
          created_at: lastSyncTimestamp
        });
      });

      // Update metrics
      db.creator_metrics = db.creator_metrics.filter((m: any) => m.username !== profile.username);
      db.creator_metrics.push({
        username: profile.username,
        average_likes: metrics.average_likes,
        average_comments: metrics.average_comments,
        average_views: metrics.average_views,
        engagement_rate: metrics.engagement_rate,
        engagement_by_views: metrics.engagement_by_views,
        comment_rate: metrics.comment_rate,
        like_rate: metrics.like_rate,
        view_follower_ratio: metrics.view_follower_ratio,
        reach_efficiency: metrics.reach_efficiency,
        reach_category: metrics.reach_category,
        avg_gap_days: metrics.avg_gap_days,
        posts_per_week: metrics.posts_per_week,
        consistency_score: metrics.consistency_score,
        best_performing_post_id: metrics.best_performing_post_id,
        worst_performing_post_id: metrics.worst_performing_post_id,
        median_views: metrics.median_views,
        median_likes: metrics.median_likes,
        median_comments: metrics.median_comments,
        viral_threshold: metrics.viral_threshold,
        viral_post_count: metrics.viral_post_count,
        viral_hit_rate: metrics.viral_hit_rate,
        virality_score: metrics.virality_score,
        comment_like_ratio: metrics.comment_like_ratio,
        authenticity_score: metrics.authenticity_score,
        bot_risk_indicators: metrics.bot_risk_indicators,
        follower_following_ratio: metrics.follower_following_ratio,
        account_activity_score: metrics.account_activity_score,
        last_10_posts_avg_views: metrics.last_10_posts_avg_views,
        previous_10_posts_avg_views: metrics.previous_10_posts_avg_views,
        momentum: metrics.momentum,
        momentum_score: metrics.momentum_score,
        most_used_hashtags: metrics.most_used_hashtags,
        avg_caption_length: metrics.avg_caption_length,
        hashtag_usage_rate: metrics.hashtag_usage_rate,
        content_type_distribution: metrics.content_type_distribution,
        // New expansion columns
        avg_reel_likes: metrics.avg_reel_likes,
        avg_reel_comments: metrics.avg_reel_comments,
        avg_reel_views: metrics.avg_reel_views,
        avg_post_likes: metrics.avg_post_likes,
        avg_post_comments: metrics.avg_post_comments,
        reel_engagement_rate: metrics.reel_engagement_rate,
        post_engagement_rate: metrics.post_engagement_rate,
        image_engagement_rate: metrics.image_engagement_rate,
        estimated_reach: metrics.estimated_reach,
        avg_reach_multiple: metrics.avg_reach_multiple,
        recent_performance_score: metrics.recent_performance_score,
        growth_trend: metrics.growth_trend,
        best_post_views: metrics.best_post_views,
        worst_post_views: metrics.worst_post_views,
        creator_value_score: metrics.creator_value_score,
        roi_potential_score: metrics.roi_potential_score,
        estimated_reel_reach: metrics.estimated_reel_reach,
        estimated_story_reach: metrics.estimated_story_reach,
        estimated_campaign_reach: metrics.estimated_campaign_reach,
        suggested_reel_price: metrics.suggested_reel_price,
        suggested_story_price: metrics.suggested_story_price,
        suggested_campaign_price: metrics.suggested_campaign_price,
        last_calculated_at: lastSyncTimestamp,
        raw_metrics: metrics
      });

      // Update AI scores
      db.creator_ai_scores = db.creator_ai_scores.filter((s: any) => s.username !== profile.username);
      db.creator_ai_scores.push({
        username: profile.username,
        creator_quality_score: metrics.creator_quality_score,
        reliability_score: metrics.reliability_score,
        audience_trust_score: metrics.audience_trust_score,
        influence_score: metrics.influence_score,
        discovery_ranking_score: metrics.discovery_ranking_score,
        updated_at: lastSyncTimestamp
      });

      // Update creator scores fallback
      db.creator_scores = db.creator_scores || [];
      db.creator_scores = db.creator_scores.filter((s: any) => s.username !== profile.username);
      db.creator_scores.push({
        username: profile.username,
        creator_quality_score: metrics.creator_quality_score,
        reliability_score: metrics.reliability_score,
        audience_trust_score: metrics.audience_trust_score,
        influence_score: metrics.influence_score,
        discovery_ranking_score: metrics.discovery_ranking_score,
        discovery_rank: Math.round(metrics.discovery_ranking_score),
        authenticity_score: metrics.authenticity_score,
        authenticity_score_num: metrics.authenticity_score_num,
        virality_score: metrics.virality_score,
        updated_at: lastSyncTimestamp
      });

      // Update metrics history
      db.creator_metrics_history = db.creator_metrics_history || [];
      db.creator_metrics_history.push({
        username: profile.username,
        followers: profile.followers,
        engagement_rate: metrics.engagement_rate,
        average_views: metrics.average_views,
        creator_quality_score: metrics.creator_quality_score,
        recorded_at: lastSyncTimestamp,
        raw_metrics: metrics
      });

      // Update sync logs
      const durationMs = Date.now() - startTime;
      db.creator_sync_logs.push({
        username: profile.username,
        status: "success",
        steps_completed: ["fetch_profile", "fetch_posts", "run_metrics_engine", "calculate_ai_scores", "store_data"],
        duration_ms: durationMs,
        created_at: lastSyncTimestamp
      });

      writeFallbackDb(db);
      syncResult.source = "fallback_json";
      console.log(`[INSTAGRAM_SERVICE] Fallback JSON write complete for @${cleanUsername}!`);
    }

    return syncResult;
  }
}
export const instaloaderService = new InstaloaderService();
export default instaloaderService;
