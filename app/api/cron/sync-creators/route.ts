import { NextResponse } from "next/server";
import { searchEngine } from "@/lib/search-client";

// This is meant to be hit securely via Vercel Cron or a secure trigger
export async function GET(request: Request) {
  // In production, we'd verify the request comes from a trusted source
  // e.g., const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return new Response('Unauthorized', { status: 401 });

  try {
    console.log("[CRON] Starting creator sync from external APIs...");

    // 1. Fetch data from an external API (Mocking this)
    // const response = await fetch("https://api.modash.io/v1/creators", { ... });
    // const updatedStats = await response.json();
    
    // Simulating a delay for the external API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 2. Simulate updating a specific creator's stats in our Search Engine
    // Let's pretend we fetched new stats for Marcus Chen (c_002)
    const newFollowers = 1450000; // Increased followers
    const newScore = 9.45; // Increased score

    await searchEngine.updateObject("c_002", {
      totalFollowers: newFollowers,
      score: newScore,
    });

    console.log(`[CRON] Successfully synced creators.`);
    return NextResponse.json({ success: true, message: "Sync complete." });
  } catch (error) {
    console.error("[CRON_ERROR]", error);
    return new NextResponse("Internal Cron Error", { status: 500 });
  }
}
