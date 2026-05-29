import { createAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AssignedCreatorsTable } from "@/components/employee/assigned-creators-table";

export default async function EmployeeCreatorsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  if (!sessionCookie) redirect("/employee/login");
  let session: { id: string; role: string };
  try { session = JSON.parse(sessionCookie.value); } catch { redirect("/employee/login"); }

  const supabase = await createAdminClient();

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
    console.warn("[CREATORS_PAGE] fetch error:", e);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Creators</h1>
        <p className="text-slate-500 text-[14px] font-medium mt-1">
          {assignedCreators.length} creator{assignedCreators.length !== 1 ? "s" : ""} assigned to you
        </p>
      </div>
      <AssignedCreatorsTable creators={assignedCreators} employeeId={session.id} />
    </div>
  );
}
