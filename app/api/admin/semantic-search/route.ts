import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { query, type = "profile", threshold = 0.5, limit = 20 } = await req.json();

    if (!query) {
      return NextResponse.json({ success: false, error: "Query string is required." }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY is missing on the server." }, { status: 500 });
    }

    console.log(`[SEMANTIC_SEARCH] Vectorizing query: "${query}" using text-embedding-004...`);

    // 1. Generate Query Vector Embedding
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embedResult = await model.embedContent(query);
    const queryVector = embedResult.embedding.values;

    console.log(`[SEMANTIC_SEARCH] Query vector generated (dimensions: ${queryVector.length}). Searching DB via match_creators RPC...`);

    // 2. Query Supabase match_creators RPC
    const { data: matches, error: matchErr } = await supabase.rpc("match_creators", {
      query_embedding: queryVector,
      match_threshold: threshold,
      match_count: limit,
      type_filter: type
    });

    if (matchErr) {
      console.error("[SEMANTIC_SEARCH_RPC_ERROR]", matchErr);
      return NextResponse.json({ success: false, error: `Database search failed: ${matchErr.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      query,
      type,
      count: matches ? matches.length : 0,
      results: matches || []
    });

  } catch (error: any) {
    console.error("[SEMANTIC_SEARCH_CRITICAL]", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred during semantic query execution." },
      { status: 500 }
    );
  }
}
