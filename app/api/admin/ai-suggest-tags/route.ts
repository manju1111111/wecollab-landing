import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CREATOR_CATEGORIES } from "@/data/creator-categories";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "No search query provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key is missing in environment variables" }, { status: 500 });
    }

    console.log(`[AI_SUGGEST] Analyzing search term: "${query}" for semantic category suggestions...`);

    // Flatten all possible subcategories from the master taxonomy
    const allValidTags = CREATOR_CATEGORIES.flatMap(group => group.subCategories);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an intelligent category mapper for an influencer discovery platform.
The user has searched for a category or topic: "${query}".
We do not have a direct keyword match for "${query}" in our list of 239 creator sub-categories.

Your task:
Analyze "${query}" conceptually and select the top 3-5 most relevant, matching sub-categories from our official MASTER TAXONOMY.
For example, if they search "cricketer" or "batting", suggest: ["Sports-specific training", "Athlete performance", "Home workouts", "Sports & Fitness"].
If they search "skincare", suggest: ["Skincare routine", "Acne & blemish care", "Anti-aging & serums", "Natural / clean beauty", "Body skincare"].

CRITICAL REQUIREMENT:
You MUST ONLY return tags that exist exactly in the provided MASTER TAXONOMY list. 
Do not invent, reword, or hallucinate tags. If it's not a 100% exact character match in the list, DO NOT use it.
Rank them from most relevant to least relevant. Return between 2 and 5 tags.

MASTER TAXONOMY:
${JSON.stringify(allValidTags, null, 2)}

Respond ONLY with a raw JSON array of strings (no markdown, no backticks, no object wrapper).
Example output: ["Sports-specific training", "Athlete performance", "Sports & Fitness"]
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean up markdown code blocks if the AI accidentally adds them
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsedData = JSON.parse(cleanJson);
    
    // Ensure the output is an array
    if (!Array.isArray(parsedData)) {
       throw new Error("AI did not return a valid array of strings.");
    }

    // Filter out any hallucinations or incorrect matches
    const strictMatches = parsedData.filter(tag => allValidTags.includes(tag));

    console.log(`[AI_SUGGEST_SUCCESS] Suggestions for "${query}":`, strictMatches);

    return NextResponse.json({ success: true, suggestions: strictMatches });
  } catch (error: any) {
    console.error("[AI_SUGGEST_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze search query." },
      { status: 500 }
    );
  }
}
