import { eventTrigger } from "@trigger.dev/sdk";
import { client } from "@/lib/trigger";
import { createClient } from "@supabase/supabase-js";
import { getScrapeProvider } from "@/lib/scraper-providers";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const creatorEnrichmentJob = client.defineJob({
  id: "creator-enrichment-v2",
  name: "Creator Enrichment V2 (Phase 2)",
  version: "2.0.0",
  trigger: eventTrigger({
    name: "creator.enrichment.requested",
  }),
  run: async (payload: { username: string; creatorId?: string; provider?: string }, io: any, ctx: any) => {
    const { username, creatorId, provider = "rapidapi" } = payload;
    const cleanUsername = username.replace("@", "").trim();

    // 1. Initialize Enrichment Run Record
    const runRecord = await io.runTask("create-run-record", async () => {
      const { data, error } = await supabase
        .from("creator_enrichment_runs")
        .insert({
          creator_id: creatorId || null,
          trigger_run_id: ctx.run.id,
          status: "running",
          started_at: new Date().toISOString(),
          metadata: { provider }
        })
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create enrichment run record: ${error.message}`);
      return data;
    });

    const runRecordId = runRecord.id;

    try {
      // Step 1: Scrape Profile & Timeline Posts
      const scrapedData = await io.runTask("scrape-profile", async () => {
        const scraper = getScrapeProvider(provider);
        return await scraper.scrape(cleanUsername);
      });

      // Step 2: Save Media Nodes
      await io.runTask("save-media-nodes", async () => {
        if (scrapedData.posts_data && scrapedData.posts_data.length > 0) {
          const nodesPayload = scrapedData.posts_data.map((p: any) => ({
            creator_id: creatorId || null,
            media_id: p.media_id || `post_${new Date(p.date).getTime()}`,
            media_type: p.is_video ? "video" : "image",
            original_url: p.original_url || "",
            video_views: p.views || 0,
            likes: p.likes || 0,
            comments_count: p.comments || 0,
            caption: p.caption || "",
            posted_at: p.date,
          }));

          if (creatorId) {
            await supabase.from("creator_media_nodes").delete().eq("creator_id", creatorId);
            await supabase.from("creator_media_nodes").insert(nodesPayload);
          }
        }
      });

      // Step 3: Run AI DNA Engines (Content, Personality, Brand Affinity) using Gemini 2.5 Flash
      const aiResults = await io.runTask("run-ai-dna-engines", async () => {
        const prompt = `
You are WeCollab's Lead AI Creator Profiler. Analyze the creator profile and recent post captions:
Username: @${scrapedData.username}
Display Name: ${scrapedData.name || scrapedData.username}
Biography: "${scrapedData.bio || ""}"
Recent Captions: ${JSON.stringify(scrapedData.captions || [])}

Perform deep profiling across Content, Personality, and Brand Affinity dimensions. 
For every classification, assign a confidence score between 0.00 and 1.00 representing your prediction certainty.
Return a RAW JSON object ONLY (no markdown code blocks, no backticks, no wrap text).

JSON Schema to follow:
{
  "niches": {
    "value": ["Lifestyle", "Fitness", "Fashion"],
    "confidence": 0.95
  },
  "languages": {
    "value": ["English", "Hindi"],
    "confidence": 0.98
  },
  "gender": {
    "value": "Female",
    "confidence": 0.99
  },
  "personality": {
    "persona": {
      "value": "Educator / Trainer",
      "confidence": 0.88
    },
    "tone_dimensions": {
      "casual": 0.30,
      "educational": 0.85,
      "entertaining": 0.50
    }
  },
  "brand_affinity": {
    "sponsored_ratio": 0.15,
    "mentioned_brands": {
      "value": ["Nike", "Myprotein"],
      "confidence": 0.92
    },
    "fits": ["Sports Apparel", "Health Supplements"]
  },
  "trust_metrics": {
    "spam_ratio": 0.05,
    "safety_status": {
      "value": "Safe",
      "confidence": 0.99
    }
  },
  "topics": {
    "value": ["home workouts", "protein recipes", "activewear styling"],
    "confidence": 0.91
  }
}
`;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const usage = result.response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
        
        // Clean JSON
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiOutput = JSON.parse(cleanJson);

        return {
          output: aiOutput,
          usage,
        };
      });

      const aiOutput = aiResults.output;

      // Log AI Usage Metric to Database
      await io.runTask("log-ai-usage", async () => {
        await supabase.from("ai_usage_logs").insert({
          creator_id: creatorId || null,
          run_id: runRecordId,
          model_name: "gemini-2.5-flash",
          prompt_type: "text_dna_engines",
          input_tokens: aiResults.usage.promptTokenCount,
          output_tokens: aiResults.usage.candidatesTokenCount,
          pricing_version: "2026-06",
        });
      });

      // Log AI Analysis Output to Database for Audit
      await io.runTask("log-ai-analysis-output", async () => {
        const inputSummary = `Username: @${scrapedData.username}, Bio Length: ${scrapedData.bio?.length || 0}, Captions Count: ${scrapedData.captions?.length || 0}`;
        await supabase.from("ai_analysis_outputs").insert({
          creator_id: creatorId || null,
          run_id: runRecordId,
          agent_name: "text_dna_engines",
          prompt_version: "v2.0",
          model_name: "gemini-2.5-flash",
          input_summary: inputSummary,
          raw_response: aiOutput,
        });
      });

      // Step 4: Compute V2 Creator Score
      const followers = scrapedData.followers || 0;
      const postsCount = scrapedData.posts_data ? scrapedData.posts_data.length : 0;
      let avgViews = 0;
      let engagementRate = 0;

      if (scrapedData.posts_data && scrapedData.posts_data.length > 0) {
        let totalLikes = 0;
        let totalComments = 0;
        let totalVideoViews = 0;
        let videoCount = 0;

        scrapedData.posts_data.forEach((p: any) => {
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
        if (followers > 0) {
          engagementRate = parseFloat((((avgLikes + avgComments) / followers) * 100).toFixed(2));
        }
      }

      // v2 Score Algorithm:
      // score = (E * 0.30) + (V * 0.20) + (C * 0.15) + (P * 0.15) + (S * 0.20)
      const erScore = Math.min(100, (engagementRate / 8) * 100);
      const viewScore = Math.min(100, (avgViews / 100000) * 100);
      const safetyScore = aiOutput.trust_metrics?.safety_status?.value === "Safe" ? 100 : 30;
      
      let postingScore = 50;
      const freq = scrapedData.posting_patterns?.frequency?.toLowerCase() || "";
      if (freq.includes("daily")) postingScore = 100;
      else if (freq.includes("week")) postingScore = 80;

      const scoreVal = (erScore * 0.30) + (viewScore * 0.20) + (80 * 0.15) + (postingScore * 0.15) + (safetyScore * 0.20);
      const creatorScore = Math.round(Math.min(99, Math.max(30, scoreVal))) / 10;

      // Step 5: Save/Upsert Creator Profile & Sub-records
      const dbResults = await io.runTask("save-to-database", async () => {
        // 1. Upsert Creators real-time profile details
        const mainCategory = aiOutput.niches?.value?.[0] || "General";
        const finalLocation = aiOutput.locations?.value?.[0] || "India";
        const emailMatch = scrapedData.bio?.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        
        const creatorPayload: any = {
          username: cleanUsername,
          name: scrapedData.name || cleanUsername,
          bio: scrapedData.bio || "",
          profile_image: scrapedData.profilePicture || "",
          followers,
          following: scrapedData.following || 0,
          posts: postsCount,
          engagement_rate: engagementRate,
          avg_reel_views: String(avgViews),
          category: mainCategory,
          location: finalLocation,
          gender: aiOutput.gender?.value || null,
          language: aiOutput.languages?.value?.[0] || "English",
          brand_safe: aiOutput.trust_metrics?.safety_status?.value === "Safe",
          posting_frequency: scrapedData.posting_patterns?.frequency || "Weekly",
          creator_score: creatorScore,
          last_fetched_at: new Date().toISOString(),
          email: emailMatch ? emailMatch[0] : null
        };

        if (creatorId) {
          creatorPayload.id = creatorId;
        }

        const { data: savedCreator, error: creatorErr } = await supabase
          .from("creators")
          .upsert(creatorPayload, { onConflict: "username" })
          .select()
          .single();

        if (creatorErr || !savedCreator) {
          throw new Error(`Failed to upsert creator: ${creatorErr?.message}`);
        }

        // Update run record, usage logs, and analysis outputs with proper creator ID if it was onboarding
        await supabase
          .from("creator_enrichment_runs")
          .update({ creator_id: savedCreator.id })
          .eq("id", runRecordId);

        await supabase
          .from("ai_usage_logs")
          .update({ creator_id: savedCreator.id })
          .eq("run_id", runRecordId);

        await supabase
          .from("ai_analysis_outputs")
          .update({ creator_id: savedCreator.id })
          .eq("run_id", runRecordId);

        if (!creatorId) {
          if (scrapedData.posts_data && scrapedData.posts_data.length > 0) {
            const nodesPayload = scrapedData.posts_data.map((p: any) => ({
              creator_id: savedCreator.id,
              media_id: p.media_id || `post_${new Date(p.date).getTime()}`,
              media_type: p.is_video ? "video" : "image",
              original_url: p.original_url || "",
              video_views: p.views || 0,
              likes: p.likes || 0,
              comments_count: p.comments || 0,
              caption: p.caption || "",
              posted_at: p.date,
            }));
            await supabase.from("creator_media_nodes").delete().eq("creator_id", savedCreator.id);
            await supabase.from("creator_media_nodes").insert(nodesPayload);
          }
        }

        // 2. Upsert Creator DNA
        await supabase.from("creator_dna").upsert({
          creator_id: savedCreator.id,
          intelligence_version: "v2",
          content_dna: {
            topics: aiOutput.topics,
            caption_tone: aiOutput.personality?.persona,
            hashtags: scrapedData.hashtags || []
          },
          visual_dna: {},  // Reserved for Gemini Vision (Phase 3)
          personality_dna: aiOutput.personality,
          brand_affinity: aiOutput.brand_affinity,
          trust_metrics: aiOutput.trust_metrics
        }, { onConflict: "creator_id" });

        // 3. Write Immutable Chronological Snapshot
        await supabase.from("creator_snapshots").insert({
          creator_id: savedCreator.id,
          snapshot_date: new Date().toISOString(),
          followers,
          engagement_rate: engagementRate,
          avg_views: avgViews,
          creator_score: creatorScore,
          intelligence_version: "v2",
          content_dna: {
            topics: aiOutput.topics,
            caption_tone: aiOutput.personality?.persona,
            hashtags: scrapedData.hashtags || []
          },
          visual_dna: {},
          personality_dna: aiOutput.personality,
          brand_affinity: aiOutput.brand_affinity,
          trust_metrics: aiOutput.trust_metrics
        });

        return savedCreator;
      });

      // Step 6: Generate Multiple Embeddings ('profile', 'content', 'personality')
      await io.runTask("generate-embeddings", async () => {
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        // Profile Embedding Source Text
        const profileSource = `
Handle: @${scrapedData.username}
DisplayName: ${dbResults.name}
Niche: ${dbResults.category}
Biography: ${dbResults.bio || ""}
Location: ${dbResults.location}
`;
        const profileRes = await model.embedContent(profileSource);
        await supabase.from("creator_embeddings").upsert({
          creator_id: dbResults.id,
          intelligence_version: "v2",
          embedding_type: "profile",
          embedding: profileRes.embedding.values,
          combined_text_source: profileSource
        }, { onConflict: "creator_id,embedding_type,intelligence_version" });

        // Content Embedding Source Text
        const contentSource = `
Handle: @${scrapedData.username}
Content Topics: ${aiOutput.topics?.value?.join(", ") || ""}
Niches: ${aiOutput.niches?.value?.join(", ") || ""}
Caption Tone: ${aiOutput.personality?.persona?.value || ""}
Hashtags: ${scrapedData.hashtags?.join(", ") || ""}
`;
        const contentRes = await model.embedContent(contentSource);
        await supabase.from("creator_embeddings").upsert({
          creator_id: dbResults.id,
          intelligence_version: "v2",
          embedding_type: "content",
          embedding: contentRes.embedding.values,
          combined_text_source: contentSource
        }, { onConflict: "creator_id,embedding_type,intelligence_version" });

        // Personality Embedding Source Text
        const personalitySource = `
Handle: @${scrapedData.username}
Persona Type: ${aiOutput.personality?.persona?.value || ""}
Tone Profiles: Casual=${aiOutput.personality?.tone_dimensions?.casual || 0}, Educational=${aiOutput.personality?.tone_dimensions?.educational || 0}, Entertaining=${aiOutput.personality?.tone_dimensions?.entertaining || 0}
Biography Vibe: ${dbResults.bio || ""}
`;
        const personalityRes = await model.embedContent(personalitySource);
        await supabase.from("creator_embeddings").upsert({
          creator_id: dbResults.id,
          intelligence_version: "v2",
          embedding_type: "personality",
          embedding: personalityRes.embedding.values,
          combined_text_source: personalitySource
        }, { onConflict: "creator_id,embedding_type,intelligence_version" });
      });

      // Step 7: Sync to Algolia Search Index
      await io.runTask("sync-algolia", async () => {
        const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
        const adminKey = process.env.ALGOLIA_ADMIN_KEY;
        
        if (appId && adminKey) {
          const syncUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/sync-algolia`;
          await fetch(syncUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "save",
              creator: {
                ...dbResults,
                score: creatorScore,
                profile_image_url: dbResults.profile_image
              }
            })
          });
        }
      });

      // 2. Mark Enrichment Run as Successful
      await io.runTask("finalize-run-success", async () => {
        await supabase
          .from("creator_enrichment_runs")
          .update({
            status: "success",
            completed_at: new Date().toISOString(),
            metadata: {
              provider,
              score: creatorScore,
              niches: aiOutput.niches?.value
            }
          })
          .eq("id", runRecordId);
      });

      return {
        success: true,
        creatorId: dbResults.id,
        username: dbResults.username,
        score: creatorScore
      };

    } catch (err: any) {
      console.error("[PIPELINE_RUN_CRITICAL_FAIL]", err);
      
      // 3. Mark Enrichment Run as Failed
      await supabase
        .from("creator_enrichment_runs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error: err.message || "An unexpected error occurred during execution."
        })
        .eq("id", runRecordId);

      throw err;
    }
  },
});
