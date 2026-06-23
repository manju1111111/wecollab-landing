import { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { getNewsletters } from "@/lib/supabase/fallback-db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.wecollab.in";

  // 1. Static and Programmatic SEO Landing Pages
  const staticPaths = [
    "",
    "/discover",
    "/newsletter",
    "/instagram-influencers",
    "/youtube-creators",
    "/food-influencers",
    "/tech-influencers",
    "/fashion-influencers",
    "/travel-influencers",
    "/finance-creators",
    "/fitness-influencers",
    "/gaming-creators",
    "/lifestyle-creators",
    "/instagram-influencers-india",
    "/youtube-influencers-india",
    "/linkedin-creators-india",
    "/influencers/bangalore",
    "/influencers/mumbai",
    "/influencers/delhi",
    "/influencers/hyderabad",
    "/influencers/chennai",
  ];

  const staticUrls = staticPaths.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1.0 : 0.8,
  }));

  // 2. Dynamic Blogs/Newsletters (via database with fallback)
  let blogs: any[] = [];
  try {
    const supabase = await createAdminClient();
    blogs = await getNewsletters(supabase, false);
  } catch (e) {
    console.error("[SITEMAP_BLOGS_ERR]", e);
  }

  const blogUrls = blogs.map((blog) => ({
    url: `${baseUrl}/blog/${blog.slug || blog.id}`,
    lastModified: new Date(blog.updated_at || blog.published_at || new Date()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // 3. Dynamic Creator Profiles (via database)
  let creators: any[] = [];
  try {
    const supabase = await createAdminClient();
    const { data } = await supabase
      .from("creators")
      .select("username, updated_at")
      .eq("verification_status", "Verified")
      .eq("visibility_status", true);
    creators = data || [];
  } catch (e) {
    console.error("[SITEMAP_CREATORS_ERR]", e);
  }

  const creatorUrls = creators.map((creator) => ({
    url: `${baseUrl}/creator/${creator.username}`,
    lastModified: new Date(creator.updated_at || new Date()),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticUrls, ...blogUrls, ...creatorUrls];
}
