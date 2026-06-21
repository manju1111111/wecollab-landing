"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CheckSquare, Kanban, FileText, Activity, BarChart2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/employee",          label: "Dashboard",    icon: LayoutDashboard },
  { href: "/employee/creators", label: "My Creators",  icon: Users },
  { href: "/employee/tasks",    label: "My Tasks",     icon: CheckSquare },
  { href: "/employee/pipeline", label: "Pipeline",     icon: Kanban },
  { href: "/employee/contracts", label: "Contracts",    icon: FileText },
  { href: "/employee/activity", label: "Activity",     icon: Activity },
  { href: "/employee/reports",  label: "Reports",      icon: BarChart2 },
];

export function SidebarLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== "/employee" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-extrabold transition-all duration-200 text-[12.5px] group relative ${
              isActive
                ? "bg-purple-50/70 text-purple-700 shadow-[0_1px_2px_rgba(124,58,237,0.02)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-purple-600 before:rounded-full pl-4.5"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/70"
            }`}
          >
            <Icon 
              className={`h-4 w-4 shrink-0 transition-colors ${
                isActive ? "text-purple-600" : "text-slate-400 group-hover:text-slate-600"
              }`} 
              strokeWidth={isActive ? 2.5 : 2} 
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
