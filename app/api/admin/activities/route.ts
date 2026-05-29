import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    // 1. Fetch active employees
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, full_name, role, status")
      .eq("status", "active");

    if (empError) {
      console.error("[ACTIVITIES_API_EMP_ERROR]", empError);
      return NextResponse.json({ error: empError.message }, { status: 500 });
    }

    // 2. Fetch employee activity statuses
    const { data: activities, error: actError } = await supabase
      .from("employee_activity")
      .select("employee_id, status, session_start, last_active, current_activity");

    if (actError) {
      // Graceful fallback to mock activity data if the table doesn't exist yet
      if (actError.code === "P0001" || actError.message.includes("does not exist")) {
        console.warn("[ACTIVITIES_API] 'employee_activity' table does not exist. Returning mock data.");
        const enrichedMock = (employees || []).map((emp, index) => {
          const mocks = [
            { status: "online", current_activity: "Viewing Creators", startOffset: 5 * 60 * 60 * 1000 },
            { status: "online", current_activity: "Managing Pipeline", startOffset: 4 * 60 * 60 * 1000 },
            { status: "break", current_activity: "On Break", startOffset: 2 * 60 * 60 * 1000 },
            { status: "online", current_activity: "Reviewing Tasks", startOffset: 6 * 60 * 60 * 1000 },
            { status: "offline", current_activity: null, startOffset: 0 }
          ];
          const mock = mocks[index % mocks.length];
          const sessionStart = mock.startOffset ? new Date(Date.now() - mock.startOffset).toISOString() : null;
          const lastActive = new Date(Date.now() - (index * 15 * 60 * 1000)).toISOString();
          return {
            id: emp.id,
            name: emp.full_name,
            role: emp.role,
            status: mock.status,
            session_start: sessionStart,
            last_active: lastActive,
            current_activity: mock.current_activity
          };
        });
        return NextResponse.json({ activities: enrichedMock, isMock: true });
      }
      return NextResponse.json({ error: actError.message }, { status: 500 });
    }

    // Map and enrich data
    const activityMap = new Map();
    (activities || []).forEach(act => {
      activityMap.set(act.employee_id, act);
    });

    const enriched = (employees || []).map(emp => {
      const act = activityMap.get(emp.id) || {
        status: "offline",
        session_start: null,
        last_active: null,
        current_activity: null
      };

      return {
        id: emp.id,
        name: emp.full_name,
        role: emp.role,
        status: act.status,
        session_start: act.session_start,
        last_active: act.last_active,
        current_activity: act.current_activity
      };
    });

    // Sort to show Online first, then Break, then Away, then Offline
    const statusOrder: Record<string, number> = { online: 0, break: 1, away: 2, offline: 3 };
    enriched.sort((a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4));

    return NextResponse.json({ activities: enriched, isMock: false });
  } catch (error) {
    console.error("[ACTIVITIES_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch employee activities" }, { status: 500 });
  }
}
