import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Lightbulb,
  LayoutDashboard,
  ClipboardList,
  Bookmark,
  MessageSquare,
  PieChart,
  Bell,
} from "lucide-react";

export default function PlansLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans">
      {/* Left Sidebar - Shared App Layout */}
      <aside className="flex w-[68px] shrink-0 flex-col items-center border-r border-slate-800 bg-[#1e2330] py-4 text-slate-400">
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
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Lightbulb className="h-5 w-5" strokeWidth={1.5} />
          </button>
          
          <Link href="/discover">
            <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </Link>

          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <LayoutDashboard className="h-5 w-5" strokeWidth={1.5} />
          </button>
          
          <Link href="/plans">
            {/* ACTIVE STATE for Plans */}
            <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700/50 text-white shadow-sm transition-colors">
              <ClipboardList className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </Link>

          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Bookmark className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <MessageSquare className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <PieChart className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </nav>

        {/* Bottom Icons */}
        <div className="mt-auto flex w-full flex-col items-center gap-4">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Bell className="h-5 w-5" strokeWidth={1.5} />
            <span className="absolute right-2 top-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-[#1e2330]"></span>
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <MessageSquare className="h-5 w-5 text-green-400" strokeWidth={1.5} />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white transition-colors hover:bg-slate-700">
            M
          </button>
          <div className="text-[10px] font-bold text-orange-400">28.4k</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-white">
        {children}
      </div>
    </div>
  );
}
