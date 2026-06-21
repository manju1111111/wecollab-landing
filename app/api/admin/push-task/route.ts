import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/supabase/notifications";
import { sendTaskAssignmentEmail } from "@/lib/notifications/email";
import { insertTask } from "@/lib/supabase/fallback-db";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, title, dueDate, creatorId } = body;

    if (!employeeId || !title) {
      return NextResponse.json({ error: "employeeId and title are required" }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await insertTask(supabase, {
      employee_id: employeeId,
      title,
      due_date: dueDate || null,
      creator_id: creatorId || null,
    });

    if (error) {
      console.error("[PUSH_TASK_ERROR]", error);
      return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }

    // Create a notification for the employee
    try {
      await createNotification({
        userId: employeeId,
        userType: "employee",
        type: "task",
        title: "New Task Assigned 📋",
        body: `Admin pushed a new task to you: "${title}"` + (dueDate ? ` due by ${dueDate}.` : "."),
        link: "/employee/tasks"
      });
    } catch (notifErr) {
      console.error("[PUSH_TASK_NOTIF_ERROR]", notifErr);
    }

    // Fetch employee details to send email notification
    try {
      const { data: employee } = await supabase
        .from("employees")
        .select("email, full_name")
        .eq("id", employeeId)
        .single();

      if (employee?.email) {
        await sendTaskAssignmentEmail({
          to: employee.email,
          employeeName: employee.full_name || "Employee",
          taskTitle: title,
          dueDate: dueDate || null,
        });
      }
    } catch (emailErr) {
      console.error("[PUSH_TASK_EMAIL_ERROR]", emailErr);
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error("[PUSH_TASK_API]", error);
    return NextResponse.json({ error: "Failed to push task" }, { status: 500 });
  }
}
