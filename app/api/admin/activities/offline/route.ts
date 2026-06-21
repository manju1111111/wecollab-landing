import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateActivityStatus } from "@/lib/supabase/fallback-db";

function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json({ error: "Missing employeeId" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { error } = await updateActivityStatus(supabase, employeeId, "offline", null);

    if (error) {
      console.error("[OFFLINE_API_UNLOAD_ERROR]", error);
      return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[OFFLINE_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to mark offline" }, { status: 500 });
  }
}
