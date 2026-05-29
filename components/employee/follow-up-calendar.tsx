"use client";

import { useMemo } from "react";
import { Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

interface FollowUp {
  id: string;
  creator_name: string;
  creator_username: string;
  due_date: string;
  title: string;
  completed_at: string | null;
}

interface FollowUpCalendarProps {
  tasks: FollowUp[];
}

function isToday(d: string) {
  return new Date(d).toDateString() === new Date().toDateString();
}
function isTomorrow(d: string) {
  const t = new Date(); t.setDate(t.getDate() + 1);
  return new Date(d).toDateString() === t.toDateString();
}
function isOverdue(d: string) {
  return new Date(d) < new Date(new Date().toDateString());
}
function dayLabel(d: string) {
  if (isOverdue(d)) return "Overdue";
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  const diff = Math.floor((new Date(d).getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);
  return `In ${diff} days`;
}
function rowStyle(d: string, done: boolean) {
  if (done) return "opacity-50";
  if (isOverdue(d)) return "border-l-rose-400";
  if (isToday(d)) return "border-l-amber-400";
  return "border-l-transparent";
}

// Mini calendar grid
function MiniCalendar({ tasks }: { tasks: FollowUp[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dueDays = new Set(
    tasks
      .filter(t => !t.completed_at && t.due_date)
      .map(t => new Date(t.due_date).getDate())
      .filter(d => {
        const taskDate = new Date(tasks.find(t => new Date(t.due_date).getDate() === d)!.due_date);
        return taskDate.getMonth() === month && taskDate.getFullYear() === year;
      })
  );

  const padding: (number | null)[] = Array.from({ length: firstDay }, () => null);
  const days: (number | null)[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const cells: (number | null)[] = [...padding, ...days];
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="px-5 py-4 border-b border-slate-100">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
        {today.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      </p>
      <div className="grid grid-cols-7 gap-px text-center text-[10px] font-bold text-slate-400 mb-1">
        {["S","M","T","W","T","F","S"].map((d,i) => <span key={i}>{d}</span>)}
      </div>
      <div className="flex flex-col gap-px">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-px">
            {week.map((day, di) => {
              if (!day) return <div key={di} />;
              const isT = day === today.getDate();
              const hasDue = dueDays.has(day);
              return (
                <div
                  key={di}
                  className={`relative flex items-center justify-center h-7 w-full rounded-lg text-[11px] font-semibold transition
                    ${isT ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {day}
                  {hasDue && !isT && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-400" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FollowUpCalendar({ tasks }: FollowUpCalendarProps) {
  const upcoming = useMemo(() =>
    tasks
      .filter(t => t.due_date)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 8),
    [tasks]
  );

  const overdueCount = upcoming.filter(t => !t.completed_at && isOverdue(t.due_date)).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-[15px]">Follow-up Calendar</h3>
          {overdueCount > 0 && (
            <p className="text-[12px] text-rose-500 font-semibold mt-0.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {overdueCount} overdue
            </p>
          )}
        </div>
        <Calendar className="h-5 w-5 text-slate-300" />
      </div>

      {/* Mini calendar */}
      <MiniCalendar tasks={tasks} />

      {/* Upcoming list */}
      <div className="divide-y divide-slate-50 max-h-[260px] overflow-y-auto">
        {upcoming.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="h-7 w-7 text-slate-200 mx-auto mb-2" />
            <p className="text-[12px] text-slate-400">No upcoming follow-ups. Add tasks with due dates!</p>
          </div>
        ) : (
          upcoming.map(t => {
            const label = dayLabel(t.due_date);
            const overdue = !t.completed_at && isOverdue(t.due_date);
            const today = !t.completed_at && isToday(t.due_date);
            return (
              <div key={t.id} className={`flex items-start gap-3 px-5 py-3 border-l-2 ${rowStyle(t.due_date, !!t.completed_at)}`}>
                <div className="mt-0.5 shrink-0">
                  {t.completed_at
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    : <Clock className={`h-4 w-4 ${overdue ? "text-rose-400" : today ? "text-amber-400" : "text-slate-300"}`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold truncate ${t.completed_at ? "line-through text-slate-400" : "text-slate-800"}`}>
                    {t.title}
                  </p>
                  <p className="text-[11px] text-indigo-500 font-medium">@{t.creator_username || t.creator_name}</p>
                </div>
                <span className={`text-[11px] font-bold shrink-0 ${overdue ? "text-rose-500" : today ? "text-amber-500" : "text-slate-400"}`}>
                  {label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
