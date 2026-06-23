import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTasks } from "@/lib/supabase/fallback-db";
import { createClient as createCookieClient, createAdminClient } from "@/lib/supabase/server";

function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    // Fetch all employees (excluding soft-deleted ones)
    // We try to query with the deleted_at filter first. If the migration has not been run,
    // we fallback to the normal query so that the app doesn't crash.
    let employeesData = [];
    let error = null;

    const firstAttempt = await supabase
      .from("employees")
      .select("id, full_name, email, role, department, designation, phone, status, created_at, deleted_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (firstAttempt.error && (firstAttempt.error.message.includes("deleted_at") || firstAttempt.error.code === "PGRST205")) {
      // Column doesn't exist yet, run fallback query
      const fallbackAttempt = await supabase
        .from("employees")
        .select("id, full_name, email, role, department, designation, phone, status, created_at")
        .order("created_at", { ascending: false });
      employeesData = fallbackAttempt.data || [];
      error = fallbackAttempt.error;
    } else {
      employeesData = firstAttempt.data || [];
      error = firstAttempt.error;
    }

    if (error) {
      console.error("[EMPLOYEES_API]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get assigned creator counts per employee
    const { data: creatorCounts } = await supabase
      .from("creators")
      .select("assigned_employee");

    const countMap: Record<string, number> = {};
    (creatorCounts || []).forEach((c: any) => {
      if (c.assigned_employee) {
        countMap[c.assigned_employee] = (countMap[c.assigned_employee] || 0) + 1;
      }
    });

    // Get completed task counts per employee via fallback-db (handles PGRST205)
    let taskCountMap: Record<string, number> = {};
    try {
      const allTasks = await getTasks(supabase);
      allTasks
        .filter((t: any) => t.completed_at)
        .forEach((t: any) => {
          taskCountMap[t.employee_id] = (taskCountMap[t.employee_id] || 0) + 1;
        });
    } catch (e) {
      // Table may not exist yet, skip task counts
    }

    const enriched = (employeesData || []).map((emp: any) => ({
      ...emp,
      assigned_count: countMap[emp.id] || 0,
      tasks_completed: taskCountMap[emp.id] || 0,
    }));

    return NextResponse.json({ employees: enriched });
  } catch (error) {
    console.error("[EMPLOYEES_API_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Authenticate Request
    const supabase = await createCookieClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract employee ID to delete
    const url = new URL(request.url);
    const targetId = url.searchParams.get("id");

    if (!targetId) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    // Initialize Admin Supabase Client to bypass RLS for authorization checks and updates
    const adminSupabase = await createAdminClient();

    // 3. Authorization Check (Super Admin check)
    // Check if the current user has the "Admin" role (representing Super Admin)
    let role = "";
    
    // Check employees table first
    const { data: empRecord } = await adminSupabase
      .from("employees")
      .select("id, role")
      .eq("email", user.email)
      .single();

    if (empRecord) {
      role = empRecord.role;
    } else {
      // Check profiles table next
      const { data: profileRecord } = await adminSupabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profileRecord) {
        role = profileRecord.role;
      } else {
        // Fallback to user metadata
        role = user.user_metadata?.role || "";
      }
    }

    if (!role || role.toLowerCase() !== "admin") {
      return NextResponse.json(
        { error: "Access denied: Only Super Admins are allowed to delete employees" },
        { status: 403 }
      );
    }

    // 4. Prevent Self-Deletion
    if (empRecord && targetId === empRecord.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }
    if (targetId === user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    // Fetch target employee info before modifying
    const { data: targetEmployee } = await adminSupabase
      .from("employees")
      .select("email, full_name")
      .eq("id", targetId)
      .single();

    if (!targetEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // 5. Unassign Creators
    const { error: unassignError } = await adminSupabase
      .from("creators")
      .update({ assigned_employee: null })
      .eq("assigned_employee", targetId);

    if (unassignError) {
      console.error("[DELETE_EMPLOYEE_UNASSIGN_CREATORS_ERROR]", unassignError);
      return NextResponse.json(
        { error: `Failed to unassign creators: ${unassignError.message}` },
        { status: 500 }
      );
    }

    // 6. Perform Soft Delete
    // Check if the database has the deleted_at column by attempting to update it.
    // If it fails because the column does not exist, we perform a status deactivated update.
    let softDeleteSuccess = false;
    
    try {
      const { error: softDeleteError } = await adminSupabase
        .from("employees")
        .update({
          deleted_at: new Date().toISOString(),
          status: "deactivated"
        })
        .eq("id", targetId);

      if (softDeleteError) {
        if (softDeleteError.message.includes("deleted_at") || softDeleteError.code === "PGRST205") {
          throw softDeleteError; // Let it fall back to status-only deactivation
        }
        console.error("[DELETE_EMPLOYEE_SOFT_DELETE_ERROR]", softDeleteError);
        return NextResponse.json(
          { error: `Failed to delete employee: ${softDeleteError.message}` },
          { status: 500 }
        );
      }
      softDeleteSuccess = true;
    } catch (e: any) {
      // Fallback to only deactivating status if table has no deleted_at column yet
      const { error: statusOnlyError } = await adminSupabase
        .from("employees")
        .update({
          status: "deactivated"
        })
        .eq("id", targetId);

      if (statusOnlyError) {
        console.error("[DELETE_EMPLOYEE_DEACTIVATE_ERROR]", statusOnlyError);
        return NextResponse.json(
          { error: `Failed to deactivate employee: ${statusOnlyError.message}` },
          { status: 500 }
        );
      }
    }

    // 7. Audit Logging
    const adminEmployeeId = empRecord?.id || user.id;
    await adminSupabase
      .from("employee_activity_log")
      .insert({
        employee_id: adminEmployeeId,
        type: "delete",
        description: `Deleted employee: ${targetEmployee.full_name} (${targetEmployee.email})`,
      });

    return NextResponse.json({ 
      success: true, 
      message: softDeleteSuccess ? "Employee deleted successfully." : "Employee deactivated successfully (deleted_at pending database migration)."
    });
  } catch (error: any) {
    console.error("[DELETE_EMPLOYEE_API_ERROR]", error);
    return NextResponse.json({ error: "An unexpected error occurred during employee deletion." }, { status: 500 });
  }
}
