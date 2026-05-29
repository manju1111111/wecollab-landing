"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  Check, 
  CheckSquare, 
  Users, 
  Clock, 
  TrendingUp, 
  Award, 
  X, 
  Info,
  CircleDot
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  user_id: string;
  user_type: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
  userType: "admin" | "employee";
}

export function NotificationBell({ userId, userType }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${userId}&userType=${userType}`);
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setIsMock(!!data.isMock);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [userId, userType]);

  // Real-time listener
  useEffect(() => {
    if (!userId || isMock) return;

    const supabase = createClient();
    const channelName = `notifications-channel-${userId}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updatedNotif = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updatedNotif.id ? updatedNotif : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isMock]);

  // Handle clicking outside of dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_all_read",
          userId,
          userType,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_read",
          notificationId: id,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "task":
        return <CheckSquare className="h-4 w-4 text-indigo-500" />;
      case "task_complete":
        return <Check className="h-4 w-4 text-emerald-500" />;
      case "overdue":
        return <Clock className="h-4 w-4 text-rose-500" />;
      case "deal_update":
        return <Award className="h-4 w-4 text-amber-500 fill-amber-100" fill="currentColor" />;
      case "deal_stage":
      case "status_update":
        return <TrendingUp className="h-4 w-4 text-violet-500" />;
      default:
        return <Info className="h-4 w-4 text-slate-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "assignment":
        return "bg-blue-50";
      case "task":
        return "bg-indigo-50";
      case "task_complete":
        return "bg-emerald-50";
      case "overdue":
        return "bg-rose-50";
      case "deal_update":
        return "bg-amber-50";
      case "deal_stage":
      case "status_update":
        return "bg-violet-50";
      default:
        return "bg-slate-50";
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const diff = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition duration-200 outline-none flex items-center justify-center ${
          isOpen ? "bg-slate-100 text-slate-800" : ""
        }`}
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 && !isOpen ? "animate-[swing_1s_ease-in-out_infinite]" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-[15px] min-w-[15px] px-1 rounded-full bg-rose-500 flex items-center justify-center text-[9px] font-black text-white border-2 border-white leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-3.5 w-[360px] bg-white rounded-3xl shadow-xl border border-slate-100/80 overflow-hidden z-50 transform origin-top-right transition-all duration-200 py-1">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h4 className="text-[14px] font-black text-slate-900 flex items-center gap-1.5">
                Notifications
                {isMock && (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90 origin-left">
                    Demo
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">You have {unreadCount} unread messages</p>
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <CircleDot className="h-8 w-8 text-slate-300 stroke-[1.5]" />
                <p className="text-[12px] font-bold">All caught up!</p>
                <p className="text-[10px]">No new notifications to display.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 hover:bg-slate-50/80 transition relative flex gap-3.5 ${
                    !n.read ? "bg-indigo-50/20" : ""
                  }`}
                >
                  {/* Icon Column */}
                  <div className={`h-8 w-8 rounded-full shrink-0 flex items-center justify-center ${getBgColor(n.type)}`}>
                    {getIcon(n.type)}
                  </div>

                  {/* Content Column */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className={`text-[12px] leading-tight text-slate-800 ${!n.read ? "font-bold" : "font-semibold"}`}>
                        {n.title}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap ml-2">
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal mb-1.5 break-words">
                      {n.body}
                    </p>
                    
                    {n.link && (
                      <Link 
                        href={n.link}
                        onClick={() => {
                          handleMarkRead(n.id);
                          setIsOpen(false);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                      >
                        View Details
                      </Link>
                    )}
                  </div>

                  {/* Mark single as read */}
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="absolute right-4 bottom-4 h-5 w-5 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-2.5 bg-slate-50/50 flex justify-center">
              <span className="text-[10px] font-bold text-slate-400">
                Connected to Supabase Realtime ⚡
              </span>
            </div>
          )}
        </div>
      )}
      <style jsx global>{`
        @keyframes swing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-10deg); }
          60% { transform: rotate(5deg); }
          80% { transform: rotate(-5deg); }
        }
      `}</style>
    </div>
  );
}
