"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function getPlans() {
  const supabase = await createAdminClient();
  
  // Fetch plans and aggregate stats from their lists
  let plans: any[] = [];
  let { data: plansData, error } = await supabase
    .from("plans")
    .select(`
      id, name, brand, created_at, budget, cbf_weights, status,
      lists (
        id,
        name,
        color,
        platform,
        deliverables,
        cost_per_creator,
        list_creators (
          creator_id
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[GET_PLANS_FALLBACK] Retrying baseline select due to column schema updates.");
    const retry = await supabase
      .from("plans")
      .select(`
        id, name, brand, created_at,
        lists (
          id,
          name,
          color,
          platform,
          deliverables,
          cost_per_creator
        )
      `)
      .order("created_at", { ascending: false });

    if (retry.error) {
      console.error("[GET_PLANS_CRITICAL]", retry.error);
      return [];
    }
    
    plans = (retry.data || []).map(p => ({
      ...p,
      budget: 1000000,
      status: "active",
      cbf_weights: { followers: 25, er: 25, cost: 25, feasibility: 25 }
    }));
  } else {
    plans = plansData || [];
  }

  // Format plans with aggregate data and backward-compatibility creator_ids array mapping
  return plans.map(plan => {
    let totalInfluencers = 0;
    const platforms = new Set<string>();
    
    const formattedLists = (plan.lists || []).map((list: any) => {
      const creatorIdsArray = (list.list_creators || []).map((lc: any) => lc.creator_id);
      
      totalInfluencers += creatorIdsArray.length;
      if (list.platform) platforms.add(list.platform);

      return {
        ...list,
        creator_ids: creatorIdsArray
      };
    });

    return {
      ...plan,
      lists: formattedLists,
      totalLists: formattedLists.length,
      totalInfluencers,
      platforms: Array.from(platforms)
    };
  });
}

export async function createPlan(formData: FormData) {
  const supabase = await createAdminClient();
  
  const name = formData.get("name") as string;
  const brand = formData.get("brand") as string;
  const budgetValue = parseFloat(formData.get("budget") as string) || 1000000;

  const { data, error } = await supabase
    .from("plans")
    .insert({ 
      name, 
      brand,
      budget: budgetValue,
      status: "active",
      cbf_weights: { followers: 25, er: 25, cost: 25, feasibility: 25 }
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("does not exist") || error.message.includes("column")) {
      // Fallback if plans table doesn't have budget/cbf columns yet
      const { data: retryData, error: retryError } = await supabase
        .from("plans")
        .insert({ name, brand })
        .select()
        .single();
      if (retryError) throw new Error(retryError.message);
      revalidatePath("/plans");
      redirect(`/plans/${retryData.id}`);
    }
    throw new Error(error.message);
  }

  revalidatePath("/plans");
  redirect(`/plans/${data.id}`);
}

export async function getPlanDetails(planId: string) {
  const supabase = await createAdminClient();
  
  // Fetch the plan and all its lists with their relational creator mappings
  let plan: any = null;
  let { data: planData, error: planError } = await supabase
    .from("plans")
    .select(`
      id, name, brand, created_at, budget, cbf_weights, status,
      lists (
        *,
        list_creators (
          creator_id
        )
      )
    `)
    .eq("id", planId)
    .single();

  if (planError) {
    console.warn("[GET_PLAN_DETAILS_FALLBACK] Retrying baseline details due to column schema updates.");
    const retry = await supabase
      .from("plans")
      .select(`
        id, name, brand, created_at,
        lists (*)
      `)
      .eq("id", planId)
      .single();

    if (retry.error) return null;
    
    plan = {
      ...retry.data,
      budget: 1000000,
      status: "active",
      cbf_weights: { followers: 25, er: 25, cost: 25, feasibility: 25 }
    };
  } else {
    plan = planData;
  }

  // Backward compatibility: Map list_creators array back to creator_ids inside lists
  if (plan && plan.lists) {
    plan.lists = plan.lists.map((list: any) => ({
      ...list,
      creator_ids: (list.list_creators || []).map((lc: any) => lc.creator_id)
    }));
  }

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
  
  // Relational join inserts
  const rows = creatorIds.map(cid => ({
    list_id: listId,
    creator_id: cid
  }));

  const { error } = await supabase
    .from("list_creators")
    .upsert(rows, { onConflict: "list_id,creator_id" });

  if (error) {
    console.warn("[ADD_CREATORS_FALLBACK] Join table failed. Falling back to list array update.", error.message);
    
    const { data: list } = await supabase.from("lists").select("creator_ids, plan_id").eq("id", listId).single();
    if (list) {
      const currentIds = list.creator_ids || [];
      const newIds = Array.from(new Set([...currentIds, ...creatorIds]));
      await supabase.from("lists").update({ creator_ids: newIds }).eq("id", listId);
      revalidatePath(`/plans/${list.plan_id}`);
      return;
    }
    throw new Error(error.message);
  }

  // Fetch plan_id to revalidate
  const { data: list } = await supabase.from("lists").select("plan_id").eq("id", listId).single();
  if (list) {
    revalidatePath(`/plans/${list.plan_id}`);
  }
}

export async function removeCreatorFromList(listId: string, creatorId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("list_creators")
    .delete()
    .eq("list_id", listId)
    .eq("creator_id", creatorId);

  if (error) {
    // Array columns fallback
    console.warn("[REMOVE_CREATOR_FALLBACK] Relational remove failed. Trying array columns update.");
    const { data: list } = await supabase.from("lists").select("creator_ids, plan_id").eq("id", listId).single();
    if (list) {
      const currentIds = list.creator_ids || [];
      const newIds = currentIds.filter((id: string) => id !== creatorId);
      await supabase.from("lists").update({ creator_ids: newIds }).eq("id", listId);
      revalidatePath(`/plans/${list.plan_id}`);
      return { success: true };
    }
    throw new Error(error.message);
  }

  const { data: list } = await supabase.from("lists").select("plan_id").eq("id", listId).single();
  if (list) {
    revalidatePath(`/plans/${list.plan_id}`);
  }
  return { success: true };
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

export async function createPlanInline({ name, brand }: { name: string; brand: string }) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("plans")
    .insert({ name, brand, status: "active" })
    .select()
    .single();

  if (error) {
    console.error("[CREATE_PLAN_INLINE]", error);
    return { error: error.message };
  }

  revalidatePath("/plans");
  return { success: true, plan: data };
}

export async function createListInline({
  planId,
  name,
  color,
  platform,
  deliverables = []
}: {
  planId: string;
  name: string;
  color: string;
  platform: string;
  deliverables?: any[];
}) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("lists")
    .insert({
      plan_id: planId,
      name,
      color,
      platform,
      deliverables
    })
    .select()
    .single();

  if (error) {
    console.error("[CREATE_LIST_INLINE]", error);
    return { error: error.message };
  }

  revalidatePath(`/plans/${planId}`);
  return { success: true, list: data };
}

export async function updatePlanCBFWeights(planId: string, weights: any) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("plans")
    .update({ cbf_weights: weights })
    .eq("id", planId);
    
  if (error) {
    console.error("[UPDATE_CBF_WEIGHTS_ERROR]", error);
    return { error: error.message };
  }
  
  revalidatePath(`/plans/${planId}`);
  return { success: true };
}

export async function updateCreatorNegotiatedCost(listId: string, creatorId: string, cost: number) {
  const supabase = await createAdminClient();
  
  const { data: list } = await supabase
    .from("lists")
    .select("cost_per_creator, plan_id")
    .eq("id", listId)
    .single();
    
  if (!list) return { error: "List not found" };
  
  const currentLedger = list.cost_per_creator || {};
  const updatedLedger = { ...currentLedger, [creatorId]: cost };
  
  const { error } = await supabase
    .from("lists")
    .update({ cost_per_creator: updatedLedger })
    .eq("id", listId);
    
  if (error) {
    console.error("[UPDATE_NEGOTIATED_COST_ERROR]", error);
    return { error: error.message };
  }
  
  revalidatePath(`/plans/${list.plan_id}`);
  return { success: true };
}

export async function updatePlanDetails(planId: string, name: string, brand: string, budget: number) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("plans")
    .update({ name, brand, budget })
    .eq("id", planId);

  if (error) {
    console.error("[UPDATE_PLAN_DETAILS_ERROR]", error);
    return { error: error.message };
  }

  revalidatePath("/plans");
  revalidatePath(`/plans/${planId}`);
  return { success: true };
}

export async function toggleArchivePlan(planId: string, archive: boolean) {
  const supabase = await createAdminClient();
  const statusValue = archive ? "archived" : "active";
  const { error } = await supabase
    .from("plans")
    .update({ status: statusValue })
    .eq("id", planId);

  if (error) {
    console.error("[TOGGLE_ARCHIVE_ERROR]", error);
    return { error: error.message };
  }

  revalidatePath("/plans");
  return { success: true };
}
