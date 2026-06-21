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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
        <p className="text-slate-500 text-[14px] font-medium mt-1">
          {pending} pending · {done} completed
        </p>
      </div>
      <div className="max-w-2xl">
        <TaskFeed tasks={tasks} employeeId={session.id} creators={creatorStubs} />
      </div>
    </div>
  );
}
