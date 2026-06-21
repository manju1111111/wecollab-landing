export interface MockNewsletter {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image?: string | null;
  category: string;
  tags?: string[] | null;
  author_name?: string | null;
  author_avatar?: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
}

export const MOCK_NEWSLETTERS: MockNewsletter[] = [
  {
    id: "seed-1",
    title: "The Rise of Micro-Communities",
    slug: "rise-of-micro-communities",
    summary: "Why smaller, tighter communities are becoming the future of influence and monetization.",
    content: `## The Shift to Niche Audiences

For years, influencer marketing was dominated by a simple metric: follower count. Brands rushed to secure sponsorships with creators boasting millions of followers, assuming that massive reach guaranteed massive returns. However, as the creator economy matures, the landscape is shifting dramatically. Today, savvy brands are reallocating their budgets away from mega-influencers and toward **micro-creators** (those with 5,000 to 50,000 followers) who command highly engaged, niche micro-communities.

### Why Follower Count is a Vanity Metric

While a mega-influencer can place your product in front of millions, the engagement rate on these posts is often abysmally low—frequently hovering under 1%. More importantly, their audience is highly general. A single post about a skincare product might reach gamers, fitness enthusiasts, and foodies alike, most of whom have zero intent to purchase.

In contrast, micro-creators build their platforms around specific interests: minimalist kitchenware, local hiking trails, or vintage mechanical keyboards. When a micro-creator shares a recommendation, it is received not as a trusted suggestion from a knowledgeable peer. This yields engagement rates that are often 4x to 10x higher than their mega-influencer counterparts.

### The Economics of Micro-Communities

1. **Higher ROI per Dollar Spent**: Working with 10 micro-creators is often significantly cheaper than hiring a single celebrity influencer, yet it distributes your message across multiple distinct hubs.
2. **Authenticity at Scale**: Micro-creators are more likely to respond to comments, answer product questions, and drive real conversations.
3. **Content Variety**: You receive 10 unique creative assets to test in your paid campaigns, rather than just one.

### How to Build a Micro-Community Strategy

To succeed in this new paradigm, brands must shift from one-off transactional sponsorships to long-term relationship building. Focus on finding creators whose values align perfectly with yours, give them creative freedom to speak to their audience authentically, and co-create value rather than dictating rigid scripts.

At WeCollab, we analyze creator engagement and audience demographics to match brands with the perfect micro-communities. Start small, track conversion data, and build an army of authentic advocates.`,
    cover_image: null,
    category: "Creator Economy",
    tags: ["Creator Economy", "Micro-Communities", "Influence", "Monetization"],
    author_name: "WeCollab Team",
    author_avatar: "/assets/discover-creator-1.png",
    is_published: true,
    published_at: "2024-05-20T09:00:00.000Z",
    created_at: "2024-05-20T09:00:00.000Z"
  },
  {
    id: "seed-2",
    title: "TikTok vs. Reels Search SEO",
    slug: "tiktok-vs-reels-search-seo",
    summary: "A deep dive into how discoverability works on TikTok and Instagram Reels—and how to win.",
    content: `## Social Media is the New Google

It's a statistic that has sent shockwaves through the SEO community: according to Google's own internal data, nearly 40% of young people (ages 18-24) now use TikTok or Instagram to search for places to eat, products to buy, or tutorials, rather than Google Search or Maps. This shift marks the dawn of the **Social Search Era**, and it requires a complete overhaul of how we write content, optimize captions, and design video structures.

### The Anatomy of Social Search Algorithms

Traditional search engines parse crawling text. Social search engines, however, parse a multi-modal set of signals:

- **In-Video Audio & Subtitles**: Both TikTok and Instagram Reels auto-transcribe spoken words. Saying your target keywords in the first 3 seconds of your video is now a primary ranking factor.
- **On-Screen Text**: Text overlays processed via OCR (Optical Recognition) tell the algorithm exactly what your video is about.
- **Captions & Description Field**: The first 150 characters of your caption are heavily weighted for semantic keywords.
- **Hashtags**: No longer just for discovery, hashtags now act as categorical taxonomies to place your content in the correct search index.

### Reels vs. TikTok SEO: Key Differences

| Feature | TikTok SEO | Instagram Reels SEO |
| :--- | :--- | :--- |
| **Search Bar Suggestion** | Highly aggressive; autocompletes related trends | Focuses on accounts, audio, and hashtags |
| **Keyword Richness** | Benefits from long, descriptive captions (up to 2,200 chars) | Prefers concise, punchy captions with high-relevance tags |
| **Audio Importance** | Trending audio acts as an indexable category | Trending audio boosts recommendation but less search intent |

### Practical Optimization Checklist

1. **Spoken Keywords**: Clear pronunciation of key phrases in the video voiceover.
2. **Keyword-Optimized Text Overlays**: Place 2-3 text boxes with search terms on the screen.
3. **Semantic Captions**: Write a 2-3 sentence description explaining the video topic, using natural variations of your primary keywords.
4. **Niche Hashtags**: Mix broad category tags (e.g., #influencermarketing) with hyper-specific search queries (e.g., #tiktokseo).

By optimizing your video assets for social search, you capture high-intent users at the exact moment they seek answers. Integrate these practices into your content pipeline immediately to stay ahead.`,
    cover_image: null,
    category: "Platform Insights",
    tags: ["Platform Insights", "SEO", "TikTok", "Instagram Reels", "Discoverability"],
    author_name: "WeCollab Team",
    author_avatar: "/assets/discover-creator-2.png",
    is_published: true,
    published_at: "2024-05-17T09:00:00.000Z",
    created_at: "2024-05-17T09:00:00.000Z"
  },
  {
    id: "seed-3",
    title: "Negotiating Creator Contracts",
    slug: "negotiating-creator-contracts",
    summary: "Key clauses, red flags, and pro tips to help you negotiate fair and future-proof creator agreements.",
    content: `## The Legalities of Creator Partnerships

Influencer campaigns are built on creativity and relationships, but they are sustained by legally binding agreements. Unfortunately, many brands utilize template contracts that ignore the unique nuances of digital content. Without specific, clear clauses, you risk paying for rights you don't own, encountering campaign overlap conflicts, or facing compliance penalties. Here are the 5 critical contract clauses that brands frequently overlook during negotiations.

### 1. Usage Rights & Content Licensing Scope

Does your contract state that you 'own the content'? Beware. In intellectual property law, the creator by default retains the copyright. To use their image or video in paid ads (dark posts), your website, or print media, you must explicitly negotiate **usage rights**. Specify:

- **Platforms**: Where can you run the content (e.g., Meta Ads, website, email)?
- **Duration**: How long does the usage right last (e.g., 30 days, 6 months, perpetual)?
- **Exclusivity**: Can the creator sell the same content to a competitor?

### 2. Category Exclusivity Period

There is nothing worse than launching a premium skincare campaign, only to have the same creator post a video promoting your direct competitor the next afternoon. To prevent this, define a **category exclusivity clause**. Keep it narrow to control costs: restrict them from partnering with a specific list of direct competitors for 7 days before the post and 14 days after.

### 3. FTC Disclosure Compliance & Indemnification

Regulators are cracking down on hidden sponsorships. Your contract must mandate explicit, visible disclosures (such as \`#ad\` or \`#sponsored\` placed above the fold in the caption or embedded in the video overlay). Furthermore, include an **indemnification clause** protecting your brand from legal or financial penalties if the creator fails to follow these guidelines.

### 4. Content Archiving vs. Active Deletion

When a campaign ends, must the creator delete the post? Deleting posts hurts the creator's organic performance history. Instead, negotiate an **archiving clause**: the creator agrees not to delete the post, but allows it to sink naturally down their feed. However, they must remove active links or pinned status after the campaign concludes.

### 5. Morals & Brand Safety Termination Clause

Your brand reputation is your most valuable asset. A robust morals clause gives you the right to terminate the contract immediately and withhold pending payments if the creator engages in behavior that is illegal, offensive, or brings public disrepute to themselves or your brand. This gives you a quick exit route if a crisis arises.

Clear contracts create healthy partnerships. Ensure your agreements protect your interests while respecting creator rights, paving the way for seamless campaigns.`,
    cover_image: null,
    category: "Business",
    tags: ["Business", "Influencer Contracts", "Legal", "Negotiations"],
    author_name: "WeCollab Team",
    author_avatar: "/assets/discover-creator-3.png",
    is_published: true,
    published_at: "2024-05-14T09:00:00.000Z",
    created_at: "2024-05-14T09:00:00.000Z"
  },
  {
    id: "seed-4",
    title: "Brand Sponsorship Trends 2026",
    slug: "brand-sponsorship-trends-2026",
    summary: "Data-backed predictions on where brand spend is heading and what creators should prepare for.",
    content: `## The Future of Sponsorships

The creator economy is shifting from simple promotional advertisements to deep joint ventures. As we look toward 2026, brands are optimizing their marketing spend with heavy focus on performance indicators, multi-channel distribution, and creators who function as full creative directors rather than simple billboards.

### Multi-Channel Distribution Networks

Creators who rely on a single platform are facing high risks. Algorithms change, and organic reach fluctuates. The most successful creators in 2026 are building multi-channel distribution networks, including:

- **Weekly Email Newsletters**: Direct access to audiences independent of third-party platform algorithms.
- **Short-form Video Distribution**: Publishing simultaneously across TikTok, YouTube Shorts, and Instagram Reels.
- **Private Audio feeds**: Podcasts and audio briefs that command deeper attention spans.

### Shift in Brand Sponsorship Budgets

1. **Performance-Driven Commissions**: Brands are shifting from flat upfront fees to hybrid structures: a baseline fee combined with performance-based bonuses (conversions, clicks, email signups).
2. **Long-Term Ambassadorships**: Instead of one-off posts, brands seek 6-month to 12-month commitments to build consistency and audience trust.
3. **Data Integrity Audits**: Brands require creators to provide verified first-party audience metrics before signing agreements.

Creators must adapt by positioning themselves as business partners who understand brand objectives, metrics, and distribution strategies.`,
    cover_image: null,
    category: "Industry Trends",
    tags: ["Industry Trends", "Sponsorships", "Marketing Predictions", "Brand Spend"],
    author_name: "WeCollab Team",
    author_avatar: "/assets/jannat_profile.png",
    is_published: true,
    published_at: "2024-05-11T09:00:00.000Z",
    created_at: "2024-05-11T09:00:00.000Z"
  }
];
