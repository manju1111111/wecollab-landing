import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CREATOR_CATEGORIES } from "@/data/creator-categories";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { description } = await req.json();

    if (!description) {
      return NextResponse.json({ error: "No description provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key is missing in environment variables" }, { status: 500 });
    }

    // Flatten all possible subcategories from the master taxonomy
    const allValidTags = CREATOR_CATEGORIES.flatMap(group => group.subCategories);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are an expert social media analyst for an influencer platform. 
Read the following creator description and extract ALL relevant subcategories.

CRITICAL INSTRUCTION:
You MUST ONLY select tags that exist exactly in the provided MASTER TAXONOMY list. 
Do not invent or hallucinate tags. If a tag is not in the list, DO NOT use it.
Return the most appropriate tags (aim for 2-6 tags).

MASTER TAXONOMY:
${JSON.stringify(allValidTags, null, 2)}

Respond ONLY with a raw JSON array of strings (no markdown, no backticks, no object wrapper).
Example output: ["Vegan / plant-based", "Healthy eating", "Vlog"]

Creator Description:
"${description}"
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean up markdown code blocks if the AI accidentally adds them
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedData = JSON.parse(cleanJson);
    
    // Ensure the output is an array
    if (!Array.isArray(parsedData)) {
       throw new Error("AI did not return an array.");
    }

    // Filter out any hallucinations just in case
    const strictTags = parsedData.filter(tag => allValidTags.includes(tag));

    return NextResponse.json({ tags: strictTags });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze description" }, { status: 500 });
  }
}
