"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { 
  insertNewsletter, 
  updateNewsletter, 
  deleteNewsletter, 
  insertNewsletterSubscriber 
} from "@/lib/supabase/fallback-db";
import { revalidatePath } from "next/cache";

export async function createNewsletterAction(formData: FormData) {
  const supabase = await createAdminClient();

  const title = formData.get("title") as string;
  const summary = formData.get("summary") as string;
  const content = formData.get("content") as string;
  const cover_image = formData.get("cover_image") as string;
  const category = formData.get("category") as string;
  const tagsString = formData.get("tags") as string;
  const is_published = formData.get("is_published") === "true";
  const seo_title = formData.get("seo_title") as string;
  const seo_description = formData.get("seo_description") as string;
  const slugInput = formData.get("slug") as string;

  const tags = tagsString
    ? tagsString.split(",").map(t => t.trim()).filter(Boolean)
    : [];

  const slug = (slugInput && slugInput.trim())
    ? slugInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    : title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

  const newsletter = {
    title,
    slug,
    summary,
    content,
    cover_image: cover_image || null,
    category: category || "Creator Economy",
    tags,
    is_published,
    published_at: is_published ? new Date().toISOString() : null,
    author_name: "WeCollab Team",
    author_avatar: "/assets/logo.jpg",
    seo_title: seo_title || null,
    seo_description: seo_description || null
  };

  const { data, error } = await insertNewsletter(supabase, newsletter) as { data: any; error: any };

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/newsletter");
  revalidatePath("/admin/newsletter");
  return data;
}

export async function updateNewsletterAction(id: string, formData: FormData) {
  const supabase = await createAdminClient();

  const title = formData.get("title") as string;
  const summary = formData.get("summary") as string;
  const content = formData.get("content") as string;
  const cover_image = formData.get("cover_image") as string;
  const category = formData.get("category") as string;
  const tagsString = formData.get("tags") as string;
  const is_published = formData.get("is_published") === "true";
  const seo_title = formData.get("seo_title") as string;
  const seo_description = formData.get("seo_description") as string;
  const slugInput = formData.get("slug") as string;

  const tags = tagsString
    ? tagsString.split(",").map(t => t.trim()).filter(Boolean)
    : [];

  const slug = (slugInput && slugInput.trim())
    ? slugInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
    : title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

  const updates = {
    title,
    slug,
    summary,
    content,
    cover_image: cover_image || null,
    category: category || "Creator Economy",
    tags,
    is_published,
    seo_title: seo_title || null,
    seo_description: seo_description || null
  };

  const { data, error } = await updateNewsletter(supabase, id, updates) as { data: any; error: any };

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/newsletter");
  revalidatePath(`/newsletter/${id}`);
  revalidatePath("/admin/newsletter");
  return data;
}

export async function deleteNewsletterAction(id: string) {
  const supabase = await createAdminClient();

  const { error } = await deleteNewsletter(supabase, id) as { error: any };

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/newsletter");
  revalidatePath("/admin/newsletter");
}

export async function togglePublishNewsletterAction(id: string, isPublished: boolean) {
  const supabase = await createAdminClient();

  const updates = {
    is_published: isPublished,
    published_at: isPublished ? new Date().toISOString() : null
  };

  const { data, error } = await updateNewsletter(supabase, id, updates) as { data: any; error: any };

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/newsletter");
  revalidatePath(`/newsletter/${id}`);
  revalidatePath("/admin/newsletter");
  return data;
}

export async function subscribeAction(email: string) {
  const supabase = await createAdminClient();

  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const { error } = await insertNewsletterSubscriber(supabase, email) as { error: any };

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/newsletter");
  return { success: true };
}
