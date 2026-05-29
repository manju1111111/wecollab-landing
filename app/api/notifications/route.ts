import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const userType = searchParams.get("userType") || "employee";

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Fetch notifications
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("user_type", userType)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      // If table doesn't exist yet, return mock notifications to prevent UI breaking
      if (error.code === "P0001" || error.message.includes("does not exist")) {
        console.warn("[NOTIFICATIONS_API] Table 'notifications' does not exist yet. Returning mock notifications.");
        const mockNotifs = getMockNotifications(userId, userType);
        return NextResponse.json({ notifications: mockNotifs, isMock: true });
      }
      console.error("[NOTIFICATIONS_GET_ERROR]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: notifications || [], isMock: false });
  } catch (error) {
    console.error("[NOTIFICATIONS_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, notificationId, userId, userType } = body;

    const supabase = getSupabaseServer();

    if (action === "create") {
      const { payload } = body;
      const { createNotification } = await import("@/lib/supabase/notifications");
      const res = await createNotification(payload);
      return NextResponse.json(res);
    }

    if (action === "mark_all_read") {
      if (!userId) {
        return NextResponse.json({ error: "Missing userId" }, { status: 400 });
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("user_type", userType || "employee");

      if (error) {
        if (error.message.includes("does not exist")) {
          return NextResponse.json({ success: true, isMock: true });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "mark_read") {
      if (!notificationId) {
        return NextResponse.json({ error: "Missing notificationId" }, { status: 400 });
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        if (error.message.includes("does not exist")) {
          return NextResponse.json({ success: true, isMock: true });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[NOTIFICATIONS_POST_ERROR]", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

function getMockNotifications(userId: string, userType: string) {
  if (userType === "admin") {
    return [
      {
        id: "mock-1",
        user_id: userId,
        user_type: "admin",
        type: "deal_update",
        title: "Deal Closed! 🎉",
        body: "Akash Sharma closed a deal with @virat.kohli for ₹12,50,000.",
        link: "/admin/employees",
        read: false,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: "mock-2",
        user_id: userId,
        user_type: "admin",
        type: "work_log",
        title: "Hours Logged ⏱️",
        body: "Priya Patel logged 8.5 hours today.",
        link: "/admin/employees",
        read: false,
        created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
      },
      {
        id: "mock-3",
        user_id: userId,
        user_type: "admin",
        type: "task_complete",
        title: "Task Completed ✅",
        body: "Raj Kumar finished: 'Draft campaign contract for @hema_upadhyay'.",
        link: "/admin/tasks",
        read: true,
        created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
      }
    ];
  } else {
    return [
      {
        id: "mock-1",
        user_id: userId,
        user_type: "employee",
        type: "assignment",
        title: "New Creator Assigned 👤",
        body: "Admin Alex Chen assigned a new creator to you: @ranveer.singh.",
        link: "/employee/creators",
        read: false,
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
      {
        id: "mock-2",
        user_id: userId,
        user_type: "employee",
        type: "task",
        title: "New Task Assigned 📋",
        body: "Admin Alex Chen pushed a task: 'Send collaboration deck' due tomorrow.",
        link: "/employee/tasks",
        read: false,
        created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
      {
        id: "mock-3",
        user_id: userId,
        user_type: "employee",
        type: "overdue",
        title: "Overdue Task Warning ⚠️",
        body: "Your task 'Follow up with @katrinakaif' is overdue by 2 days.",
        link: "/employee/tasks",
        read: true,
        created_at: new Date(Date.now() - 1440 * 60 * 1000).toISOString(),
      }
    ];
  }
}
