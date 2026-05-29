import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { ActivityTimeline } from "@/components/employee/activity-timeline";
import { WorkLog } from "@/components/employee/work-log";

export default async function EmployeeActivityPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  const session = sessionCookie
    ? JSON.parse(sessionCookie.value)
    : { id: "guest", role: "Employee" };

  const supabase = await createClient();

  // Fetch activity events
  let events: any[] = [];
  try {
    const { data } = await supabase
      .from("employee_activity_log")
      .select("*")
      .eq("employee_id", session.id)
      .order("created_at", { ascending: false })
      .limit(60);
    events = data || [];
  } catch (e) {
    console.warn("[ACTIVITY_PAGE]", e);
  }

  // Fallback: synthesize events from tasks and notes (before activity_log table exists)
  if (events.length === 0) {
    try {
      const { data: tasks } = await supabase
        .from("employee_tasks")
        .select("id, title, completed_at, created_at")
        .eq("employee_id", session.id)
        .order("created_at", { ascending: false })
        .limit(30);

      const { data: notes } = await supabase
        .from("employee_creator_notes")
        .select("creator_id, note_text, deal_status, updated_at")
        .eq("employee_id", session.id)
        .order("updated_at", { ascending: false })
        .limit(10);

      const taskEvents = (tasks || []).flatMap((t): any[] => [
        { id: `t-${t.id}`, type: "task_created", description: `Created task: "${t.title}"`, created_at: t.created_at },
        ...(t.completed_at ? [{ id: `tc-${t.id}`, type: "task_completed", description: `Completed task: "${t.title}"`, created_at: t.completed_at }] : []),
      ]);

      const noteEvents = (notes || []).map((n): any => ({
        id: `n-${n.creator_id}`,
        type: "note_saved",
        description: `Saved notes on a creator`,
        meta: n.deal_status !== "new" ? `Status: ${n.deal_status}` : undefined,
        created_at: n.updated_at,
      }));

      events = [...taskEvents, ...noteEvents].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (e2) {
      console.warn("[ACTIVITY_FALLBACK]", e2);
    }
  }

  // Fetch work log sessions
  let sessions: any[] = [];
  try {
    const { data } = await supabase
      .from("employee_work_log")
      .select("*")
      .eq("employee_id", session.id)
      .order("created_at", { ascending: false })
      .limit(30);
    sessions = data || [];
  } catch (e) {
    console.warn("[WORK_LOG_FETCH]", e);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity & Work Log</h1>
        <p className="text-slate-500 text-[14px] font-medium mt-1">
          Your timeline and daily hours at a glance
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
          <ActivityTimeline events={events} />
        </div>
        <div className="xl:col-span-2">
          <WorkLog sessions={sessions} employeeId={session.id} />
        </div>
      </div>
    </div>
  );
}
