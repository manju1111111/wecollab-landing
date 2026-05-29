"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addTask({
  employeeId,
  title,
  dueDate,
  creatorId,
}: {
  employeeId: string;
  title: string;
  dueDate: string | null;
  creatorId: string | null;
}) {
  const supabase = await createClient();

  const { data: task, error } = await supabase
    .from("employee_tasks")
    .insert({
      employee_id: employeeId,
      title,
      due_date: dueDate || null,
      creator_id: creatorId || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[ADD_TASK_ERROR]", error.message);
    return { error: error.message };
  }

  revalidatePath("/employee");
  return { task };
}

export async function completeTask(taskId: string) {
  const supabase = await createClient();

  // Get task info before updating so we know employee ID and task title
  let taskData: { title: string; employee_id: string } | null = null;
  try {
    const { data } = await supabase
      .from("employee_tasks")
      .select("title, employee_id")
      .eq("id", taskId)
      .single();
    taskData = data;
  } catch (e) {
    console.error("[FETCH_TASK_PRE_COMPLETE_ERROR]", e);
  }

  const { error } = await supabase
    .from("employee_tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) {
    console.error("[COMPLETE_TASK_ERROR]", error.message);
  } else if (taskData) {
    // Trigger notification to admin
    try {
      const { data: empData } = await supabase
        .from("employees")
        .select("full_name")
        .eq("id", taskData.employee_id)
        .single();
      const empName = empData?.full_name || "Employee";

      const { createNotification } = await import("@/lib/supabase/notifications");
      await createNotification({
        userId: "00000000-0000-0000-0000-000000000000",
        userType: "admin",
        type: "task_complete",
        title: "Task Completed ✅",
        body: `${empName} completed task: "${taskData.title}".`,
        link: `/admin/employees/${taskData.employee_id}`
      });
    } catch (notifErr) {
      console.error("[COMPLETE_TASK_NOTIF_ERROR]", notifErr);
    }
  }

  revalidatePath("/employee");
  return { success: !error };
}

export async function updateTask(
  taskId: string,
  updates: { completed_at?: string | null; due_date?: string | null }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("employee_tasks")
    .update(updates)
    .eq("id", taskId);

  if (error) {
    console.error("[UPDATE_TASK_ERROR]", error.message);
    return { error: error.message };
  }

  revalidatePath("/employee");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("employee_tasks")
    .delete()
    .eq("id", taskId);

  if (error) console.error("[DELETE_TASK_ERROR]", error.message);
  revalidatePath("/employee");
  return { success: !error };
}
