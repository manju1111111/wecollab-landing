import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/supabase/session-crypto";
import { PortfolioGrowthChart, CategoryBreakdownChart, PlatformMixChart } from "@/components/employee/portfolio-charts";
import { PerformanceScore } from "@/components/employee/performance-score";

export default async function EmployeeReportsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  const session = sessionCookie
    ? (verifySession(sessionCookie.value) || { id: "guest", role: "Employee" })
    : { id: "guest", role: "Employee" };

  const supabase = await createClient();

  // Fetch assigned creators
  let creators: any[] = [];
  try {
    const { data } = await supabase
      .from("creators")
      .select("id, name, followers, engagement_rate, category, platforms, tags, created_at")
      .eq("assigned_employee", session.id)
      .order("followers", { ascending: false });
    creators = data || [];
  } catch (e) { console.warn("[REPORTS]", e); }

  // Fetch notes (for deal status)
  let notes: any[] = [];
  try {
    const { data } = await supabase
      .from("employee_creator_notes")
      .select("creator_id, deal_status")
      .eq("employee_id", session.id);
    notes = data || [];
  } catch (e) { console.warn("[REPORTS_NOTES]", e); }

  const notesMap = new Map(notes.map(n => [n.creator_id, n]));
  const contacted = creators.filter(c => {
    const s = notesMap.get(c.id)?.deal_status;
    return s && s !== "new" && s !== "not_interested";
  }).length;
  const dealsWon = notes.filter(n => n.deal_status === "deal_closed").length;

  // Fetch completed tasks count
  let tasksCompleted = 0;
  try {
    const { getTasks } = await import("@/lib/supabase/fallback-db");
    const rawTasks = await getTasks(supabase, session.id);
    tasksCompleted = (rawTasks || []).filter((t: any) => t.completed_at).length;
  } catch (e) { console.warn("[REPORTS_TASKS]", e); }

  // Fetch week hours
  let weekHours = 0;
  try {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: wl } = await supabase
      .from("employee_work_log")
      .select("hours")
      .eq("employee_id", session.id)
      .gte("date", weekAgo.toISOString().split("T")[0]);
    weekHours = (wl || []).reduce((s, r) => s + (r.hours || 0), 0);
  } catch (e) { console.warn("[REPORTS_HOURS]", e); }

  // Build chart data ──────────────────────────────────────────────

  // Growth: cumulative followers by creator added date
  const growthMap: Record<string, number> = {};
  creators.forEach(c => {
    const d = new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    growthMap[d] = (growthMap[d] || 0) + (c.followers || 0);
  });
  let cum = 0;
  const growthData = Object.entries(growthMap)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([name, val]) => { cum += val; return { name, value: cum }; });

  // Category breakdown
  const catCounts: Record<string, number> = {};
  creators.forEach(c => { if (c.category) catCounts[c.category] = (catCounts[c.category] || 0) + 1; });
  const categoryData = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  // Platform mix
  const platCounts: Record<string, number> = {};
  creators.forEach(c => {
    (c.platforms || []).forEach((p: any) => {
      if (p.name) platCounts[p.name] = (platCounts[p.name] || 0) + 1;
    });
  });
  const platformData = Object.entries(platCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Reports</h1>
        <p className="text-slate-500 text-[14px] font-medium mt-1">
          Analytics for your {creators.length} assigned creator{creators.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Performance + Growth */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <PerformanceScore
            totalAssigned={creators.length}
            contacted={contacted}
            dealsWon={dealsWon}
            tasksCompleted={tasksCompleted}
            weekHours={weekHours}
          />
        </div>
        <div className="xl:col-span-2">
          <PortfolioGrowthChart data={growthData} />
        </div>
      </div>

      {/* Category + Platform */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CategoryBreakdownChart data={categoryData} />
        <PlatformMixChart data={platformData} />
      </div>
    </div>
  );
}
