"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { updateActivityStatus } from "@/lib/supabase/fallback-db";

/**
 * Upserts or updates the live activity status and current activity for an employee.
 * Handles graceful fallback if table has not yet been created in Supabase.
 */
export async function upsertEmployeeActivity({
  employeeId,
  status,
  currentActivity,
}: {
  employeeId: string;
  status: "online" | "offline" | "away" | "break";
  currentActivity?: string;
}) {
  try {
    const supabase = await createAdminClient();

    const { error } = await updateActivityStatus(
      supabase,
      employeeId,
      status,
      currentActivity
    );

    if (error) {
      console.error("[UPSERT_ACTIVITY_ERROR]", error);
      return { success: false, error: (error as any).message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[UPSERT_ACTIVITY_CRITICAL]", err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a periodic heartbeat to keep the employee active.
 */
export async function sendHeartbeat({
  employeeId,
  currentActivity,
  status = "online",
}: {
  employeeId: string;
  currentActivity?: string;
  status?: "online" | "offline" | "away" | "break";
}) {
  try {
    const supabase = await createAdminClient();

    const { error } = await updateActivityStatus(
      supabase,
      employeeId,
      status,
      currentActivity
    );

    if (error) {
      console.error("[HEARTBEAT_ERROR]", error);
      return { success: false, error: (error as any).message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[HEARTBEAT_CRITICAL]", err);
    return { success: false, error: err.message };
  }
}

/**
 * Marks the employee offline (e.g. on logout or disconnect).
 */
export async function setOffline(employeeId: string) {
  try {
    const supabase = await createAdminClient();

    const { error } = await updateActivityStatus(
      supabase,
      employeeId,
      "offline",
      null
    );

    if (error) {
      console.error("[SET_OFFLINE_ERROR]", error);
      return { success: false, error: (error as any).message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[SET_OFFLINE_CRITICAL]", err);
    return { success: false, error: err.message };
  }
}
