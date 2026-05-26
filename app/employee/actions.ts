"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function inviteEmployee(formData: FormData) {
  const supabase = await createAdminClient();
  
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const department = formData.get("department") as string;
  const role = formData.get("role") as string;
  const designation = formData.get("designation") as string;

  if (!fullName || !email || !role) {
    return { error: "Missing required fields" };
  }

  const token = uuidv4();

  const { data, error } = await supabase
    .from("employees")
    .insert({
      full_name: fullName,
      email: email.toLowerCase(),
      phone,
      department,
      role,
      designation,
      invitation_token: token,
      status: "invited"
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: "An employee with this email already exists." };
    }
    console.error("Invite Error:", error);
    return { error: `Database Error: ${error.message || "Failed to create invitation"}` };
  }

  // In production, send email via Resend/SendGrid here.
  // For MVP, we return the link to the UI so admin can share/test it.
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employee/create-account?token=${token}`;

  return { success: true, link: inviteLink, employee: data };
}

export async function verifyToken(token: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, email, full_name, status")
    .eq("invitation_token", token)
    .single();

  if (error || !data) return { error: "Invalid or expired token." };
  if (data.status !== "invited") return { error: "Account has already been created." };

  return { success: true, employee: data };
}

export async function createAccount(token: string, formData: FormData) {
  const supabase = await createAdminClient();
  const password = formData.get("password") as string;

  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id, status")
    .eq("invitation_token", token)
    .single();

  if (!employee || employee.status !== "invited") {
    return { error: "Invalid token." };
  }

  const hash = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from("employees")
    .update({
      password_hash: hash,
      status: "active",
      invitation_token: null // invalidate token
    })
    .eq("id", employee.id);

  if (error) {
    console.error("Create Account Error:", error);
    return { error: "Failed to setup account." };
  }

  return { success: true };
}

export async function loginEmployee(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, password_hash, status, role")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !employee) {
    return { error: "Invalid email or password." };
  }

  if (employee.status !== "active") {
    return { error: "Account is not active. Please check your invitation." };
  }

  const isValid = await bcrypt.compare(password, employee.password_hash);
  
  if (!isValid) {
    return { error: "Invalid email or password." };
  }

  // Create simple session using cookies
  // In a full production app, use JWT or Supabase Auth.
  const sessionData = {
    id: employee.id,
    role: employee.role,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week
  };

  const cookieStore = await cookies();
  cookieStore.set("employee_session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60
  });

  return { success: true };
}

export async function logoutEmployee() {
  const cookieStore = await cookies();
  cookieStore.delete("employee_session");
  return { success: true };
}
