"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
