import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/supabase/session-crypto";
import {
  Search,
  Lightbulb,
  LayoutDashboard,
  ClipboardList,
  Bookmark,
  MessageSquare,
  PieChart,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { DiscoverMobileDrawer } from "@/components/discover/mobile-drawer";

export default async function DiscoverLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("brand_session");
  let initials = "M";

  if (sessionCookie) {
    try {
      const session = verifySession(sessionCookie.value);
      if (session && session.id) {
        // Live query database to make sure brand name changes reflect instantly
        const { createAdminClient } = await import("@/lib/supabase/server");
        const supabase = await createAdminClient();
        const { data: brand } = await supabase
          .from("brands")
          .select("name")
          .eq("id", session.id)
          .single();
        
        const brandName = brand?.name || session.name || "Brand";
        initials = brandName
          .split(" ")
          .filter(Boolean)
          .map((n: string) => n[0])
          .slice(0, 1)
          .join("")
          .toUpperCase();
      }
    } catch (e) {
      console.error("Failed to query live brand profile:", e);
    }
  }

  const logoutAction = async () => {
    "use server";
    const { cookies } = await import("next/headers");
    (await cookies()).delete("brand_session");
    redirect("/brand/login");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans">
      {/* Left Sidebar */}
      <aside className="hidden md:flex w-[68px] shrink-0 flex-col items-center border-r border-slate-800 bg-[#1e2330] py-4 text-slate-400">
        {/* Logo Area */}
        <Link
          href="/"
          className="mb-6 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-sm hover:opacity-80 transition-opacity"
        >
          <div className="relative h-10 w-10">
            <Image src="/assets/logo.jpg" alt="Wecollab Logo" fill className="object-cover" />
          </div>
        </Link>

        {/* Navigation Icons */}
        <nav className="flex w-full flex-col items-center gap-4">
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
            <Lightbulb className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50 text-white shadow-sm transition-colors cursor-pointer">
            <Search className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
            <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <Link href="/plans">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
              <ClipboardList className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </Link>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
            <Bookmark className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
            <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
            <PieChart className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </nav>

        {/* Bottom Icons */}
        <div className="mt-auto flex w-full flex-col items-center gap-4">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors cursor-pointer">
            <Bell className="h-5 w-5" strokeWidth={1.5} />
            <span className="absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-[#1e2330]"></span>
          </button>
          
          {sessionCookie && (
            <form action={logoutAction}>
              <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-rose-450 transition-colors cursor-pointer" title="Sign Out">
                <LogOut className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </form>
          )}

          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white transition-colors hover:bg-slate-700" title={sessionCookie ? "Active Brand Session" : "Guest Mode"}>
            {initials}
          </button>
          <div className="text-[10px] font-bold text-violet-400">28.4k</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {/* Mobile Header */}
        <header className="flex md:hidden h-14 bg-[#1e2330] border-b border-slate-800 items-center justify-between px-4 shrink-0 text-white">
          <div className="flex items-center gap-2">
            <DiscoverMobileDrawer initials={initials} hasSession={!!sessionCookie} logoutAction={logoutAction} />
            <span className="font-bold text-[14px] tracking-tight">WeCollab</span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
            {initials}
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
