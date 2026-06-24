export interface InstagramPost {
  post_id: string;
  shortcode: string;
  caption: string;
  likes: number;
  comments: number;
  views: number;
  timestamp: string;
  is_video: boolean;
  url: string;
}

export interface CalculatedMetrics {
  // Original Fields (for backward compatibility)
  average_likes: number;
  average_comments: number;
  average_views: number;
  engagement_rate: number;
  view_follower_ratio: number;
  comment_rate: number;
  posting_frequency: string;
  consistency_score: number;
  viral_hit_rate: number;
  creator_quality_score: number;

  // New Engagement Metrics
  engagement_by_views: number;
  like_rate: number;

  // New Reach Metrics
  reach_efficiency: number;
  reach_category: "viral" | "strong" | "average" | "weak";

  // New Posting Consistency Metrics
  avg_gap_days: number;
  posts_per_week: number;

  // New Performance Analysis Metrics
  best_performing_post_id: string | null;
  worst_performing_post_id: string | null;
  median_views: number;
  median_likes: number;
  median_comments: number;

  // New Virality Metrics
  viral_threshold: number;
  viral_post_count: number;
  virality_score: number;

  // New Authenticity Metrics
  comment_like_ratio: number;
  authenticity_score: "High" | "Medium" | "Low";
  bot_risk_indicators: string[];

  // New Account Health Metrics
  follower_following_ratio: number;
  account_activity_score: number;

  // New Momentum Metrics
  last_10_posts_avg_views: number;
  previous_10_posts_avg_views: number;
  momentum: number;
  momentum_score: "Growing" | "Stable" | "Declining";

  // New Content Metrics
  most_used_hashtags: string[];
  avg_caption_length: number;
  hashtag_usage_rate: number;
  content_type_distribution: {
    reels: number;
    images: number;
    carousels: number;
  };

  // New AI Scores
  reliability_score: number;
  audience_trust_score: number;
  influence_score: number;
  discovery_ranking_score: number;

  // Commercial Metrics
  estimated_reel_reach: number;
  estimated_story_reach: number;
  estimated_campaign_reach: number;
  suggested_reel_price: number;
  suggested_story_price: number;
  suggested_campaign_price: number;

  // Wecollab Expansion Metrics
  avg_reel_likes: number;
  avg_reel_comments: number;
  avg_reel_views: number;
  avg_post_likes: number;
  avg_post_comments: number;
  reel_engagement_rate: number;
  post_engagement_rate: number;
  image_engagement_rate: number;
  estimated_reach: number;
  avg_reach_multiple: number;
  recent_performance_score: number;
  growth_trend: "Growing" | "Stable" | "Declining";
  best_post_views: number;
  worst_post_views: number;
  authenticity_score_num: number;
  creator_value_score: number;
  roi_potential_score: number;
}

// Helpers for calculations
function getMedian(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getStandardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
  const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Calculates advanced metrics for an Instagram profile based on its latest posts.
 * 
 * @param posts List of InstagramPost objects
 * @param followers Total followers of the creator
 * @param following Total following of the creator
 * @returns CalculatedMetrics object
 */
export function calculateCreatorMetrics(posts: InstagramPost[], followers: number, following: number = 0): CalculatedMetrics {
  const totalPosts = posts.length;
  
  if (totalPosts === 0) {
    return {
      average_likes: 0,
      average_comments: 0,
      average_views: 0,
      engagement_rate: 0,
      view_follower_ratio: 0,
      comment_rate: 0,
      posting_frequency: "Irregular",
      consistency_score: 50,
      viral_hit_rate: 0,
      creator_quality_score: 0,
      engagement_by_views: 0,
      like_rate: 0,
      reach_efficiency: 0,
      reach_category: "weak",
      avg_gap_days: 0,
      posts_per_week: 0,
      best_performing_post_id: null,
      worst_performing_post_id: null,
      median_views: 0,
      median_likes: 0,
      median_comments: 0,
      viral_threshold: 0,
      viral_post_count: 0,
      virality_score: 0,
      comment_like_ratio: 0,
      authenticity_score: "Low",
      bot_risk_indicators: [],
      follower_following_ratio: 0,
      account_activity_score: 0,
      last_10_posts_avg_views: 0,
      previous_10_posts_avg_views: 0,
      momentum: 0,
      momentum_score: "Stable",
      most_used_hashtags: [],
      avg_caption_length: 0,
      hashtag_usage_rate: 0,
      content_type_distribution: { reels: 0, images: 0, carousels: 0 },
      reliability_score: 0,
      audience_trust_score: 0,
      influence_score: 0,
      discovery_ranking_score: 0,
      // Expansion fields
      avg_reel_likes: 0,
      avg_reel_comments: 0,
      avg_reel_views: 0,
      avg_post_likes: 0,
      avg_post_comments: 0,
      reel_engagement_rate: 0,
      post_engagement_rate: 0,
      image_engagement_rate: 0,
      estimated_reach: 0,
      avg_reach_multiple: 0,
      recent_performance_score: 0,
      growth_trend: "Stable",
      best_post_views: 0,
      worst_post_views: 0,
      authenticity_score_num: 0,
      creator_value_score: 0,
      roi_potential_score: 0,
      // Commercial Metrics
      estimated_reel_reach: 0,
      estimated_story_reach: 0,
      estimated_campaign_reach: 0,
      suggested_reel_price: 0,
      suggested_story_price: 0,
      suggested_campaign_price: 0
    };
  }

  // 1. ENGAGEMENT METRICS
  let totalLikes = 0;
  let totalComments = 0;
  let totalViews = 0;

  posts.forEach(p => {
    totalLikes += p.likes || 0;
    totalComments += p.comments || 0;
    totalViews += p.views || 0;
  });

  const averageLikes = Math.round(totalLikes / totalPosts);
  const averageComments = Math.round(totalComments / totalPosts);
  const averageViews = Math.round(totalViews / totalPosts);

  const engagementRate = followers > 0 
    ? parseFloat((((averageLikes + averageComments) / followers) * 100).toFixed(2))
    : 0;

  const engagementByViews = averageViews > 0
    ? parseFloat((((averageLikes + averageComments) / averageViews) * 100).toFixed(2))
    : 0;

  const commentRate = followers > 0
    ? parseFloat(((averageComments / followers) * 100).toFixed(2))
    : 0;

  const likeRate = followers > 0
    ? parseFloat(((averageLikes / followers) * 100).toFixed(2))
    : 0;

  // 2. REACH METRICS
  const viewFollowerRatio = followers > 0
    ? parseFloat(((averageViews / followers) * 100).toFixed(2))
    : 0;

  const reachEfficiency = followers > 0
    ? parseFloat((averageViews / followers).toFixed(4))
    : 0;

  let reachCategory: "viral" | "strong" | "average" | "weak" = "weak";
  const reachPercentage = reachEfficiency * 100;
  if (reachPercentage > 100) reachCategory = "viral";
  else if (reachPercentage >= 50) reachCategory = "strong";
  else if (reachPercentage >= 25) reachCategory = "average";

  // 3. POSTING CONSISTENCY
  let avgGapDays = 0;
  let postingFrequency = "Irregular";
  let consistencyScore = 50;
  const gaps: number[] = [];

  if (totalPosts >= 2) {
    const dates = posts
      .map(p => new Date(p.timestamp).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => a - b); // chronological order (oldest first)

    if (dates.length >= 2) {
      for (let i = 0; i < dates.length - 1; i++) {
        const diffDays = (dates[i + 1] - dates[i]) / (1000 * 60 * 60 * 24);
        gaps.push(diffDays);
      }
      avgGapDays = parseFloat((gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2));
      
      // Determine Frequency Label
      if (avgGapDays <= 1.5) postingFrequency = "Daily or near-daily";
      else if (avgGapDays <= 4.0) postingFrequency = "Multiple times a week";
      else if (avgGapDays <= 8.0) postingFrequency = "Weekly";
      else if (avgGapDays <= 15.0) postingFrequency = "Bi-weekly";
      else postingFrequency = "Irregular";

      // Consistency Score formula: 100 - (std_deviation(posting_gaps) * factor)
      // Factor of 3.0 gives standard deviation of 10 days a score decrement of 30
      const stdDevGaps = getStandardDeviation(gaps);
      consistencyScore = Math.max(0, Math.min(100, Math.round(100 - (stdDevGaps * 3.0))));
    }
  }

  // Calculate posts per week (posts in last 30 days / 4)
  // Reference date: the latest post's timestamp, or current time if recent
  const referenceTime = new Date().getTime();
  const thirtyDaysAgo = referenceTime - (30 * 24 * 60 * 60 * 1000);
  const postsLast30Days = posts.filter(p => new Date(p.timestamp).getTime() >= thirtyDaysAgo).length;
  const postsPerWeek = parseFloat((postsLast30Days / 4.0).toFixed(2));

  // 4. PERFORMANCE ANALYSIS
  let bestPerformingPostId: string | null = null;
  let worstPerformingPostId: string | null = null;
  let maxViews = -1;
  let minViews = Infinity;

  const likesArray: number[] = [];
  const commentsArray: number[] = [];
  const viewsArray: number[] = [];

  posts.forEach(p => {
    likesArray.push(p.likes || 0);
    commentsArray.push(p.comments || 0);
    viewsArray.push(p.views || 0);

    if (p.views > maxViews) {
      maxViews = p.views;
      bestPerformingPostId = p.post_id;
    }
    if (p.views < minViews) {
      minViews = p.views;
      worstPerformingPostId = p.post_id;
    }
  });

  // Safe checks if views aren't available at all
  if (maxViews === -1) bestPerformingPostId = posts[0]?.post_id || null;
  if (minViews === Infinity) worstPerformingPostId = posts[posts.length - 1]?.post_id || null;

  const medianLikes = getMedian(likesArray);
  const medianComments = getMedian(commentsArray);
  const medianViews = getMedian(viewsArray);

  // 5. VIRALITY METRICS
  const viralThreshold = averageViews * 2;
  let viralPostCount = 0;
  posts.forEach(p => {
    // Only count if views exceed threshold and views > 0 (to avoid images with 0 views)
    if (p.views > 0 && p.views > viralThreshold) {
      viralPostCount++;
    }
  });
  const viralHitRate = parseFloat(((viralPostCount / totalPosts) * 100).toFixed(2));
  const viralityScore = Math.min(Math.round(viralHitRate * 10), 100);

  // 6. AUTHENTICITY METRICS
  const commentLikeRatio = averageLikes > 0
    ? parseFloat((averageComments / averageLikes).toFixed(4))
    : 0;

  const commentLikePct = commentLikeRatio * 100;
  let authenticityScore: "High" | "Medium" | "Low" = "Low";
  if (commentLikePct >= 2 && commentLikePct <= 8) {
    authenticityScore = "High";
  } else if (commentLikePct >= 1 && commentLikePct < 2) {
    authenticityScore = "Medium";
  }

  // Bot risk indicators
  const botRiskIndicators: string[] = [];
  
  // Indicator 1: huge likes with tiny comments
  const hugeLikesTinyComments = posts.some(p => p.likes > 2000 && p.comments <= 2);
  if (hugeLikesTinyComments) {
    botRiskIndicators.push("Huge likes with tiny comments pattern detected");
  }

  // Indicator 2: repeated engagement patterns
  const likesCountMap: { [key: number]: number } = {};
  posts.forEach(p => {
    if (p.likes > 5) { // ignore small counts
      likesCountMap[p.likes] = (likesCountMap[p.likes] || 0) + 1;
    }
  });
  const hasRepeatedLikes = Object.values(likesCountMap).some(count => count >= 4);
  if (hasRepeatedLikes) {
    botRiskIndicators.push("Repeated engagement patterns detected");
  }

  // Indicator 3: inconsistent spikes
  const stdDevLikes = getStandardDeviation(likesArray);
  if (stdDevLikes > 3.0 * (medianLikes || 1) && medianLikes > 50) {
    botRiskIndicators.push("Inconsistent engagement spikes detected");
  }

  // 7. ACCOUNT HEALTH
  const followerFollowingRatio = following > 0
    ? parseFloat((followers / following).toFixed(2))
    : followers;

  // Account Activity Score (0-100)
  // Combined from: posting frequency, engagement, consistency
  const activityFreqScore = Math.min(100, postsPerWeek * 20); // 5+ posts per week is 100
  const activityEngScore = Math.min(100, engagementRate * 15); // 6.6%+ ER is 100
  const accountActivityScore = Math.round(
    (activityFreqScore * 0.3) +
    (activityEngScore * 0.4) +
    (consistencyScore * 0.3)
  );

  // 8. MOMENTUM ANALYSIS
  // Sort posts descending by date (newest first)
  const sortedPostsDesc = [...posts].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const last10 = sortedPostsDesc.slice(0, 10);
  const prev10 = sortedPostsDesc.slice(10, 20);

  let last10AvgViews = 0;
  let prev10AvgViews = 0;

  if (last10.length > 0) {
    last10AvgViews = last10.reduce((acc, p) => acc + (p.views || 0), 0) / last10.length;
  }
  if (prev10.length > 0) {
    prev10AvgViews = prev10.reduce((acc, p) => acc + (p.views || 0), 0) / prev10.length;
  } else if (sortedPostsDesc.length > last10.length) {
    // If we have less than 20 posts but more than 10, compare first half with second half
    const half = Math.ceil(sortedPostsDesc.length / 2);
    const firstHalf = sortedPostsDesc.slice(0, half);
    const secondHalf = sortedPostsDesc.slice(half);
    last10AvgViews = firstHalf.reduce((acc, p) => acc + (p.views || 0), 0) / firstHalf.length;
    prev10AvgViews = secondHalf.reduce((acc, p) => acc + (p.views || 0), 0) / secondHalf.length;
  }

  const momentum = prev10AvgViews > 0
    ? parseFloat(((last10AvgViews - prev10AvgViews) / prev10AvgViews).toFixed(4))
    : 0.0;

  let momentumScore: "Growing" | "Stable" | "Declining" = "Stable";
  if (momentum > 0.05) momentumScore = "Growing";
  else if (momentum < -0.05) momentumScore = "Declining";

  // 9. CONTENT ANALYSIS
  const hashtagCounts: { [tag: string]: number } = {};
  let totalCaptionLength = 0;
  let postsWithHashtags = 0;

  posts.forEach(p => {
    const caption = p.caption || "";
    totalCaptionLength += caption.length;

    const tags = caption.match(/#[a-zA-Z0-9_\u00C0-\u00FF]+/g) || [];
    if (tags.length > 0) {
      postsWithHashtags++;
      tags.forEach(tag => {
        const cleanTag = tag.toLowerCase();
        hashtagCounts[cleanTag] = (hashtagCounts[cleanTag] || 0) + 1;
      });
    }
  });

  const mostUsedHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(entry => entry[0]);

  const avgCaptionLength = Math.round(totalCaptionLength / totalPosts);
  const hashtagUsageRate = parseFloat(((postsWithHashtags / totalPosts) * 100).toFixed(2));

  // Content type distribution (simulate Carousel since scraper returns is_video)
  const reelsCount = posts.filter(p => p.is_video).length;
  const nonReelsCount = totalPosts - reelsCount;
  // Estimate: 20% of non-reels are carousels, 80% are single images
  const carouselsCount = Math.round(nonReelsCount * 0.2);
  const imagesCount = nonReelsCount - carouselsCount;

  const contentTypeDistribution = {
    reels: parseFloat(((reelsCount / totalPosts) * 100).toFixed(2)),
    images: parseFloat(((imagesCount / totalPosts) * 100).toFixed(2)),
    carousels: parseFloat(((carouselsCount / totalPosts) * 100).toFixed(2))
  };

  // 10. AI SCORES
  
  // A. Creator Quality Score (0-100)
  // Weights: 35% Engagement, 25% Reach, 20% Consistency, 10% Virality, 10% Authenticity
  const scoreEngagement = Math.min(100, engagementRate * 12); // Max 100 at 8.3% ER
  const scoreReach = Math.min(100, reachEfficiency * 150); // Max 100 at 0.66 Reach Efficiency
  const scoreConsistency = consistencyScore;
  const scoreVirality = viralityScore;
  
  let scoreAuthenticity = 30; // Low
  if (authenticityScore === "High") scoreAuthenticity = 100;
  else if (authenticityScore === "Medium") scoreAuthenticity = 70;

  const creatorQualityScore = parseFloat((
    (scoreEngagement * 0.35) +
    (scoreReach * 0.25) +
    (scoreConsistency * 0.20) +
    (scoreVirality * 0.10) +
    (scoreAuthenticity * 0.10)
  ).toFixed(1));

  // B. Reliability Score (0-100)
  // Based on posting consistency, performance variance, engagement stability
  const stdDevViews = getStandardDeviation(viewsArray);
  const scoreVarianceViews = Math.max(0, 100 - (stdDevViews / (medianViews || 1)) * 40);
  const scoreStabilityLikes = Math.max(0, 100 - (stdDevLikes / (medianLikes || 1)) * 40);
  
  const reliabilityScore = Math.round(
    (consistencyScore * 0.40) +
    (scoreVarianceViews * 0.30) +
    (scoreStabilityLikes * 0.30)
  );

  // C. Audience Trust Score (0-100)
  // Based on comment ratio, engagement quality (bot indicators penalty), consistency
  const scoreCommentRatio = Math.min(100, commentRate * 60); // 1.6% comment rate is 100
  const scoreEngQuality = Math.max(0, 100 - (botRiskIndicators.length * 35));
  
  const audienceTrustScore = Math.round(
    (scoreCommentRatio * 0.40) +
    (scoreEngQuality * 0.30) +
    (consistencyScore * 0.30)
  );

  // D. Influence Score (0-100)
  // Based on followers, engagement, reach, virality
  // Followers score: Log scale. 1M+ followers is 100, 100k is 80, 10k is 60, 1k is 40
  let scoreFollowers = 20;
  if (followers >= 1000000) scoreFollowers = 100;
  else if (followers >= 100000) scoreFollowers = 80;
  else if (followers >= 10000) scoreFollowers = 60;
  else if (followers >= 1000) scoreFollowers = 40;
  
  const influenceScore = Math.round(
    (scoreFollowers * 0.40) +
    (scoreEngagement * 0.20) +
    (scoreReach * 0.20) +
    (scoreVirality * 0.20)
  );

  // E. Discovery Ranking Score (0-100)
  // Controls creator search ranking
  // Weights: 40% Creator Quality, 20% Reach, 15% Reliability, 15% Authenticity, 10% Momentum
  let scoreMomentumValue = 60; // Stable
  if (momentumScore === "Growing") scoreMomentumValue = 100;
  else if (momentumScore === "Declining") scoreMomentumValue = 30;

  const discoveryRankingScore = parseFloat((
    (creatorQualityScore * 0.40) +
    (scoreReach * 0.20) +
    (reliabilityScore * 0.15) +
    (scoreAuthenticity * 0.15) +
    (scoreMomentumValue * 0.10)
  ).toFixed(1));

  // ============================================================
  // WeCollab Metrics Expansion Calculations
  // ============================================================
  const reelPosts = posts.filter(p => p.is_video);
  const imagePosts = posts.filter(p => !p.is_video);

  const avgReelLikes = reelPosts.length > 0
    ? Math.round(reelPosts.reduce((acc, p) => acc + (p.likes || 0), 0) / reelPosts.length)
    : 0;

  const avgReelComments = reelPosts.length > 0
    ? Math.round(reelPosts.reduce((acc, p) => acc + (p.comments || 0), 0) / reelPosts.length)
    : 0;

  const avgReelViews = reelPosts.length > 0
    ? Math.round(reelPosts.reduce((acc, p) => acc + (p.views || 0), 0) / reelPosts.length)
    : 0;

  const avgPostLikes = imagePosts.length > 0
    ? Math.round(imagePosts.reduce((acc, p) => acc + (p.likes || 0), 0) / imagePosts.length)
    : 0;

  const avgPostComments = imagePosts.length > 0
    ? Math.round(imagePosts.reduce((acc, p) => acc + (p.comments || 0), 0) / imagePosts.length)
    : 0;

  const reelEngagementRate = followers > 0
    ? parseFloat((((avgReelLikes + avgReelComments) / followers) * 100).toFixed(2))
    : 0;

  const postEngagementRate = followers > 0
    ? parseFloat((((avgPostLikes + avgPostComments) / followers) * 100).toFixed(2))
    : 0;

  const imageEngagementRate = followers > 0
    ? parseFloat((((avgPostLikes + avgPostComments) / followers) * 100).toFixed(2))
    : 0;

  const estimatedReach = Math.round(averageViews * 0.85);
  const avgReachMultiple = followers > 0
    ? parseFloat((averageViews / followers).toFixed(4))
    : 0;

  const recentPerformanceScore = Math.round(last10AvgViews);
  
  const momentumScoreVal = parseFloat((momentum * 100).toFixed(2));
  const growthTrend = momentumScoreVal > 5 ? "Growing" : momentumScoreVal < -5 ? "Declining" : "Stable";

  const bestPostViews = maxViews === -1 ? 0 : maxViews;
  const worstPostViews = minViews === Infinity ? 0 : minViews;

  // Authenticity Score (0-100)
  const commentRatioPct = commentLikeRatio * 100;
  let authBase = 50;
  if (commentRatioPct >= 2 && commentRatioPct <= 8) authBase = 100;
  else if (commentRatioPct >= 1 && commentRatioPct < 2) authBase = 80;
  else if (commentRatioPct > 8 && commentRatioPct <= 12) authBase = 75;
  else if (commentRatioPct > 12) authBase = 50;
  
  const botPenalty = botRiskIndicators.length * 30;
  const authenticityScoreNum = Math.max(0, authBase - botPenalty);

  // Commercial Metrics
  const estimatedReelReach = Math.round(avgReelViews * 0.85);
  const estimatedStoryReach = Math.round(followers * 0.12);
  const estimatedCampaignReach = estimatedReelReach; // assume 1 reel deliverable for base metrics

  // Suggested Prices
  const suggestedReelPrice = Math.round((avgReelViews / 1000) * 300); // CPM = 300
  const suggestedStoryPrice = Math.round(followers * 0.05); // Story price factor = 0.05
  const suggestedCampaignPrice = suggestedReelPrice + suggestedStoryPrice;

  // Creator Value Score
  const creatorValueScore = suggestedCampaignPrice > 0 
    ? parseFloat(((engagementRate / suggestedCampaignPrice) * 100000).toFixed(2)) 
    : 0;

  // ROI Potential Score (0-100)
  const roiEng = Math.min(100, engagementRate * 12);
  const roiReach = Math.min(100, reachEfficiency * 150);
  const cpmVal = avgReelViews > 0 ? (suggestedReelPrice / avgReelViews) * 1000 : 300;
  const roiPrice = Math.max(0, 100 - Math.max(0, (cpmVal - 200) * 0.25));
  const roiPotentialScore = Math.round((roiEng * 0.4) + (roiReach * 0.3) + (roiPrice * 0.3));

  return {
    // Original fields
    average_likes: averageLikes,
    average_comments: averageComments,
    average_views: averageViews,
    engagement_rate: engagementRate,
    view_follower_ratio: viewFollowerRatio,
    comment_rate: commentRate,
    posting_frequency: postingFrequency,
    consistency_score: consistencyScore,
    viral_hit_rate: viralHitRate,
    creator_quality_score: creatorQualityScore,

    // New Engagement
    engagement_by_views: engagementByViews,
    like_rate: likeRate,

    // Reach
    reach_efficiency: reachEfficiency,
    reach_category: reachCategory,

    // Consistency
    avg_gap_days: avgGapDays,
    posts_per_week: postsPerWeek,

    // Performance
    best_performing_post_id: bestPerformingPostId,
    worst_performing_post_id: worstPerformingPostId,
    median_views: medianViews,
    median_likes: medianLikes,
    median_comments: medianComments,

    // Virality
    viral_threshold: viralThreshold,
    viral_post_count: viralPostCount,
    virality_score: viralityScore,

    // Authenticity
    comment_like_ratio: commentLikeRatio,
    authenticity_score: authenticityScore,
    bot_risk_indicators: botRiskIndicators,

    // Health
    follower_following_ratio: followerFollowingRatio,
    account_activity_score: accountActivityScore,

    // Momentum
    last_10_posts_avg_views: last10AvgViews,
    previous_10_posts_avg_views: prev10AvgViews,
    momentum: momentum,
    momentum_score: momentumScore,

    // Content
    most_used_hashtags: mostUsedHashtags,
    avg_caption_length: avgCaptionLength,
    hashtag_usage_rate: hashtagUsageRate,
    content_type_distribution: contentTypeDistribution,

    // AI Scores
    reliability_score: reliabilityScore,
    audience_trust_score: audienceTrustScore,
    influence_score: influenceScore,
    discovery_ranking_score: discoveryRankingScore,

    // Expansion fields
    avg_reel_likes: avgReelLikes,
    avg_reel_comments: avgReelComments,
    avg_reel_views: avgReelViews,
    avg_post_likes: avgPostLikes,
    avg_post_comments: avgPostComments,
    reel_engagement_rate: reelEngagementRate,
    post_engagement_rate: postEngagementRate,
    image_engagement_rate: imageEngagementRate,
    estimated_reach: estimatedReach,
    avg_reach_multiple: avgReachMultiple,
    recent_performance_score: recentPerformanceScore,
    growth_trend: growthTrend,
    best_post_views: bestPostViews,
    worst_post_views: worstPostViews,
    authenticity_score_num: authenticityScoreNum,
    creator_value_score: creatorValueScore,
    roi_potential_score: roiPotentialScore,
    // Commercial Metrics
    estimated_reel_reach: estimatedReelReach,
    estimated_story_reach: estimatedStoryReach,
    estimated_campaign_reach: estimatedCampaignReach,
    suggested_reel_price: suggestedReelPrice,
    suggested_story_price: suggestedStoryPrice,
    suggested_campaign_price: suggestedCampaignPrice
  };
}
