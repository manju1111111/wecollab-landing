"use server";

import { createAdminClient } from "@/lib/supabase/server";

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

    // Check if transition is from offline (or row doesn't exist) to set session_start
    let shouldStartSession = false;
    try {
      const { data: existing } = await supabase
        .from("employee_activity")
        .select("status")
        .eq("employee_id", employeeId)
        .single();
      
      if (!existing || existing.status === "offline") {
        shouldStartSession = true;
      }
    } catch (e) {
      // Row probably doesn't exist
      shouldStartSession = true;
    }

    const updatePayload: any = {
      employee_id: employeeId,
      status,
      last_active: new Date().toISOString(),
    };

    if (currentActivity !== undefined) {
      updatePayload.current_activity = currentActivity || null;
    }

    if (shouldStartSession && status !== "offline") {
      updatePayload.session_start = new Date().toISOString();
    }

    const { error } = await supabase
      .from("employee_activity")
      .upsert(updatePayload, { onConflict: "employee_id" });

    if (error) {
      if (error.message.includes("does not exist")) {
        console.warn(`[ACTIVITY_ACTION] Table 'employee_activity' not created. Skipped status '${status}'.`);
        return { success: true, isMock: true };
      }
      console.error("[UPSERT_ACTIVITY_ERROR]", error);
      return { success: false, error: error.message };
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

    const updatePayload: any = {
      employee_id: employeeId,
      status,
      last_active: new Date().toISOString(),
    };

    if (currentActivity !== undefined) {
      updatePayload.current_activity = currentActivity || null;
    }

    const { error } = await supabase
      .from("employee_activity")
      .upsert(updatePayload, { onConflict: "employee_id" });

    if (error) {
      if (error.message.includes("does not exist")) {
        return { success: true, isMock: true };
      }
      console.error("[HEARTBEAT_ERROR]", error);
      return { success: false, error: error.message };
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

    const { error } = await supabase
      .from("employee_activity")
      .upsert({
        employee_id: employeeId,
        status: "offline",
        last_active: new Date().toISOString(),
        current_activity: null,
      }, { onConflict: "employee_id" });

    if (error) {
      if (error.message.includes("does not exist")) {
        return { success: true, isMock: true };
      }
      console.error("[SET_OFFLINE_ERROR]", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[SET_OFFLINE_CRITICAL]", err);
    return { success: false, error: err.message };
  }
}
