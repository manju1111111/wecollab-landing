import { NextResponse } from "next/server";
import { classifyCreatorFilters } from "@/lib/instagram/classifier";

export async function POST(req: Request) {
  try {
    const { description, captions } = await req.json();

    if (!description && (!captions || captions.length === 0)) {
      return NextResponse.json({ error: "No description or captions provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key is missing in environment variables" }, { status: 500 });
    }

    console.log(`[AI_CATEGORIZE] Categorizing description with shared taxonomy classifier...`);
    
    const result = await classifyCreatorFilters(
      "anonymous",
      description || "",
      captions || []
    );

    return NextResponse.json({ tags: result.tags, category: result.category });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze description" }, { status: 500 });
  }
}
