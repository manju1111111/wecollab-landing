import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { CREATOR_CATEGORIES } from "@/data/creator-categories";
import { getScrapeProvider, type CreatorScrapedData } from "@/lib/scraper-providers";
import { verifyEmail } from "@/lib/email-verifier";
import { client } from "@/lib/trigger";
import masterFilters from "@/data/filters.json";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// 2. Filter Mapping Engine (Phase 5)
const allSubCategories = CREATOR_CATEGORIES.flatMap(g => g.subCategories);

export function mapAiAttributesToTags(ai: any): string[] {
  const matchedTags = new Set<string>();

  const hasWord = (str: string, word: string) => {
    const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(str);
  };

  // Map face-showing boolean
  if (ai.faceShowing === true) {
    matchedTags.add("Face-showing (talking head)");
  } else if (ai.faceShowing === false) {
    matchedTags.add("Faceless creator");
  }

  // Include direct suggestions from the AI (validated against taxonomy)
  if (Array.isArray(ai.suggestedTags)) {
    ai.suggestedTags.forEach((tag: string) => {
      if (allSubCategories.includes(tag)) {
        matchedTags.add(tag);
      }
    });
  }

  const checkMatch = (attributeValue: string) => {
    const val = attributeValue.toLowerCase().trim();
    if (!val) return;

    // Direct mapping synonyms dictionary
    const synonyms: Record<string, string[]> = {
      "cricket": ["Cricket"],
      "football": ["Football", "Soccer"],
      "soccer": ["Soccer", "Football"],
      "basketball": ["Basketball"],
      "volleyball": ["Volleyball"],
      "tennis": ["Tennis"],
      "badminton": ["Badminton"],
      "kabaddi": ["Kabaddi"],
      "hockey": ["Hockey"],
      "athletics": ["Athletics", "Running"],
      "running": ["Running", "Athletics"],
      "marathon": ["Marathon", "Running"],
      "cycling": ["Cycling"],
      "swimming": ["Swimming"],
      "wrestling": ["Wrestling"],
      "mma": ["MMA"],
      "boxing": ["Boxing"],
      "ufc": ["UFC", "MMA"],
      "bodybuilding": ["Bodybuilding"],
      "powerlifting": ["Powerlifting"],
      "weightlifting": ["Weightlifting"],
      "formula 1": ["Formula 1", "Motorsport"],
      "f1": ["Formula 1", "Motorsport"],
      "motorsport": ["Motorsport"],
      "chess": ["Chess"],
      "esports": ["Esports", "Gaming Esports"],
      "gaming esports": ["Gaming Esports", "Esports"],
      "golf": ["Golf"],
      "rugby": ["Rugby"],
      "baseball": ["Baseball"],
      "table tennis": ["Table Tennis"],
      "skating": ["Skating"],
      "trekking": ["Trekking", "Adventure Sports"],
      "mountaineering": ["Mountaineering", "Adventure Sports"],
      "adventure sports": ["Adventure Sports"],
      "skincare": ["Skincare routine"],
      "make up": ["Makeup tutorials", "Makeup reviews"],
      "makeup": ["Makeup tutorials", "Makeup reviews"],
      "grwm": ["GRWM (get ready with me)"],
      "nails": ["Nail art & care"],
      "nail": ["Nail art & care"],
      "perfume": ["Fragrance & perfume"],
      "cologne": ["Fragrance & perfume"],
      "scent": ["Fragrance & perfume"],
      "ootd": ["Outfit of the day (OOTD)"],
      "thrift": ["Thrift & secondhand fashion"],
      "thrifting": ["Thrift & secondhand fashion"],
      "luxury fashion": ["Luxury & designer fashion"],
      "streetwear": ["Streetwear"],
      "recipe": ["Recipe tutorials"],
      "cooking": ["Recipe tutorials"],
      "bake": ["Baking & pastry"],
      "baking": ["Baking & pastry"],
      "vegan": ["Vegan / plant-based"],
      "vegetarian": ["Vegan / plant-based"],
      "plant-based": ["Vegan / plant-based"],
      "coffee": ["Coffee & café culture"],
      "cafe": ["Coffee & café culture"],
      "tea": ["Coffee & café culture"],
      "cocktails": ["Cocktails & mixology"],
      "mixology": ["Cocktails & mixology"],
      "crochet": ["Knitting, sewing & crafts"],
      "knitting": ["Knitting, sewing & crafts"],
      "sewing": ["Knitting, sewing & crafts"],
      "vlog": ["Vlog (daily life cam)"],
      "vlogger": ["Vlog (daily life cam)"],
      "daily life": ["Vlog (daily life cam)"],
      "cinematic": ["Cinematic / film style"],
      "gaming": ["Game walkthroughs", "Let's play", "Game reviews"],
      "gamer": ["Game walkthroughs", "Let's play", "Game reviews"],
      "fitness": ["Home workouts", "Gym training"],
      "gym": ["Gym training"],
      "workout": ["Home workouts", "Gym training"],
      "tech": ["Smartphone reviews", "Laptop & PC reviews", "AI tools & software"],
      "software": ["AI tools & software"],
      "ai": ["AI tools & software"],
      "coding": ["Coding & programming"],
      "programming": ["Coding & programming"],
      "developer": ["Coding & programming"],
      "personal finance": ["Personal finance & budgeting"],
      "investing": ["Investing (stocks, ETFs)"],
      "crypto": ["Crypto & Web3"],
      "web3": ["Crypto & Web3"],
      "real estate": ["Real estate investing"],
      "side hustle": ["Side hustles & income ideas"],
      "entrepreneur": ["Entrepreneurship & startups"],
      "startup": ["Entrepreneurship & startups"],
      "dog": ["Dog care & training"],
      "dogs": ["Dog care & training"],
      "cat": ["Cat care"],
      "cats": ["Cat care"],
      "animal": ["Wildlife & nature content", "Pet product reviews"],
      "animals": ["Wildlife & nature content", "Pet product reviews"],
      "painting": ["Painting (watercolor, oil, acrylic)"],
      "drawing": ["Illustration & drawing"],
      "sketching": ["Illustration & drawing"],
      "photography": ["Photography"],
      "travel": ["Budget travel", "Luxury travel", "Solo travel", "City guides & travel tips"],
      "backpacking": ["Backpacking"],
      "road trip": ["Road trips"],
      "couple": ["Couple life"],
      "marriage": ["Couple life"],
      "wedding": ["Couple life"],
      "parenting": ["Toddler parenting", "Newborn & baby care"],
      "mom": ["Toddler parenting", "Newborn & baby care"],
      "dad": ["Toddler parenting", "Newborn & baby care"],
      "mother": ["Toddler parenting", "Newborn & baby care"],
      "father": ["Toddler parenting", "Newborn & baby care"],
      "baby": ["Newborn & baby care"],
      "baby care": ["Newborn & baby care"],
      "pregnancy": ["Pregnancy & birth journey"],
      "pregnant": ["Pregnancy & birth journey"],
      "home decor": ["Home decor & interior design"],
      "cleaning": ["Cleaning & organization"],
      "diy": ["DIY & home improvement"],
      "renovation": ["DIY & home improvement"],
      "astrology": ["Astrology & birth charts"],
      "tarot": ["Tarot & oracle readings"],
      "meditation": ["Meditation & breathwork"],
      "mindfulness": ["Meditation & breathwork"],
      "mental health": ["Mental health awareness", "Mental health destigmatization"],
    };

    // Synonyms matches (full word boundary matches only)
    for (const [key, tags] of Object.entries(synonyms)) {
      if (hasWord(val, key)) {
        tags.forEach(t => matchedTags.add(t));
      }
    }

    // Direct case-insensitive matches (exact matches only)
    for (const tag of allSubCategories) {
      const tagLower = tag.toLowerCase();
      if (tagLower === val) {
        matchedTags.add(tag);
      }
    }
  };

  const processList = (list: any) => {
    if (Array.isArray(list)) {
      list.forEach(item => {
        if (typeof item === "string") checkMatch(item);
      });
    } else if (typeof list === "string") {
      checkMatch(list);
    }
  };

  processList(ai.niches);
  processList(ai.locations);
  processList(ai.contentStyles);
  processList(ai.audienceTypes);
  processList(ai.topics);
  processList(ai.interests);
  processList(ai.creatorType);

  return Array.from(matchedTags);
}

// Helper to determine the main category group
function determineMainCategory(tags: string[]): string {
  if (!tags || tags.length === 0) return "General";
  
  const groupCounts: Record<string, number> = {};
  
  tags.forEach(tag => {
    CREATOR_CATEGORIES.forEach(group => {
      if (group.subCategories.includes(tag)) {
        groupCounts[group.groupName] = (groupCounts[group.groupName] || 0) + 1;
      }
    });
  });

  if (Object.keys(groupCounts).length === 0) return "General";
  
  return Object.keys(groupCounts).reduce((a, b) => groupCounts[a] > groupCounts[b] ? a : b);
}

async function runLocalEnrichment({
  username,
  creatorId,
  provider,
  runRecordId,
  triggerRunId,
}: {
  username: string;
  creatorId: string | null;
  provider: string;
  runRecordId: string;
  triggerRunId: string;
}) {
  // Create Supabase client using Service Role Key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cleanUsername = username.replace("@", "").trim();

  const updateProgress = async (stepKey: string, extraMeta: Record<string, any> = {}) => {
    try {
      const { data: currentRun } = await supabase
        .from("creator_enrichment_runs")
        .select("metadata")
        .eq("id", runRecordId)
        .single();

      const currentMeta = currentRun?.metadata || {};
      const currentSteps = currentMeta.steps || {};
      currentSteps[stepKey] = true;

      await supabase
        .from("creator_enrichment_runs")
        .update({
          metadata: {
            ...currentMeta,
            ...extraMeta,
            steps: currentSteps
          }
        })
        .eq("id", runRecordId);
    } catch (e) {
      console.error(`[LOCAL_ENRICH_WARN] Failed to update progress for step ${stepKey}:`, e);
    }
  };

  try {
    // Step 1: Scrape Profile
    console.log(`[LOCAL_ENRICH] Starting step 1 (scrape) for @${cleanUsername}...`);
    const scraper = getScrapeProvider(provider);
    const scrapedData = await scraper.scrape(cleanUsername);
    await updateProgress("profile_fetched");

    // Step 2: Save Media Nodes
    console.log(`[LOCAL_ENRICH] Starting step 2 (media nodes) for @${cleanUsername}...`);
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
    await updateProgress("content_analyzed");

    // Step 3: Run AI DNA Engines (Content, Personality, Brand Affinity) using Gemini 2.5 Flash
    console.log(`[LOCAL_ENRICH] Starting step 3 (AI DNA Engines) for @${cleanUsername}...`);
    const dnaPrompt = `
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
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const dnaResult = await model.generateContent(dnaPrompt);
    const dnaText = dnaResult.response.text();
    const dnaUsage = dnaResult.response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
    
    const cleanDnaJson = dnaText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiOutput = JSON.parse(cleanDnaJson);

    // Log AI Usage Metric to Database
    await supabase.from("ai_usage_logs").insert({
      creator_id: creatorId || null,
      run_id: runRecordId,
      model_name: "gemini-2.5-flash",
      prompt_type: "text_dna_engines",
      input_tokens: dnaUsage.promptTokenCount,
      output_tokens: dnaUsage.candidatesTokenCount,
      pricing_version: "2026-06",
    });

    // Log AI Analysis Output to Database for Audit
    const dnaInputSummary = `Username: @${scrapedData.username}, Bio Length: ${scrapedData.bio?.length || 0}, Captions Count: ${scrapedData.captions?.length || 0}`;
    await supabase.from("ai_analysis_outputs").insert({
      creator_id: creatorId || null,
      run_id: runRecordId,
      agent_name: "text_dna_engines",
      prompt_version: "v2.0",
      model_name: "gemini-2.5-flash",
      input_summary: dnaInputSummary,
      raw_response: aiOutput,
    });

    await updateProgress("categories_assigned");
    await updateProgress("brand_safety_checked");

    // Step 3.5: Run AI Filter Mapping using Gemini 2.5 Flash
    console.log(`[LOCAL_ENRICH] Starting step 3.5 (filter mapping) for @${cleanUsername}...`);
    const filterPrompt = `
You are WeCollab's Lead AI Creator Categorization Specialist. Compare the creator's profile against our master filter catalog and match all applicable filters.

Creator Profile:
- Username: @${scrapedData.username}
- Display Name: ${scrapedData.name || scrapedData.username}
- Biography: "${scrapedData.bio || ""}"
- Recent Captions: ${JSON.stringify(scrapedData.captions || [])}

Master Filter Catalog:
${JSON.stringify(masterFilters)}

Rules:
1. Output a JSON object with a single key "matches", containing an array of matched filters.
2. For each match, provide:
   - "filter_id": the exact ID from the catalog
   - "confidence": a score between 0.00 and 1.00 indicating match certainty
   - "reasoning": a concise explanation of why this filter applies based on the bio or captions.
3. Be strict: only include matches where there is direct evidence in the creator's profile.
4. Return a RAW JSON object ONLY (no markdown code blocks, no backticks, no wrap text).

JSON Schema to follow:
{
  "matches": [
    {
      "filter_id": "video_format_face_showing",
      "confidence": 0.95,
      "reasoning": "Creator is seen talking directly to the camera in their recent reels."
    }
  ]
}
`;
    const filterResult = await model.generateContent(filterPrompt);
    const filterText = filterResult.response.text();
    const filterUsage = filterResult.response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };

    const cleanFilterJson = filterText.replace(/```json/g, '').replace(/```/g, '').trim();
    const filterMappingOutput = JSON.parse(cleanFilterJson);
    const matchedFilters = filterMappingOutput.matches || [];

    // Log AI Filter Mapping Usage to Database
    await supabase.from("ai_usage_logs").insert({
      creator_id: creatorId || null,
      run_id: runRecordId,
      model_name: "gemini-2.5-flash",
      prompt_type: "filter_mapping_engine",
      input_tokens: filterUsage.promptTokenCount,
      output_tokens: filterUsage.candidatesTokenCount,
      pricing_version: "2026-06",
    });

    // Log AI Filter Mapping Analysis Output to Database for Audit
    const filterInputSummary = `Username: @${scrapedData.username}, Bio Length: ${scrapedData.bio?.length || 0}, Filters Catalog Size: ${masterFilters.length}`;
    await supabase.from("ai_analysis_outputs").insert({
      creator_id: creatorId || null,
      run_id: runRecordId,
      agent_name: "filter_mapping_engine",
      prompt_version: "v2.0",
      model_name: "gemini-2.5-flash",
      input_summary: filterInputSummary,
      raw_response: filterMappingOutput,
    });

    await updateProgress("filters_assigned");

    // Step 4: Compute Creator Score
    console.log(`[LOCAL_ENRICH] Starting step 4 (score generation) for @${cleanUsername}...`);
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

    const erScore = Math.min(100, (engagementRate / 8) * 100);
    const viewScore = Math.min(100, (avgViews / 100000) * 100);
    const safetyScore = aiOutput.trust_metrics?.safety_status?.value === "Safe" ? 100 : 30;
    
    let postingScore = 50;
    const freq = scrapedData.posting_patterns?.frequency?.toLowerCase() || "";
    if (freq.includes("daily")) postingScore = 100;
    else if (freq.includes("week")) postingScore = 80;

    const scoreVal = (erScore * 0.30) + (viewScore * 0.20) + (80 * 0.15) + (postingScore * 0.15) + (safetyScore * 0.20);
    const creatorScore = Math.round(Math.min(99, Math.max(30, scoreVal))) / 10;

    await updateProgress("score_generated");

    // Step 5: Save/Upsert Creator Profile & Sub-records
    console.log(`[LOCAL_ENRICH] Starting step 5 (save to database) for @${cleanUsername}...`);
    const validAssignments = matchedFilters.filter((f: any) => f.confidence >= 0.75);

    const tagsToAssign = validAssignments.map((f: any) => {
      const matchedItem = masterFilters.find((item: any) => item.id === f.filter_id);
      return matchedItem?.name || f.filter_id;
    });

    let mainCategory = aiOutput.niches?.value?.[0] || "General";
    if (validAssignments.length > 0) {
      const highestConf = validAssignments.reduce((prev: any, current: any) => (prev.confidence > current.confidence) ? prev : current);
      const matchedItem = masterFilters.find((item: any) => item.id === highestConf.filter_id);
      if (matchedItem?.group) {
        mainCategory = matchedItem.group;
      }
    }

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
      tags: tagsToAssign,
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
      throw new Error(`Failed to upsert creator locally: ${creatorErr?.message}`);
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

    // Upsert Filter Assignments to database
    const assignmentPayloads = validAssignments.map((f: any) => {
      const matchedItem = masterFilters.find((item: any) => item.id === f.filter_id);
      return {
        creator_id: savedCreator.id,
        run_id: runRecordId,
        filter_id: f.filter_id,
        filter_name: matchedItem?.name || f.filter_id,
        filter_group: matchedItem?.group || "General",
        confidence: f.confidence,
        reasoning: f.reasoning,
      };
    });

    if (assignmentPayloads.length > 0) {
      await supabase
        .from("creator_filter_assignments")
        .delete()
        .eq("creator_id", savedCreator.id);

      const { error: assignErr } = await supabase
        .from("creator_filter_assignments")
        .insert(assignmentPayloads);
        
      if (assignErr) {
        console.error("[LOCAL_FILTER_ASSIGN_ERROR] Failed to save filter assignments:", assignErr.message);
      }
    }

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

    // Upsert Creator DNA
    await supabase.from("creator_dna").upsert({
      creator_id: savedCreator.id,
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
    }, { onConflict: "creator_id" });

    // Write Snapshot
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

    // Step 6: Generate Embeddings
    console.log(`[LOCAL_ENRICH] Starting step 6 (embedding generation) for @${cleanUsername}...`);
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const profileSource = `
Handle: @${scrapedData.username}
DisplayName: ${savedCreator.name}
Niche: ${savedCreator.category}
Biography: ${savedCreator.bio || ""}
Location: ${savedCreator.location}
`;
    const profileRes = await embedModel.embedContent(profileSource);
    await supabase.from("creator_embeddings").upsert({
      creator_id: savedCreator.id,
      intelligence_version: "v2",
      embedding_type: "profile",
      embedding: profileRes.embedding.values,
      combined_text_source: profileSource
    }, { onConflict: "creator_id,embedding_type,intelligence_version" });

    const contentSource = `
Handle: @${scrapedData.username}
Content Topics: ${aiOutput.topics?.value?.join(", ") || ""}
Niches: ${aiOutput.niches?.value?.join(", ") || ""}
Caption Tone: ${aiOutput.personality?.persona?.value || ""}
Hashtags: ${scrapedData.hashtags?.join(", ") || ""}
`;
    const contentRes = await embedModel.embedContent(contentSource);
    await supabase.from("creator_embeddings").upsert({
      creator_id: savedCreator.id,
      intelligence_version: "v2",
      embedding_type: "content",
      embedding: contentRes.embedding.values,
      combined_text_source: contentSource
    }, { onConflict: "creator_id,embedding_type,intelligence_version" });

    const personalitySource = `
Handle: @${scrapedData.username}
Persona Type: ${aiOutput.personality?.persona?.value || ""}
Tone Profiles: Casual=${aiOutput.personality?.tone_dimensions?.casual || 0}, Educational=${aiOutput.personality?.tone_dimensions?.educational || 0}, Entertaining=${aiOutput.personality?.tone_dimensions?.entertaining || 0}
Biography Vibe: ${savedCreator.bio || ""}
`;
    const personalityRes = await embedModel.embedContent(personalitySource);
    await supabase.from("creator_embeddings").upsert({
      creator_id: savedCreator.id,
      intelligence_version: "v2",
      embedding_type: "personality",
      embedding: personalityRes.embedding.values,
      combined_text_source: personalitySource
    }, { onConflict: "creator_id,embedding_type,intelligence_version" });

    // Step 7: Sync to Algolia
    console.log(`[LOCAL_ENRICH] Starting step 7 (Algolia sync) for @${cleanUsername}...`);
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
            ...savedCreator,
            score: creatorScore,
            profile_image_url: savedCreator.profile_image
          }
        })
      }).catch(e => console.error("[LOCAL_ALGOLIA_SYNC_FAIL]", e));
    }

    const finalOutput = {
      success: true,
      creatorId: savedCreator.id,
      username: savedCreator.username,
      name: savedCreator.name,
      bio: savedCreator.bio,
      profile_image: savedCreator.profile_image,
      followers: savedCreator.followers,
      following: savedCreator.following,
      posts: savedCreator.posts,
      engagement_rate: savedCreator.engagement_rate,
      avg_reel_views: savedCreator.avg_reel_views,
      category: savedCreator.category,
      location: savedCreator.location,
      gender: savedCreator.gender,
      language: savedCreator.language,
      brand_safe: savedCreator.brand_safe,
      creator_score: savedCreator.creator_score,
      tags: savedCreator.tags,
      filters: validAssignments.map((f: any) => ({
        filter_id: f.filter_id,
        name: (masterFilters as any[]).find((item: any) => item.id === f.filter_id)?.name || f.filter_id,
        group: (masterFilters as any[]).find((item: any) => item.id === f.filter_id)?.group || "General",
        confidence: f.confidence,
        reasoning: f.reasoning
      }))
    };

    // Step 8: Finalize Run
    console.log(`[LOCAL_ENRICH] Finalizing step 8 for @${cleanUsername}...`);
    await supabase
      .from("creator_enrichment_runs")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
        metadata: {
          provider,
          score: creatorScore,
          niches: aiOutput.niches?.value,
          output: finalOutput
        }
      })
      .eq("id", runRecordId);

    console.log(`[LOCAL_ENRICH_SUCCESS] Enrichment finished successfully for @${cleanUsername}`);

  } catch (err: any) {
    console.error(`[LOCAL_ENRICH_CRITICAL_FAIL] For @${cleanUsername}:`, err);
    await supabase
      .from("creator_enrichment_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error: err.message || "An unexpected error occurred during execution."
      })
      .eq("id", runRecordId);
  }
}

// 3. API Entry Point
export async function POST(req: Request) {
  let createdLogId: string | null = null;
  let creatorId: string | null = null;
  let username = "";
  
  // Create Supabase Admin client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { username: rawUsername, creatorId: providedCreatorId, provider = "rapidapi" } = await req.json();
    
    if (!rawUsername) {
      return NextResponse.json({ success: false, error: "Username is required." }, { status: 400 });
    }
    
    username = rawUsername.replace("@", "").trim();
    creatorId = providedCreatorId || null;

    // Feature Flag for V2 Trigger.dev Pipeline (Phase 1)
    const isV2Enabled = process.env.CREATOR_V2_ENABLED === "true";
    if (isV2Enabled) {
      console.log(`[PIPELINE_V2] Routing enrichment request for @${username} to Trigger.dev...`);
      
      try {
        const run = await client.invokeJob("creator-enrichment-v2", {
          payload: {
            username,
            creatorId,
            provider,
          }
        });

        console.log(`[PIPELINE_V2] Dispatched Trigger.dev run: ${run.id}. Returning immediately.`);

        return NextResponse.json({
          success: true,
          message: `Creator @${username} enrichment job enqueued.`,
          runId: run.id,
        });
      } catch (triggerErr: any) {
        console.warn(`[PIPELINE_V2_WARN] Trigger.dev invocation failed: ${triggerErr.message}. Falling back to local async enrichment pipeline.`);
        
        const triggerRunId = "local_run_" + Math.random().toString(36).substring(2, 15);
        
        // Create enrichment run record in DB immediately so the client can poll progress
        const { data: runRecord, error: runErr } = await supabase
          .from("creator_enrichment_runs")
          .insert({
            creator_id: creatorId || null,
            trigger_run_id: triggerRunId,
            status: "running",
            started_at: new Date().toISOString(),
            metadata: { provider, steps: {} }
          })
          .select()
          .single();

        if (runErr || !runRecord) {
          console.error("[LOCAL_ENRICH_INIT_ERROR]", runErr);
          throw new Error(`Failed to create local enrichment run record: ${runErr?.message}`);
        }

        // Fire off local enrichment as a background promise (non-awaited)
        runLocalEnrichment({
          username,
          creatorId,
          provider,
          runRecordId: runRecord.id,
          triggerRunId,
        });

        return NextResponse.json({
          success: true,
          message: `Creator @${username} local async enrichment enqueued.`,
          runId: triggerRunId,
        });
      }
    }




    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing on the server.");
    }

    // Initialize provider and fetch raw data
    const scraper = getScrapeProvider(provider);
    let scrapedData: CreatorScrapedData;
    
    try {
      scrapedData = await scraper.scrape(username);
    } catch (scrapeErr: any) {
      console.error("[PIPELINE_SCRAPING_FAILED]", scrapeErr);
      
      // Log scraping failure to db
      const { data: failLog } = await supabase
        .from("creator_categorization_logs")
        .insert({
          creator_id: creatorId,
          username,
          status: "failed",
          provider,
          error: scrapeErr.message || "Failed to extract Instagram details."
        })
        .select()
        .single();
        
      return NextResponse.json({ 
        success: false, 
        error: `Instagram extraction failed: ${scrapeErr.message || "Unknown scraper error"}` 
      }, { status: 500 });
    }

    // Call Gemini Creator Intelligence
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
You are WeCollab's Senior AI Creator Curation Specialist.
Analyze the following Instagram profile metadata, biography, captions, and hashtags, and extract key creator attributes.

Profile Data to Analyze:
- Username: @${scrapedData.username}
- Display Name: ${scrapedData.name}
- Bio: "${scrapedData.bio}"
- Website: ${scrapedData.website}
- Followers: ${scrapedData.followers}
- Recent Captions: ${JSON.stringify(scrapedData.captions)}
- Hashtags used: ${JSON.stringify(scrapedData.hashtags)}

CRITICAL CLASSIFICATION INSTRUCTION:
Do not limit yourself to only the most obvious categories. We require MAXIMUM classification coverage and deep sub-niche/style detection.
For example:
- A food creator should receive "Food & Beverage" related tags (e.g., "Recipe tutorials", "Restaurant reviews", "Food mukbang", "ASMR cooking / eating", "Street food exploration") but also "Vlog (daily life cam)", "Short-form (Reels/Shorts/TikTok)" or "Face-showing (talking head)" if applicable.
- A fitness creator should be assigned "Home workouts", "Gym training", "Bodybuilding & physique", "Athlete performance" if they showcase workouts.
- If the creator posts about any sport (e.g. Cricket, Football, Soccer, Basketball, Tennis, Badminton, MMA, Boxing, Chess, Esports, F1, Trekking), you MUST identify the specific sport(s) and include them in "suggestedTags".
Ensure you select ALL applicable subcategories from the MASTER TAXONOMY that describe the creator's content, topics, or style.

CRITICAL RESPONSE REQUIREMENT:
You MUST respond with a single, raw JSON object ONLY. Do not wrap the JSON in markdown code blocks (\`\`\`json ... \`\`\`), do not include backticks, do not include any explanatory text or prefix.

MASTER TAXONOMY:
${JSON.stringify(allSubCategories, null, 2)}

Output JSON Format:
{
  "niches": ["general list of niches, e.g. food, fashion, makeup, beauty, travel, tech, gaming"],
  "languages": ["primary languages used, e.g. English, Hindi, Telugu, Tamil, Spanish"],
  "gender": "Female, Male, or Other",
  "locations": ["cities or countries mentioned, e.g. Mumbai, Delhi, India, NYC, USA"],
  "contentStyles": ["styles, e.g. Vlog, OOTD, GRWM, Aesthetic, Educational, Cinematic, Commentary"],
  "audienceTypes": ["types of target audiences, e.g. tech enthusiasts, fashion lovers, foodies, gamers"],
  "creatorTier": "Nano (under 10k), Micro (10k-50k), Mid-tier (50k-500k), Macro (500k-1M), or Mega (1M+)",
  "brandSafety": "Safe or Risky",
  "faceShowing": true/false (true if the creator appears in posts/vlogs; false if faceless, animated or text-only)",
  "creatorType": "Individual, Group, Brand, or Organization",
  "topics": ["specific subjects, e.g. healthy vegan recipes, smartphone reviews, home workouts"],
  "interests": ["personal hobbies, e.g. cafe vlogging, thrift shopping, dog training"],
  "suggestedTags": ["list of exact subcategories from the provided MASTER TAXONOMY that apply to this creator"]
}
`;

    console.log(`[PIPELINE_AI] Sending profile @${username} content to Gemini AI...`);
    const aiResult = await model.generateContent(prompt);
    const text = aiResult.response.text();
    
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let aiOutput: any;
    try {
      aiOutput = JSON.parse(cleanJson);
    } catch (e) {
      console.error("[PIPELINE_AI_JSON_PARSE_ERROR] Raw output:", text);
      throw new Error("Gemini returned invalid JSON structure.");
    }

    // Map attributes to official categories
    const mappedTags = mapAiAttributesToTags(aiOutput);
    const mainCategory = determineMainCategory(mappedTags);

    // Calculate details and metrics
    const followers = scrapedData.followers || 0;
    const postsCount = scrapedData.posts_data ? scrapedData.posts_data.length : 0;
    
    let avgViews = 0;
    let engagementRate = 0;
    
    if (scrapedData.posts_data && scrapedData.posts_data.length > 0) {
      let totalLikes = 0;
      let totalComments = 0;
      let totalVideoViews = 0;
      let videoCount = 0;
      
      scrapedData.posts_data.forEach(p => {
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

    // Format location properly (City, Country)
    let finalLocation = "India";
    if (aiOutput.locations && aiOutput.locations.length > 0) {
      // Pick first matched location
      finalLocation = aiOutput.locations[0];
    } else if (scrapedData.bio) {
      const match = scrapedData.bio.match(/(Mumbai|Delhi|Bangalore|Kolkata|Chennai|Hyderabad|Pune|Ahmedabad|Noida|Gurgaon)/i);
      if (match) {
        finalLocation = match[0] + ", India";
      }
    }

    // Extract and verify email from biography for free using DNS resolver
    let verifiedEmail: string | null = null;
    if (scrapedData.bio) {
      const emailMatch = scrapedData.bio.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        const parsedEmail = emailMatch[0];
        console.log(`[PIPELINE_EMAIL] Found email "${parsedEmail}" in bio. Verifying...`);
        const isValid = await verifyEmail(parsedEmail);
        if (isValid) {
          console.log(`[PIPELINE_EMAIL] Email "${parsedEmail}" resolved successfully.`);
          verifiedEmail = parsedEmail;
        } else {
          console.warn(`[PIPELINE_EMAIL] Email "${parsedEmail}" failed DNS verification. Skipping email saving.`);
        }
      }
    }

    // Prepare fields for Supabase database upsert
    const creatorPayload: any = {
      username: username,
      name: scrapedData.name || username,
      bio: scrapedData.bio || "",
      profile_image: scrapedData.profilePicture || "",
      followers: followers,
      following: scrapedData.following || 0,
      posts: postsCount || 0,
      engagement_rate: engagementRate,
      avg_reel_views: String(avgViews),
      category: mainCategory,
      tags: mappedTags,
      location: finalLocation,
      gender: aiOutput.gender || null,
      language: aiOutput.languages && aiOutput.languages.length > 0 ? aiOutput.languages[0] : "English",
      brand_safe: aiOutput.brandSafety !== "Risky",
      posting_frequency: scrapedData.posting_patterns?.frequency || "Weekly",
      last_fetched_at: new Date().toISOString(),
      visibility_status: true, // Auto-visible once automated categorization completes
      email: verifiedEmail,
    };

    // If onboarding a new creator, set default verification statuses
    if (!creatorId) {
      creatorPayload.verification_status = "Verified";
      creatorPayload.score = 8.5; // Default score
      creatorPayload.rating = 4.5;
    } else {
      creatorPayload.id = creatorId;
    }

    console.log(`[PIPELINE_DB] Upserting creator profile @${username} to Supabase...`);
    let savedCreator = null;
    let dbError = null;

    const firstUpsert = await supabase
      .from("creators")
      .upsert(creatorPayload, { onConflict: "username" })
      .select()
      .single();

    savedCreator = firstUpsert.data;
    dbError = firstUpsert.error;

    if (dbError && dbError.message.includes("column") && (dbError.message.includes("gender") || dbError.message.includes("language"))) {
      console.warn(`[PIPELINE_DB_WARNING] Database upsert failed due to missing columns in schema. Retrying without gender/language...`);
      const safePayload = { ...creatorPayload };
      delete safePayload.gender;
      delete safePayload.language;

      const retryUpsert = await supabase
        .from("creators")
        .upsert(safePayload, { onConflict: "username" })
        .select()
        .single();

      savedCreator = retryUpsert.data;
      dbError = retryUpsert.error;
    }

    if (dbError) {
      console.error("[PIPELINE_DB_ERROR]", dbError);
      throw new Error(`Database upsert failed: ${dbError.message}`);
    }

    console.log(`[PIPELINE_LOGGING] Logging execution for @${username}`);
    try {
      // Log success
      const { data: logEntry } = await supabase
        .from("creator_categorization_logs")
        .insert({
          creator_id: savedCreator.id,
          username,
          status: "success",
          provider,
          raw_data: scrapedData as any,
          ai_output: aiOutput,
          mapped_tags: mappedTags
        })
        .select()
        .single();

      createdLogId = logEntry?.id || null;
    } catch (logErr: any) {
      console.warn("[PIPELINE_LOGGING_WARNING] Failed to write log entry to creator_categorization_logs table. Make sure the table was created via migration:", logErr.message);
    }

    // Synchronize to Algolia in real-time
    try {
      console.log(`[PIPELINE_ALGOLIA] Syncing creator ${savedCreator.name} to Algolia search index...`);
      
      const algoliaSyncUrl = new URL("/api/admin/sync-algolia", req.url).toString();
      const syncRes = await fetch(algoliaSyncUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          creator: {
            ...savedCreator,
            profile_image_url: savedCreator.profile_image // pass original CDN URL
          }
        })
      });
      
      if (!syncRes.ok) {
        const syncErrText = await syncRes.text();
        console.error("[PIPELINE_ALGOLIA_SYNC_FAILED]", syncErrText);
      } else {
        console.log("[PIPELINE_ALGOLIA_SYNC_SUCCESS] Indexed successfully.");
      }
    } catch (algoliaErr) {
      console.error("[PIPELINE_ALGOLIA_SYNC_CATCH_ERROR]", algoliaErr);
    }

    return NextResponse.json({
      success: true,
      creator: savedCreator,
      logId: createdLogId,
      message: `Creator @${username} successfully processed and categorized.`
    });

  } catch (error: any) {
    console.error("[PIPELINE_COORDINATOR_ERROR]", error);
    
    // Log unexpected failure to db if we have a username
    if (username) {
      try {
        await supabase
          .from("creator_categorization_logs")
          .insert({
            creator_id: creatorId,
            username,
            status: "failed",
            provider: "instaloader",
            error: error.message || "An unexpected error occurred during execution."
          });
      } catch (logErr) {
        console.error("[PIPELINE_DB_LOGGING_ERROR]", logErr);
      }
    }

    return NextResponse.json({
      success: false,
      error: error.message || "Categorization pipeline execution failed."
    }, { status: 500 });
  }
}
