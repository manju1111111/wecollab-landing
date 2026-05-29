"use client";

import { Star, TrendingUp, Target, Zap } from "lucide-react";

interface PerformanceScoreProps {
  totalAssigned: number;
  contacted: number;      // creators with status != 'new'
  dealsWon: number;       // creators with status == 'deal_closed'
  tasksCompleted: number;
  weekHours: number;
}

function getBadge(score: number): { label: string; color: string; bg: string; emoji: string } {
  if (score >= 85) return { label: "Top Performer",    color: "text-amber-700", bg: "bg-amber-50 border-amber-200",   emoji: "🥇" };
  if (score >= 65) return { label: "On Track",         color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", emoji: "🥈" };
  if (score >= 40) return { label: "Getting Started",  color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",     emoji: "🥉" };
  return               { label: "Just Warming Up",   color: "text-slate-500",  bg: "bg-slate-50 border-slate-200",   emoji: "🌱" };
}

function ScoreMeter({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const color = clamped >= 85 ? "#f59e0b" : clamped >= 65 ? "#10b981" : clamped >= 40 ? "#3b82f6" : "#94a3b8";
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-900">{clamped}</span>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-8 w-8 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p className="text-[14px] font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export function PerformanceScore({
  totalAssigned,
  contacted,
  dealsWon,
  tasksCompleted,
  weekHours,
}: PerformanceScoreProps) {
  // Scoring formula (weighted):
  // - Contact rate:      (contacted / max(totalAssigned,1)) * 35 pts
  // - Conversion rate:   (dealsWon / max(contacted,1)) * 30 pts
  // - Task completion:   min(tasksCompleted / 5, 1) * 20 pts  (5 tasks = full score)
  // - Hours logged:      min(weekHours / 35, 1) * 15 pts       (35h/week = full score)
  const contactRate = totalAssigned > 0 ? contacted / totalAssigned : 0;
  const conversionRate = contacted > 0 ? dealsWon / contacted : 0;
  const taskScore = Math.min(tasksCompleted / 5, 1);
  const hoursScore = Math.min(weekHours / 35, 1);

  const score = Math.round(
    contactRate * 35 +
    conversionRate * 30 +
    taskScore * 20 +
    hoursScore * 15
  );

  const badge = getBadge(score);
  const convPct = contacted > 0 ? Math.round((dealsWon / contacted) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-5">
      <div>
        <h3 className="font-bold text-slate-900 text-[15px]">My Performance</h3>
        <p className="text-[12px] text-slate-400 mt-0.5">Score calculated from outreach, deals & tasks</p>
      </div>

      {/* Score meter + badge */}
      <div className="flex items-center gap-5">
        <ScoreMeter score={score} />
        <div className="flex flex-col gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[13px] font-bold ${badge.bg} ${badge.color}`}>
            {badge.emoji} {badge.label}
          </div>
          <p className="text-[12px] text-slate-400 leading-relaxed max-w-[160px]">
            {score >= 65
              ? "Great work! Keep closing deals."
              : score >= 40
              ? "Good start — focus on outreach."
              : "Assign yourself tasks to build your score."}
          </p>
        </div>
      </div>

      {/* Sub-stats */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
        <Stat icon={Target}    label="Creators Contacted" value={`${contacted} / ${totalAssigned}`} color="bg-blue-50 text-blue-600" />
        <Stat icon={Star}      label="Deals Closed"        value={dealsWon}                          color="bg-emerald-50 text-emerald-600" />
        <Stat icon={Zap}       label="Conversion Rate"     value={`${convPct}%`}                     color="bg-amber-50 text-amber-600" />
        <Stat icon={TrendingUp} label="Tasks This Month"   value={tasksCompleted}                    color="bg-violet-50 text-violet-600" />
      </div>
    </div>
  );
}
