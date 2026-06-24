import { NextResponse } from "next/server";
import { instaloaderService } from "../../../../lib/instagram/instaloader";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: "Username parameter is required.", code: "MISSING_USERNAME" }, { status: 400 });
    }

    console.log(`[API_ANALYZE] Triggering full Instagram analysis for: @${username}`);
    const result = await instaloaderService.analyzeProfile(username);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`[API_ANALYZE_ERROR] For username @${request.body}:`, error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during profiling.", code: "ANALYSIS_FAILED" },
      { status: 500 }
    );
  }
}
