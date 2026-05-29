"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Circle, User } from "lucide-react";

interface EmployeeActivity {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline" | "away" | "break";
  session_start: string | null;
  last_active: string | null;
  current_activity: string | null;
}

export function EmployeeActivityList() {
  const [activities, setActivities] = useState<EmployeeActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [now, setNow] = useState<number>(Date.now());

  // Periodically trigger a local re-render to update dynamic working durations
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000); // every minute
    return () => clearInterval(timer);
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/admin/activities");
      const data = await res.json();
      if (data.activities) {
        setActivities(data.activities);
        setIsDemo(!!data.isMock);
      }
    } catch (e) {
      console.error("Failed to fetch employee activities:", e);
    } finally {
      setLoading(false);
    }
  };

  // 1. Fetch initial states
  useEffect(() => {
    fetchActivities();
  }, []);

  // 2. Real-time channel listener
  useEffect(() => {
    if (loading || isDemo) return;

    const supabase = createClient();

    // Sort function helper
    const sortActivities = (list: EmployeeActivity[]) => {
      const statusOrder: Record<string, number> = { online: 0, break: 1, away: 2, offline: 3 };
      return [...list].sort((a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4));
    };

    const channel = supabase
      .channel("live-employee-activity-list")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to insert and update
          schema: "public",
          table: "employee_activity",
        },
        (payload) => {
          const act = payload.new as any;
          if (!act) return;

          setActivities((prev) => {
            const index = prev.findIndex((e) => e.id === act.employee_id);
            if (index === -1) {
              // Fetch to ensure we get matching employee info if it's a new entry
              fetchActivities();
              return prev;
            }

            const updatedList = [...prev];
            updatedList[index] = {
              ...updatedList[index],
              status: act.status,
              session_start: act.session_start,
              last_active: act.last_active,
              current_activity: act.current_activity,
            };

            return sortActivities(updatedList);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loading, isDemo]);

  // Compute status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-emerald-500";
      case "break":
        return "bg-amber-500";
      case "away":
        return "bg-rose-400";
      default:
        return "bg-slate-300";
    }
  };

  // Compute session active duration or relative last active seen
  const formatActivityTime = (emp: EmployeeActivity) => {
    if (emp.status === "offline") {
      if (!emp.last_active) return "seen —";
      const diff = Math.floor((now - new Date(emp.last_active).getTime()) / 60000);
      if (diff < 1) return "seen just now";
      if (diff < 60) return `seen ${diff}m ago`;
      const hrs = Math.floor(diff / 60);
      if (hrs < 24) return `seen ${hrs}h ago`;
      return `seen ${new Date(emp.last_active).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`;
    }

    if (!emp.session_start) return "00h 00m";
    const diff = Math.floor((now - new Date(emp.session_start).getTime()) / 60000);
    if (diff <= 0) return "00h 00m";
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours.toString().padStart(2, "0")}h ${mins.toString().padStart(2, "0")}m`;
  };

  // Initials generator
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Initials background gradient
  const getGradient = (name: string) => {
    const gradients = [
      "from-indigo-400 to-indigo-600",
      "from-teal-400 to-teal-600",
      "from-amber-400 to-amber-600",
      "from-rose-400 to-rose-600",
      "from-violet-400 to-violet-600",
    ];
    const index = name.charCodeAt(0) % gradients.length;
    return gradients[index];
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[280px] flex flex-col">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h3 className="text-[14px] font-black text-slate-900 flex items-center gap-1.5">
            Employee Activity
            {isDemo && (
              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90 origin-left">
                Demo
              </span>
            )}
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Real-time workspace active feeds.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-100 border-t-indigo-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-1">
            <User className="h-6 w-6 stroke-[1.5]" />
            <p className="text-[11px] font-bold">No active employees</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {activities.map((emp) => (
              <div key={emp.id} className="flex items-center justify-between group">
                {/* Left side: Avatar + details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${getGradient(emp.name)} flex items-center justify-center text-white font-bold text-[10px] shrink-0 shadow-sm`}>
                    {getInitials(emp.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-slate-900 leading-tight truncate group-hover:text-indigo-600 transition">
                      {emp.name}
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 truncate mt-0.5">
                      {emp.current_activity ? (
                        <span className="text-slate-600 font-semibold text-[9px] bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">
                          ⚡ {emp.current_activity}
                        </span>
                      ) : (
                        emp.role
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Status and duration */}
                <div className="flex items-center gap-5 shrink-0 text-right">
                  <div className="flex items-center gap-1.5 w-16 justify-end">
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(emp.status)} shrink-0`} />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide text-[10px]">
                      {emp.status}
                    </span>
                  </div>
                  <div className="text-[11px] font-black text-slate-800 w-24 text-right">
                    {formatActivityTime(emp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
