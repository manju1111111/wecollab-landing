import { NextResponse } from "next/server";
import { instaloaderService } from "../../../../lib/instagram/instaloader";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: "Username parameter is required.", code: "MISSING_USERNAME" }, { status: 400 });
    }

    console.log(`[API_PROFILE] Fetching Instagram profile for: @${username}`);
    const profile = await instaloaderService.fetchProfile(username);
    return NextResponse.json(profile);
  } catch (error: any) {
    console.error(`[API_PROFILE_ERROR] For username @${request.body}:`, error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred.", code: "SCRAPING_FAILED" },
      { status: 500 }
    );
  }
}
