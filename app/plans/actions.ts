"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getPlans() {
  const supabase = await createAdminClient();
  
  // Fetch plans and aggregate stats from their lists
  const { data: plans, error } = await supabase
    .from("plans")
    .select(`
      *,
      lists (
        id,
        creator_ids,
        platform
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching plans:", error);
    return [];
  }

  // Format plans with aggregate data
  return plans.map(plan => {
    let totalInfluencers = 0;
    const platforms = new Set<string>();
    
    plan.lists.forEach((list: any) => {
      totalInfluencers += (list.creator_ids || []).length;
      if (list.platform) platforms.add(list.platform);
    });

    return {
      ...plan,
      totalLists: plan.lists.length,
      totalInfluencers,
      platforms: Array.from(platforms)
    };
  });
}

export async function createPlan(formData: FormData) {
  const supabase = await createAdminClient();
  
  const name = formData.get("name") as string;
  const brand = formData.get("brand") as string;

  const { data, error } = await supabase
    .from("plans")
    .insert({ name, brand })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/plans");
  redirect(`/plans/${data.id}`);
}

export async function getPlanDetails(planId: string) {
  const supabase = await createAdminClient();
  
  // Fetch the plan and all its lists
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(`
      *,
      lists (*)
    `)
    .eq("id", planId)
    .single();

  if (planError) return null;

  return plan;
}

export async function createList(planId: string, formData: FormData) {
  const supabase = await createAdminClient();
  
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const platform = formData.get("platform") as string;
  const deliverables = formData.get("deliverables") as string;

  const { error } = await supabase
    .from("lists")
    .insert({
      plan_id: planId,
      name,
      color,
      platform,
      deliverables: deliverables ? JSON.parse(deliverables) : []
    });

  if (error) throw new Error(error.message);

  revalidatePath(`/plans/${planId}`);
}

export async function addCreatorsToList(listId: string, creatorIds: string[]) {
  const supabase = await createAdminClient();
  
  // Get current list
  const { data: list } = await supabase.from("lists").select("creator_ids, plan_id").eq("id", listId).single();
  if (!list) return;

  const currentIds = list.creator_ids || [];
  
  // Create a Set to remove duplicates
  const newIds = Array.from(new Set([...currentIds, ...creatorIds]));

  const { error } = await supabase
    .from("lists")
    .update({ creator_ids: newIds })
    .eq("id", listId);
    
  if (error) throw new Error(error.message);

  revalidatePath(`/plans/${list.plan_id}`);
}

export async function getCreatorsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const supabase = await createAdminClient();
  const { data, error } = await supabase.from("creators").select("*").in("id", ids);
  if (error) {
    console.error("Error fetching creators:", error);
    return [];
  }
  return data;
}

