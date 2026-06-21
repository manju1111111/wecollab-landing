"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { insertTask, updateTaskCompletion, updateTask as updateTaskFallback, deleteTask as deleteTaskFallback } from "@/lib/supabase/fallback-db";
import { getValidatedEmployeeSession, logAudit } from "@/app/employee/actions";


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
  const session = await getValidatedEmployeeSession();
  if (!session) {
    return { error: "Unauthorized or deactivated account." };
  }

  if (session.id !== employeeId && !["admin", "manager"].includes(session.role.toLowerCase())) {
    return { error: "Access denied." };
  }

  const supabase = await createClient();

  const { data: task, error } = await insertTask(supabase, {
    employee_id: employeeId,
    title,
    due_date: dueDate || null,
    creator_id: creatorId || null,
  });


  if (error) {
    console.error("[ADD_TASK_ERROR]", error);
    return { error: "Failed to add task" };
  }

  // Activity log for task creation
  try {
    await logAudit("task_create", `New task created: "${title}"`, employeeId);
  } catch (e) {
    console.error("[ADD_TASK_AUDIT_ERROR]", e);
  }

  revalidatePath("/employee");
  return { task };
}

export async function completeTask(taskId: string) {
  const session = await getValidatedEmployeeSession();
  if (!session) {
    return { error: "Unauthorized or deactivated account." };
  }

  const supabase = await createClient();

  // Get task info before updating so we know employee ID and task title
  let taskData: { title: string; employee_id: string } | null = null;
  try {
    const { getTasks } = await import("@/lib/supabase/fallback-db");
    const allTasks = await getTasks(supabase);
    const matched = allTasks.find((t: any) => t.id === taskId);
    if (matched) {
      taskData = { title: matched.title, employee_id: matched.employee_id };
    }
  } catch (e) {
    console.error("[FETCH_TASK_PRE_COMPLETE_ERROR]", e);
  }

  if (taskData && taskData.employee_id !== session.id && !["admin", "manager"].includes(session.role.toLowerCase())) {
    return { error: "Access denied." };
  }

  const { error } = await updateTaskCompletion(supabase, taskId, new Date().toISOString());


  if (error) {
    console.error("[COMPLETE_TASK_ERROR]", error);
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
  updates: { completed_at?: string | null; due_date?: string | null; title?: string }
) {
  const session = await getValidatedEmployeeSession();
  if (!session) {
    return { error: "Unauthorized or deactivated account." };
  }

  const supabase = await createClient();

  // Verify task belongs to user or is admin/manager
  try {
    const { getTasks } = await import("@/lib/supabase/fallback-db");
    const allTasks = await getTasks(supabase);
    const matched = allTasks.find((t: any) => t.id === taskId);
    if (matched && matched.employee_id !== session.id && !["admin", "manager"].includes(session.role.toLowerCase())) {
      return { error: "Access denied." };
    }
  } catch (e) {
    console.warn("Failed to check task ownership:", e);
  }

  const { error } = await updateTaskFallback(supabase, taskId, updates);


  if (error) {
    console.error("[UPDATE_TASK_ERROR]", error);
    return { error: "Failed to update task" };
  }

  revalidatePath("/employee");
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const session = await getValidatedEmployeeSession();
  if (!session) {
    return { error: "Unauthorized or deactivated account." };
  }

  const supabase = await createClient();

  // Verify task belongs to user or is admin/manager
  try {
    const { getTasks } = await import("@/lib/supabase/fallback-db");
    const allTasks = await getTasks(supabase);
    const matched = allTasks.find((t: any) => t.id === taskId);
    if (matched && matched.employee_id !== session.id && !["admin", "manager"].includes(session.role.toLowerCase())) {
      return { error: "Access denied." };
    }
  } catch (e) {
    console.warn("Failed to check task ownership:", e);
  }

  const { error } = await deleteTaskFallback(supabase, taskId);


  if (error) console.error("[DELETE_TASK_ERROR]", error);
  revalidatePath("/employee");
  return { success: !error };
}
