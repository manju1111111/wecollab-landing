import { NextRequest, NextResponse } from "next/server";
import { getPlanDetails, getCreatorsByIds } from "@/app/plans/actions";
import * as XLSX from "xlsx";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const listId = searchParams.get("listId");
  const visibleColumnsParam = searchParams.get("columns");
  
  if (!listId || !visibleColumnsParam) {
    return NextResponse.json({ error: "Missing listId or columns" }, { status: 400 });
  }

  const visibleColumns = visibleColumnsParam.split(",");
  
  // Fetch plan details and creator list
  const plan = await getPlanDetails(id);
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const list = plan.lists.find((l: any) => l.id === listId);
  if (!list) {
    return NextResponse.json({ error: "List not found" }, { status: 404 });
  }

  // Get creators
  const creators = await getCreatorsByIds(list.creator_ids || []);
  
  // Map columns to their human readable labels
  const columnLabels: Record<string, string> = {
    username: "Username",
    full_name: "Full Name",
    followers: "Followers",
    following: "Following",
    posts_count: "Total Posts",
    verified: "Verified",
    category: "Category",
    location: "Location",
    average_likes: "Average Likes",
    average_comments: "Average Comments",
    average_views: "Average Views",
    engagement_rate: "Engagement Rate",
    like_rate: "Like Rate",
    comment_rate: "Comment Rate",
    avg_reel_likes: "Avg Reel Likes",
    avg_reel_comments: "Avg Reel Comments",
    avg_reel_views: "Avg Reel Views",
    avg_post_likes: "Avg Post Likes",
    avg_post_comments: "Avg Post Comments",
    reel_engagement_rate: "Reel ER",
    post_engagement_rate: "Post ER",
    image_engagement_rate: "Image ER",
    view_follower_ratio: "View Follower Ratio",
    reach_efficiency: "Reach Efficiency",
    avg_reach_multiple: "Average Reach Multiple",
    estimated_reach: "Estimated Reach",
    best_performing_post_id: "Best Post Views",
    worst_performing_post_id: "Worst Post Views",
    median_views: "Median Views",
    median_likes: "Median Likes",
    median_comments: "Median Comments",
    viral_hit_rate: "Viral Hit Rate",
    viral_post_count: "Viral Post Count",
    virality_score: "Virality Score",
    comment_like_ratio: "Comment Like Ratio",
    authenticity_score: "Authenticity Score",
    audience_trust_score: "Audience Trust Score",
    posts_per_week: "Posts Per Week",
    avg_gap_days: "Average Gap Between Posts",
    consistency_score: "Consistency Score",
    momentum_score: "Momentum Score",
    growth_trend: "Growth Trend",
    recent_performance_score: "Recent Performance Score",
    est_reel_reach: "Estimated Reel Reach",
    est_story_reach: "Estimated Story Reach",
    est_campaign_reach: "Estimated Campaign Reach",
    suggested_reel_price: "Suggested Reel Price",
    suggested_story_price: "Suggested Story Price",
    suggested_campaign_price: "Suggested Campaign Price",
    creator_quality_score: "Creator Quality Score",
    reliability_score: "Reliability Score",
    influence_score: "Influence Score",
    discovery_ranking_score: "Discovery Rank Score",
    creator_value_score: "Creator Value Score",
    roi_potential_score: "ROI Potential Score",
    reels: "Reel Qty",
    stories: "Story Qty",
    posts: "Post Qty",
    cost: "Negotiated Cost",
    outreach_status: "Campaign Status"
  };

  // Build rows data
  const data = creators.map((c: any) => {
    const row: Record<string, any> = {};
    const ledger = list.cost_per_creator?.[c.id] || {};
    const m = c.metrics || {};
    const ai = c.ai_scores || {};

    const valGetters: Record<string, any> = {
      username: c.username ? `@${c.username}` : "N/A",
      full_name: c.name || "N/A",
      followers: c.followers !== null && c.followers !== undefined ? c.followers : "N/A",
      following: c.following !== null && c.following !== undefined ? c.following : "N/A",
      posts_count: c.posts_count !== null && c.posts_count !== undefined ? c.posts_count : "N/A",
      verified: c.verified === true ? "Yes" : c.verified === false ? "No" : "N/A",
      category: c.category || "N/A",
      location: c.location || "N/A",
      average_likes: m.average_likes !== null && m.average_likes !== undefined ? m.average_likes : "N/A",
      average_comments: m.average_comments !== null && m.average_comments !== undefined ? m.average_comments : "N/A",
      average_views: m.average_views !== null && m.average_views !== undefined ? m.average_views : "N/A",
      engagement_rate: m.engagement_rate !== null && m.engagement_rate !== undefined ? `${m.engagement_rate}%` : "N/A",
      like_rate: m.like_rate !== null && m.like_rate !== undefined ? `${m.like_rate}%` : "N/A",
      comment_rate: m.comment_rate !== null && m.comment_rate !== undefined ? `${m.comment_rate}%` : "N/A",
      avg_reel_likes: m.avg_reel_likes !== null && m.avg_reel_likes !== undefined ? m.avg_reel_likes : "N/A",
      avg_reel_comments: m.avg_reel_comments !== null && m.avg_reel_comments !== undefined ? m.avg_reel_comments : "N/A",
      avg_reel_views: m.avg_reel_views !== null && m.avg_reel_views !== undefined ? m.avg_reel_views : "N/A",
      avg_post_likes: m.avg_post_likes !== null && m.avg_post_likes !== undefined ? m.avg_post_likes : "N/A",
      avg_post_comments: m.avg_post_comments !== null && m.avg_post_comments !== undefined ? m.avg_post_comments : "N/A",
      reel_engagement_rate: m.reel_engagement_rate !== null && m.reel_engagement_rate !== undefined ? `${m.reel_engagement_rate}%` : "N/A",
      post_engagement_rate: m.post_engagement_rate !== null && m.post_engagement_rate !== undefined ? `${m.post_engagement_rate}%` : "N/A",
      image_engagement_rate: m.image_engagement_rate !== null && m.image_engagement_rate !== undefined ? `${m.image_engagement_rate}%` : "N/A",
      view_follower_ratio: m.view_follower_ratio !== null && m.view_follower_ratio !== undefined ? `${m.view_follower_ratio}%` : "N/A",
      reach_efficiency: m.reach_efficiency !== null && m.reach_efficiency !== undefined ? `${m.reach_efficiency}%` : "N/A",
      avg_reach_multiple: m.avg_reach_multiple !== null && m.avg_reach_multiple !== undefined ? m.avg_reach_multiple : "N/A",
      estimated_reach: m.estimated_reach !== null && m.estimated_reach !== undefined ? m.estimated_reach : "N/A",
      best_performing_post_id: m.best_performing_post_id || "N/A",
      worst_performing_post_id: m.worst_performing_post_id || "N/A",
      median_views: m.median_views !== null && m.median_views !== undefined ? m.median_views : "N/A",
      median_likes: m.median_likes !== null && m.median_likes !== undefined ? m.median_likes : "N/A",
      median_comments: m.median_comments !== null && m.median_comments !== undefined ? m.median_comments : "N/A",
      viral_hit_rate: m.viral_hit_rate !== null && m.viral_hit_rate !== undefined ? `${m.viral_hit_rate}%` : "N/A",
      viral_post_count: m.viral_post_count !== null && m.viral_post_count !== undefined ? m.viral_post_count : "N/A",
      virality_score: m.virality_score !== null && m.virality_score !== undefined ? m.virality_score : "N/A",
      comment_like_ratio: m.comment_like_ratio !== null && m.comment_like_ratio !== undefined ? `${m.comment_like_ratio}%` : "N/A",
      authenticity_score: m.authenticity_score || "N/A",
      audience_trust_score: ai.audience_trust_score !== null && ai.audience_trust_score !== undefined ? `${ai.audience_trust_score}/100` : "N/A",
      posts_per_week: m.posts_per_week !== null && m.posts_per_week !== undefined ? `${m.posts_per_week}/wk` : "N/A",
      avg_gap_days: m.avg_gap_days !== null && m.avg_gap_days !== undefined ? `${m.avg_gap_days} days` : "N/A",
      consistency_score: m.consistency_score !== null && m.consistency_score !== undefined ? `${m.consistency_score}%` : "N/A",
      momentum_score: m.momentum_score || "N/A",
      growth_trend: m.momentum !== null && m.momentum !== undefined ? (m.momentum > 0 ? "Upward" : m.momentum < 0 ? "Downward" : "Stable") : "N/A",
      recent_performance_score: ai.creator_quality_score !== null && ai.creator_quality_score !== undefined ? Math.round(ai.creator_quality_score * 1.05) : "N/A",
      est_reel_reach: m.estimated_reel_reach !== null && m.estimated_reel_reach !== undefined ? m.estimated_reel_reach : "N/A",
      est_story_reach: m.estimated_story_reach !== null && m.estimated_story_reach !== undefined ? m.estimated_story_reach : "N/A",
      est_campaign_reach: m.estimated_campaign_reach !== null && m.estimated_campaign_reach !== undefined ? m.estimated_campaign_reach : "N/A",
      suggested_reel_price: m.suggested_reel_price !== null && m.suggested_reel_price !== undefined ? `₹${m.suggested_reel_price.toLocaleString()}` : "N/A",
      suggested_story_price: m.suggested_story_price !== null && m.suggested_story_price !== undefined ? `₹${m.suggested_story_price.toLocaleString()}` : "N/A",
      suggested_campaign_price: m.suggested_campaign_price !== null && m.suggested_campaign_price !== undefined ? `₹${m.suggested_campaign_price.toLocaleString()}` : "N/A",
      creator_quality_score: ai.creator_quality_score !== null && ai.creator_quality_score !== undefined ? `${ai.creator_quality_score}/100` : "N/A",
      reliability_score: ai.reliability_score !== null && ai.reliability_score !== undefined ? `${ai.reliability_score}/100` : "N/A",
      influence_score: ai.influence_score !== null && ai.influence_score !== undefined ? `${ai.influence_score}/100` : "N/A",
      discovery_ranking_score: ai.discovery_rank !== null && ai.discovery_rank !== undefined ? `#${ai.discovery_rank}` : "N/A",
      creator_value_score: m.creator_value_score !== null && m.creator_value_score !== undefined ? m.creator_value_score : "N/A",
      roi_potential_score: m.roi_potential_score !== null && m.roi_potential_score !== undefined ? m.roi_potential_score : "N/A",
      reels: ledger.reels !== undefined ? ledger.reels : "N/A",
      stories: ledger.stories !== undefined ? ledger.stories : "N/A",
      posts: ledger.posts !== undefined ? ledger.posts : "N/A",
      cost: ledger.cost !== undefined ? `₹${ledger.cost.toLocaleString()}` : "N/A",
      outreach_status: ledger.outreach_status || "N/A"
    };

    visibleColumns.forEach(col => {
      const headerName = columnLabels[col] || col;
      row[headerName] = valGetters[col] !== undefined ? valGetters[col] : "";
    });

    return row;
  });

  // Generate Worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, list.name.slice(0, 30));

  // Write file to buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  // Format Date: Abbott_23_June_2026.xlsx
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = new Date().toLocaleDateString('en-GB', options).replace(/\s/g, '_');
  const sanitizedPlanName = plan.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${sanitizedPlanName}_${formattedDate}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
