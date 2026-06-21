"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getValidatedEmployeeSession } from "@/app/employee/actions";

export async function logWorkSession({
  employeeId,
  hours,
  category,
  note,
}: {
  employeeId: string;
  hours: number;
  category: string;
  note: string;
}) {
  const session = await getValidatedEmployeeSession();
  if (!session) {
    return { error: "Unauthorized or deactivated account." };
  }

  // Ensure employees can only log work for themselves (unless admin or manager)
  if (session.id !== employeeId && !["admin", "manager"].includes(session.role.toLowerCase())) {
    return { error: "Access denied." };
  }

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("employee_work_log").insert({
    employee_id: employeeId,
    date: today,
    hours,
    category,
    note: note || null,
  });

  if (error) {
    console.error("[LOG_WORK_ERROR]", error.message);
    return { error: error.message };
  }

  revalidatePath("/employee");
  return { success: true };
}
