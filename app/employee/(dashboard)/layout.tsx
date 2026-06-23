import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Settings, LogOut } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ActivityTracker } from "@/components/employee/activity-tracker";
import { SidebarLinks } from "@/components/employee/sidebar-links";
import { SidebarProfileCard } from "@/components/employee/sidebar-profile-card";
import { HeaderBreadcrumbs } from "@/components/employee/header-breadcrumbs";
import { verifySession } from "@/lib/supabase/session-crypto";
import { EmployeeMobileDrawer } from "@/components/employee/mobile-drawer";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");

  if (!sessionCookie) {
    redirect("/employee/login");
  }

  let sessionUser: { id: string; full_name: string; role: string; status: string } | null = null;
  try {
    const session = verifySession(sessionCookie.value);
    const userRole = session?.role ? session.role.toLowerCase() : "";
    const allowedRoles = ["employee", "admin", "manager", "researcher", "senior_employee", "team_lead"];
    if (!session || !allowedRoles.includes(userRole)) {
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

  const logoutAction = async () => {
    "use server";
    const { cookies } = await import("next/headers");
    (await cookies()).delete("employee_session");
    redirect("/employee/login");
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      <ActivityTracker employeeId={session.id} />

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-[240px] bg-white border-r border-slate-200/60 flex flex-col shrink-0 relative z-20">

        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden shadow-sm shrink-0 border border-slate-200/50">
              <Image src="/assets/logo.jpg" alt="WeCollab Logo" fill className="object-cover" />
            </div>
            <div>
              <span className="font-bold text-[13.5px] tracking-tight text-slate-950 block">WeCollab</span>
              <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wider -mt-0.5">Employee Portal</span>
            </div>
          </div>
        </div>

        {/* Nav Links Section */}
        <div className="p-3.5 flex-1 overflow-y-auto flex flex-col gap-4">
          <div>
            <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 px-2.5">Workspace</p>
            <SidebarLinks />
          </div>
        </div>

        {/* Bottom Section: Settings + Profile (Separated Visually) */}
        <div className="p-3.5 border-t border-slate-100 shrink-0 flex flex-col gap-2.5">
          {/* Settings & Logout Links */}
          <div className="flex flex-col gap-0.5">
            <Link 
              href="/employee/settings" 
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold transition-all text-[12px]"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={2} />
              Settings
            </Link>

            <form action={logoutAction}>
              <button 
                type="submit" 
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 font-bold transition-all text-[12px] cursor-pointer text-left"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-400 shrink-0 group-hover:text-rose-500" strokeWidth={2} />
                Log out
              </button>
            </form>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Profile Card with Status Selector Dropup */}
          <SidebarProfileCard 
            initials={initials} 
            name={session.full_name || "Employee"} 
            role={session.role || "Team Member"} 
          />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <header className="h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <EmployeeMobileDrawer initials={initials} name={session.full_name || "Employee"} role={session.role || "Team Member"} logoutAction={logoutAction} />
            <HeaderBreadcrumbs />
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell userId={session.id} userType="employee" />
            <div className="h-7 w-7 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-[11px] border border-purple-100">
              {initials}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto py-3 px-4 sm:py-5 sm:px-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
