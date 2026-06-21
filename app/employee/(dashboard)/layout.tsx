import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, CheckSquare, Settings, LogOut, Activity, BarChart2, Kanban, FileText } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ActivityTracker } from "@/components/employee/activity-tracker";
import { StatusSelector } from "@/components/employee/status-selector";

const NAV_ITEMS = [
  { href: "/employee",          label: "Dashboard",    icon: LayoutDashboard },
  { href: "/employee/creators", label: "My Creators",  icon: Users },
  { href: "/employee/tasks",    label: "My Tasks",     icon: CheckSquare },
  { href: "/employee/pipeline", label: "Pipeline",     icon: Kanban },
  { href: "/employee/contracts", label: "Contracts",    icon: FileText },
  { href: "/employee/activity", label: "Activity",     icon: Activity },
  { href: "/employee/reports",  label: "Reports",      icon: BarChart2 },
];

import { verifySession } from "@/lib/supabase/session-crypto";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");

  if (!sessionCookie) {
    redirect("/employee/login");
  }

  let sessionUser: { id: string; full_name: string; role: string; status: string } | null = null;
  try {
    const session = verifySession(sessionCookie.value);
    if (!session || !["employee", "admin", "senior_employee", "team_lead"].includes(session.role)) {
      throw new Error("Invalid session");
    }
    const { createAdminClient } = await import("@/lib/supabase/server");
    const supabase = await createAdminClient();
    const { data: employee } = await supabase
      .from("employees")
      .select("id, full_name, role, status")
      .eq("id", session.id)
      .eq("status", "active")
      .maybeSingle();

    if (!employee) {
      // Expired, deleted or deactivated profile - purge session cookie and redirect
      cookieStore.delete("employee_session");
      redirect("/employee/login");
    }
    sessionUser = employee;
  } catch (e) {
    cookieStore.delete("employee_session");
    redirect("/employee/login");
  }

  const session = sessionUser;

  const initials = (session.full_name || session.role || "E")
    .split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <ActivityTracker employeeId={session.id} />

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="w-[240px] bg-white border-r border-slate-200 flex flex-col shrink-0 relative z-20">

        {/* Logo */}
        <div className="h-[64px] flex items-center px-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              W
            </div>
            <div>
              <span className="font-bold text-[15px] tracking-tight text-slate-900">WeCollab</span>
              <span className="block text-[10px] text-slate-400 font-medium -mt-0.5">Employee Portal</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="p-3 flex-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 mt-2">Menu</p>
          <nav className="flex flex-col gap-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold transition-colors text-[13px] group"
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom: Profile + Logout */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          {/* Profile mini-card */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 mb-1">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[12px] shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-[13px] font-bold text-slate-800 truncate">{session.full_name || "Employee"}</p>
              <p className="text-[11px] text-slate-400 font-medium">{session.role || "Team Member"}</p>
            </div>
          </div>
          
          <StatusSelector />

          <Link href="/employee/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold transition-colors text-[13px]">
            <Settings className="h-4 w-4 shrink-0" strokeWidth={2} />
            Settings
          </Link>

          <form action={async () => {
            "use server";
            const { cookies } = await import("next/headers");
            (await cookies()).delete("employee_session");
            redirect("/employee/login");
          }}>
            <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-semibold transition-colors text-[13px]">
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <header className="h-[64px] bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <p className="text-[14px] font-bold text-slate-500">
            WeCollab <span className="text-slate-300 mx-1">/</span>
            <span className="text-slate-900">Workspace</span>
          </p>
          <div className="flex items-center gap-3.5">
            <NotificationBell userId={session.id} userType="employee" />
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[12px]">
              {initials}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
