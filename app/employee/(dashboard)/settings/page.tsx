import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/supabase/session-crypto";
import { EmployeeSettingsForm } from "./settings-form";

export default async function EmployeeSettingsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");

  if (!sessionCookie) {
    redirect("/employee/login");
  }

  const session = verifySession(sessionCookie.value);
  if (!session) {
    redirect("/employee/login");
  }

  const supabase = await createAdminClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select("full_name, email, phone, department, designation, role")
    .eq("id", session.id)
    .single();

  if (error || !employee) {
    redirect("/employee/login");
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-4">
      {/* Title Header */}
      <div className="bg-white rounded-2xl px-7 py-5 border border-slate-200 shadow-sm flex flex-col justify-center">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-slate-500 text-[14px] font-medium mt-1">
          Manage your personal details and partner configurations.
        </p>
      </div>

      {/* Form Component */}
      <EmployeeSettingsForm
        initialData={{
          fullName: employee.full_name || "",
          email: employee.email || "",
          phone: employee.phone || "",
          department: employee.department || "",
          designation: employee.designation || "",
          role: employee.role || "",
        }}
      />
    </div>
  );
}
