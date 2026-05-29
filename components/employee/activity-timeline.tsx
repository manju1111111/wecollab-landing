"use client";

import { useMemo } from "react";
import { UserPlus, FileEdit, CheckCircle2, Trash2, StickyNote, Clock } from "lucide-react";

type EventType = "task_created" | "task_completed" | "note_saved" | "creator_assigned" | "status_changed";

interface ActivityEvent {
  id: string;
  type: EventType;
  description: string;
  meta?: string;
  created_at: string;
}

const ICONS: Record<EventType, { icon: any; color: string; bg: string }> = {
  task_created:      { icon: Clock,         color: "text-blue-600",    bg: "bg-blue-50" },
  task_completed:    { icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50" },
  note_saved:        { icon: StickyNote,    color: "text-violet-600",  bg: "bg-violet-50" },
  creator_assigned:  { icon: UserPlus,      color: "text-indigo-600",  bg: "bg-indigo-50" },
  status_changed:    { icon: FileEdit,      color: "text-amber-600",   bg: "bg-amber-50" },
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function groupByDay(events: ActivityEvent[]) {
  const groups: Record<string, ActivityEvent[]> = {};
  events.forEach(e => {
    const day = new Date(e.created_at).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
    if (!groups[day]) groups[day] = [];
    groups[day].push(e);
  });
  return groups;
}

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  const grouped = useMemo(() => groupByDay(events), [events]);
  const todayKey = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-[15px]">My Activity</h3>
        <p className="text-[12px] text-slate-400 mt-0.5">Everything you've done, in order</p>
      </div>

      <div className="overflow-y-auto max-h-[480px]">
        {events.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-[13px] text-slate-400 font-medium">Your activity will appear here as you work.</p>
            <p className="text-[12px] text-slate-300 mt-1">Try adding a task or saving a note!</p>
          </div>
        ) : (
          Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day}>
              {/* Day divider */}
              <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-50/80 sticky top-0">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {day === todayKey ? "Today" : day}
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Events */}
              <div className="divide-y divide-slate-50">
                {dayEvents.map((event, i) => {
                  const cfg = ICONS[event.type] || ICONS.note_saved;
                  return (
                    <div key={event.id} className="flex items-start gap-3.5 px-5 py-3.5 group hover:bg-slate-50/50 transition">
                      {/* Icon */}
                      <div className={`h-8 w-8 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <cfg.icon className={`h-4 w-4 ${cfg.color}`} strokeWidth={2} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 leading-snug">{event.description}</p>
                        {event.meta && (
                          <p className="text-[11px] text-indigo-500 font-medium mt-0.5">{event.meta}</p>
                        )}
                      </div>

                      {/* Time */}
                      <span className="text-[11px] text-slate-400 shrink-0 mt-0.5">{timeAgo(event.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
