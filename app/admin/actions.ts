"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { algoliasearch } from "algoliasearch";
import { redirect } from "next/navigation";
import { CREATOR_CATEGORIES } from "@/data/creator-categories";

let _algoliaClient: ReturnType<typeof algoliasearch> | null = null;

function getAlgoliaClient() {
  if (!_algoliaClient) {
    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const adminKey = process.env.ALGOLIA_ADMIN_KEY;
    
    if (!appId || !adminKey) {
      throw new Error("Algolia credentials (NEXT_PUBLIC_ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY) are missing in environment variables.");
    }
    
    _algoliaClient = algoliasearch(appId, adminKey);
  }
  return _algoliaClient;
}

const INDEX_NAME = "creators";

// Helper to find the main category based on selected tags
function determineMainCategory(tags: string[]): string {
  if (!tags || tags.length === 0) return "General";
  
  // Find which group has the most matching tags
  const groupCounts: Record<string, number> = {};
  
  tags.forEach(tag => {
    CREATOR_CATEGORIES.forEach(group => {
      if (group.subCategories.includes(tag)) {
        groupCounts[group.groupName] = (groupCounts[group.groupName] || 0) + 1;
      }
    });
  });

  if (Object.keys(groupCounts).length === 0) return "General";
  
  // Return the group name with the highest count
  return Object.keys(groupCounts).reduce((a, b) => groupCounts[a] > groupCounts[b] ? a : b);
}

export async function createCreatorAction(formData: FormData) {
  const supabase = await createAdminClient();
  
  const platformsJsonStr = formData.get("platforms_json") as string;
  const platforms = platformsJsonStr ? JSON.parse(platformsJsonStr) : [];
  
  const tagsJsonStr = formData.get("tags_json") as string;
  const tags = tagsJsonStr ? JSON.parse(tagsJsonStr) : [];
  
  const totalFollowers = platforms.reduce((acc: number, p: any) => acc + (Number(p.followers) || 0), 0);
  
  // Automatically determine main category from tags
  const mainCategory = determineMainCategory(tags);
  
  const creator = {
    name: formData.get("name") as string,
    username: formData.get("username") as string,
    category: mainCategory,
    location: formData.get("location") as string,
    bio: formData.get("bio") as string,
    internal_notes: formData.get("internal_notes") as string,
    
    platforms: platforms,
    followers: totalFollowers,
    tags: tags,
    
    // Default metrics since manual entry is removed
    profile_image: "/assets/mock-creators/c1.jpg", 
    verified: false,
    score: 0,
    rating: 0,
    engagement_rate: 0,
    avg_likes: "0",
    avg_reel_views: "0",
  };

  // 1. Save to Supabase
  const { data, error } = await supabase
    .from("creators")
    .insert(creator)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // 2. Sync to Algolia
  const algoliaClient = getAlgoliaClient();
  await algoliaClient.saveObject({
    indexName: INDEX_NAME,
    body: {
      objectID: data.id,
      id: data.id,
      name: data.name,
      handle: data.username,
      avatar: data.profile_image,
      category: data.category,
      platforms: data.platforms,
      totalFollowers: data.followers,
      bio: data.bio,
      location: data.location,
      rating: data.rating,
      engagementRate: data.engagement_rate,
      verified: data.verified,
      score: data.score,
      avgLikes: data.avg_likes,
      avgReelViews: data.avg_reel_views,
      _tags: data.tags // Algolia specific filtering tag
    }
  });

  revalidatePath("/admin/creators");
  redirect("/admin/creators");
}

export async function updateCreatorAction(id: string, formData: FormData) {
  const supabase = await createAdminClient();
  
  const platformsJsonStr = formData.get("platforms_json") as string;
  const platforms = platformsJsonStr ? JSON.parse(platformsJsonStr) : [];
  
  const tagsJsonStr = formData.get("tags_json") as string;
  const tags = tagsJsonStr ? JSON.parse(tagsJsonStr) : [];
  
  const totalFollowers = platforms.reduce((acc: number, p: any) => acc + (Number(p.followers) || 0), 0);
  
  const mainCategory = determineMainCategory(tags);
  
  const creator = {
    name: formData.get("name") as string,
    username: formData.get("username") as string,
    category: mainCategory,
    location: formData.get("location") as string,
    bio: formData.get("bio") as string,
    internal_notes: formData.get("internal_notes") as string,
    
    platforms: platforms,
    followers: totalFollowers,
    tags: tags,
  };

  // 1. Update in Supabase (Only provided fields)
  const { data, error } = await supabase
    .from("creators")
    .update(creator)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // 2. Partial Update in Algolia
  const algoliaClient = getAlgoliaClient();
  await algoliaClient.partialUpdateObject({
    indexName: INDEX_NAME,
    objectID: id,
    attributesToUpdate: {
      name: data.name,
      handle: data.username,
      category: data.category,
      platforms: data.platforms,
      totalFollowers: data.followers,
      bio: data.bio,
      location: data.location,
      _tags: data.tags
    } as any
  });

  revalidatePath("/admin/creators");
  redirect("/admin/creators");
}

export async function deleteCreatorAction(id: string) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase
    .from("creators")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  const algoliaClient = getAlgoliaClient();
  await algoliaClient.deleteObject({
    indexName: INDEX_NAME,
    objectID: id,
  });

  revalidatePath("/admin/creators");
}
