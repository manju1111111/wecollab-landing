import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LayoutDashboard, Users, CheckSquare, Activity, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { logoutEmployee } from "@/app/employee/actions";

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");

  if (!sessionCookie) {
    redirect("/employee/login");
  }

  const session = JSON.parse(sessionCookie.value);

  // If Admin tries to access, optionally let them in or redirect them.
  // For now, let's allow everyone with a valid session to see the employee portal.

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden text-slate-900 font-sans">
      
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-slate-200 flex flex-col shrink-0 relative z-20">
        <div className="h-[72px] flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-lg">
              W
            </div>
            <span className="font-bold text-lg tracking-tight">WeCollab</span>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Menu</div>
          <nav className="flex flex-col gap-1">
            <Link href="/employee" className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-100 text-slate-900 font-bold transition-colors">
              <LayoutDashboard className="h-4 w-4" strokeWidth={2.5} />
              <span className="text-[13px]">Dashboard</span>
            </Link>
            <Link href="/employee" className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold transition-colors">
              <Users className="h-4 w-4" strokeWidth={2.5} />
              <span className="text-[13px]">Assigned Creators</span>
            </Link>
            <Link href="/employee" className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold transition-colors">
              <CheckSquare className="h-4 w-4" strokeWidth={2.5} />
              <span className="text-[13px]">My Tasks</span>
            </Link>
            <Link href="/employee" className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold transition-colors">
              <Activity className="h-4 w-4" strokeWidth={2.5} />
              <span className="text-[13px]">Activity</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 mt-auto">
          <nav className="flex flex-col gap-1">
            <Link href="/employee" className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold transition-colors">
              <Settings className="h-4 w-4" strokeWidth={2.5} />
              <span className="text-[13px]">Settings</span>
            </Link>
            <form action={async () => {
              "use server";
              const { cookies } = await import("next/headers");
              (await cookies()).delete("employee_session");
              redirect("/employee/login");
            }}>
              <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold transition-colors">
                <LogOut className="h-4 w-4" strokeWidth={2.5} />
                <span className="text-[13px]">Log out</span>
              </button>
            </form>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-[15px] font-bold text-slate-900">Workspace</h2>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-[12px]">
              {session.role ? session.role[0] : 'E'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-5xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
