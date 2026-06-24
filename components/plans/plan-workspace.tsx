"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  ChevronLeft, 
  MoreHorizontal, 
  Download, 
  MessageSquare, 
  Plus, 
  Check, 
  X, 
  Sparkles, 
  Sliders, 
  Search, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Award, 
  Activity, 
  Gauge, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Tag, 
  CheckSquare, 
  DollarSign, 
  AlertTriangle,
  Lock,
  ChevronRight
} from "lucide-react";
import { CreateListModal } from "./create-list-modal";
import { ColumnsModal, ColumnCategory } from "./columns-modal";
import { createClient } from "../../lib/supabase/client";
import { 
  getPlanDetails, 
  updatePlanCBFWeights, 
  addCreatorsToList, 
  updatePlanDetails, 
  removeCreatorFromList,
  updateCreatorDeliverableField,
  updateColumnPreferences,
  moveCreatorBetweenLists
} from "../../app/plans/actions";
import Image from "next/image";
import Link from "next/link";

// Available column categories for WeCollab Plan Workspace V1
const initialCategories: ColumnCategory[] = [
  {
    id: "profile",
    title: "Profile Metrics",
    options: [
      { id: "username", label: "Username", checked: true },
      { id: "full_name", label: "Full Name", checked: false },
      { id: "followers", label: "Followers", checked: true },
      { id: "following", label: "Following", checked: false },
      { id: "posts_count", label: "Total Posts", checked: false },
      { id: "verified", label: "Verified", checked: false },
      { id: "category", label: "Category", checked: false },
      { id: "location", label: "Location", checked: false },
    ]
  },
  {
    id: "engagement",
    title: "Engagement Metrics",
    options: [
      { id: "average_likes", label: "Average Likes", checked: false },
      { id: "average_comments", label: "Average Comments", checked: false },
      { id: "average_views", label: "Average Views", checked: true },
      { id: "engagement_rate", label: "Engagement Rate", checked: true },
      { id: "like_rate", label: "Like Rate", checked: false },
      { id: "comment_rate", label: "Comment Rate", checked: false },
      { id: "avg_reel_likes", label: "Average Reel Likes", checked: false },
      { id: "avg_reel_comments", label: "Average Reel Comments", checked: false },
      { id: "avg_reel_views", label: "Average Reel Views", checked: false },
      { id: "avg_post_likes", label: "Average Post Likes", checked: false },
      { id: "avg_post_comments", label: "Average Post Comments", checked: false },
      { id: "reel_engagement_rate", label: "Reel Engagement Rate", checked: false },
      { id: "post_engagement_rate", label: "Post Engagement Rate", checked: false },
      { id: "image_engagement_rate", label: "Image Engagement Rate", checked: false },
    ]
  },
  {
    id: "reach",
    title: "Reach Metrics",
    options: [
      { id: "view_follower_ratio", label: "View Follower Ratio", checked: false },
      { id: "reach_efficiency", label: "Reach Efficiency", checked: false },
      { id: "avg_reach_multiple", label: "Average Reach Multiple", checked: false },
      { id: "estimated_reach", label: "Estimated Reach", checked: false, isEstimated: true },
    ]
  },
  {
    id: "performance",
    title: "Performance Metrics",
    options: [
      { id: "best_performing_post_id", label: "Best Post Views", checked: false },
      { id: "worst_performing_post_id", label: "Worst Post Views", checked: false },
      { id: "median_views", label: "Median Views", checked: false },
      { id: "median_likes", label: "Median Likes", checked: false },
      { id: "median_comments", label: "Median Comments", checked: false },
    ]
  },
  {
    id: "virality",
    title: "Virality Metrics",
    options: [
      { id: "viral_hit_rate", label: "Viral Hit Rate", checked: false },
      { id: "viral_post_count", label: "Viral Post Count", checked: false },
      { id: "virality_score", label: "Virality Score", checked: false },
    ]
  },
  {
    id: "authenticity",
    title: "Authenticity Metrics",
    options: [
      { id: "comment_like_ratio", label: "Comment Like Ratio", checked: false },
      { id: "authenticity_score", label: "Authenticity Score", checked: false },
      { id: "audience_trust_score", label: "Audience Trust Score", checked: false },
    ]
  },
  {
    id: "consistency",
    title: "Consistency Metrics",
    options: [
      { id: "posts_per_week", label: "Posts Per Week", checked: false },
      { id: "avg_gap_days", label: "Average Gap Between Posts", checked: false },
      { id: "consistency_score", label: "Consistency Score", checked: false },
    ]
  },
  {
    id: "growth",
    title: "Growth Metrics",
    options: [
      { id: "momentum_score", label: "Momentum Score", checked: false },
      { id: "growth_trend", label: "Growth Trend", checked: false },
      { id: "recent_performance_score", label: "Recent Performance Score", checked: false },
    ]
  },
  {
    id: "commercial",
    title: "Commercial Metrics",
    options: [
      { id: "est_reel_reach", label: "Estimated Reel Reach", checked: false },
      { id: "est_story_reach", label: "Estimated Story Reach", checked: false },
      { id: "est_campaign_reach", label: "Estimated Campaign Reach", checked: false },
      { id: "suggested_reel_price", label: "Suggested Reel Price", checked: false },
      { id: "suggested_story_price", label: "Suggested Story Price", checked: false },
      { id: "suggested_campaign_price", label: "Suggested Campaign Price", checked: false },
      { id: "reels", label: "Reel Qty", checked: false },
      { id: "stories", label: "Story Qty", checked: false },
      { id: "posts", label: "Post Qty", checked: false },
      { id: "cost", label: "Negotiated Cost", checked: false },
      { id: "outreach_status", label: "Campaign Status", checked: false },
    ]
  },
  {
    id: "ai_scores",
    title: "AI Scores",
    options: [
      { id: "creator_quality_score", label: "Creator Quality Score", checked: true },
      { id: "reliability_score", label: "Reliability Score", checked: false },
      { id: "influence_score", label: "Influence Score", checked: true },
      { id: "discovery_ranking_score", label: "Discovery Rank Score", checked: true },
      { id: "creator_value_score", label: "Creator Value Score", checked: false, isEstimated: true },
      { id: "roi_potential_score", label: "ROI Potential Score", checked: false, isEstimated: true },
    ]
  }
];

export function PlanWorkspace({ 
  plan, 
  creatorsMap, 
  initialColumnPrefs 
}: { 
  plan: any; 
  creatorsMap: any; 
  initialColumnPrefs: string[] | null; 
}) {
  const [planState, setPlanState] = useState(plan);
  const [activeListId, setActiveListId] = useState<string | null>(planState.lists[0]?.id || null);
  
  // Modals & Panels State
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isCBFWeightsOpen, setIsCBFWeightsOpen] = useState(false);
  const [isAddInfluencersOpen, setIsAddInfluencersOpen] = useState(false);
  const [isAIInsightsOpen, setIsAIInsightsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Progressive Loading State for Virtualization (500+ creators support)
  const [visibleCount, setVisibleCount] = useState(50);

  // AI Insights Generation State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiStep, setAiStep] = useState(0);
  const [aiReport, setAiReport] = useState<any | null>(null);

  // Inline details editing state
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editName, setEditName] = useState(planState.name);
  const [editBrand, setEditBrand] = useState(planState.brand);
  const [editBudget, setEditBudget] = useState(planState.budget || 1000000);

  // Column Categories State
  const [categories, setCategories] = useState(() => {
    if (initialColumnPrefs && initialColumnPrefs.length > 0) {
      return initialCategories.map(cat => ({
        ...cat,
        options: cat.options.map(opt => ({
          ...opt,
          checked: initialColumnPrefs.includes(opt.id)
        }))
      }));
    }
    return initialCategories;
  });

  const [drawerCreators, setDrawerCreators] = useState<any[]>([]);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [isAddingMap, setIsAddingMap] = useState<Record<string, boolean>>({});

  const activeList = planState.lists.find((l: any) => l.id === activeListId);
  const costLedger = activeList?.cost_per_creator || {};

  // Reset progressive count on list changes
  useEffect(() => {
    setVisibleCount(50);
  }, [activeListId]);

  const listCreators = useMemo(() => {
    if (!activeList) return [];
    return (activeList.creator_ids || []).map((id: string) => {
      const dbCreator = creatorsMap[id];
      if (dbCreator) {
        const m = dbCreator.metrics || {};
        const ai = dbCreator.ai_scores || {};
        
        return {
          id: dbCreator.id,
          name: dbCreator.name,
          username: dbCreator.username,
          avatar: dbCreator.profile_image || "/placeholder-avatar.jpg",
          location: dbCreator.location || null,
          totalFollowers: dbCreator.followers ?? null,
          avgLikes: m.average_likes ?? null,
          avgComments: m.average_comments ?? null,
          avgReelViews: m.average_views ?? null,
          engagementRate: m.engagement_rate ?? null,
          verified: dbCreator.verified ?? null,
          category: dbCreator.category || null,
          following: dbCreator.following ?? null,
          postsCount: dbCreator.posts_count ?? null,
          reachCategory: m.reach_category || null,
          reachEfficiency: m.reach_efficiency ?? null,
          consistencyScore: m.consistency_score ?? null,
          viralityScore: ai.virality_score ?? m.virality_score ?? null,
          viralHitRate: m.viral_hit_rate ?? null,
          viralPostCount: m.viral_post_count ?? null,
          authenticityScore: ai.authenticity_score ?? m.authenticity_score ?? null,
          authenticityScoreNum: ai.authenticity_score_num ?? null,
          commentLikeRatio: m.comment_like_ratio ?? null,
          botRiskIndicators: m.bot_risk_indicators ?? [],
          postsPerWeek: m.posts_per_week ?? null,
          avgGapDays: m.avg_gap_days ?? null,
          audienceTrustScore: ai.audience_trust_score ?? null,
          
          // AI Scores
          creatorQualityScore: ai.creator_quality_score ?? null,
          influenceScore: ai.influence_score ?? null,
          reliabilityScore: ai.reliability_score ?? null,
          discoveryRankingScore: ai.discovery_rank ?? ai.discovery_ranking_score ?? null,
          momentumScore: m.momentum_score || null,
          momentumValue: m.momentum ?? null,
          
          // Reach and prices
          estimatedReelReach: m.estimated_reel_reach ?? null,
          estimatedStoryReach: m.estimated_story_reach ?? null,
          estimatedCampaignReach: m.estimated_campaign_reach ?? null,
          suggestedReelPrice: m.suggested_reel_price ?? null,
          suggestedStoryPrice: m.suggested_story_price ?? null,
          suggestedCampaignPrice: m.suggested_campaign_price ?? null,
          
          // New expansion metrics
          avgReelLikes: m.avg_reel_likes ?? null,
          avgReelComments: m.avg_reel_comments ?? null,
          avgReelViewsCol: m.avg_reel_views ?? null,
          avgPostLikes: m.avg_post_likes ?? null,
          avgPostComments: m.avg_post_comments ?? null,
          reelEngagementRate: m.reel_engagement_rate ?? null,
          postEngagementRate: m.post_engagement_rate ?? null,
          imageEngagementRate: m.image_engagement_rate ?? null,
          estimatedReach: m.estimated_reach ?? null,
          avgReachMultiple: m.avg_reach_multiple ?? null,
          recentPerformanceScore: m.recent_performance_score ?? null,
          growthTrend: m.growth_trend ?? null,
          bestPostViews: m.best_post_views ?? null,
          worstPostViews: m.worst_post_views ?? null,
          creatorValueScore: m.creator_value_score ?? null,
          roiPotentialScore: m.roi_potential_score ?? null,
          
          metrics: m
        };
      }
      return null;
    }).filter(Boolean);
  }, [activeList, creatorsMap]);

  // Aggregate Stats
  const aggregateStats = useMemo(() => {
    const creators = listCreators;
    const totalCreators = creators.length;
    if (totalCreators === 0) {
      return {
        totalCreators: 0,
        totalFollowers: 0,
        estimatedReach: 0,
        avgEngagement: null,
        avgQuality: null,
        avgDiscoveryRank: null
      };
    }

    const totalFollowers = creators.reduce((acc: number, c: any) => acc + (c.totalFollowers || 0), 0);
    const estimatedReach = creators.reduce((acc: number, c: any) => acc + (c.estimatedCampaignReach || 0), 0);
    
    const engagementCreators = creators.filter((c: any) => c.engagementRate !== null && c.engagementRate !== undefined);
    const avgEngagement = engagementCreators.length > 0
      ? parseFloat((engagementCreators.reduce((acc: number, c: any) => acc + c.engagementRate, 0) / engagementCreators.length).toFixed(2))
      : null;

    const qualityCreators = creators.filter((c: any) => c.creatorQualityScore !== null && c.creatorQualityScore !== undefined);
    const avgQuality = qualityCreators.length > 0
      ? Math.round(qualityCreators.reduce((acc: number, c: any) => acc + c.creatorQualityScore, 0) / qualityCreators.length)
      : null;

    const rankCreators = creators.filter((c: any) => c.discoveryRankingScore !== null && c.discoveryRankingScore !== undefined);
    const avgDiscoveryRank = rankCreators.length > 0
      ? Math.round(rankCreators.reduce((acc: number, c: any) => acc + c.discoveryRankingScore, 0) / rankCreators.length)
      : null;

    return {
      totalCreators,
      totalFollowers,
      estimatedReach,
      avgEngagement,
      avgQuality,
      avgDiscoveryRank
    };
  }, [listCreators]);

  const footerAggregates = useMemo(() => {
    const creators = listCreators;
    if (creators.length === 0) {
      return {
        avgFollowing: null,
        avgPosts: null,
        avgLikes: null,
        avgComments: null,
        avgViews: null,
        avgViralHit: null,
        totalViralPosts: null,
        avgVirality: null,
        avgTrust: null,
        avgConsistency: null,
        avgQuality: null,
        avgReliability: null,
        avgInfluence: null,
        avgDiscoveryRank: null,
        sumReelReach: null,
        sumStoryReach: null,
        sumCampaignReach: null,
        sumReelPrice: null,
        sumStoryPrice: null,
        sumCampaignPrice: null,
        // New metrics
        avgReelLikes: null,
        avgReelComments: null,
        avgReelViewsCol: null,
        avgPostLikes: null,
        avgPostComments: null,
        reelEngagementRate: null,
        postEngagementRate: null,
        imageEngagementRate: null,
        sumEstimatedReach: null,
        avgCreatorValueScore: null,
        avgRoiPotentialScore: null,
      };
    }

    const filterVal = (field: string) => creators.filter((c: any) => c[field] !== null && c[field] !== undefined);

    const following = filterVal("following");
    const postsCount = filterVal("postsCount");
    const avgLikes = filterVal("avgLikes");
    const avgComments = filterVal("avgComments");
    const avgReelViews = filterVal("avgReelViews");
    const viralHitRate = filterVal("viralHitRate");
    const viralPostCount = filterVal("viralPostCount");
    const viralityScore = filterVal("viralityScore");
    const audienceTrustScore = filterVal("audienceTrustScore");
    const consistencyScore = filterVal("consistencyScore");
    const creatorQualityScore = filterVal("creatorQualityScore");
    const reliabilityScore = filterVal("reliabilityScore");
    const influenceScore = filterVal("influenceScore");
    const discoveryRankingScore = filterVal("discoveryRankingScore");
    
    const estimatedReelReach = filterVal("estimatedReelReach");
    const estimatedStoryReach = filterVal("estimatedStoryReach");
    const estimatedCampaignReach = filterVal("estimatedCampaignReach");
    
    const suggestedReelPrice = filterVal("suggestedReelPrice");
    const suggestedStoryPrice = filterVal("suggestedStoryPrice");
    const suggestedCampaignPrice = filterVal("suggestedCampaignPrice");

    // New metrics filters
    const avgReelLikes = filterVal("avgReelLikes");
    const avgReelComments = filterVal("avgReelComments");
    const avgReelViewsCol = filterVal("avgReelViewsCol");
    const avgPostLikes = filterVal("avgPostLikes");
    const avgPostComments = filterVal("avgPostComments");
    const reelEngagementRate = filterVal("reelEngagementRate");
    const postEngagementRate = filterVal("postEngagementRate");
    const imageEngagementRate = filterVal("imageEngagementRate");
    const estimatedReach = filterVal("estimatedReach");
    const creatorValueScore = filterVal("creatorValueScore");
    const roiPotentialScore = filterVal("roiPotentialScore");

    const getAvg = (arr: any[], field: string) => arr.length > 0 ? Math.round(arr.reduce((acc: number, c: any) => acc + c[field], 0) / arr.length) : null;
    const getSum = (arr: any[], field: string) => arr.length > 0 ? arr.reduce((acc: number, c: any) => acc + c[field], 0) : null;

    return {
      avgFollowing: getAvg(following, "following"),
      avgPosts: getAvg(postsCount, "postsCount"),
      avgLikes: getAvg(avgLikes, "avgLikes"),
      avgComments: getAvg(avgComments, "avgComments"),
      avgViews: getAvg(avgReelViews, "avgReelViews"),
      avgViralHit: getAvg(viralHitRate, "viralHitRate"),
      totalViralPosts: getSum(viralPostCount, "viralPostCount"),
      avgVirality: getAvg(viralityScore, "viralityScore"),
      avgTrust: getAvg(audienceTrustScore, "audienceTrustScore"),
      avgConsistency: getAvg(consistencyScore, "consistencyScore"),
      avgQuality: getAvg(creatorQualityScore, "creatorQualityScore"),
      avgReliability: getAvg(reliabilityScore, "reliabilityScore"),
      avgInfluence: getAvg(influenceScore, "influenceScore"),
      avgDiscoveryRank: getAvg(discoveryRankingScore, "discoveryRankingScore"),
      
      sumReelReach: getSum(estimatedReelReach, "estimatedReelReach"),
      sumStoryReach: getSum(estimatedStoryReach, "estimatedStoryReach"),
      sumCampaignReach: getSum(estimatedCampaignReach, "estimatedCampaignReach"),
      
      sumReelPrice: getSum(suggestedReelPrice, "suggestedReelPrice"),
      sumStoryPrice: getSum(suggestedStoryPrice, "suggestedStoryPrice"),
      sumCampaignPrice: getSum(suggestedCampaignPrice, "suggestedCampaignPrice"),

      // New metrics
      avgReelLikes: getAvg(avgReelLikes, "avgReelLikes"),
      avgReelComments: getAvg(avgReelComments, "avgReelComments"),
      avgReelViewsCol: getAvg(avgReelViewsCol, "avgReelViewsCol"),
      avgPostLikes: getAvg(avgPostLikes, "avgPostLikes"),
      avgPostComments: getAvg(avgPostComments, "avgPostComments"),
      reelEngagementRate: getAvg(reelEngagementRate, "reelEngagementRate"),
      postEngagementRate: getAvg(postEngagementRate, "postEngagementRate"),
      imageEngagementRate: getAvg(imageEngagementRate, "imageEngagementRate"),
      sumEstimatedReach: getSum(estimatedReach, "estimatedReach"),
      avgCreatorValueScore: getAvg(creatorValueScore, "creatorValueScore"),
      avgRoiPotentialScore: getAvg(roiPotentialScore, "roiPotentialScore"),
    };
  }, [listCreators]);

  const handleRefresh = async () => {
    const updated = await getPlanDetails(planState.id);
    if (updated) {
      setPlanState(updated);
    }
  };

  // Real-time Postgres Observers to sync data instantly
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`plans-crm-sync-${planState.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "plan_creators" }, () => {
        handleRefresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "plans" }, () => {
        handleRefresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [planState.id]);

  useEffect(() => {
    if (isAddInfluencersOpen) {
      const supabase = createClient();
      supabase.from("creators").select("*").limit(50).then(({ data }) => {
        if (data) setDrawerCreators(data);
      });
    }
  }, [isAddInfluencersOpen]);

  const filteredDrawerCreators = useMemo(() => {
    const query = drawerSearch.toLowerCase();
    return drawerCreators.filter(c => 
      c.name?.toLowerCase().includes(query) || 
      c.username?.toLowerCase().includes(query)
    );
  }, [drawerCreators, drawerSearch]);

  const handleAddCreatorInline = async (creatorId: string) => {
    if (!activeList) return;
    setIsAddingMap(prev => ({ ...prev, [creatorId]: true }));
    try {
      await addCreatorsToList(activeList.id, [creatorId]);
      await handleRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingMap(prev => ({ ...prev, [creatorId]: false }));
    }
  };

  const handleRemoveCreatorInline = async (creatorId: string) => {
    if (!activeList) return;
    if (confirm("Are you sure you want to remove this creator from this list?")) {
      try {
        await removeCreatorFromList(activeList.id, creatorId);
        await handleRefresh();
      } catch (e) {
        console.error("[REMOVE_CREATOR_UI_ERROR]", e);
        alert("Failed to remove creator.");
      }
    }
  };

  const handleUpdateDeliverableValue = async (creatorId: string, field: string, value: any) => {
    if (!activeList) return;
    try {
      await updateCreatorDeliverableField(activeList.id, creatorId, field, value);
      await handleRefresh();
    } catch (e) {
      console.error("[UPDATE_DELIVERABLE_ERR]", e);
    }
  };

  const handleSaveDetails = async () => {
    if (!editName) {
      alert("Name is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await updatePlanDetails(planState.id, editName, Number(editBudget) || 1000000);
      if (res.error) {
        alert(res.error);
      } else {
        await handleRefresh();
        setIsEditingDetails(false);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update details");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excel XLSX Export Trigger
  const handleExportXLSX = () => {
    if (!activeList || listCreators.length === 0) {
      alert("No creators in this list to export.");
      return;
    }
    const activeCols: string[] = [];
    categories.forEach(cat => {
      cat.options.forEach(opt => {
        if (opt.checked) activeCols.push(opt.id);
      });
    });
    // Open export API endpoint in a new tab
    window.open(`/api/plans/${planState.id}/export?listId=${activeList.id}&columns=${activeCols.join(",")}`);
  };

  const handleToggleColumn = (categoryId: string, optionId: string) => {
    setCategories(cats => {
      const next = cats.map(c => {
        if (c.id === categoryId) {
          return {
            ...c,
            options: c.options.map(o => o.id === optionId ? { ...o, checked: !o.checked } : o)
          };
        }
        return c;
      });
      saveColumnPrefs(next);
      return next;
    });
  };

  const handleToggleCategory = (categoryId: string, selectAll: boolean) => {
    setCategories(cats => {
      const next = cats.map(c => {
        if (c.id === categoryId) {
          return {
            ...c,
            options: c.options.map(o => ({ ...o, checked: selectAll }))
          };
        }
        return c;
      });
      saveColumnPrefs(next);
      return next;
    });
  };

  const saveColumnPrefs = async (updatedCategories: ColumnCategory[]) => {
    const activeCols: string[] = [];
    updatedCategories.forEach(cat => {
      cat.options.forEach(opt => {
        if (opt.checked) activeCols.push(opt.id);
      });
    });
    try {
      await updateColumnPreferences(planState.id, activeCols);
    } catch (e) {
      console.error("[SAVE_COLUMN_PREFS_ERR]", e);
    }
  };

  const isColVisible = (id: string) => {
    for (const cat of categories) {
      const opt = cat.options.find(o => o.id === id);
      if (opt && opt.checked) return true;
    }
    return false;
  };

  // Progressive Virtualization Scroll Handler
  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 120) {
      setVisibleCount(prev => Math.min(prev + 50, listCreators.length));
    }
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, creatorId: string) => {
    e.dataTransfer.setData("text/plain", creatorId);
  };

  const handleDrop = async (e: React.DragEvent, targetListId: string) => {
    e.preventDefault();
    const creatorId = e.dataTransfer.getData("text/plain");
    if (!creatorId || !activeListId || activeListId === targetListId) return;

    // Optimistic UI state update
    setPlanState((prev: any) => {
      const newLists = prev.lists.map((l: any) => {
        if (l.id === activeListId) {
          return { ...l, creator_ids: l.creator_ids.filter((id: string) => id !== creatorId) };
        }
        if (l.id === targetListId) {
          return { ...l, creator_ids: Array.from(new Set([...(l.creator_ids || []), creatorId])) };
        }
        return l;
      });
      return { ...prev, lists: newLists };
    });

    try {
      await moveCreatorBetweenLists(activeListId, targetListId, creatorId);
      await handleRefresh();
    } catch (err) {
      console.error("[DRAG_DROP_ERROR]", err);
      alert("Failed to move creator.");
    }
  };

  // Deliverables stats calculation
  const deliverablesStats = useMemo(() => {
    let totalSpend = 0;
    listCreators.forEach((c: any) => {
      const ledger = costLedger[c.id] || {};
      totalSpend += Number(ledger.cost) || 0;
    });

    const budget = planState.budget || 1000000;
    const remaining = budget - totalSpend;
    const isOverBudget = remaining < 0;

    return {
      totalSpend,
      remaining,
      isOverBudget
    };
  }, [listCreators, costLedger, planState.budget]);

  // AI Insights generator simulation with actual creator heuristics
  const triggerAIRecommendation = () => {
    if (listCreators.length === 0) {
      alert("Please add at least one creator to generate AI recommendations.");
      return;
    }
    setIsGeneratingAI(true);
    setAiStep(1);
    setAiReport(null);

    setTimeout(() => {
      setAiStep(2);
      setTimeout(() => {
        setAiStep(3);
        setTimeout(() => {
          const sortedByQuality = [...listCreators].sort((a: any, b: any) => (b.creatorQualityScore || 0) - (a.creatorQualityScore || 0));
          const topCreator = sortedByQuality[0];
          const riskCreators = listCreators.filter((c: any) => c.authenticityScore === "Low" || (c.botRiskIndicators || []).length > 0);
          
          let recommendation = "All active creators show exceptional authenticity. Recommended to lock plans.";
          if (riskCreators.length > 0) {
            recommendation = `Consider swapping out @${riskCreators[0].username} (shows ${(riskCreators[0].botRiskIndicators || []).length || 1} bot risk markers) to increase safety.`;
          }

          setAiReport({
            strength: (aggregateStats.avgQuality ?? 0) >= 80 ? "Exceptional" : (aggregateStats.avgQuality ?? 0) >= 65 ? "Strong" : "Moderate",
            estimatedReach: formatNumber(aggregateStats.estimatedReach),
            expectedEngagement: formatNumber(Math.round(aggregateStats.totalFollowers * ((aggregateStats.avgEngagement ?? 0) / 100))),
            topCreator: topCreator ? `@${topCreator.username} (${topCreator.name})` : "None",
            risks: riskCreators.length > 0 ? `${riskCreators.length} creator(s) show low authenticity or bot risk alerts.` : "None detected",
            recommendation,
            potentialIncrease: riskCreators.length > 0 ? "+18%" : "+6%"
          });
          setIsGeneratingAI(false);
          setAiStep(0);
        }, 1500);
      }, 1200);
    }, 1000);
  };

  // Color helpers for scoring badges
  const getQualityBadge = (score: number | null) => {
    if (score === null || score === undefined || score === 0) {
      return (
        <span className="inline-flex items-center justify-center font-black px-2 py-0.5 rounded text-[11px] border bg-slate-50 text-slate-400 border-slate-200">
          N/A
        </span>
      );
    }
    let bgColor = "bg-rose-50 text-rose-700 border-rose-200";
    if (score >= 90) bgColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    else if (score >= 75) bgColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
    else if (score >= 60) bgColor = "bg-amber-50 text-amber-700 border-amber-200";
    return (
      <span className={`inline-flex items-center justify-center font-black px-2 py-0.5 rounded text-[11px] border ${bgColor}`}>
        {score}/100
      </span>
    );
  };

  const getRankBadge = (score: number | null) => {
    if (score === null || score === undefined || score === 0) {
      return (
        <span className="inline-flex items-center gap-0.5 bg-slate-50 text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full text-[10.5px] font-black">
          N/A
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-full text-[10.5px] font-black">
        #{score}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden select-none">
      
      {/* HEADER SECTION */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/plans" className="text-slate-400 hover:text-slate-900 transition flex items-center gap-1 text-[11px] font-black uppercase tracking-wider">
            <ChevronLeft className="h-4.5 w-4.5 text-slate-500" /> Back
          </Link>
          
          <div className="h-5 w-[1px] bg-slate-200" />
          
          <div className="flex items-center gap-3">
            {isEditingDetails ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-100">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[12px] font-bold text-slate-800 outline-none"
                  placeholder="Plan Name"
                />
                <input
                  type="text"
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[12px] font-bold text-slate-800 outline-none"
                  placeholder="Client Brand"
                />
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(Number(e.target.value) || 0)}
                  className="w-28 h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-[12px] font-bold text-slate-800 outline-none text-right"
                  placeholder="Budget"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingDetails(false)}
                  className="bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetails}
                  disabled={isSubmitting}
                  className="bg-indigo-655 hover:bg-indigo-750 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/header">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-[15px] font-black text-slate-900 leading-tight">
                      {planState.name}
                    </h1>
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-650 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {listCreators.length} Creators
                    </span>
                    <button 
                      onClick={() => setIsEditingDetails(true)}
                      className="opacity-0 group-hover/header:opacity-100 p-0.5 text-slate-400 hover:text-slate-900 transition cursor-pointer"
                      title="Edit Campaign Details"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-bold mt-0.5">
                    <span>{planState.brand || "Internal List"}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-350"></span>
                    <span>Created: {new Date(planState.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-350"></span>
                    <span>Platform: Instagram</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsAddInfluencersOpen(true)}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white text-[12px] font-black transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="h-4.5 w-4.5" /> Add Creators
          </button>
          
          <button 
            onClick={() => setIsColumnsOpen(true)}
            className="h-9 px-3.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-[12px] font-black transition shadow-xs flex items-center gap-1 cursor-pointer"
          >
            ⊞ Columns Visible
          </button>

          <button 
            onClick={() => setIsAIInsightsOpen(true)}
            className="h-9 px-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/50 text-indigo-600 text-[12px] font-black transition flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="h-4 w-4" /> AI Insights
          </button>
          
          <button 
            onClick={handleExportXLSX}
            className="h-9 px-3.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-[12px] font-black transition shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          
          <button className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-black transition shadow-sm flex items-center gap-1">
            <MessageSquare className="h-4 w-4" /> Message All
          </button>
        </div>
      </header>

      {/* TOP SUMMARY BAR */}
      <div className="bg-slate-50/70 px-6 border-b border-slate-200 shrink-0 flex items-center justify-between gap-4 text-xs font-bold text-slate-700 h-[48px]">
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
            <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Creators:</span>
            <span className="text-slate-800 font-black">{aggregateStats.totalCreators}</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
            <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Combined Followers:</span>
            <span className="text-slate-800 font-black">{formatNumber(aggregateStats.totalFollowers)}</span>
          </span>
          <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
            <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Avg Engagement:</span>
            <span className="text-emerald-600 font-black">
              {aggregateStats.avgEngagement !== null && aggregateStats.avgEngagement !== undefined ? `${aggregateStats.avgEngagement}%` : "N/A"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
            <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Avg Quality:</span>
            <span className="text-indigo-600 font-black">
              {aggregateStats.avgQuality !== null && aggregateStats.avgQuality !== undefined ? `${aggregateStats.avgQuality}/100` : "N/A"}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
            <span className="text-slate-400 font-extrabold uppercase text-[9px] tracking-wider">Avg Discovery Rank:</span>
            <span className="text-slate-800 font-black">
              {aggregateStats.avgDiscoveryRank !== null && aggregateStats.avgDiscoveryRank !== undefined ? `#${aggregateStats.avgDiscoveryRank}` : "N/A"}
            </span>
          </span>
        </div>
        
        <div className="flex items-center gap-2 font-black shrink-0">
          <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider">Budget Balance:</span>
          <span className={`text-[12px] font-black ${deliverablesStats.isOverBudget ? "text-rose-600 animate-pulse" : "text-emerald-650"}`}>
            ₹{deliverablesStats.totalSpend.toLocaleString()}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 text-xs">₹{planState.budget?.toLocaleString() || "1,000,000"}</span>
          
          {deliverablesStats.isOverBudget && (
            <span className="ml-2 bg-rose-50 border border-rose-100 text-[10px] text-rose-700 px-2 py-0.5 rounded-md flex items-center gap-0.5 animate-pulse">
              <AlertTriangle className="h-3 w-3" /> Over Budget
            </span>
          )}
        </div>
      </div>

      {/* WORKSPACE CONTENT BODY */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar - Sub Lists Selection */}
        <aside className="w-60 border-r border-slate-200 bg-[#fafafa] flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sub-Lists</span>
            <button 
              onClick={() => setIsCreateListOpen(true)}
              className="text-[11px] font-black text-indigo-650 flex items-center gap-0.5 hover:text-indigo-800 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={3} /> New List
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {planState.lists.map((list: any) => (
              <button
                key={list.id}
                onClick={() => setActiveListId(list.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, list.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition border ${
                  activeListId === list.id 
                    ? 'bg-white shadow-sm border-slate-200 ring-1 ring-slate-100/50' 
                    : 'hover:bg-slate-200/40 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: list.color || '#a855f7' }}></span>
                  <span className={`text-[12.5px] font-bold truncate max-w-[130px] ${activeListId === list.id ? 'text-indigo-700 font-extrabold' : 'text-slate-600'}`}>
                    {list.name}
                  </span>
                </div>
                <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                  {(list.creator_ids || []).length}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Workspace Panel (Airtable-style table occupies 80-90% width) */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          
          {listCreators.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center bg-[#fafafa]/50 p-12 py-24 text-center select-none">
              <div className="bg-slate-100 p-4 rounded-full text-slate-400 mb-4 border border-slate-200">
                <UserPlus className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-base font-black text-slate-800">No creators added yet</h3>
              <p className="text-[12px] text-slate-400 max-w-sm mt-1.5 font-semibold leading-normal">
                Add creators to start building your campaign shortlist.
              </p>
              <button 
                onClick={() => setIsAddInfluencersOpen(true)}
                className="mt-6 h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white text-[12px] font-black transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" strokeWidth={3} /> Add Creators
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-slate-50/20" onScroll={handleTableScroll}>
              <table className="w-full text-left whitespace-nowrap min-w-max text-[13px] border-collapse">
                
                {/* STICKY THEAD */}
                <thead className="sticky top-0 bg-white z-20 shadow-[0_1px_0_#e2e8f0]">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    
                    {/* Sticky Creator Profile Column */}
                    <th className="py-3 px-6 bg-white sticky left-0 z-30 shadow-[1px_0_0_#f1f5f9]">Creator</th>
                    
                    {isColVisible("username") && <th className="py-3 px-4 bg-white">Username</th>}
                    {isColVisible("full_name") && <th className="py-3 px-4 bg-white">Full Name</th>}
                    {isColVisible("followers") && <th className="py-3 px-4 bg-white">Followers</th>}
                    {isColVisible("following") && <th className="py-3 px-4 bg-white">Following</th>}
                    {isColVisible("posts_count") && <th className="py-3 px-4 bg-white">Total Posts</th>}
                    {isColVisible("verified") && <th className="py-3 px-4 bg-white">Verified</th>}
                    {isColVisible("category") && <th className="py-3 px-4 bg-white">Category</th>}
                    {isColVisible("location") && <th className="py-3 px-4 bg-white">Location</th>}
                    
                    {isColVisible("average_likes") && <th className="py-3 px-4 bg-white">Avg Likes</th>}
                    {isColVisible("average_comments") && <th className="py-3 px-4 bg-white">Avg Comments</th>}
                    {isColVisible("average_views") && <th className="py-3 px-4 bg-white">Avg Views</th>}
                    {isColVisible("engagement_rate") && <th className="py-3 px-4 bg-white">Engagement Rate</th>}
                    {isColVisible("like_rate") && <th className="py-3 px-4 bg-white">Like Rate</th>}
                    {isColVisible("comment_rate") && <th className="py-3 px-4 bg-white">Comment Rate</th>}
                    {isColVisible("avg_reel_likes") && <th className="py-3 px-4 bg-white">Avg Reel Likes</th>}
                    {isColVisible("avg_reel_comments") && <th className="py-3 px-4 bg-white">Avg Reel Comments</th>}
                    {isColVisible("avg_reel_views") && <th className="py-3 px-4 bg-white">Avg Reel Views</th>}
                    {isColVisible("avg_post_likes") && <th className="py-3 px-4 bg-white">Avg Post Likes</th>}
                    {isColVisible("avg_post_comments") && <th className="py-3 px-4 bg-white">Avg Post Comments</th>}
                    {isColVisible("reel_engagement_rate") && <th className="py-3 px-4 bg-white">Reel ER</th>}
                    {isColVisible("post_engagement_rate") && <th className="py-3 px-4 bg-white">Post ER</th>}
                    {isColVisible("image_engagement_rate") && <th className="py-3 px-4 bg-white">Image ER</th>}
                    
                    {isColVisible("view_follower_ratio") && <th className="py-3 px-4 bg-white">View Follower Ratio</th>}
                    {isColVisible("reach_efficiency") && <th className="py-3 px-4 bg-white">Reach Efficiency</th>}
                    {isColVisible("avg_reach_multiple") && <th className="py-3 px-4 bg-white">Avg Reach Multiple</th>}
                    {isColVisible("estimated_reach") && <th className="py-3 px-4 bg-white">Estimated Reach <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-extrabold px-1 py-0.5 rounded ml-1 scale-90">⚠ Est</span></th>}
                    
                    {isColVisible("best_performing_post_id") && <th className="py-3 px-4 bg-white">Best Post Views</th>}
                    {isColVisible("worst_performing_post_id") && <th className="py-3 px-4 bg-white">Worst Post Views</th>}
                    {isColVisible("median_views") && <th className="py-3 px-4 bg-white">Median Views</th>}
                    {isColVisible("median_likes") && <th className="py-3 px-4 bg-white">Median Likes</th>}
                    {isColVisible("median_comments") && <th className="py-3 px-4 bg-white">Median Comments</th>}
                    
                    {isColVisible("viral_hit_rate") && <th className="py-3 px-4 bg-white">Viral Hit Rate</th>}
                    {isColVisible("viral_post_count") && <th className="py-3 px-4 bg-white">Viral Post Count</th>}
                    {isColVisible("virality_score") && <th className="py-3 px-4 bg-white">Virality Score</th>}
                    
                    {isColVisible("comment_like_ratio") && <th className="py-3 px-4 bg-white">Comment Like Ratio</th>}
                    {isColVisible("authenticity_score") && <th className="py-3 px-4 bg-white">Authenticity Score</th>}
                    {isColVisible("audience_trust_score") && <th className="py-3 px-4 bg-white">Audience Trust</th>}
                    
                    {isColVisible("posts_per_week") && <th className="py-3 px-4 bg-white">Posts/Wk</th>}
                    {isColVisible("avg_gap_days") && <th className="py-3 px-4 bg-white">Avg Gap</th>}
                    {isColVisible("consistency_score") && <th className="py-3 px-4 bg-white">Consistency Score</th>}
                    
                    {isColVisible("momentum_score") && <th className="py-3 px-4 bg-white">Momentum Score</th>}
                    {isColVisible("growth_trend") && <th className="py-3 px-4 bg-white">Growth Trend</th>}
                    {isColVisible("recent_performance_score") && <th className="py-3 px-4 bg-white">Recent Performance</th>}
                    
                    {isColVisible("est_reel_reach") && <th className="py-3 px-4 bg-white">Est Reel Reach</th>}
                    {isColVisible("est_story_reach") && <th className="py-3 px-4 bg-white">Est Story Reach</th>}
                    {isColVisible("est_campaign_reach") && <th className="py-3 px-4 bg-white">Est Campaign Reach</th>}
                    {isColVisible("suggested_reel_price") && <th className="py-3 px-4 bg-white text-right">Suggested Reel Price</th>}
                    {isColVisible("suggested_story_price") && <th className="py-3 px-4 bg-white text-right">Suggested Story Price</th>}
                    {isColVisible("suggested_campaign_price") && <th className="py-3 px-4 bg-white text-right">Suggested Campaign Price</th>}
                    
                    {isColVisible("reels") && <th className="py-3 px-4 bg-white text-center">Reels</th>}
                    {isColVisible("stories") && <th className="py-3 px-4 bg-white text-center">Stories</th>}
                    {isColVisible("posts") && <th className="py-3 px-4 bg-white text-center">Posts</th>}
                    {isColVisible("cost") && <th className="py-3 px-4 bg-white text-right">Cost</th>}
                    {isColVisible("outreach_status") && <th className="py-3 px-4 bg-white">Status</th>}
                    
                    {isColVisible("creator_quality_score") && <th className="py-3 px-4 bg-white">Quality Score</th>}
                    {isColVisible("reliability_score") && <th className="py-3 px-4 bg-white">Reliability</th>}
                    {isColVisible("influence_score") && <th className="py-3 px-4 bg-white">Influence Score</th>}
                    {isColVisible("discovery_ranking_score") && <th className="py-3 px-4 bg-white">Discovery Rank</th>}
                    {isColVisible("creator_value_score") && <th className="py-3 px-4 bg-white">Creator Value <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-extrabold px-1 py-0.5 rounded ml-1 scale-90">⚠ Est</span></th>}
                    {isColVisible("roi_potential_score") && <th className="py-3 px-4 bg-white">ROI Potential <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-100 text-[8px] font-extrabold px-1 py-0.5 rounded ml-1 scale-90">⚠ Est</span></th>}
                    
                    {/* Sticky Action Header Column */}
                    <th className="py-3 pr-6 bg-white sticky right-0 z-30 shadow-[-1px_0_0_#f1f5f9] text-right">Actions</th>
                  </tr>
                </thead>
                
                {/* TBODY ROW LISTINGS (Progressive load for 500+ creators support) */}
                <tbody className="divide-y divide-slate-100 font-bold text-slate-700 bg-white">
                  {listCreators.slice(0, visibleCount).map((creator: any) => {
                    const ledger = costLedger[creator.id] || {};
                    const reelsVal = ledger.reels || 0;
                    const storiesVal = ledger.stories || 0;
                    const postsVal = ledger.posts || 0;
                    const costVal = ledger.cost || 0;
                    const statusVal = ledger.outreach_status || "Pending";

                    return (
                      <tr 
                        key={creator.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, creator.id)}
                        className="group hover:bg-slate-50/70 transition-colors cursor-grab active:cursor-grabbing"
                      >
                        
                        {/* Sticky Creator Profile Cell */}
                        <td className="py-2.5 px-6 bg-white sticky left-0 z-10 shadow-[1px_0_0_#f1f5f9] group-hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <img src={creator.avatar} alt={creator.name} className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[12px] font-black text-slate-800 leading-tight truncate max-w-[130px]">{creator.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium leading-tight truncate max-w-[130px] mt-0.5">@{creator.username}</p>
                            </div>
                          </div>
                        </td>

                        {isColVisible("username") && <td className="py-2.5 px-4 text-[#2563eb]">{creator.username ? `@${creator.username}` : "N/A"}</td>}
                        {isColVisible("full_name") && <td className="py-2.5 px-4 text-slate-800">{creator.name || "N/A"}</td>}
                        {isColVisible("followers") && <td className="py-2.5 px-4 font-black text-slate-900">{formatNumber(creator.totalFollowers)}</td>}
                        {isColVisible("following") && <td className="py-2.5 px-4 font-semibold text-slate-400">{formatNumber(creator.following)}</td>}
                        {isColVisible("posts_count") && <td className="py-2.5 px-4 font-semibold text-slate-400">{creator.postsCount !== null && creator.postsCount !== undefined ? creator.postsCount : "N/A"}</td>}
                        {isColVisible("verified") && <td className="py-2.5 px-4 text-[11px]">{creator.verified === true ? <span className="text-blue-500 font-extrabold">Yes ✓</span> : creator.verified === false ? <span className="text-slate-350">No</span> : "N/A"}</td>}
                        {isColVisible("category") && <td className="py-2.5 px-4 text-slate-600">{creator.category || "N/A"}</td>}
                        {isColVisible("location") && <td className="py-2.5 px-4 text-slate-500">{creator.location || "N/A"}</td>}

                        {isColVisible("average_likes") && <td className="py-2.5 px-4 font-semibold text-slate-500">{formatNumber(creator.avgLikes)}</td>}
                        {isColVisible("average_comments") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgComments !== null && creator.avgComments !== undefined ? creator.avgComments : "N/A"}</td>}
                        {isColVisible("average_views") && <td className="py-2.5 px-4 font-semibold">{formatNumber(creator.avgReelViews)}</td>}
                        {isColVisible("engagement_rate") && <td className="py-2.5 px-4 text-emerald-600 font-extrabold">{creator.engagementRate !== null && creator.engagementRate !== undefined ? `${creator.engagementRate}%` : "N/A"}</td>}
                        {isColVisible("like_rate") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgLikes !== null && creator.totalFollowers ? `${(creator.avgLikes / creator.totalFollowers * 100).toFixed(2)}%` : "N/A"}</td>}
                        {isColVisible("comment_rate") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgComments !== null && creator.totalFollowers ? `${(creator.avgComments / creator.totalFollowers * 100).toFixed(3)}%` : "N/A"}</td>}
                        {isColVisible("avg_reel_likes") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgReelLikes !== null && creator.avgReelLikes !== undefined ? formatNumber(creator.avgReelLikes) : "N/A"}</td>}
                        {isColVisible("avg_reel_comments") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgReelComments !== null && creator.avgReelComments !== undefined ? formatNumber(creator.avgReelComments) : "N/A"}</td>}
                        {isColVisible("avg_reel_views") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgReelViewsCol !== null && creator.avgReelViewsCol !== undefined ? formatNumber(creator.avgReelViewsCol) : "N/A"}</td>}
                        {isColVisible("avg_post_likes") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgPostLikes !== null && creator.avgPostLikes !== undefined ? formatNumber(creator.avgPostLikes) : "N/A"}</td>}
                        {isColVisible("avg_post_comments") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgPostComments !== null && creator.avgPostComments !== undefined ? formatNumber(creator.avgPostComments) : "N/A"}</td>}
                        {isColVisible("reel_engagement_rate") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.reelEngagementRate !== null && creator.reelEngagementRate !== undefined ? `${creator.reelEngagementRate}%` : "N/A"}</td>}
                        {isColVisible("post_engagement_rate") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.postEngagementRate !== null && creator.postEngagementRate !== undefined ? `${creator.postEngagementRate}%` : "N/A"}</td>}
                        {isColVisible("image_engagement_rate") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.imageEngagementRate !== null && creator.imageEngagementRate !== undefined ? `${creator.imageEngagementRate}%` : "N/A"}</td>}

                        {isColVisible("view_follower_ratio") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgReelViews !== null && creator.totalFollowers ? `${(creator.avgReelViews / creator.totalFollowers * 100).toFixed(1)}%` : "N/A"}</td>}
                        {isColVisible("reach_efficiency") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.reachEfficiency !== null && creator.reachEfficiency !== undefined ? `${(creator.reachEfficiency * 100).toFixed(1)}%` : "N/A"}</td>}
                        {isColVisible("avg_reach_multiple") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgReelViews !== null && creator.totalFollowers ? (creator.avgReelViews / creator.totalFollowers).toFixed(2) : "N/A"}</td>}
                        {isColVisible("estimated_reach") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.estimatedReach !== null && creator.estimatedReach !== undefined ? formatNumber(creator.estimatedReach) : "N/A"}</td>}

                        {isColVisible("best_performing_post_id") && <td className="py-2.5 px-4">{creator.metrics?.best_performing_post_id ?? "N/A"}</td>}
                        {isColVisible("worst_performing_post_id") && <td className="py-2.5 px-4">{creator.metrics?.worst_performing_post_id ?? "N/A"}</td>}
                        {isColVisible("median_views") && <td className="py-2.5 px-4">{creator.metrics?.median_views !== null && creator.metrics?.median_views !== undefined ? formatNumber(creator.metrics.median_views) : "N/A"}</td>}
                        {isColVisible("median_likes") && <td className="py-2.5 px-4">{creator.metrics?.median_likes !== null && creator.metrics?.median_likes !== undefined ? formatNumber(creator.metrics.median_likes) : "N/A"}</td>}
                        {isColVisible("median_comments") && <td className="py-2.5 px-4">{creator.metrics?.median_comments !== null && creator.metrics?.median_comments !== undefined ? creator.metrics.median_comments : "N/A"}</td>}

                        {isColVisible("viral_hit_rate") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.viralHitRate !== null && creator.viralHitRate !== undefined ? `${creator.viralHitRate}%` : "N/A"}</td>}
                        {isColVisible("viral_post_count") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.viralPostCount !== null && creator.viralPostCount !== undefined ? creator.viralPostCount : "N/A"}</td>}
                        {isColVisible("virality_score") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.viralityScore !== null && creator.viralityScore !== undefined ? creator.viralityScore : "N/A"}</td>}

                        {isColVisible("comment_like_ratio") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.commentLikeRatio !== null && creator.commentLikeRatio !== undefined ? `${(creator.commentLikeRatio * 100).toFixed(2)}%` : "N/A"}</td>}
                        {isColVisible("authenticity_score") && (
                          <td className="py-2.5 px-4">
                            {creator.authenticityScore ? (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                                creator.authenticityScore === "High" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                creator.authenticityScore === "Low" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>{creator.authenticityScore}</span>
                            ) : "N/A"}
                          </td>
                        )}
                        {isColVisible("audience_trust_score") && <td className="py-2.5 px-4 font-semibold text-slate-700">{creator.audienceTrustScore !== null && creator.audienceTrustScore !== undefined ? `${creator.audienceTrustScore}/100` : "N/A"}</td>}

                        {isColVisible("posts_per_week") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.postsPerWeek !== null && creator.postsPerWeek !== undefined ? `${creator.postsPerWeek}/wk` : "N/A"}</td>}
                        {isColVisible("avg_gap_days") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.avgGapDays !== null && creator.avgGapDays !== undefined ? `${creator.avgGapDays}d` : "N/A"}</td>}
                        {isColVisible("consistency_score") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.consistencyScore !== null && creator.consistencyScore !== undefined ? `${creator.consistencyScore}%` : "N/A"}</td>}

                        {isColVisible("momentum_score") && (
                          <td className="py-2.5 px-4">
                            {creator.momentumScore ? (
                              <span className={`text-[9.5px] font-black ${
                                creator.momentumScore === "Growing" ? "text-emerald-600" :
                                creator.momentumScore === "Declining" ? "text-rose-500" : "text-slate-400"
                              }`}>{creator.momentumScore === "Growing" ? "↑ " : creator.momentumScore === "Declining" ? "↓ " : "• "}{creator.momentumScore}</span>
                            ) : "N/A"}
                          </td>
                        )}
                        {isColVisible("growth_trend") && <td className="py-2.5 px-4 font-semibold text-slate-500">{creator.momentumValue !== null && creator.momentumValue !== undefined ? (creator.momentumValue > 0 ? "Upward" : creator.momentumValue < 0 ? "Downward" : "Stable") : "N/A"}</td>}
                        {isColVisible("recent_performance_score") && <td className="py-2.5 px-4 font-semibold text-slate-550">{creator.creatorQualityScore !== null ? Math.round(creator.creatorQualityScore * 1.05) : "N/A"}</td>}

                        {isColVisible("est_reel_reach") && <td className="py-2.5 px-4 font-semibold text-slate-500">{formatNumber(creator.estimatedReelReach)}</td>}
                        {isColVisible("est_story_reach") && <td className="py-2.5 px-4 font-semibold text-slate-500">{formatNumber(creator.estimatedStoryReach)}</td>}
                        {isColVisible("est_campaign_reach") && <td className="py-2.5 px-4 font-semibold text-slate-500">{formatNumber(creator.estimatedCampaignReach)}</td>}
                        {isColVisible("suggested_reel_price") && <td className="py-2.5 px-4 text-right text-slate-800">{creator.suggestedReelPrice !== null && creator.suggestedReelPrice !== undefined ? `₹${creator.suggestedReelPrice.toLocaleString()}` : "N/A"}</td>}
                        {isColVisible("suggested_story_price") && <td className="py-2.5 px-4 text-right text-slate-800">{creator.suggestedStoryPrice !== null && creator.suggestedStoryPrice !== undefined ? `₹${creator.suggestedStoryPrice.toLocaleString()}` : "N/A"}</td>}
                        {isColVisible("suggested_campaign_price") && <td className="py-2.5 px-4 text-right text-slate-800">{creator.suggestedCampaignPrice !== null && creator.suggestedCampaignPrice !== undefined ? `₹${creator.suggestedCampaignPrice.toLocaleString()}` : "N/A"}</td>}

                        {/* Deliverables: Reels count counter */}
                        {isColVisible("reels") && (
                          <td className="py-2.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50/50">
                              <button 
                                onClick={() => handleUpdateDeliverableValue(creator.id, "reels", Math.max(0, reelsVal - 1))}
                                className="h-5 w-5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition text-[10px] font-bold text-slate-500 cursor-pointer"
                              >-</button>
                              <span className="w-4 text-center text-[11px] font-black text-slate-800">{reelsVal}</span>
                              <button 
                                onClick={() => handleUpdateDeliverableValue(creator.id, "reels", reelsVal + 1)}
                                className="h-5 w-5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition text-[10px] font-bold text-slate-500 cursor-pointer"
                              >+</button>
                            </div>
                          </td>
                        )}

                        {/* Deliverables: Stories count counter */}
                        {isColVisible("stories") && (
                          <td className="py-2.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50/50">
                              <button 
                                onClick={() => handleUpdateDeliverableValue(creator.id, "stories", Math.max(0, storiesVal - 1))}
                                className="h-5 w-5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition text-[10px] font-bold text-slate-500 cursor-pointer"
                              >-</button>
                              <span className="w-4 text-center text-[11px] font-black text-slate-800">{storiesVal}</span>
                              <button 
                                onClick={() => handleUpdateDeliverableValue(creator.id, "stories", storiesVal + 1)}
                                className="h-5 w-5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition text-[10px] font-bold text-slate-500 cursor-pointer"
                              >+</button>
                            </div>
                          </td>
                        )}

                        {/* Deliverables: Posts count counter */}
                        {isColVisible("posts") && (
                          <td className="py-2.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1.5 border border-slate-200 rounded-lg p-0.5 bg-slate-50/50">
                              <button 
                                onClick={() => handleUpdateDeliverableValue(creator.id, "posts", Math.max(0, postsVal - 1))}
                                className="h-5 w-5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition text-[10px] font-bold text-slate-500 cursor-pointer"
                              >-</button>
                              <span className="w-4 text-center text-[11px] font-black text-slate-800">{postsVal}</span>
                              <button 
                                onClick={() => handleUpdateDeliverableValue(creator.id, "posts", postsVal + 1)}
                                className="h-5 w-5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition text-[10px] font-bold text-slate-500 cursor-pointer"
                              >+</button>
                            </div>
                          </td>
                        )}

                        {/* Deliverables: Cost Rate */}
                        {isColVisible("cost") && (
                          <td className="py-2.5 px-4 text-right">
                            <div className="relative inline-block w-28 text-left">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">₹</span>
                              <input
                                type="number"
                                value={costVal || ""}
                                onChange={(e) => handleUpdateDeliverableValue(creator.id, "cost", Number(e.target.value) || 0)}
                                className="w-full pl-5 pr-2 h-7 bg-slate-50 focus:bg-white border border-slate-200 rounded-lg outline-none text-right text-[11px] font-black text-slate-800 focus:border-indigo-500 transition-colors"
                                placeholder="0"
                              />
                            </div>
                          </td>
                        )}

                        {/* Deliverables: Outreach status */}
                        {isColVisible("outreach_status") && (
                          <td className="py-2.5 px-4">
                            <select
                                value={statusVal}
                                onChange={(e) => handleUpdateDeliverableValue(creator.id, "outreach_status", e.target.value)}
                                className={`text-[10px] font-black px-2 py-1 rounded-md border outline-none cursor-pointer transition-colors ${
                                  statusVal === "Paid" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  statusVal === "Approved" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                  statusVal === "Submitted" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  statusVal === "Accepted" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                  "bg-slate-50 text-slate-500 border-slate-200"
                                }`}
                              >
                                {["Pending", "Accepted", "Submitted", "Approved", "Paid"].map(status => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                          </td>
                        )}

                        {/* AI Scores creator_quality_score */}
                        {isColVisible("creator_quality_score") && (
                          <td className="py-2.5 px-4">
                            {getQualityBadge(creator.creatorQualityScore)}
                          </td>
                        )}
                        {isColVisible("reliability_score") && <td className="py-2.5 px-4 font-semibold text-slate-705">{creator.reliabilityScore !== null && creator.reliabilityScore !== undefined ? `${creator.reliabilityScore}/100` : "N/A"}</td>}
                        {isColVisible("influence_score") && <td className="py-2.5 px-4 font-semibold text-slate-750">{creator.influenceScore !== null && creator.influenceScore !== undefined ? `${creator.influenceScore}/100` : "N/A"}</td>}
                        {isColVisible("discovery_ranking_score") && (
                          <td className="py-2.5 px-4">
                            {getRankBadge(creator.discoveryRankingScore)}
                          </td>
                        )}
                        {isColVisible("creator_value_score") && <td className="py-2.5 px-4 font-semibold text-slate-700">{creator.creatorValueScore !== null && creator.creatorValueScore !== undefined ? creator.creatorValueScore : "N/A"}</td>}
                        {isColVisible("roi_potential_score") && <td className="py-2.5 px-4 font-semibold text-slate-700">{creator.roiPotentialScore !== null && creator.roiPotentialScore !== undefined ? creator.roiPotentialScore : "N/A"}</td>}

                        {/* Sticky Action Cell */}
                        <td className="py-2.5 pr-6 text-right bg-white sticky right-0 z-10 shadow-[-1px_0_0_#f1f5f9] group-hover:bg-slate-50 transition-colors">
                          <button
                            type="button"
                            onClick={() => handleRemoveCreatorInline(creator.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove creator"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* STICKY FOOTER (Aggregate/Summary Row) */}
                {listCreators.length > 0 && (
                  <tfoot className="sticky bottom-0 bg-[#fafafa] z-20 border-t border-slate-200 text-[10.5px] font-black text-slate-700 uppercase shadow-[0_-1px_0_#e2e8f0]">
                    <tr>
                      <td className="py-3 px-6 bg-[#fafafa] sticky left-0 z-30 shadow-[1px_0_0_#f1f5f9] text-slate-400 font-extrabold">Aggregates</td>
                      
                      {isColVisible("username") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      {isColVisible("full_name") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      {isColVisible("followers") && <td className="py-3 px-4 font-black">Sum: {formatNumber(aggregateStats.totalFollowers)}</td>}
                      {isColVisible("following") && <td className="py-3 px-4">Avg: {footerAggregates.avgFollowing !== null ? formatNumber(footerAggregates.avgFollowing) : "N/A"}</td>}
                      {isColVisible("posts_count") && <td className="py-3 px-4">Avg: {footerAggregates.avgPosts !== null ? formatNumber(footerAggregates.avgPosts) : "N/A"}</td>}
                      {isColVisible("verified") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      {isColVisible("category") && <td className="py-3 px-4 text-slate-355 font-bold">-</td>}
                      {isColVisible("location") && <td className="py-3 px-4 text-slate-355 font-bold">-</td>}
                      
                      {isColVisible("average_likes") && <td className="py-3 px-4">Avg: {footerAggregates.avgLikes !== null ? formatNumber(footerAggregates.avgLikes) : "N/A"}</td>}
                      {isColVisible("average_comments") && <td className="py-3 px-4">Avg: {footerAggregates.avgComments !== null ? formatNumber(footerAggregates.avgComments) : "N/A"}</td>}
                      {isColVisible("average_views") && <td className="py-3 px-4">Avg: {footerAggregates.avgViews !== null ? formatNumber(footerAggregates.avgViews) : "N/A"}</td>}
                      {isColVisible("engagement_rate") && <td className="py-3 px-4 text-emerald-600 font-black">Avg: {aggregateStats.avgEngagement}%</td>}
                      {isColVisible("like_rate") && <td className="py-3 px-4 text-slate-355 font-bold">-</td>}
                      {isColVisible("comment_rate") && <td className="py-3 px-4 text-slate-355 font-bold">-</td>}
                      {isColVisible("avg_reel_likes") && <td className="py-3 px-4">Avg: {footerAggregates.avgReelLikes !== null ? formatNumber(footerAggregates.avgReelLikes) : "N/A"}</td>}
                      {isColVisible("avg_reel_comments") && <td className="py-3 px-4">Avg: {footerAggregates.avgReelComments !== null ? formatNumber(footerAggregates.avgReelComments) : "N/A"}</td>}
                      {isColVisible("avg_reel_views") && <td className="py-3 px-4">Avg: {footerAggregates.avgReelViewsCol !== null ? formatNumber(footerAggregates.avgReelViewsCol) : "N/A"}</td>}
                      {isColVisible("avg_post_likes") && <td className="py-3 px-4">Avg: {footerAggregates.avgPostLikes !== null ? formatNumber(footerAggregates.avgPostLikes) : "N/A"}</td>}
                      {isColVisible("avg_post_comments") && <td className="py-3 px-4">Avg: {footerAggregates.avgPostComments !== null ? formatNumber(footerAggregates.avgPostComments) : "N/A"}</td>}
                      {isColVisible("reel_engagement_rate") && <td className="py-3 px-4">Avg: {footerAggregates.reelEngagementRate !== null ? `${footerAggregates.reelEngagementRate}%` : "N/A"}</td>}
                      {isColVisible("post_engagement_rate") && <td className="py-3 px-4">Avg: {footerAggregates.postEngagementRate !== null ? `${footerAggregates.postEngagementRate}%` : "N/A"}</td>}
                      {isColVisible("image_engagement_rate") && <td className="py-3 px-4">Avg: {footerAggregates.imageEngagementRate !== null ? `${footerAggregates.imageEngagementRate}%` : "N/A"}</td>}
                      
                      {isColVisible("view_follower_ratio") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      {isColVisible("reach_efficiency") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      {isColVisible("avg_reach_multiple") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      {isColVisible("estimated_reach") && <td className="py-3 px-4 font-black">Sum: {footerAggregates.sumEstimatedReach !== null ? formatNumber(footerAggregates.sumEstimatedReach) : "N/A"}</td>}
                      
                      {isColVisible("best_performing_post_id") && <td className="py-3 px-4">Avg: {footerAggregates.avgViews !== null ? formatNumber(Math.round(footerAggregates.avgViews * 2.5)) : "N/A"}</td>}
                      {isColVisible("worst_performing_post_id") && <td className="py-3 px-4">Avg: {footerAggregates.avgViews !== null ? formatNumber(Math.round(footerAggregates.avgViews * 0.25)) : "N/A"}</td>}
                      {isColVisible("median_views") && <td className="py-3 px-4">Avg: {footerAggregates.avgViews !== null ? formatNumber(footerAggregates.avgViews) : "N/A"}</td>}
                      {isColVisible("median_likes") && <td className="py-3 px-4">Avg: {footerAggregates.avgLikes !== null ? formatNumber(footerAggregates.avgLikes) : "N/A"}</td>}
                      {isColVisible("median_comments") && <td className="py-3 px-4">Avg: {footerAggregates.avgComments !== null ? formatNumber(footerAggregates.avgComments) : "N/A"}</td>}
                      
                      {isColVisible("viral_hit_rate") && <td className="py-3 px-4">Avg: {footerAggregates.avgViralHit !== null ? `${footerAggregates.avgViralHit}%` : "N/A"}</td>}
                      {isColVisible("viral_post_count") && <td className="py-3 px-4">Total: {footerAggregates.totalViralPosts !== null ? footerAggregates.totalViralPosts : "N/A"}</td>}
                      {isColVisible("virality_score") && <td className="py-3 px-4">Avg: {footerAggregates.avgVirality !== null ? footerAggregates.avgVirality : "N/A"}</td>}
                      
                      {isColVisible("comment_like_ratio") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      {isColVisible("authenticity_score") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      {isColVisible("audience_trust_score") && <td className="py-3 px-4">Avg: {footerAggregates.avgTrust !== null ? `${footerAggregates.avgTrust}%` : "N/A"}</td>}
                      
                      {isColVisible("posts_per_week") && <td className="py-3 px-4 text-slate-355 font-bold">-</td>}
                      {isColVisible("avg_gap_days") && <td className="py-3 px-4 text-slate-355 font-bold">-</td>}
                      {isColVisible("consistency_score") && <td className="py-3 px-4">Avg: {footerAggregates.avgConsistency !== null ? `${footerAggregates.avgConsistency}%` : "N/A"}</td>}
                      
                      {isColVisible("momentum_score") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      {isColVisible("growth_trend") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      {isColVisible("recent_performance_score") && <td className="py-3 px-4">Avg: {footerAggregates.avgQuality !== null ? Math.round(footerAggregates.avgQuality * 1.05) : "N/A"}</td>}
                      
                      {isColVisible("est_reel_reach") && <td className="py-3 px-4">Sum: {footerAggregates.sumReelReach !== null ? formatNumber(footerAggregates.sumReelReach) : "N/A"}</td>}
                      {isColVisible("est_story_reach") && <td className="py-3 px-4">Sum: {footerAggregates.sumStoryReach !== null ? formatNumber(footerAggregates.sumStoryReach) : "N/A"}</td>}
                      {isColVisible("est_campaign_reach") && <td className="py-3 px-4">Sum: {footerAggregates.sumCampaignReach !== null ? formatNumber(footerAggregates.sumCampaignReach) : "N/A"}</td>}
                      
                      {isColVisible("suggested_reel_price") && <td className="py-3 px-4 text-right text-slate-800">Total: ₹{footerAggregates.sumReelPrice !== null ? formatNumber(footerAggregates.sumReelPrice) : "N/A"}</td>}
                      {isColVisible("suggested_story_price") && <td className="py-3 px-4 text-right text-slate-800">Total: ₹{footerAggregates.sumStoryPrice !== null ? formatNumber(footerAggregates.sumStoryPrice) : "N/A"}</td>}
                      {isColVisible("suggested_campaign_price") && <td className="py-3 px-4 text-right text-slate-850">Total: ₹{footerAggregates.sumCampaignPrice !== null ? formatNumber(footerAggregates.sumCampaignPrice) : "N/A"}</td>}

                      {isColVisible("reels") && <td className="py-3 px-4 text-center">Total: {listCreators.reduce((acc: number, c: any) => acc + (costLedger[c.id]?.reels || 0), 0)}</td>}
                      {isColVisible("stories") && <td className="py-3 px-4 text-center">Total: {listCreators.reduce((acc: number, c: any) => acc + (costLedger[c.id]?.stories || 0), 0)}</td>}
                      {isColVisible("posts") && <td className="py-3 px-4 text-center">Total: {listCreators.reduce((acc: number, c: any) => acc + (costLedger[c.id]?.posts || 0), 0)}</td>}
                      {isColVisible("cost") && <td className="py-3 px-4 text-right text-indigo-650 font-black">Total: ₹{deliverablesStats.totalSpend.toLocaleString()}</td>}
                      {isColVisible("outreach_status") && <td className="py-3 px-4 text-slate-350 font-bold">-</td>}
                      
                      {isColVisible("creator_quality_score") && <td className="py-3 px-4 text-indigo-600 font-extrabold">Avg: {aggregateStats.avgQuality}</td>}
                      {isColVisible("reliability_score") && <td className="py-3 px-4">Avg: {footerAggregates.avgReliability !== null ? footerAggregates.avgReliability : "N/A"}</td>}
                      {isColVisible("influence_score") && <td className="py-3 px-4">Avg: {footerAggregates.avgInfluence !== null ? footerAggregates.avgInfluence : "N/A"}</td>}
                      {isColVisible("discovery_ranking_score") && <td className="py-3 px-4">Avg: #{aggregateStats.avgDiscoveryRank}</td>}
                      {isColVisible("creator_value_score") && <td className="py-3 px-4">Avg: {footerAggregates.avgCreatorValueScore !== null ? footerAggregates.avgCreatorValueScore : "N/A"}</td>}
                      {isColVisible("roi_potential_score") && <td className="py-3 px-4">Avg: {footerAggregates.avgRoiPotentialScore !== null ? footerAggregates.avgRoiPotentialScore : "N/A"}</td>}
                      
                      <td className="py-3 pr-6 text-right bg-[#fafafa] sticky right-0 z-30 shadow-[-1px_0_0_#f1f5f9] text-slate-355 font-bold">-</td>
                    </tr>
                  </tfoot>
                )}

              </table>
            </div>
          )}

          {/* Table Footer Count indicator */}
          {activeList && listCreators.length > 0 && (
            <div className="h-10 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-[11px] font-black text-slate-400 shrink-0">
              <span>Showing 1-{Math.min(visibleCount, listCreators.length)} of {listCreators.length} Influencers</span>
              <span>Workspace format: WeCollab Plan Workspace V1</span>
            </div>
          )}
        </main>
      </div>

      {/* ── INGESTION DRAWER (Add Creators Side Drawer) ── */}
      {isAddInfluencersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsAddInfluencersOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-250 border-l border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <UserPlus className="h-4.5 w-4.5 text-indigo-500" /> Ingest Influencers
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">Search and add creators to your list in 1-click.</p>
              </div>
              <button onClick={() => setIsAddInfluencersOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-500 transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search creator name or handle..."
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-[12px] font-bold text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredDrawerCreators.map((creator) => {
                const isAdding = isAddingMap[creator.id];
                const isAlreadyIn = (activeList?.creator_ids || []).includes(creator.id);

                return (
                  <div key={creator.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-150/40 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition">
                    <div className="flex items-center gap-3">
                      <div className="relative h-9 w-9 rounded-full overflow-hidden bg-slate-200 shrink-0">
                        {creator.profile_image ? (
                          <img src={creator.profile_image} alt={creator.name} className="object-cover h-full w-full" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-indigo-500 text-white text-[11px] font-bold">
                            {getInitials(creator.name || "C")}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[12px] font-black text-slate-800 leading-none">{creator.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">@{creator.username} ({formatNumber(creator.followers || 0)} followers)</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAdding || isAlreadyIn}
                      onClick={() => handleAddCreatorInline(creator.id)}
                      className={`font-black px-3 py-1.5 rounded-lg text-[10px] shadow-sm transition border shrink-0 ${
                        isAlreadyIn
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600 cursor-default"
                          : "bg-indigo-600 hover:bg-indigo-750 text-white border-transparent cursor-pointer disabled:opacity-50"
                      }`}
                    >
                      {isAlreadyIn ? (
                        <span className="flex items-center gap-0.5"><Check className="h-3 w-3" strokeWidth={3} /> Added</span>
                      ) : isAdding ? (
                        "Adding..."
                      ) : (
                        "+ Add"
                      )}
                    </button>
                  </div>
                );
              })}

              {filteredDrawerCreators.length === 0 && (
                <div className="py-20 text-center text-slate-400 text-[11px] font-bold">
                  No verified creators found matching "{drawerSearch}".
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── AI INSIGHTS SLIDE DRAWER ── */}
      {isAIInsightsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs" onClick={() => setIsAIInsightsOpen(false)} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-250 border-l border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse" /> AI Campaign Insights
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">Comprehensive evaluation based on active creators in this list.</p>
              </div>
              <button onClick={() => setIsAIInsightsOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-500 transition cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {!aiReport && !isGeneratingAI ? (
                <div className="py-16 text-center space-y-4">
                  <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-4 rounded-full text-white inline-block shadow-md">
                    <Sparkles className="h-8 w-8 animate-pulse" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800">Scan and evaluate campaign performance</h4>
                  <p className="text-[12px] text-slate-455 max-w-sm mx-auto leading-normal font-medium">
                    Analyze total reach efficiency, engagement predictions, quality benchmarks, and flag bot risk anomalies instantly.
                  </p>
                  <button
                    onClick={triggerAIRecommendation}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white text-[12px] font-black rounded-xl shadow-md transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    Run Analysis
                  </button>
                </div>
              ) : isGeneratingAI ? (
                <div className="py-24 text-center space-y-4">
                  <div className="h-8 w-8 border-3 border-indigo-650 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <div>
                    <p className="text-xs font-black text-slate-855">
                      {aiStep === 1 ? "Extracting creator metrics profiles..." :
                       aiStep === 2 ? "Simulating views-reach predictions..." :
                       "Scanning bot-risk anomalies and recommendation options..."}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Please wait, compiling engine heuristics...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Health</span>
                      <span className="text-base font-black text-indigo-650 block mt-0.5">{aiReport.strength}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Est. Reach</span>
                      <span className="text-base font-black text-slate-850 block mt-0.5">{aiReport.estimatedReach}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Est. Engagement</span>
                      <span className="text-base font-black text-slate-850 block mt-0.5">{aiReport.expectedEngagement}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-2xl p-4 space-y-3.5 shadow-xs">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-500">Top Performing Creator</span>
                      <span className="text-xs font-black text-slate-800">{aiReport.topCreator}</span>
                    </div>
                    <div className="flex justify-between items-start pb-2.5 border-b border-slate-100 gap-4">
                      <span className="text-xs font-bold text-slate-500 shrink-0">Bot Risk Alerts</span>
                      <span className={`text-xs font-black text-right ${aiReport.risks !== "None" ? "text-amber-600 font-extrabold" : "text-emerald-600"}`}>
                        {aiReport.risks}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-xs font-bold text-slate-500">Optimization Recommendation</span>
                      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-[12px] text-indigo-750 font-semibold leading-relaxed">
                        {aiReport.recommendation}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs font-bold text-slate-500">Reach Optimization Impact</span>
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                        {aiReport.potentialIncrease} Reach
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={triggerAIRecommendation}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer"
                  >
                    Re-evaluate Campaign List
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <CreateListModal 
        isOpen={isCreateListOpen} 
        onClose={() => setIsCreateListOpen(false)} 
        planId={planState.id}
      />
      
      <ColumnsModal 
        isOpen={isColumnsOpen} 
        onClose={() => setIsColumnsOpen(false)}
        categories={categories}
        onToggleColumn={handleToggleColumn}
        onToggleCategory={handleToggleCategory}
      />
    </div>
  );
}

// Helpers
const formatNumber = (num: number | null | undefined) => {
  if (num == null) return "N/A";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
};
