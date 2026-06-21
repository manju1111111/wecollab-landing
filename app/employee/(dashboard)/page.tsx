import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/supabase/session-crypto";
import { EmployeeDashboardClient } from "@/components/employee/dashboard-client";

export default async function EmployeeDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  if (!sessionCookie) redirect("/employee/login");
  
  const session = verifySession(sessionCookie.value);
  if (!session) redirect("/employee/login");

  const supabase = await createAdminClient();

  // Fetch employee profile
  const { data: employee } = await supabase
    .from("employees")
    .select("id, full_name, role")
    .eq("id", session.id)
    .maybeSingle();

  // Fetch assigned creators with deal statuses
  let assignedCreators: any[] = [];
  try {
    const { data: creators } = await supabase
      .from("creators")
      .select("id, name, username, profile_image, followers, category")
      .eq("assigned_employee", session.id)
      .order("followers", { ascending: false });

    if (creators && creators.length > 0) {
      const { data: notes } = await supabase
        .from("employee_creator_notes")
        .select("creator_id, deal_status")
        .eq("employee_id", session.id);

      const notesMap = new Map((notes || []).map(n => [n.creator_id, n.deal_status]));
      assignedCreators = creators.map(c => ({
        ...c,
        _deal_status: notesMap.get(c.id) || "new",
      }));
    }
  } catch (e) {
    console.warn("[EMPLOYEE_DASH] creators:", e);
  }

  // Fetch tasks from fallback-db
  let tasks: any[] = [];
  try {
    const { getTasks } = await import("@/lib/supabase/fallback-db");
    const rawTasks = await getTasks(supabase, session.id);

    const creatorMap = new Map(assignedCreators.map(c => [c.id, c.name]));
    tasks = (rawTasks || []).map((t: any) => ({
      ...t,
      creator_name: t.creator_id ? creatorMap.get(t.creator_id) : undefined,
    }));
  } catch (e) {
    console.warn("[EMPLOYEE_DASH] tasks:", e);
  }

  return (
    <EmployeeDashboardClient
      employee={employee}
      assignedCreators={assignedCreators}
      initialTasks={tasks}
      employeeId={session.id}
    />
  );
}
