"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

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
      if (error.message.includes("does not exist")) {
        // Fallback for demo when DB is not yet migrated
        console.warn("[BRAND_AUTH] 'brands' table does not exist. Emulating registration.");
        const mockSession = {
          id: "brand-mock-uuid-1",
          name,
          role: "brand",
          isMock: true
        };
        const cookieStore = await cookies();
        cookieStore.set("brand_session", JSON.stringify(mockSession), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60
        });
        return { success: true, isMock: true };
      }
      console.error("[REGISTER_BRAND_ERROR]", error);
      return { error: error.message };
    }

    // Set brand session cookie
    const sessionData = {
      id: brand.id,
      name: brand.name,
      role: "brand",
      isMock: false
    };

    const cookieStore = await cookies();
    cookieStore.set("brand_session", JSON.stringify(sessionData), {
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
 * Log in an existing brand account.
 */
export async function loginBrand(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    const supabase = await createClient();

    const { data: brand, error } = await supabase
      .from("brands")
      .select("id, name, password_hash, status")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error) {
      if (error.message.includes("does not exist")) {
        // Safe demo fallback when DB is not migrated
        console.warn("[BRAND_AUTH] 'brands' table does not exist. Emulating brand login.");
        if (email.toLowerCase() === "nike@wecollab.in" && password === "nike@2026") {
          const mockSession = {
            id: "brand-mock-uuid-2",
            name: "Nike India",
            role: "brand",
            isMock: true
          };
          const cookieStore = await cookies();
          cookieStore.set("brand_session", JSON.stringify(mockSession), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60
          });
          return { success: true, isMock: true };
        }
        return { error: "Invalid email or password (or run migration for actual login)." };
      }
      return { error: error.message };
    }

    if (!brand) {
      return { error: "Invalid email or password." };
    }

    if (brand.status !== "active") {
      return { error: "This brand account has been deactivated." };
    }

    const isValid = await bcrypt.compare(password, brand.password_hash);
    if (!isValid) {
      return { error: "Invalid email or password." };
    }

    const sessionData = {
      id: brand.id,
      name: brand.name,
      role: "brand",
      isMock: false
    };

    const cookieStore = await cookies();
    cookieStore.set("brand_session", JSON.stringify(sessionData), {
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
