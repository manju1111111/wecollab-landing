import { NextResponse } from "next/server";
import { client } from "@/lib/trigger";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const runId = searchParams.get("runId");

    if (!eventId && !runId) {
      return NextResponse.json({ success: false, error: "eventId or runId is required." }, { status: 400 });
    }

    if (runId) {
      const run = await client.getRun(runId);
      return NextResponse.json({
        success: true,
        status: run.status,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        output: run.output,
      });
    }

    // Fallback: search by event ID
    try {
      const eventDetails = await (client as any).getEvent(eventId!);
      return NextResponse.json({
        success: true,
        eventId,
        runs: eventDetails.runs || [],
      });
    } catch (err: any) {
      // Fallback: If SDK client doesn't support getEvent, hit Trigger API directly
      const apiKey = process.env.TRIGGER_API_KEY;
      const apiUrl = process.env.TRIGGER_API_URL || "https://api.trigger.dev";
      
      if (!apiKey) {
        return NextResponse.json({ success: false, error: "TRIGGER_API_KEY is not configured on the server." }, { status: 500 });
      }

      const response = await fetch(`${apiUrl}/api/v1/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      
      if (response.ok) {
        const eventData = await response.json();
        return NextResponse.json({
          success: true,
          eventId,
          runs: eventData.runs || [],
        });
      }
      
      return NextResponse.json({ success: false, error: "Failed to fetch event status from Trigger.dev REST API." }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[ENRICH_STATUS_ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve job status." },
      { status: 500 }
    );
  }
}
