"use client";

import { usePathname } from "next/navigation";

const ROUTE_MAP: Record<string, string> = {
  "/employee": "Dashboard",
  "/employee/pipeline": "Pipeline",
  "/employee/creators": "My Creators",
  "/employee/tasks": "My Tasks",
  "/employee/contracts": "Contracts",
  "/employee/activity": "Activity",
  "/employee/reports": "Reports",
  "/employee/settings": "Settings",
};

export function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const activeLabel = ROUTE_MAP[pathname] || "Workspace";

  return (
    <p className="text-[13.5px] text-slate-400 font-medium flex items-center gap-1.5 select-none">
      <span>Workspace</span>
      <span className="text-slate-300 font-normal">/</span>
      <span className="text-slate-900 font-bold tracking-tight">{activeLabel}</span>
    </p>
  );
}
