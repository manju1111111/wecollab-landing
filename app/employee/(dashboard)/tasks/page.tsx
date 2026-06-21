import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/supabase/session-crypto";
import { TaskFeed } from "@/components/employee/task-feed";

export default async function EmployeeTasksPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  if (!sessionCookie) redirect("/employee/login");
  const session = verifySession(sessionCookie.value);
  if (!session) redirect("/employee/login");

  const supabase = await createAdminClient();

  let tasks: any[] = [];
  let creatorStubs: { id: string; name: string }[] = [];

  try {
    const { data: creators } = await supabase
      .from("creators")
      .select("id, name")
      .eq("assigned_employee", session.id);
    creatorStubs = creators || [];

    const creatorMap = new Map((creators || []).map(c => [c.id, c.name]));

    const { getTasks } = await import("@/lib/supabase/fallback-db");
    const rawTasks = await getTasks(supabase, session.id);

    tasks = (rawTasks || []).map((t: any) => ({
      ...t,
      creator_name: t.creator_id ? creatorMap.get(t.creator_id) : undefined,
    }));
  } catch (e) {
    console.warn("[TASKS_PAGE] fetch error:", e);
  }

  const pending = tasks.filter((t: any) => !t.completed_at).length;
  const done = tasks.filter((t: any) => t.completed_at).length;

  return (
    <TaskFeed tasks={tasks} employeeId={session.id} creators={creatorStubs} />
  );
}
