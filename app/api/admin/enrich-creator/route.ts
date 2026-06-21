import { NextResponse } from "next/server";
import { client } from "@/lib/trigger";

export async function POST(req: Request) {
  try {
    const { username, creatorId, provider = "rapidapi" } = await req.json();

    if (!username) {
      return NextResponse.json({ success: false, error: "Username is required." }, { status: 400 });
    }

    console.log(`[ENRICH_DISPATCH] Dispatching Trigger.dev job for creator: @${username}`);

    const event = await client.sendEvent({
      name: "creator.enrichment.requested",
      payload: { 
        username, 
        creatorId: creatorId || null, 
        provider 
      },
    });

    return NextResponse.json({
      success: true,
      message: `Enrichment task dispatched for @${username}.`,
      eventId: event.id,
    });
  } catch (error: any) {
    console.error("[ENRICH_DISPATCH_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch enrichment job." },
      { status: 500 }
    );
  }
}
