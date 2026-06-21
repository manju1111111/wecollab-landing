"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { signSession } from "@/lib/supabase/session-crypto";

/**
 * Onboards a new creator using Supabase Auth and inserts their profile.
 */
export async function onboardCreator(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string;
    const instagram = formData.get("instagram") as string;
    const youtube = formData.get("youtube") as string;
    const location = formData.get("location") as string;
    const category = formData.get("category") as string || "General";

    if (!name || !email || !password || !instagram) {
      return { error: "Name, email, password, and Instagram handle are required." };
    }

    const supabase = await createAdminClient();

    // 1. Sign up user in Supabase Auth
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: name,
          role: "creator"
        }
      }
    });

    if (signUpErr) {
      console.error("[CREATOR_SIGNUP_AUTH_ERROR]", signUpErr.message);
      return { error: signUpErr.message };
    }

    const authUser = authData.user;
    if (!authUser) {
      return { error: "Failed to establish creator user profile." };
    }

    // 2. Insert creator profile into the public.creators table using the matching Auth UUID
    const cleanUsername = instagram.replace("@", "").trim();
    
    // Map platforms structure
    const platforms = [
      { name: "Instagram", handle: `@${cleanUsername}`, url: `https://instagram.com/${cleanUsername}` }
    ];
    if (youtube) {
      const cleanYt = youtube.replace("@", "").trim();
      platforms.push({ name: "YouTube", handle: `@${cleanYt}`, url: `https://youtube.com/${cleanYt}` });
    }

    const { error: profileErr } = await supabase
      .from("creators")
      .insert({
        id: authUser.id, // Match the Auth UUID
        name: name,
        email: email.toLowerCase(),
        phone: phone || null,
        username: cleanUsername,
        platforms: platforms,
        location: location || "India",
        category: category,
        bio: `Professional Creator focusing on ${category}.`,
        followers: 15000, // Seed initial starting baseline
        avg_reel_views: "5000",
        engagement_rate: 3.5,
        verification_status: "Pending Verification", // New signups go to Review queue
        visibility_status: false // Invisible until verified
      });

    if (profileErr) {
      console.error("[CREATOR_PROFILE_INSERT_ERROR]", profileErr.message);
      // Clean up the created auth user so they can retry
      await supabase.auth.admin.deleteUser(authUser.id);
      return { error: `Profile creation failed: ${profileErr.message}` };
    }

    // 3. Establish Session Cookie
    const sessionData = {
      id: authUser.id,
      name: name,
      email: email.toLowerCase(),
      role: "creator"
    };

    const cookieStore = await cookies();
    cookieStore.set("creator_session", signSession(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return { success: true };
  } catch (err: any) {
    console.error("[CREATOR_ONBOARD_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Logs in an existing creator.
 */
export async function loginCreator(formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return { error: "Email and password are required." };
    }

    const supabase = await createAdminClient();

    // 1. Sign in via Supabase Auth
    const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    if (signInErr) {
      console.error("[CREATOR_LOGIN_AUTH_ERROR]", signInErr.message);
      return { error: signInErr.message };
    }

    const authUser = authData.user;
    if (!authUser) {
      return { error: "Failed to login creator." };
    }

    // 2. Fetch profile from creators table
    const { data: creator, error: profileErr } = await supabase
      .from("creators")
      .select("id, name, email")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileErr || !creator) {
      console.error("[CREATOR_LOGIN_PROFILE_ERROR]", profileErr?.message || "Profile not found");
      return { error: "Creator profile not found. Please onboarding first." };
    }

    // 3. Set Session Cookie
    const sessionData = {
      id: creator.id,
      name: creator.name,
      email: creator.email,
      role: "creator"
    };

    const cookieStore = await cookies();
    cookieStore.set("creator_session", signSession(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return { success: true };
  } catch (err: any) {
    console.error("[CREATOR_LOGIN_CRITICAL]", err);
    return { error: err.message };
  }
}

/**
 * Logs out the creator.
 */
export async function logoutCreator() {
  const cookieStore = await cookies();
  cookieStore.delete("creator_session");
  return { success: true };
}
