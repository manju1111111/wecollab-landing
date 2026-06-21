import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServer();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    let dbQuery = supabase
      .from("creators")
      .select("id, name, username, category, platform, status, followers, engagement_rate, assigned_employee, created_at")
      .order("name");

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,username.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error("[CREATORS_API]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ creators: data || [] });
  } catch (error: any) {
    console.error("[CREATORS_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch creators" }, { status: 500 });
  }
}
