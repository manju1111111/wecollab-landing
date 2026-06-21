"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { signSession, verifySession } from "@/lib/supabase/session-crypto";
import { sendPasswordResetEmail } from "@/lib/notifications/email";

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
  const invitedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours

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
      status: "invited",
      invited_at: invitedAt,
      invitation_expires_at: expiresAt
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

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employee/create-account?token=${token}`;

  return { success: true, link: inviteLink, employee: data };
}

export async function verifyToken(token: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id, email, full_name, status, invitation_expires_at")
    .eq("invitation_token", token)
    .single();

  if (error || !data) return { error: "Invalid invitation link." };
  if (data.status !== "invited") return { error: "Account has already been created." };

  // Expiration check (48 hours)
  if (data.invitation_expires_at && new Date(data.invitation_expires_at) < new Date()) {
    return { error: "This invitation link has expired. Please request a new one from your Admin." };
  }

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
    .select("id, status, invitation_expires_at, full_name, role")
    .eq("invitation_token", token)
    .single();

  if (!employee || employee.status !== "invited") {
    return { error: "Invalid token." };
  }

  // Expiration validation
  if (employee.invitation_expires_at && new Date(employee.invitation_expires_at) < new Date()) {
    return { error: "This invitation link has expired." };
  }

  const hash = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from("employees")
    .update({
      password_hash: hash,
      status: "active",
      invitation_token: null, // invalidate token
      invitation_expires_at: null // clear expiration window
    })
    .eq("id", employee.id);

  if (error) {
    console.error("Create Account Error:", error);
    return { error: "Failed to setup account." };
  }

  // Automatically log in the user immediately after account setup for premier UX
  const sessionData = {
    id: employee.id,
    role: employee.role,
    full_name: employee.full_name,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week
  };

  const cookieStore = await cookies();
  cookieStore.set("employee_session", signSession(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60
  });

  // Set activity status online
  try {
    const { upsertEmployeeActivity } = await import("./activity-actions");
    await upsertEmployeeActivity({ employeeId: employee.id, status: "online", currentActivity: "Logged In" });
  } catch (e) {
    console.error("Failed to set login activity:", e);
  }

  return { success: true };
}

export async function loginEmployee(formData: FormData) {
  // CRITICAL SECURITY UPGRADE: Use createAdminClient to safely query credentials bypassing RLS
  const supabase = await createAdminClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const { data: employee, error } = await supabase
    .from("employees")
    .select("id, password_hash, status, role, full_name")
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
  const sessionData = {
    id: employee.id,
    role: employee.role,
    full_name: employee.full_name,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week
  };

  const cookieStore = await cookies();
  cookieStore.set("employee_session", signSession(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60
  });

  // Set activity status online
  try {
    const { upsertEmployeeActivity } = await import("./activity-actions");
    await upsertEmployeeActivity({ employeeId: employee.id, status: "online", currentActivity: "Logged In" });
  } catch (e) {
    console.error("Failed to set login activity:", e);
  }

  return { success: true };
}

export async function logoutEmployee() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  
  if (sessionCookie) {
    try {
      const session = verifySession(sessionCookie.value);
      if (session && session.id) {
        const { setOffline } = await import("./activity-actions");
        await setOffline(session.id);
      }
    } catch (e) {
      console.error("Failed to set offline activity on logout:", e);
    }
  }

  cookieStore.delete("employee_session");
  return { success: true };
}

export async function resendEmployeeInvite(employeeId: string) {
  const supabase = await createAdminClient();

  const { data: employee, error: fetchErr } = await supabase
    .from("employees")
    .select("id, email, full_name, status")
    .eq("id", employeeId)
    .single();

  if (fetchErr || !employee) {
    return { error: "Employee profile not found." };
  }

  if (employee.status !== "invited") {
    return { error: "Only currently invited employees can have invitations resent." };
  }

  const newToken = uuidv4();
  const invitedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error: updateErr } = await supabase
    .from("employees")
    .update({
      invitation_token: newToken,
      invited_at: invitedAt,
      invitation_expires_at: expiresAt
    })
    .eq("id", employeeId);

  if (updateErr) {
    console.error("[RESEND_INVITE_ERROR]", updateErr.message);
    return { error: `Failed to refresh invitation token: ${updateErr.message}` };
  }

  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/employee/create-account?token=${newToken}`;
  return { success: true, link: inviteLink };
}

export async function updateEmployeeProfile(formData: FormData) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  if (!sessionCookie) {
    return { error: "Not authenticated" };
  }

  let session = verifySession(sessionCookie.value);
  if (!session) {
    return { error: "Invalid session" };
  }

  const employeeId = session.id;
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const department = formData.get("department") as string;
  const designation = formData.get("designation") as string;

  if (!fullName || !email) {
    return { error: "Full Name and Email are required." };
  }

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("employees")
    .update({
      full_name: fullName,
      email: email.toLowerCase(),
      phone,
      department,
      designation
    })
    .eq("id", employeeId);

  if (error) {
    console.error("Update Employee Profile Error:", error);
    if (error.code === '23505') {
      return { error: "An employee with this email already exists." };
    }
    return { error: `Failed to update profile: ${error.message}` };
  }

  // Update session cookie with new details
  const updatedSession = {
    ...session,
    full_name: fullName,
  };
  cookieStore.set("employee_session", signSession(updatedSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60
  });

  revalidatePath("/employee", "layout");
  return { success: true };
}

/**
 * Gets the verified employee session.
 */
export async function getEmployeeSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  if (!sessionCookie) return null;
  return verifySession(sessionCookie.value);
}

/**
 * Request password reset link for employees.
 */
export async function requestEmployeePasswordReset(email: string, origin: string) {
  try {
    if (!email) {
      return { error: "Email is required." };
    }

    const adminSupabase = await createAdminClient();

    const { data: employee, error } = await adminSupabase
      .from("employees")
      .select("id, email, full_name")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("[REQUEST_EMPLOYEE_RESET_DB_ERROR]", error);
      return { error: error.message };
    }

    // Safe response: return success even if email doesn't exist to prevent email harvesting
    if (!employee) {
      return { success: true };
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const { error: updateError } = await adminSupabase
      .from("employees")
      .update({
        reset_token: token,
        reset_token_expires_at: expiresAt
      })
      .eq("id", employee.id);

    if (updateError) {
      console.error("[REQUEST_EMPLOYEE_RESET_UPDATE_ERROR]", updateError);
      return { error: "Failed to generate reset token." };
    }

    const resetUrl = `${origin}/employee/reset-password?token=${token}`;
    const emailRes = await sendPasswordResetEmail({
      to: employee.email,
      token,
      resetUrl
    });

    if (!emailRes.success) {
      console.error("[REQUEST_EMPLOYEE_RESET_EMAIL_ERROR]", emailRes.error);
      return { error: "Failed to send reset email." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[REQUEST_EMPLOYEE_RESET_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Reset employee password using token.
 */
export async function resetEmployeePasswordWithToken(token: string, newPassword: string) {
  try {
    if (!token || !newPassword) {
      return { error: "Token and new password are required." };
    }

    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }

    const adminSupabase = await createAdminClient();

    // Check if token exists and is valid
    const { data: employee, error } = await adminSupabase
      .from("employees")
      .select("id, reset_token_expires_at")
      .eq("reset_token", token)
      .maybeSingle();

    if (error) {
      console.error("[RESET_EMPLOYEE_PASSWORD_DB_ERROR]", error);
      return { error: error.message };
    }

    if (!employee) {
      return { error: "Invalid or expired password reset token." };
    }

    const isExpired = new Date(employee.reset_token_expires_at).getTime() < Date.now();
    if (isExpired) {
      return { error: "The password reset link has expired." };
    }

    const hash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await adminSupabase
      .from("employees")
      .update({
        password_hash: hash,
        reset_token: null,
        reset_token_expires_at: null
      })
      .eq("id", employee.id);

    if (updateError) {
      console.error("[RESET_EMPLOYEE_PASSWORD_UPDATE_ERROR]", updateError);
      return { error: "Failed to update password." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[RESET_EMPLOYEE_PASSWORD_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Verify if employee reset token is valid and not expired.
 */
export async function verifyEmployeeResetToken(token: string) {
  try {
    if (!token) return { isValid: false };

    const adminSupabase = await createAdminClient();
    const { data: employee, error } = await adminSupabase
      .from("employees")
      .select("id, reset_token_expires_at")
      .eq("reset_token", token)
      .maybeSingle();

    if (error || !employee) {
      return { isValid: false };
    }

    const isExpired = new Date(employee.reset_token_expires_at).getTime() < Date.now();
    if (isExpired) {
      return { isValid: false };
    }

    return { isValid: true };
  } catch (err) {
    console.error("[VERIFY_EMPLOYEE_TOKEN_CRITICAL]", err);
    return { isValid: false };
  }
}
