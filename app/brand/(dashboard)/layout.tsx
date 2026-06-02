import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LayoutDashboard, Award, Settings, LogOut, HeartHandshake, FileText } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/notifications/notification-bell";

const BRAND_NAV_ITEMS = [
  { href: "/brand",           label: "Overview Dashboard", icon: LayoutDashboard },
  { href: "/brand/campaigns", label: "Campaigns Manager",  icon: Award },
  { href: "/brand/invoices",  label: "Billing & Invoices",  icon: FileText },
];

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("brand_session");

  if (!sessionCookie) {
    redirect("/brand/login");
  }

  const session = JSON.parse(sessionCookie.value);
  const initials = (session.name || "Brand")
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-screen w-full bg-slate-900 overflow-hidden text-slate-200 font-sans">
      
      {/* Sidebar navigation */}
      <aside className="w-[260px] bg-slate-950/60 border-r border-slate-800/80 flex flex-col shrink-0 relative z-20 backdrop-blur-xl">
        {/* Brand logo header */}
        <div className="h-[72px] flex items-center px-6 border-b border-slate-800/60 shrink-0 gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
            W
          </div>
          <div>
            <span className="font-bold text-[14px] tracking-tight text-white block">WeCollab</span>
            <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider -mt-0.5">Brand Partner</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Console Menu</p>
          <nav className="flex flex-col gap-1">
            {BRAND_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/40 font-bold transition-all text-[12px] group"
              >
                <Icon className="h-4.5 w-4.5 shrink-0 text-slate-500 group-hover:text-indigo-400 transition" strokeWidth={2} />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Profile Card & Logout */}
        <div className="p-4 border-t border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 px-3.5 py-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/40 mb-2">
            <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-[11px] shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-[12px] font-bold text-white truncate">{session.name}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Verified Client</p>
            </div>
          </div>

          <form action={async () => {
            "use server";
            const { cookies } = await import("next/headers");
            (await cookies()).delete("brand_session");
            redirect("/brand/login");
          }}>
            <button type="submit" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 font-bold transition text-[12px]">
              <LogOut className="h-4.5 w-4.5 shrink-0 text-slate-500 hover:text-rose-400" strokeWidth={2} />
              Disconnect
            </button>
          </form>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Navbar */}
        <header className="h-[72px] bg-slate-950/20 border-b border-slate-800/60 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400">
            <span>Client Workspace</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-200">Overview</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Notifications bell */}
            <NotificationBell userId={session.id} userType="admin" />
            
            <button className="text-slate-400 hover:text-white transition">
              <Settings className="h-4.5 w-4.5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-[11px]">
              {initials}
            </div>
          </div>
        </header>

        {/* Page contents */}
        <div className="flex-1 overflow-auto p-8 bg-slate-950/20">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
