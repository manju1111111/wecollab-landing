"use server";

import { createAdminClient } from "../../lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const fallbackFilePath = path.join(process.cwd(), 'data/fallback-db.json');

function initFallbackDb() {
  if (!fs.existsSync(fallbackFilePath)) {
    const dir = path.dirname(fallbackFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      fallbackFilePath,
      JSON.stringify({ 
        creator_profiles: [],
        creator_posts: [],
        creator_metrics: [],
        creator_scores: [],
        creator_sync_logs: [],
        creator_metrics_history: [],
        plans: [],
        plan_lists: [],
        plan_creators: [],
        plan_column_preferences: []
      }, null, 2),
      'utf8'
    );
  }
}

function readFallbackDb() {
  initFallbackDb();
  try {
    const content = fs.readFileSync(fallbackFilePath, 'utf8');
    const parsed = JSON.parse(content);
    parsed.plans = parsed.plans || [];
    parsed.plan_lists = parsed.plan_lists || [];
    parsed.plan_creators = parsed.plan_creators || [];
    parsed.plan_column_preferences = parsed.plan_column_preferences || [];
    parsed.creator_scores = parsed.creator_scores || [];
    parsed.creator_profiles = parsed.creator_profiles || [];
    parsed.creator_metrics = parsed.creator_metrics || [];
    return parsed;
  } catch (e) {
    return {
      plans: [],
      plan_lists: [],
      plan_creators: [],
      plan_column_preferences: [],
      creator_scores: [],
      creator_profiles: [],
      creator_metrics: []
    };
  }
}

function writeFallbackDb(data: any) {
  try {
    fs.writeFileSync(fallbackFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error("Failed to write to fallback DB:", e);
  }
}

export async function getPlans() {
  const supabase = await createAdminClient();
  try {
    let plans: any[] = [];
    const { data: plansData, error } = await supabase
      .from("plans")
      .select(`
        id, name, brand, created_at, budget, cbf_weights, status,
        plan_lists (
          id,
          name,
          color,
          platform,
          deliverables,
          cost_per_creator,
          plan_creators (
            creator_id
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    plans = plansData || [];

    return plans.map(plan => {
      let totalInfluencers = 0;
      const platforms = new Set<string>();
      
      const formattedLists = (plan.plan_lists || []).map((list: any) => {
        const creatorIdsArray = (list.plan_creators || []).map((lc: any) => lc.creator_id);
        totalInfluencers += creatorIdsArray.length;
        if (list.platform) platforms.add(list.platform);
        return { ...list, creator_ids: creatorIdsArray };
      });

      return {
        ...plan,
        lists: formattedLists,
        totalLists: formattedLists.length,
        totalInfluencers,
        platforms: Array.from(platforms)
      };
    });
  } catch (err: any) {
    console.warn(`[GET_PLANS_FALLBACK] Supabase read failed. Reading from fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    return db.plans.map((plan: any) => {
      const planLists = db.plan_lists.filter((l: any) => l.plan_id === plan.id);
      let totalInfluencers = 0;
      const platforms = new Set<string>();
      
      const formattedLists = planLists.map((list: any) => {
        const creatorIdsArray = db.plan_creators.filter((pc: any) => pc.list_id === list.id).map((pc: any) => pc.creator_id);
        totalInfluencers += creatorIdsArray.length;
        if (list.platform) platforms.add(list.platform);
        return { ...list, creator_ids: creatorIdsArray };
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
}

export async function createPlan(formData: FormData) {
  const name = formData.get("name") as string;
  const brand = formData.get("brand") as string;
  const budgetValue = parseFloat(formData.get("budget") as string) || 1000000;

  const supabase = await createAdminClient();
  let createdId: string | null = null;

  try {
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

    if (error) throw error;
    createdId = data.id;
  } catch (err: any) {
    console.warn(`[CREATE_PLAN_FALLBACK] Supabase insert failed. Saving to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    const newPlan = {
      id: crypto.randomUUID(),
      name,
      brand,
      budget: budgetValue,
      status: "active",
      cbf_weights: { followers: 25, er: 25, cost: 25, feasibility: 25 },
      created_at: new Date().toISOString()
    };
    db.plans.push(newPlan);
    writeFallbackDb(db);
    createdId = newPlan.id;
  }

  revalidatePath("/plans");
  redirect(`/plans/${createdId}`);
}

export async function getPlanDetails(planId: string) {
  const supabase = await createAdminClient();
  try {
    let { data: planData, error: planError } = await supabase
      .from("plans")
      .select(`
        id, name, brand, created_at, budget, cbf_weights, status,
        plan_lists (
          *,
          plan_creators (
            creator_id
          )
        )
      `)
      .eq("id", planId)
      .single();

    if (planError) throw planError;
    if (!planData) return null;
    
    const formattedPlan: any = {
      ...planData,
      lists: (planData.plan_lists || []).map((list: any) => ({
        ...list,
        creator_ids: (list.plan_creators || []).map((lc: any) => lc.creator_id)
      }))
    };
    return formattedPlan;
  } catch (err: any) {
    console.warn(`[GET_PLAN_DETAILS_FALLBACK] Supabase fetch failed. Reading from fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    const plan = db.plans.find((p: any) => p.id === planId);
    if (!plan) return null;
    
    const planLists = db.plan_lists.filter((l: any) => l.plan_id === plan.id);
    plan.lists = planLists.map((list: any) => {
      const creatorIdsArray = db.plan_creators.filter((pc: any) => pc.list_id === list.id).map((pc: any) => pc.creator_id);
      return {
        ...list,
        creator_ids: creatorIdsArray || []
      };
    });
    return plan;
  }
}

export async function createList(planId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const platform = formData.get("platform") as string;
  const deliverables = formData.get("deliverables") as string;

  const supabase = await createAdminClient();
  try {
    const { error } = await supabase
      .from("plan_lists")
      .insert({
        plan_id: planId,
        name,
        color,
        platform,
        deliverables: deliverables ? JSON.parse(deliverables) : []
      });

    if (error) throw error;
  } catch (err: any) {
    console.warn(`[CREATE_LIST_FALLBACK] Supabase list insert failed. Writing to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    const newList = {
      id: crypto.randomUUID(),
      plan_id: planId,
      name,
      color,
      platform,
      deliverables: deliverables ? JSON.parse(deliverables) : [],
      cost_per_creator: {},
      created_at: new Date().toISOString()
    };
    db.plan_lists.push(newList);
    writeFallbackDb(db);
  }

  revalidatePath(`/plans/${planId}`);
}

export async function addCreatorsToList(listId: string, creatorIds: string[]) {
  const supabase = await createAdminClient();
  try {
    const rows = creatorIds.map(cid => ({
      list_id: listId,
      creator_id: cid
    }));

    const { error } = await supabase
      .from("plan_creators")
      .upsert(rows, { onConflict: "list_id,creator_id" });

    if (error) throw error;
  } catch (err: any) {
    console.warn(`[ADD_CREATORS_FALLBACK] Supabase join failed. Writing to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    
    creatorIds.forEach(creatorId => {
      const exists = db.plan_creators.some((pc: any) => pc.list_id === listId && pc.creator_id === creatorId);
      if (!exists) {
        db.plan_creators.push({
          id: crypto.randomUUID(),
          list_id: listId,
          creator_id: creatorId,
          created_at: new Date().toISOString()
        });
      }
    });
    
    writeFallbackDb(db);
  }
}

export async function removeCreatorFromList(listId: string, creatorId: string) {
  const supabase = await createAdminClient();
  try {
    const { error } = await supabase
      .from("plan_creators")
      .delete()
      .eq("list_id", listId)
      .eq("creator_id", creatorId);

    if (error) throw error;
  } catch (err: any) {
    console.warn(`[REMOVE_CREATOR_FALLBACK] Supabase delete failed. Writing to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    db.plan_creators = db.plan_creators.filter((pc: any) => !(pc.list_id === listId && pc.creator_id === creatorId));
    writeFallbackDb(db);
  }
  return { success: true };
}

export async function getCreatorsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  const supabase = await createAdminClient();
  const { data: creators, error } = await supabase.from("creators").select("*").in("id", ids);
  if (error) {
    console.error("Error fetching creators:", error);
    return [];
  }

  const usernames = (creators || []).map(c => c.username).filter(Boolean);
  if (usernames.length === 0) return creators || [];

  // Fetch advanced metrics and profiles
  const { data: profiles } = await supabase.from("creator_profiles").select("*").in("username", usernames);
  const { data: metrics } = await supabase.from("creator_metrics").select("*").in("username", usernames);
  const { data: scores } = await supabase.from("creator_scores").select("*").in("username", usernames);

  // Load fallback JSON cache
  let fallbackDb = readFallbackDb();

  const profilesMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.username]: p }), {});
  const metricsMap = (metrics || []).reduce((acc: any, m: any) => ({ ...acc, [m.username]: m }), {});
  const scoresMap = (scores || []).reduce((acc: any, s: any) => ({ ...acc, [s.username]: s }), {});

  return (creators || []).map(creator => {
    const uname = creator.username;
    if (!uname) return creator;

    const profile = profilesMap[uname] || fallbackDb.creator_profiles?.find((p: any) => p.username === uname);
    const metric = metricsMap[uname] || fallbackDb.creator_metrics?.find((m: any) => m.username === uname);
    const score = scoresMap[uname] || fallbackDb.creator_scores?.find((s: any) => s.username === uname);

    return {
      ...creator,
      followers: profile?.followers ?? null,
      following: profile?.following ?? null,
      biography: profile?.biography ?? null,
      profile_image: profile?.profile_pic_url ?? creator.profile_image ?? null,
      verified: profile?.is_verified ?? null,
      category: profile?.category ?? null,
      location: profile?.location ?? null,
      posts_count: profile?.posts_count ?? null,
      metrics: metric ? {
        average_likes: metric.average_likes ?? null,
        average_comments: metric.average_comments ?? null,
        average_views: metric.average_views ?? null,
        engagement_rate: metric.engagement_rate ?? null,
        like_rate: metric.like_rate ?? null,
        comment_rate: metric.comment_rate ?? null,
        view_follower_ratio: metric.view_follower_ratio ?? null,
        reach_efficiency: metric.reach_efficiency ?? null,
        viral_hit_rate: metric.viral_hit_rate ?? null,
        viral_post_count: metric.viral_post_count ?? null,
        comment_like_ratio: metric.comment_like_ratio ?? null,
        posts_per_week: metric.posts_per_week ?? null,
        avg_gap_days: metric.avg_gap_days ?? null,
        momentum_score: metric.momentum_score ?? null,
        estimated_reel_reach: metric.estimated_reel_reach ?? null,
        estimated_story_reach: metric.estimated_story_reach ?? null,
        estimated_campaign_reach: metric.estimated_campaign_reach ?? null,
        suggested_reel_price: metric.suggested_reel_price ?? null,
        suggested_story_price: metric.suggested_story_price ?? null,
        suggested_campaign_price: metric.suggested_campaign_price ?? null,
        consistency_score: metric.consistency_score ?? null,
        best_performing_post_id: metric.best_performing_post_id ?? null,
        worst_performing_post_id: metric.worst_performing_post_id ?? null,
        median_views: metric.median_views ?? null,
        median_likes: metric.median_likes ?? null,
        median_comments: metric.median_comments ?? null,
        virality_score: metric.virality_score ?? null,
        authenticity_score: metric.authenticity_score ?? null,
        bot_risk_indicators: metric.bot_risk_indicators ?? [],
        // New expansion columns
        avg_reel_likes: metric.avg_reel_likes ?? null,
        avg_reel_comments: metric.avg_reel_comments ?? null,
        avg_reel_views: metric.avg_reel_views ?? null,
        avg_post_likes: metric.avg_post_likes ?? null,
        avg_post_comments: metric.avg_post_comments ?? null,
        reel_engagement_rate: metric.reel_engagement_rate ?? null,
        post_engagement_rate: metric.post_engagement_rate ?? null,
        image_engagement_rate: metric.image_engagement_rate ?? null,
        estimated_reach: metric.estimated_reach ?? null,
        avg_reach_multiple: metric.avg_reach_multiple ?? null,
        recent_performance_score: metric.recent_performance_score ?? null,
        growth_trend: metric.growth_trend ?? null,
        best_post_views: metric.best_post_views ?? null,
        worst_post_views: metric.worst_post_views ?? null,
        creator_value_score: metric.creator_value_score ?? null,
        roi_potential_score: metric.roi_potential_score ?? null
      } : null,
      ai_scores: score ? {
        creator_quality_score: score.creator_quality_score ?? null,
        reliability_score: score.reliability_score ?? null,
        influence_score: score.influence_score ?? null,
        discovery_rank: score.discovery_rank ?? score.discovery_ranking_score ?? null,
        authenticity_score: score.authenticity_score ?? null,
        authenticity_score_num: score.authenticity_score_num ?? null,
        audience_trust_score: score.audience_trust_score ?? null,
        virality_score: score.virality_score ?? null
      } : null
    };
  });
}

export async function createPlanInline({ name, brand }: { name: string; brand: string }): Promise<{ success: boolean; plan: any; error?: string }> {
  const supabase = await createAdminClient();
  try {
    const { data, error } = await supabase
      .from("plans")
      .insert({ name, brand, status: "active" })
      .select()
      .single();

    if (error) throw error;
    revalidatePath("/plans");
    return { success: true, plan: data };
  } catch (err: any) {
    console.warn(`[CREATE_PLAN_INLINE_FALLBACK] Supabase failed. Saving to fallback JSON... (${err.message})`);
    try {
      const db = readFallbackDb();
      const newPlan = {
        id: crypto.randomUUID(),
        name,
        brand,
        budget: 1000000,
        status: "active",
        cbf_weights: { followers: 25, er: 25, cost: 25, feasibility: 25 },
        created_at: new Date().toISOString()
      };
      db.plans.push(newPlan);
      writeFallbackDb(db);
      revalidatePath("/plans");
      return { success: true, plan: newPlan };
    } catch (fallbackErr: any) {
      return { success: false, plan: null, error: fallbackErr.message };
    }
  }
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
}): Promise<{ success: boolean; list: any; error?: string }> {
  const supabase = await createAdminClient();
  try {
    const { data, error } = await supabase
      .from("plan_lists")
      .insert({
        plan_id: planId,
        name,
        color,
        platform,
        deliverables
      })
      .select()
      .single();

    if (error) throw error;
    revalidatePath(`/plans/${planId}`);
    return { success: true, list: data };
  } catch (err: any) {
    console.warn(`[CREATE_LIST_INLINE_FALLBACK] Supabase failed. Saving to fallback JSON... (${err.message})`);
    try {
      const db = readFallbackDb();
      const newList = {
        id: crypto.randomUUID(),
        plan_id: planId,
        name,
        color,
        platform,
        deliverables,
        cost_per_creator: {},
        created_at: new Date().toISOString()
      };
      db.plan_lists.push(newList);
      writeFallbackDb(db);
      revalidatePath(`/plans/${planId}`);
      return { success: true, list: newList };
    } catch (fallbackErr: any) {
      return { success: false, list: null, error: fallbackErr.message };
    }
  }
}

export async function updatePlanCBFWeights(planId: string, weights: any): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();
  try {
    const { error } = await supabase
      .from("plans")
      .update({ cbf_weights: weights })
      .eq("id", planId);
      
    if (error) throw error;
  } catch (err: any) {
    console.warn(`[UPDATE_CBF_WEIGHTS_FALLBACK] Supabase failed. Saving to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    const plan = db.plans.find((p: any) => p.id === planId);
    if (plan) {
      plan.cbf_weights = weights;
      writeFallbackDb(db);
    } else {
      return { success: false, error: "Plan not found in fallback cache" };
    }
  }
  revalidatePath(`/plans/${planId}`);
  return { success: true };
}

export async function updateCreatorNegotiatedCost(listId: string, creatorId: string, cost: number): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();
  try {
    const { data: list, error: fetchErr } = await supabase
      .from("plan_lists")
      .select("cost_per_creator, plan_id")
      .eq("id", listId)
      .single();
      
    if (fetchErr || !list) throw new Error("List not found in Supabase");
    
    const currentLedger = (list.cost_per_creator as Record<string, any>) || {};
    const currentCreatorData = currentLedger[creatorId];
    
    let updatedCreatorData;
    if (typeof currentCreatorData === "object" && currentCreatorData !== null) {
      updatedCreatorData = { ...currentCreatorData, cost };
    } else {
      updatedCreatorData = { cost, outreach_status: "not_contacted" };
    }
    
    const updatedLedger = { ...currentLedger, [creatorId]: updatedCreatorData };
    
    const { error } = await supabase
      .from("plan_lists")
      .update({ cost_per_creator: updatedLedger })
      .eq("id", listId);
      
    if (error) throw error;
    revalidatePath(`/plans/${list.plan_id}`);
  } catch (err: any) {
    console.warn(`[UPDATE_NEGOTIATED_COST_FALLBACK] Supabase failed. Saving to fallback JSON... (${err.message})`);
    try {
      const db = readFallbackDb();
      const list = db.plan_lists.find((l: any) => l.id === listId);
      if (list) {
        const currentLedger = list.cost_per_creator || {};
        const currentCreatorData = currentLedger[creatorId] || { cost: 0, outreach_status: "Pending", reels: 0, stories: 0, posts: 0 };
        const updatedCreatorData = { ...currentCreatorData, cost };
        list.cost_per_creator = { ...currentLedger, [creatorId]: updatedCreatorData };
        writeFallbackDb(db);
        revalidatePath(`/plans/${list.plan_id}`);
      } else {
        return { success: false, error: "List not found in fallback DB" };
      }
    } catch (fallbackErr: any) {
      return { success: false, error: fallbackErr.message };
    }
  }
  return { success: true };
}

export async function updateCreatorOutreachStatus(listId: string, creatorId: string, status: string) {
  const supabase = await createAdminClient();
  try {
    const { data: list, error: fetchErr } = await supabase
      .from("plan_lists")
      .select("cost_per_creator, plan_id")
      .eq("id", listId)
      .single();
      
    if (fetchErr || !list) throw new Error("List not found in Supabase");
    
    const currentLedger = (list.cost_per_creator as Record<string, any>) || {};
    const currentCreatorData = currentLedger[creatorId];
    
    let updatedCreatorData;
    if (typeof currentCreatorData === "object" && currentCreatorData !== null) {
      updatedCreatorData = { ...currentCreatorData, outreach_status: status };
    } else {
      updatedCreatorData = { cost: Number(currentCreatorData) || 0, outreach_status: status };
    }
    
    const updatedLedger = { ...currentLedger, [creatorId]: updatedCreatorData };
    
    const { error } = await supabase
      .from("plan_lists")
      .update({ cost_per_creator: updatedLedger })
      .eq("id", listId);
      
    if (error) throw error;
    revalidatePath(`/plans/${list.plan_id}`);
  } catch (err: any) {
    console.warn(`[UPDATE_OUTREACH_STATUS_FALLBACK] Supabase failed. Saving to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    const list = db.plan_lists.find((l: any) => l.id === listId);
    if (list) {
      const currentLedger = list.cost_per_creator || {};
      const currentCreatorData = currentLedger[creatorId] || { cost: 0, outreach_status: "Pending", reels: 0, stories: 0, posts: 0 };
      const updatedCreatorData = { ...currentCreatorData, outreach_status: status };
      list.cost_per_creator = { ...currentLedger, [creatorId]: updatedCreatorData };
      writeFallbackDb(db);
      revalidatePath(`/plans/${list.plan_id}`);
    }
  }
  return { success: true };
}

export async function updateCreatorDeliverableField(listId: string, creatorId: string, field: string, value: any) {
  const supabase = await createAdminClient();
  try {
    const { data: list, error: fetchErr } = await supabase
      .from("plan_lists")
      .select("cost_per_creator, plan_id")
      .eq("id", listId)
      .single();
      
    if (fetchErr || !list) throw new Error("List not found in Supabase");
    
    const currentLedger = (list.cost_per_creator as Record<string, any>) || {};
    const currentCreatorData = currentLedger[creatorId] || { cost: 0, outreach_status: "Pending", reels: 0, stories: 0, posts: 0 };
    
    let updatedCreatorData;
    if (typeof currentCreatorData === "object" && currentCreatorData !== null) {
      updatedCreatorData = { ...currentCreatorData, [field]: value };
    } else {
      updatedCreatorData = { cost: Number(currentCreatorData) || 0, outreach_status: "Pending", reels: 0, stories: 0, posts: 0, [field]: value };
    }
    
    const updatedLedger = { ...currentLedger, [creatorId]: updatedCreatorData };
    
    const { error } = await supabase
      .from("plan_lists")
      .update({ cost_per_creator: updatedLedger })
      .eq("id", listId);
      
    if (error) throw error;
    revalidatePath(`/plans/${list.plan_id}`);
  } catch (err: any) {
    console.warn(`[UPDATE_DELIVERABLE_FIELD_FALLBACK] Supabase failed. Saving to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    const list = db.plan_lists.find((l: any) => l.id === listId);
    if (list) {
      const currentLedger = list.cost_per_creator || {};
      const currentCreatorData = currentLedger[creatorId] || { cost: 0, outreach_status: "Pending", reels: 0, stories: 0, posts: 0 };
      const updatedCreatorData = { ...currentCreatorData, [field]: value };
      list.cost_per_creator = { ...currentLedger, [creatorId]: updatedCreatorData };
      writeFallbackDb(db);
      revalidatePath(`/plans/${list.plan_id}`);
    }
  }
  return { success: true };
}

export async function updatePlanDetails(planId: string, name: string, budget: number): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();
  try {
    const { error } = await supabase
      .from("plans")
      .update({ name, budget })
      .eq("id", planId);

    if (error) throw error;
  } catch (err: any) {
    console.warn(`[UPDATE_PLAN_DETAILS_FALLBACK] Supabase failed. Saving to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    const plan = db.plans.find((p: any) => p.id === planId);
    if (plan) {
      plan.name = name;
      plan.budget = budget;
      writeFallbackDb(db);
    } else {
      return { success: false, error: "Plan not found in fallback cache" };
    }
  }
  revalidatePath("/plans");
  revalidatePath(`/plans/${planId}`);
  return { success: true };
}

export async function toggleArchivePlan(planId: string, archive: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminClient();
  const statusValue = archive ? "archived" : "active";
  try {
    const { error } = await supabase
      .from("plans")
      .update({ status: statusValue })
      .eq("id", planId);

    if (error) throw error;
  } catch (err: any) {
    console.warn(`[TOGGLE_ARCHIVE_FALLBACK] Supabase failed. Saving to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    const plan = db.plans.find((p: any) => p.id === planId);
    if (plan) {
      plan.status = statusValue;
      writeFallbackDb(db);
    } else {
      return { success: false, error: "Plan not found in fallback cache" };
    }
  }
  revalidatePath("/plans");
  return { success: true };
}

export async function getColumnPreferences(planId: string) {
  const supabase = await createAdminClient();
  try {
    const { data, error } = await supabase
      .from("plan_column_preferences")
      .select("selected_columns")
      .eq("plan_id", planId)
      .maybeSingle();

    if (error) throw error;
    return data?.selected_columns || null;
  } catch (err: any) {
    console.warn(`[GET_COLUMN_PREFS_FALLBACK] Supabase read failed. Reading from fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    const pref = db.plan_column_preferences.find((p: any) => p.plan_id === planId);
    return pref?.selected_columns || null;
  }
}

export async function updateColumnPreferences(planId: string, selectedColumns: string[]) {
  const supabase = await createAdminClient();
  try {
    const { error } = await supabase
      .from("plan_column_preferences")
      .upsert({
        plan_id: planId,
        selected_columns: selectedColumns
      }, { onConflict: "plan_id,user_id" });

    if (error) throw error;
  } catch (err: any) {
    console.warn(`[UPDATE_COLUMN_PREFS_FALLBACK] Supabase upsert failed. Writing to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    const index = db.plan_column_preferences.findIndex((p: any) => p.plan_id === planId);
    if (index >= 0) {
      db.plan_column_preferences[index].selected_columns = selectedColumns;
    } else {
      db.plan_column_preferences.push({
        id: crypto.randomUUID(),
        plan_id: planId,
        selected_columns: selectedColumns
      });
    }
    writeFallbackDb(db);
  }
  revalidatePath(`/plans/${planId}`);
  return { success: true };
}

export async function moveCreatorBetweenLists(fromListId: string, toListId: string, creatorId: string) {
  const supabase = await createAdminClient();
  try {
    await supabase
      .from("plan_creators")
      .delete()
      .eq("list_id", fromListId)
      .eq("creator_id", creatorId);

    const { error } = await supabase
      .from("plan_creators")
      .upsert({
        list_id: toListId,
        creator_id: creatorId
      }, { onConflict: "list_id,creator_id" });

    if (error) throw error;
  } catch (err: any) {
    console.warn(`[MOVE_CREATOR_FALLBACK] Supabase move failed. Writing to fallback JSON... (${err.message})`);
    const db = readFallbackDb();
    db.plan_creators = db.plan_creators.filter((pc: any) => !(pc.list_id === fromListId && pc.creator_id === creatorId));
    
    const exists = db.plan_creators.some((pc: any) => pc.list_id === toListId && pc.creator_id === creatorId);
    if (!exists) {
      db.plan_creators.push({
        id: crypto.randomUUID(),
        list_id: toListId,
        creator_id: creatorId,
        created_at: new Date().toISOString()
      });
    }
    writeFallbackDb(db);
  }
  revalidatePath("/plans");
  return { success: true };
}
