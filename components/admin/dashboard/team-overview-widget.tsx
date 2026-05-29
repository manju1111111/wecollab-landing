import { ChevronRight, Crown, Users } from "lucide-react";
import Link from "next/link";

interface TeamMember {
  id: string;
  full_name: string;
  role: string;
  assigned_count: number;
  tasks_completed: number;
  status: string;
}

function getScore(m: TeamMember) {
  // Simple score: assigned × 3 + tasks × 5 (just for ranking)
  return (m.assigned_count * 3) + (m.tasks_completed * 5);
}

function getBadge(score: number) {
  if (score >= 50) return { emoji: "🥇", color: "text-amber-600" };
  if (score >= 25) return { emoji: "🥈", color: "text-slate-500" };
  if (score >= 10) return { emoji: "🥉", color: "text-amber-800" };
  return { emoji: "🌱", color: "text-emerald-600" };
}

function Initials({ name }: { name: string }) {
  const initials = name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["from-indigo-400 to-violet-500", "from-rose-400 to-pink-500", "from-fuchsia-400 to-primary", "from-emerald-400 to-teal-500"];
  const g = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${g} flex items-center justify-center text-white font-bold text-[11px] shrink-0`}>
      {initials}
    </div>
  );
}

export function TeamOverviewWidget({ employees }: { employees: TeamMember[] }) {
  const active = employees.filter(e => e.status === "active" || e.status === "invited");
  const sorted = [...active].sort((a, b) => getScore(b) - getScore(a));
  const totalAssigned = active.reduce((s, e) => s + e.assigned_count, 0);
  const totalTasks = active.reduce((s, e) => s + e.tasks_completed, 0);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[280px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-500" />
          <h3 className="text-[14px] font-bold text-slate-900">Team Overview</h3>
        </div>
        <Link
          href="/admin/employees"
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition"
        >
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Summary */}
      <div className="flex gap-4 mb-3 text-center">
        <div className="flex-1 bg-slate-50 rounded-xl py-2">
          <p className="text-lg font-black text-slate-900">{active.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Members</p>
        </div>
        <div className="flex-1 bg-indigo-50 rounded-xl py-2">
          <p className="text-lg font-black text-indigo-700">{totalAssigned}</p>
          <p className="text-[10px] font-bold text-indigo-400 uppercase">Creators</p>
        </div>
        <div className="flex-1 bg-emerald-50 rounded-xl py-2">
          <p className="text-lg font-black text-emerald-700">{totalTasks}</p>
          <p className="text-[10px] font-bold text-emerald-400 uppercase">Tasks Done</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {sorted.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[12px] text-slate-300">No employees yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sorted.slice(0, 5).map((m, i) => {
              const score = getScore(m);
              const badge = getBadge(score);
              return (
                <div key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition group">
                  <span className="text-[13px] w-4 text-center shrink-0">{badge.emoji}</span>
                  <Initials name={m.full_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{m.full_name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{m.assigned_count} creators · {m.tasks_completed} tasks</p>
                  </div>
                  <Link
                    href={`/admin/employees/${m.id}`}
                    className="opacity-0 group-hover:opacity-100 transition text-[11px] font-bold text-indigo-500 hover:text-indigo-700"
                  >
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
