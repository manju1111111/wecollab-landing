import { NextResponse } from "next/server";
import { client } from "@/lib/trigger";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const runId = searchParams.get("runId");

    if (!eventId && !runId) {
      return NextResponse.json({ success: false, error: "eventId or runId is required." }, { status: 400 });
    }

    if (runId) {
      // 1. Attempt to fetch from local database for fast step progress
      const { data: dbRun } = await supabase
        .from("creator_enrichment_runs")
        .select("*")
        .eq("trigger_run_id", runId)
        .maybeSingle();

      if (dbRun) {
        if (dbRun.status === "success" && dbRun.metadata?.output) {
          return NextResponse.json({
            success: true,
            status: "SUCCESS",
            startedAt: dbRun.started_at,
            completedAt: dbRun.completed_at,
            output: dbRun.metadata.output,
            metadata: dbRun.metadata,
          });
        }
        
        if (dbRun.status === "failed") {
          return NextResponse.json({
            success: true,
            status: "FAILED",
            startedAt: dbRun.started_at,
            completedAt: dbRun.completed_at,
            error: dbRun.error || "Analysis failed.",
            metadata: dbRun.metadata,
          });
        }

        if (dbRun.status === "running" || dbRun.status === "pending") {
          return NextResponse.json({
            success: true,
            status: dbRun.status.toUpperCase(),
            metadata: dbRun.metadata,
            startedAt: dbRun.started_at,
            completedAt: dbRun.completed_at,
            error: dbRun.error,
          });
        }
      }

      // 2. If finished or not in DB, query Trigger.dev directly
      try {
        const run = await client.getRun(runId);
        return NextResponse.json({
          success: true,
          status: run.status,
          startedAt: run.startedAt,
          completedAt: run.completedAt,
          output: run.output,
          metadata: dbRun?.metadata || {},
        });
      } catch (triggerErr: any) {
        console.warn(`[ENRICH_STATUS_WARN] Failed to query Trigger.dev directly for runId ${runId}:`, triggerErr.message);
        if (dbRun) {
          return NextResponse.json({
            success: true,
            status: dbRun.status.toUpperCase(),
            metadata: dbRun.metadata,
            startedAt: dbRun.started_at,
            completedAt: dbRun.completed_at,
            error: dbRun.error || triggerErr.message,
            output: dbRun.metadata?.output || null,
          });
        }
        throw triggerErr;
      }
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

