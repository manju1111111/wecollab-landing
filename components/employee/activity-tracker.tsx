"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { sendHeartbeat, upsertEmployeeActivity } from "@/app/employee/activity-actions";

function broadcastActivityUpdate() {
  try {
    const bc = new BroadcastChannel("wecollab-updates");
    bc.postMessage({ type: "ACTIVITY_UPDATE", timestamp: Date.now() });
    bc.close();
  } catch (_) {}
}

interface ActivityTrackerProps {
  employeeId: string;
}

export function ActivityTracker({ employeeId }: ActivityTrackerProps) {
  const pathname = usePathname();
  const [status, setStatus] = useState<"online" | "away" | "break">("online");
  
  const lastInteractionRef = useRef<number>(Date.now());
  const statusRef = useRef<"online" | "away" | "break">("online");
  const currentActivityRef = useRef<string>("Working");

  // Map path to friendly text
  const getActivityLabel = (path: string) => {
    if (path === "/employee") return "Viewing Dashboard";
    if (path.startsWith("/employee/creators")) return "Managing Creators";
    if (path.startsWith("/employee/tasks")) return "Reviewing Tasks";
    if (path.startsWith("/employee/pipeline")) return "Updating Deals Pipeline";
    if (path.startsWith("/employee/activity")) return "Checking Activity Log";
    if (path.startsWith("/employee/reports")) return "Analyzing Reports";
    if (path.startsWith("/employee/settings")) return "Updating Settings";
    return "Working";
  };

  const currentActivity = getActivityLabel(pathname);

  // Update status reference on state changes
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Keep current activity synced
  useEffect(() => {
    currentActivityRef.current = currentActivity;
    // Push immediately on page navigation
    if (employeeId && statusRef.current !== "away") {
      upsertEmployeeActivity({
        employeeId,
        status: statusRef.current,
        currentActivity,
      }).then(() => broadcastActivityUpdate());
    }
  }, [currentActivity, employeeId]);

  useEffect(() => {
    if (!employeeId) return;

    // 1. Mark online on mount
    upsertEmployeeActivity({
      employeeId,
      status: "online",
      currentActivity: currentActivityRef.current,
    }).then(() => broadcastActivityUpdate());

    // 2. Interaction Listeners to prevent Away status
    const updateInteraction = () => {
      lastInteractionRef.current = Date.now();
      
      // If we were away and the user is back, mark online immediately
      if (statusRef.current === "away") {
        setStatus("online");
        upsertEmployeeActivity({
          employeeId,
          status: "online",
          currentActivity: currentActivityRef.current,
        }).then(() => broadcastActivityUpdate());
      }
    };

    window.addEventListener("mousemove", updateInteraction);
    window.addEventListener("keydown", updateInteraction);
    window.addEventListener("click", updateInteraction);
    window.addEventListener("scroll", updateInteraction);

    // 3. Heartbeat & Inactivity Check Intervals
    const heartbeatInterval = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionRef.current;
      const inactivityThreshold = 5 * 60 * 1000; // 5 minutes

      let nextStatus = statusRef.current;

      // Handle automatic transitioning to Away
      if (timeSinceLastInteraction > inactivityThreshold && statusRef.current === "online") {
        nextStatus = "away";
        setStatus("away");
      }

      sendHeartbeat({
        employeeId,
        currentActivity: nextStatus === "away" ? "Idle / Away" : currentActivityRef.current,
        status: nextStatus,
      });
    }, 30000); // 30 seconds

    // 4. Tab Close / Unload Event: Mark Offline Instantly
    const handleUnload = () => {
      const payload = JSON.stringify({
        employeeId,
        status: "offline",
        currentActivity: null
      });

      // Attempt standard fetch with keepalive to guarantee execution after tab closure
      fetch("/api/admin/activities/offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true
      });
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener("mousemove", updateInteraction);
      window.removeEventListener("keydown", updateInteraction);
      window.removeEventListener("click", updateInteraction);
      window.removeEventListener("scroll", updateInteraction);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [employeeId]);

  // Support status picker notifications
  useEffect(() => {
    const handleStatusUpdate = (e: CustomEvent<{ status: "online" | "break" }>) => {
      setStatus(e.detail.status);
      upsertEmployeeActivity({
        employeeId,
        status: e.detail.status,
        currentActivity: e.detail.status === "break" ? "On Break" : currentActivityRef.current
      }).then(() => broadcastActivityUpdate());
    };

    window.addEventListener("employee-status-changed" as any, handleStatusUpdate);
    return () => {
      window.removeEventListener("employee-status-changed" as any, handleStatusUpdate);
    };
  }, [employeeId]);

  return null; // Silent background tracker
}
