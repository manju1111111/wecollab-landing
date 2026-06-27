import { NextResponse } from "next/server";
import { instaloaderService } from "@/lib/instagram/instaloader";

// Allow up to 60 seconds for the Instagram scraping + AI classification to complete
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body?.username?.toString().replace("@", "").trim();

    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required." }, { status: 400 });
    }

    const result = await instaloaderService.analyzeProfile(username);
    return NextResponse.json({
      success: true,
      message: `Instagram analysis completed for @${username}`,
      profile: result.profile,
      metrics: result.metrics,
      posts: result.posts,
      lastSyncTimestamp: result.lastSyncTimestamp,
      source: result.source,
    });
  } catch (error: any) {
    console.error("[LEGACY_CATEGORIZE_PIPELINE]", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to analyze creator." }, { status: 500 });
  }
}
