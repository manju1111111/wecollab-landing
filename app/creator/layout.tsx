import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LayoutDashboard, Target, UserCheck, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { verifySession } from "@/lib/supabase/session-crypto";
import { CreatorMobileDrawer } from "@/components/creator/mobile-drawer";

const CREATOR_NAV_ITEMS = [
  { href: "/creator",          label: "Dashboard",   icon: LayoutDashboard },
  { href: "/creator/campaigns", label: "My Campaigns", icon: Target },
];

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("creator_session");

  if (!sessionCookie) {
    redirect("/creator/login");
  }

  let session: { id: string; name: string; email: string; role: string } | null = null;
  try {
    session = verifySession(sessionCookie.value);
    if (!session) throw new Error("Invalid signature");
  } catch (e) {
    cookieStore.delete("creator_session");
    redirect("/creator/login");
  }

  if (!session || session.role !== "creator") {
    cookieStore.delete("creator_session");
    redirect("/creator/login");
  }

  // Fetch verified status from Database
  const { createAdminClient } = await import("@/lib/supabase/server");
  const supabase = await createAdminClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("name, verification_status")
    .eq("id", session.id)
    .maybeSingle();

  const isVerified = creator?.verification_status === "Verified";

  const initials = (session.name || "Creator")
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const logoutAction = async () => {
    "use server";
    const { cookies } = await import("next/headers");
    (await cookies()).delete("creator_session");
    redirect("/creator/login");
  };

  return (
    <div className="flex h-screen w-full bg-slate-955 overflow-hidden text-slate-200 font-sans">
      
      {/* Sidebar navigation */}
      <aside className="hidden md:flex w-[260px] bg-slate-900/60 border-r border-slate-800/80 flex flex-col shrink-0 relative z-20 backdrop-blur-xl">
        {/* logo header */}
        <div className="h-[72px] flex items-center px-6 border-b border-slate-800/60 shrink-0 gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-black text-base shadow-sm">
            W
          </div>
          <div>
            <span className="font-bold text-[14px] tracking-tight text-white block">WeCollab</span>
            <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider -mt-0.5">Creator Console</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Console Menu</p>
          <nav className="flex flex-col gap-1">
            {CREATOR_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/40 font-bold transition-all text-[12px] group"
              >
                <Icon className="h-4.5 w-4.5 shrink-0 text-slate-500 group-hover:text-violet-400 transition" strokeWidth={2} />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Profile Card & Logout */}
        <div className="p-4 border-t border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 px-3.5 py-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/40 mb-2">
            <div className="h-8 w-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-[11px] shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-[12px] font-bold text-white truncate flex items-center gap-1.5">
                {session.name}
                {isVerified && <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {isVerified ? "Verified Creator" : "Pending Audit"}
              </p>
            </div>
          </div>

          <form action={logoutAction}>
            <button type="submit" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 font-bold transition text-[12px] cursor-pointer">
              <LogOut className="h-4.5 w-4.5 shrink-0 text-slate-500 hover:text-rose-400" strokeWidth={2} />
              Disconnect
            </button>
          </form>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Navbar */}
        <header className="h-[72px] bg-slate-900/20 border-b border-slate-800/60 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400">
            <CreatorMobileDrawer creatorName={session.name} initials={initials} isVerified={isVerified} logoutAction={logoutAction} />
            <span className="hidden sm:inline">Creator Command</span>
            <span className="hidden sm:inline text-slate-700">/</span>
            <span className="text-slate-200">Overview</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationBell userId={session.id} userType="employee" />
            
            <button className="text-slate-400 hover:text-white transition cursor-pointer">
              <Settings className="h-4.5 w-4.5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-[11px]">
              {initials}
            </div>
          </div>
        </header>

        {/* Page contents */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 bg-slate-900/10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
