import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TaskFeed } from "@/components/employee/task-feed";

export default async function EmployeeTasksPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  if (!sessionCookie) redirect("/employee/login");
  let session: { id: string; role: string };
  try { session = JSON.parse(sessionCookie.value); } catch { redirect("/employee/login"); }

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

    const { data: rawTasks } = await supabase
      .from("employee_tasks")
      .select("id, title, due_date, completed_at, creator_id")
      .eq("employee_id", session.id)
      .order("created_at", { ascending: false });

    tasks = (rawTasks || []).map(t => ({
      ...t,
      creator_name: t.creator_id ? creatorMap.get(t.creator_id) : undefined,
    }));
  } catch (e) {
    console.warn("[TASKS_PAGE] fetch error:", e);
  }

  const pending = tasks.filter(t => !t.completed_at).length;
  const done = tasks.filter(t => t.completed_at).length;

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
