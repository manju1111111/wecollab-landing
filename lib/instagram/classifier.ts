import { GoogleGenerativeAI } from "@google/generative-ai";
import { CREATOR_CATEGORIES } from "@/data/creator-categories";
import masterFilters from "@/data/filters.json";

export interface MatchedFilter {
  filter_id: string;
  filter_name: string;
  filter_group: string;
  confidence: number;
  reasoning: string;
}

export async function classifyCreatorFilters(
  username: string,
  bio: string,
  captions: string[]
): Promise<{ 
  tags: string[]; 
  category: string; 
  filters: MatchedFilter[];
  usage: { promptTokenCount: number; candidatesTokenCount: number };
}> {
  console.log(`[CLASSIFIER] Starting classification for @${username}...`);
  console.log(`[CLASSIFIER] process.env.GEMINI_API_KEY is present: ${!!process.env.GEMINI_API_KEY}`);

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // 1. Generate full 250+ master filters catalog dynamically from CREATOR_CATEGORIES
  const fullCatalog = CREATOR_CATEGORIES.flatMap(group => {
    return group.subCategories.map(sub => {
      const existing = masterFilters.find(f => f.name.toLowerCase() === sub.toLowerCase());
      return {
        id: existing?.id || `${group.groupName.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${sub.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
        name: sub,
        group: group.groupName,
        description: existing?.description || `Content related to ${sub} in the ${group.groupName} category.`
      };
    });
  });

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are WeCollab's Lead AI Creator Categorization Specialist. Compare the creator's profile against our master filter catalog and match all applicable filters.

Creator Profile:
- Username: @${username}
- Biography: "${bio || ""}"
- Recent Captions: ${JSON.stringify(captions || [])}

Master Filter Catalog (250+ filters):
${JSON.stringify(fullCatalog)}

Rules:
1. Output a JSON object with a single key "matches", containing an array of matched filters.
2. For each match, provide:
   - "filter_id": the exact ID from the catalog
   - "confidence": a score between 0.00 and 1.00 indicating match certainty
   - "reasoning": a concise explanation of why this filter applies based on the bio or captions.
3. Be strict: only include matches where there is direct evidence in the creator's profile.
4. Select ALL relevant filters that apply (no upper limit; aim for comprehensive coverage of all their content topics, styles, and activities).
5. Return a RAW JSON object ONLY (no markdown code blocks, no backticks, no wrap text).

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

  console.log(`[CLASSIFIER] Model defined. Immediately before calling Gemini model.generateContent...`);
  let result;
  try {
    result = await model.generateContent(prompt);
    console.log(`[CLASSIFIER] Gemini returned successfully.`);
  } catch (error: any) {
    console.error(`[CLASSIFIER] Gemini API call failed:`, {
      message: error.message,
      status: error.status,
      stack: error.stack,
      raw: error
    });
    throw error;
  }
  const text = result.response.text();
  const usage = result.response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };

  // Clean JSON
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);
  const matches = parsed.matches || [];

  // Filter matches with confidence >= 0.75
  const validMatches = matches.filter((m: any) => m.confidence >= 0.75);

  // Map matches to full info
  const filters: MatchedFilter[] = validMatches.map((m: any) => {
    const matchedItem = fullCatalog.find(item => item.id === m.filter_id);
    return {
      filter_id: m.filter_id,
      filter_name: matchedItem?.name || m.filter_id,
      filter_group: matchedItem?.group || "General",
      confidence: m.confidence,
      reasoning: m.reasoning
    };
  });

  const tags = filters.map(f => f.filter_name);

  // Determine main category
  let category = "General";
  if (filters.length > 0) {
    const highestConf = filters.reduce((prev, current) => (prev.confidence > current.confidence) ? prev : current);
    category = highestConf.filter_group;
  }

  return {
    tags,
    category,
    filters,
    usage: {
      promptTokenCount: usage.promptTokenCount || 0,
      candidatesTokenCount: usage.candidatesTokenCount || 0
    }
  };
}

export async function syncCreatorFilterAssignments(
  supabase: any,
  creatorId: string,
  tags: string[]
): Promise<void> {
  if (!creatorId) return;

  // Clear existing assignments
  await supabase
    .from("creator_filter_assignments")
    .delete()
    .eq("creator_id", creatorId);

  if (!tags || tags.length === 0) return;

  // Generate filter payloads from CREATOR_CATEGORIES and masterFilters
  const assignmentPayloads = tags.map(tag => {
    const group = CREATOR_CATEGORIES.find(g => g.subCategories.some(sub => sub.toLowerCase() === tag.toLowerCase()))?.groupName || "General";
    const existing = masterFilters.find(f => f.name.toLowerCase() === tag.toLowerCase());
    const filter_id = existing?.id || `${group.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${tag.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

    return {
      creator_id: creatorId,
      filter_id,
      filter_name: tag,
      filter_group: group,
      confidence: 1.00, // Manual/Verified addition defaults to 1.00 confidence
      reasoning: "Assigned during creator creation/sync."
    };
  });

  const { error } = await supabase
    .from("creator_filter_assignments")
    .insert(assignmentPayloads);

  if (error) {
    console.error(`[SYNC_FILTER_ASSIGNMENTS_ERROR] Failed to save filter assignments for creator ID ${creatorId}:`, error.message);
  }
}
