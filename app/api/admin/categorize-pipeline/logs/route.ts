import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data: logs, error } = await supabase
      .from("creator_categorization_logs")
      .select("*, creators(name, username)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[PIPELINE_LOGS_API_DB_ERROR]", error);
      // Check if table missing error (PGRST116 or 42P01 in pg)
      if (error.code === "PGRST204" || error.message.includes("relation") && error.message.includes("does not exist")) {
        return NextResponse.json({ 
          success: true, 
          tableExists: false, 
          logs: [], 
          message: "Logs table is missing. Run migration first." 
        });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      tableExists: true, 
      logs: logs || [] 
    });

  } catch (error: any) {
    console.error("[PIPELINE_LOGS_API_ERROR]", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch logs" }, { status: 500 });
  }
}
