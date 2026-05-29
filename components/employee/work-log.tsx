"use client";

import { useState, useTransition } from "react";
import { Clock, Plus, BarChart2, Timer } from "lucide-react";
import { logWorkSession } from "@/app/employee/work-actions";

interface WorkSession {
  id: string;
  date: string;
  hours: number;
  category: string;
  note: string;
}

const CATEGORIES = [
  "Creator Outreach",
  "Contract Review",
  "Campaign Planning",
  "Content Review",
  "Reporting",
  "Admin / Other",
];

function hoursColor(h: number) {
  if (h >= 7) return "bg-emerald-500";
  if (h >= 4) return "bg-blue-400";
  if (h >= 1) return "bg-amber-400";
  return "bg-slate-200";
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

interface WorkLogProps {
  sessions: WorkSession[];
  employeeId: string;
}

export function WorkLog({ sessions: initialSessions, employeeId }: WorkLogProps) {
  const [sessions, setSessions] = useState<WorkSession[]>(initialSessions);
  const [showForm, setShowForm] = useState(false);
  const [hours, setHours] = useState("8");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const weekTotal = sessions
    .filter(s => {
      const d = new Date(s.date);
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    })
    .reduce((sum, s) => sum + s.hours, 0);

  const handleLog = () => {
    const today = new Date().toISOString().split("T")[0];
    const optimistic: WorkSession = {
      id: `tmp-${Date.now()}`,
      date: today,
      hours: parseFloat(hours) || 0,
      category,
      note,
    };
    setSessions(prev => [optimistic, ...prev]);
    setShowForm(false);
    setHours("8"); setCategory(CATEGORIES[0]); setNote("");

    startTransition(async () => {
      await logWorkSession({ employeeId, hours: optimistic.hours, category, note: optimistic.note });
    });
  };

  // Last 7 days chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const match = sessions.find(s => s.date === key);
    return { date: key, hours: match?.hours || 0, label: d.toLocaleDateString("en-IN", { weekday: "short" }) };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-[15px]">Work Log</h3>
          <p className="text-[12px] text-slate-400 mt-0.5">{weekTotal}h logged this week</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-[12px] font-bold transition"
        >
          <Plus className="h-3.5 w-3.5" /> Log Hours
        </button>
      </div>

      {/* 7-day bar chart */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-end gap-1.5 h-16">
          {last7.map(day => (
            <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
              <div className="w-full flex items-end justify-center" style={{ height: "44px" }}>
                <div
                  className={`w-full rounded-t-md transition-all ${hoursColor(day.hours)}`}
                  style={{ height: day.hours > 0 ? `${Math.min((day.hours / 10) * 100, 100)}%` : "4px", opacity: day.hours > 0 ? 1 : 0.3 }}
                  title={`${day.hours}h`}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{day.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="mx-4 mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Hours</label>
              <input
                type="number" min="0.5" max="16" step="0.5"
                value={hours} onChange={e => setHours(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full h-9 px-2 rounded-lg border border-slate-200 bg-white text-[13px] focus:outline-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <input value={note} onChange={e => setNote(e.target.value)}
            placeholder="What did you work on? (optional)"
            className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] focus:outline-none mb-2" />
          <button onClick={handleLog} disabled={isPending}
            className="w-full h-9 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-[13px] font-bold transition disabled:opacity-50">
            Save Entry
          </button>
        </div>
      )}

      {/* Recent sessions */}
      <div className="divide-y divide-slate-50 max-h-[220px] overflow-y-auto">
        {sessions.slice(0, 8).map(s => (
          <div key={s.id} className="flex items-center gap-3 px-5 py-3">
            <div className={`h-2 w-2 rounded-full shrink-0 ${hoursColor(s.hours)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-800 truncate">{s.category}</p>
              {s.note && <p className="text-[11px] text-slate-400 truncate">{s.note}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[13px] font-bold text-slate-700">{s.hours}h</p>
              <p className="text-[10px] text-slate-400">{dayLabel(s.date)}</p>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="py-8 text-center">
            <Timer className="h-7 w-7 text-slate-200 mx-auto mb-2" />
            <p className="text-[12px] text-slate-400">No work logged yet. Start tracking your hours!</p>
          </div>
        )}
      </div>
    </div>
  );
}
