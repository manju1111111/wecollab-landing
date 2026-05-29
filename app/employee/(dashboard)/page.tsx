import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EmployeeMetricsStrip } from "@/components/employee/metrics-strip";
import { TaskFeed } from "@/components/employee/task-feed";
import { AssignedCreatorsTable } from "@/components/employee/assigned-creators-table";
import { QuickActions } from "@/components/employee/quick-actions";
import { FollowUpCalendar } from "@/components/employee/follow-up-calendar";

export default async function EmployeeDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  if (!sessionCookie) redirect("/employee/login");
  
  let session: { id: string; role: string; full_name: string };
  try {
    session = JSON.parse(sessionCookie.value);
  } catch {
    redirect("/employee/login");
  }

  const supabase = await createAdminClient();

  // Fetch employee profile
  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", session.id)
    .maybeSingle();

  const firstName = employee?.full_name?.split(" ")[0] || session.full_name?.split(" ")[0] || "There";

  // Fetch assigned creators with notes
  let assignedCreators: any[] = [];
  try {
    const { data: creators } = await supabase
      .from("creators")
      .select("id, name, username, profile_image, followers, engagement_rate, avg_reel_views, category, location, bio, verified, platforms, tags")
      .eq("assigned_employee", session.id)
      .order("followers", { ascending: false });

    if (creators && creators.length > 0) {
      const { data: notes } = await supabase
        .from("employee_creator_notes")
        .select("creator_id, note_text, deal_status")
        .eq("employee_id", session.id);

      const notesMap = new Map((notes || []).map(n => [n.creator_id, n]));
      assignedCreators = creators.map(c => ({
        ...c,
        _note: notesMap.get(c.id)?.note_text || "",
        _deal_status: notesMap.get(c.id)?.deal_status || "new",
      }));
    }
  } catch (e) {
    console.warn("[EMPLOYEE_DASH] creators:", e);
  }

  // Fetch tasks
  let tasks: any[] = [];
  try {
    const { data: rawTasks } = await supabase
      .from("employee_tasks")
      .select("id, title, due_date, completed_at, creator_id")
      .eq("employee_id", session.id)
      .order("created_at", { ascending: false });

    const creatorMap = new Map(assignedCreators.map(c => [c.id, c]));
    tasks = (rawTasks || []).map(t => ({
      ...t,
      creator_name: t.creator_id ? creatorMap.get(t.creator_id)?.name : undefined,
      creator_username: t.creator_id ? creatorMap.get(t.creator_id)?.username : undefined,
    }));
  } catch (e) {
    console.warn("[EMPLOYEE_DASH] tasks:", e);
  }

  // Metrics
  const completedTasks = tasks.filter(t => t.completed_at).length;
  const pendingTasks = tasks.filter(t => !t.completed_at).length;
  const avgER = assignedCreators.length > 0
    ? parseFloat((assignedCreators.reduce((s, c) => s + (c.engagement_rate || 0), 0) / assignedCreators.length).toFixed(1))
    : 0;

  const creatorStubs = assignedCreators.map(c => ({ id: c.id, name: c.name, username: c.username || "" }));

  // Follow-up tasks (tasks with due_date, not completed)
  const followUpTasks = tasks
    .filter(t => t.due_date)
    .map(t => ({
      id: t.id,
      creator_name: t.creator_name || "",
      creator_username: t.creator_username || "",
      due_date: t.due_date,
      title: t.title,
      completed_at: t.completed_at,
    }));

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl px-7 py-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">
            Here's your workspace overview for today.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
          <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Role</span>
          <span className="text-[14px] font-black text-indigo-800">{employee?.role || session.role || "Employee"}</span>
        </div>
      </div>

      {/* Metrics Strip */}
      <EmployeeMetricsStrip
        assignedCount={assignedCreators.length}
        completedTasks={completedTasks}
        avgEngagement={avgER}
        pendingTasks={pendingTasks}
      />

      {/* Row 1: Creators table (wide) + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <AssignedCreatorsTable creators={assignedCreators} employeeId={session.id} />
        </div>
        <div className="xl:col-span-1">
          <QuickActions creators={creatorStubs} />
        </div>
      </div>

      {/* Row 2: Task Feed + Follow-up Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TaskFeed tasks={tasks} employeeId={session.id} creators={creatorStubs} />
        <FollowUpCalendar tasks={followUpTasks} />
      </div>

    </div>
  );
}
