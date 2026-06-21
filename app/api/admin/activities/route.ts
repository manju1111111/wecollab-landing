import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getActivities } from "@/lib/supabase/fallback-db";

function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const enriched = await getActivities(supabase);
    return NextResponse.json({ activities: enriched, isMock: false });
  } catch (error) {
    console.error("[ACTIVITIES_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch employee activities" }, { status: 500 });
  }
}

