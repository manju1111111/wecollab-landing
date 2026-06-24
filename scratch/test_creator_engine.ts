import { calculateCreatorMetrics, type InstagramPost } from "../lib/instagram/metrics-engine";

const mockPosts: InstagramPost[] = [
  {
    post_id: "1",
    shortcode: "code1",
    caption: "Loving this sunny day! #sunny #travel",
    likes: 1200,
    comments: 50,
    views: 0,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    is_video: false,
    url: "url1"
  },
  {
    post_id: "2",
    shortcode: "code2",
    caption: "Checkout my new video reel! #dance #reels",
    likes: 2500,
    comments: 110,
    views: 5000,
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_video: true,
    url: "url2"
  },
  {
    post_id: "3",
    shortcode: "code3",
    caption: "Another great day! #sunny #vibes",
    likes: 800,
    comments: 30,
    views: 0,
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    is_video: false,
    url: "url3"
  }
];

const followers = 50000;
const following = 200;

console.log("Running Metrics Engine calculations with mock data...");
const result = calculateCreatorMetrics(mockPosts, followers, following);

console.log("Calculated Metrics Result:", JSON.stringify(result, null, 2));

const expectedAvgLikes = Math.round((1200 + 2500 + 800) / 3);
if (result.average_likes === expectedAvgLikes) {
  console.log(`✓ average_likes test passed (expected: ${expectedAvgLikes}, got: ${result.average_likes})`);
} else {
  console.error(`✗ average_likes test failed (expected: ${expectedAvgLikes}, got: ${result.average_likes})`);
}

const expectedAvgComments = Math.round((50 + 110 + 30) / 3);
if (result.average_comments === expectedAvgComments) {
  console.log(`✓ average_comments test passed (expected: ${expectedAvgComments}, got: ${result.average_comments})`);
} else {
  console.error(`✗ average_comments test failed (expected: ${expectedAvgComments}, got: ${result.average_comments})`);
}

const expectedEngagementRate = parseFloat((((expectedAvgLikes + expectedAvgComments) / followers) * 100).toFixed(2));
if (result.engagement_rate === expectedEngagementRate) {
  console.log(`✓ engagement_rate test passed (expected: ${expectedEngagementRate}%, got: ${result.engagement_rate}%)`);
} else {
  console.error(`✗ engagement_rate test failed (expected: ${expectedEngagementRate}%, got: ${result.engagement_rate}%)`);
}

if (result.creator_quality_score > 0) {
  console.log(`✓ creator_quality_score test passed: ${result.creator_quality_score}`);
} else {
  console.error("✗ creator_quality_score test failed");
}

if (result.discovery_ranking_score > 0) {
  console.log(`✓ discovery_ranking_score test passed: ${result.discovery_ranking_score}`);
} else {
  console.error("✗ discovery_ranking_score test failed");
}
