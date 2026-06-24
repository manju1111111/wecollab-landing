import { NextResponse } from "next/server";
import { instaloaderService } from "../../../../lib/instagram/instaloader";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: "Username parameter is required.", code: "MISSING_USERNAME" }, { status: 400 });
    }

    console.log(`[API_POSTS] Fetching Instagram posts for: @${username}`);
    const posts = await instaloaderService.fetchPosts(username);
    return NextResponse.json(posts);
  } catch (error: any) {
    console.error(`[API_POSTS_ERROR] For username @${request.body}:`, error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred.", code: "SCRAPING_FAILED" },
      { status: 500 }
    );
  }
}
