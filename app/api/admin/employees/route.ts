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

    // Fetch all employees with their assigned creator counts
    const { data: employees, error } = await supabase
      .from("employees")
      .select("id, full_name, email, role, department, designation, phone, status, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[EMPLOYEES_API]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get assigned creator counts per employee
    const { data: creatorCounts } = await supabase
      .from("creators")
      .select("assigned_employee");

    const countMap: Record<string, number> = {};
    (creatorCounts || []).forEach((c: any) => {
      if (c.assigned_employee) {
        countMap[c.assigned_employee] = (countMap[c.assigned_employee] || 0) + 1;
      }
    });

    // Get completed task counts per employee
    let taskCountMap: Record<string, number> = {};
    try {
      const { data: taskCounts } = await supabase
        .from("employee_tasks")
        .select("employee_id")
        .not("completed_at", "is", null);

      (taskCounts || []).forEach((t: any) => {
        taskCountMap[t.employee_id] = (taskCountMap[t.employee_id] || 0) + 1;
      });
    } catch (e) {
      // Table may not exist yet
    }

    const enriched = (employees || []).map(emp => ({
      ...emp,
      assigned_count: countMap[emp.id] || 0,
      tasks_completed: taskCountMap[emp.id] || 0,
    }));

    return NextResponse.json({ employees: enriched });
  } catch (error) {
    console.error("[EMPLOYEES_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}
