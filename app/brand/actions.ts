"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/notifications/email";
import { signSession, verifySession } from "@/lib/supabase/session-crypto";

/**
 * Registers a new Brand client in the database.
 */
export async function registerBrand(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const website = formData.get("website") as string;
    const industry = formData.get("industry") as string;

    if (!name || !email || !password) {
      return { error: "Name, email, and password are required." };
    }

    const supabase = await createAdminClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("brands")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return { error: "A brand account with this email already exists." };
    }

    const hash = await bcrypt.hash(password, 10);

    const { data: brand, error } = await supabase
      .from("brands")
      .insert({
        name,
        email: email.toLowerCase(),
        password_hash: hash,
        website: website || null,
        industry: industry || "General",
        status: "active"
      })
      .select()
      .single();

    if (error) {
      console.error("[REGISTER_BRAND_ERROR]", error);
      return { error: error.message };
    }

    // Set brand session cookie
    const sessionData = {
      id: brand.id,
      name: brand.name,
      role: "brand",
    };

    const cookieStore = await cookies();
    cookieStore.set("brand_session", signSession(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return { success: true };
  } catch (err: any) {
    console.error("[REGISTER_BRAND_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Log in an existing brand account with IP-based rate limiting.
 */
export async function loginBrand(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    // IP-based Rate Limiting (attempts from this IP)
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const adminSupabase = await createAdminClient();

    // Check if IP is currently blocked (5 attempts within last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: attemptRecord } = await adminSupabase
      .from("login_attempts")
      .select("attempts, last_attempt")
      .eq("ip", ip)
      .maybeSingle();

    if (attemptRecord) {
      const isBlocked = attemptRecord.attempts >= 5 && new Date(attemptRecord.last_attempt).getTime() > Date.now() - 10 * 60 * 1000;
      if (isBlocked) {
        return { error: "Too many login attempts. Please try again in 10 minutes." };
      }
    }

    const supabase = await createClient();

    const { data: brand, error } = await supabase
      .from("brands")
      .select("id, name, password_hash, status")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      return { error: error.message };
    }

    // Helper to log failed attempts
    const handleLoginFailure = async () => {
      try {
        const now = new Date().toISOString();
        if (attemptRecord) {
          const resetAttempts = new Date(attemptRecord.last_attempt).getTime() < Date.now() - 10 * 60 * 1000;
          const newAttempts = resetAttempts ? 1 : attemptRecord.attempts + 1;
          await adminSupabase
            .from("login_attempts")
            .upsert({ ip, attempts: newAttempts, last_attempt: now });
        } else {
          await adminSupabase
            .from("login_attempts")
            .insert({ ip, attempts: 1, last_attempt: now });
        }
      } catch (e) {
        console.error("[RATE_LIMIT_UPSERT_FAILED]", e);
      }
    };

    if (!brand) {
      await handleLoginFailure();
      return { error: "Invalid email or password." };
    }

    if (brand.status !== "active") {
      return { error: "This brand account has been deactivated." };
    }

    if (!brand.password_hash) {
      await handleLoginFailure();
      return { error: "Please log in using your social provider." };
    }

    const isValid = await bcrypt.compare(password, brand.password_hash);
    if (!isValid) {
      await handleLoginFailure();
      return { error: "Invalid email or password." };
    }

    // Clear login attempts on success
    try {
      await adminSupabase
        .from("login_attempts")
        .delete()
        .eq("ip", ip);
    } catch (e) {
      console.error("[RATE_LIMIT_DELETE_FAILED]", e);
    }

    const sessionData = {
      id: brand.id,
      name: brand.name,
      role: "brand",
    };

    const cookieStore = await cookies();
    cookieStore.set("brand_session", signSession(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return { success: true };
  } catch (err: any) {
    console.error("[LOGIN_BRAND_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Log out the brand session.
 */
export async function logoutBrand() {
  const cookieStore = await cookies();
  cookieStore.delete("brand_session");
  return { success: true };
}

/**
 * Request password reset link.
 */
export async function requestPasswordReset(email: string, origin: string) {
  try {
    if (!email) {
      return { error: "Email is required." };
    }

    const adminSupabase = await createAdminClient();

    const { data: brand, error } = await adminSupabase
      .from("brands")
      .select("id, email, name")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("[REQUEST_RESET_DB_ERROR]", error);
      return { error: error.message };
    }

    // Safe response: return success even if email doesn't exist to prevent email harvesting
    if (!brand) {
      return { success: true };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const { error: updateError } = await adminSupabase
      .from("brands")
      .update({
        reset_token: token,
        reset_token_expires_at: expiresAt
      })
      .eq("id", brand.id);

    if (updateError) {
      console.error("[REQUEST_RESET_UPDATE_ERROR]", updateError);
      return { error: "Failed to generate reset token." };
    }

    const resetUrl = `${origin}/brand/reset-password?token=${token}`;
    const emailRes = await sendPasswordResetEmail({
      to: brand.email,
      token,
      resetUrl
    });

    if (!emailRes.success) {
      console.error("[REQUEST_RESET_EMAIL_ERROR]", emailRes.error);
      return { error: "Failed to send reset email." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[REQUEST_RESET_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Reset password using token.
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  try {
    if (!token || !newPassword) {
      return { error: "Token and new password are required." };
    }

    if (newPassword.length < 8) {
      return { error: "Password must be at least 8 characters long." };
    }

    const adminSupabase = await createAdminClient();

    // Check if token exists and is valid
    const { data: brand, error } = await adminSupabase
      .from("brands")
      .select("id, reset_token_expires_at")
      .eq("reset_token", token)
      .maybeSingle();

    if (error) {
      console.error("[RESET_PASSWORD_DB_ERROR]", error);
      return { error: error.message };
    }

    if (!brand) {
      return { error: "Invalid or expired password reset token." };
    }

    const isExpired = new Date(brand.reset_token_expires_at).getTime() < Date.now();
    if (isExpired) {
      return { error: "The password reset link has expired." };
    }

    const hash = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await adminSupabase
      .from("brands")
      .update({
        password_hash: hash,
        reset_token: null,
        reset_token_expires_at: null
      })
      .eq("id", brand.id);

    if (updateError) {
      console.error("[RESET_PASSWORD_UPDATE_ERROR]", updateError);
      return { error: "Failed to update password." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[RESET_PASSWORD_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Verify if reset token is valid and not expired.
 */
export async function verifyResetToken(token: string) {
  try {
    if (!token) return { isValid: false };

    const adminSupabase = await createAdminClient();
    const { data: brand, error } = await adminSupabase
      .from("brands")
      .select("id, reset_token_expires_at")
      .eq("reset_token", token)
      .maybeSingle();

    if (error || !brand) {
      return { isValid: false };
    }

    const isExpired = new Date(brand.reset_token_expires_at).getTime() < Date.now();
    if (isExpired) {
      return { isValid: false };
    }

    return { isValid: true };
  } catch (err) {
    console.error("[VERIFY_TOKEN_CRITICAL]", err);
    return { isValid: false };
  }
}

/**
 * Gets the verified brand session.
 */
export async function getBrandSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("brand_session");
  if (!sessionCookie) return null;
  return verifySession(sessionCookie.value);
}

