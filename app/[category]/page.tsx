import { createAdminClient } from "@/lib/supabase/server";
import { MOCK_CREATORS } from "@/data/mock-creators";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Breadcrumbs } from "@/components/seo/breadcrumb";
import { InternalLinks } from "@/components/seo/internal-links";
import { MapPin, CheckCircle, Flame, Star, Sparkles } from "lucide-react";
import { FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa6";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

interface CategoryConfig {
  title: string;
  description: string;
  breadcrumbName: string;
  pageHeader: string;
  pageSubheader: string;
  categoryFilter: string | null;
  platformFilter: string | null;
  locationFilter: string | null;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  "instagram-influencers": {
    title: "Top Instagram Influencers in India | WeCollab",
    description: "Discover and connect with top Instagram influencers in India. View verified analytics, engagement rates, and collaboration pricing on WeCollab.",
    breadcrumbName: "Instagram Influencers",
    pageHeader: "Top Instagram Influencers in India",
    pageSubheader: "Partner with top verified Instagram creators for high-impact social media campaigns.",
    categoryFilter: null,
    platformFilter: "Instagram",
    locationFilter: null,
  },
  "youtube-creators": {
    title: "Top YouTube Creators in India | WeCollab",
    description: "Discover and connect with top YouTube creators in India. View verified subscriber stats, metrics, and partnership options on WeCollab.",
    breadcrumbName: "YouTube Creators",
    pageHeader: "Top YouTube Creators in India",
    pageSubheader: "Discover verified YouTube video channels and video content creators for your brand.",
    categoryFilter: null,
    platformFilter: "YouTube",
    locationFilter: null,
  },
  "instagram-influencers-india": {
    title: "Top Instagram Influencers in India | WeCollab",
    description: "Discover and connect with top Instagram influencers in India. View verified analytics, engagement rates, and collaboration pricing on WeCollab.",
    breadcrumbName: "Instagram Influencers India",
    pageHeader: "Top Instagram Influencers in India",
    pageSubheader: "Partner with top verified Instagram creators in India for high-impact social media campaigns.",
    categoryFilter: null,
    platformFilter: "Instagram",
    locationFilter: "India",
  },
  "youtube-influencers-india": {
    title: "Top YouTube Influencers in India | WeCollab",
    description: "Discover and connect with top YouTube influencers in India. View verified subscriber stats, metrics, and partnership options on WeCollab.",
    breadcrumbName: "YouTube Influencers India",
    pageHeader: "Top YouTube Influencers in India",
    pageSubheader: "Discover verified YouTube video channels and video content creators in India for your brand.",
    categoryFilter: null,
    platformFilter: "YouTube",
    locationFilter: "India",
  },
  "linkedin-creators-india": {
    title: "Top LinkedIn Creators in India | WeCollab",
    description: "Discover and connect with top LinkedIn creators in India. View verified analytics, audience insights, and partnership options on WeCollab.",
    breadcrumbName: "LinkedIn Creators India",
    pageHeader: "Top LinkedIn Creators in India",
    pageSubheader: "Connect with industry leaders and professional B2B creators on LinkedIn India.",
    categoryFilter: null,
    platformFilter: "LinkedIn",
    locationFilter: "India",
  },
  "food-influencers": {
    title: "Top Food Influencers & Culinary Creators | WeCollab",
    description: "Discover and connect with top food influencers and culinary creators. View verified statistics, engagement, and collaboration pricing on WeCollab.",
    breadcrumbName: "Food Influencers",
    pageHeader: "Top Food & Culinary Creators",
    pageSubheader: "Discover top food vloggers, recipe developers, and culinary influencers.",
    categoryFilter: "Food",
    platformFilter: null,
    locationFilter: null,
  },
  "tech-influencers": {
    title: "Top Tech Influencers & Gadget Creators | WeCollab",
    description: "Discover and connect with top tech influencers and hardware creators. View verified statistics, engagement, and collaboration pricing on WeCollab.",
    breadcrumbName: "Tech Influencers",
    pageHeader: "Top Tech & Gadget Influencers",
    pageSubheader: "Connect with tech reviewers, gadget unboxers, and software developers.",
    categoryFilter: "Tech",
    platformFilter: null,
    locationFilter: null,
  },
  "fashion-influencers": {
    title: "Top Fashion & Style Influencers | WeCollab",
    description: "Discover and connect with top fashion and style influencers. View verified statistics, engagement, and collaboration pricing on WeCollab.",
    breadcrumbName: "Fashion Influencers",
    pageHeader: "Top Fashion & Style Influencers",
    pageSubheader: "Partner with stylish creators, outfit-of-the-day vloggers, and fashionistas.",
    categoryFilter: "Fashion",
    platformFilter: null,
    locationFilter: null,
  },
  "travel-influencers": {
    title: "Top Travel & Adventure Influencers | WeCollab",
    description: "Discover and connect with top travel and adventure influencers. View verified statistics, engagement, and collaboration pricing on WeCollab.",
    breadcrumbName: "Travel Influencers",
    pageHeader: "Top Travel & Adventure Influencers",
    pageSubheader: "Explore the world through top travel vloggers, nomads, and adventure creators.",
    categoryFilter: "Travel",
    platformFilter: null,
    locationFilter: null,
  },
  "finance-creators": {
    title: "Top Finance & FinTech Creators | WeCollab",
    description: "Discover and connect with top finance and fintech creators. View verified statistics, engagement, and collaboration pricing on WeCollab.",
    breadcrumbName: "Finance Creators",
    pageHeader: "Top Finance & FinTech Creators",
    pageSubheader: "Connect with financial advisors, investment experts, and personal finance creators.",
    categoryFilter: "Finance",
    platformFilter: null,
    locationFilter: null,
  },
  "fitness-influencers": {
    title: "Top Fitness & Health Influencers | WeCollab",
    description: "Discover and connect with top fitness and health influencers. View verified statistics, engagement, and collaboration pricing on WeCollab.",
    breadcrumbName: "Fitness Influencers",
    pageHeader: "Top Fitness & Health Influencers",
    pageSubheader: "Find certified personal trainers, nutritionists, and health advocates.",
    categoryFilter: "Fitness",
    platformFilter: null,
    locationFilter: null,
  },
  "gaming-creators": {
    title: "Top Gaming Creators & Streamers | WeCollab",
    description: "Discover and connect with top gaming creators and streamers. View verified statistics, engagement, and collaboration pricing on WeCollab.",
    breadcrumbName: "Gaming Creators",
    pageHeader: "Top Gaming Creators & Streamers",
    pageSubheader: "Partner with top esports players, live streamers, and video game reviewers.",
    categoryFilter: "Gaming",
    platformFilter: null,
    locationFilter: null,
  },
  "lifestyle-creators": {
    title: "Top Lifestyle & Daily Vlog Creators | WeCollab",
    description: "Discover and connect with top lifestyle and daily vlog creators. View verified statistics, engagement, and collaboration pricing on WeCollab.",
    breadcrumbName: "Lifestyle Creators",
    pageHeader: "Top Lifestyle & Daily Vlog Creators",
    pageSubheader: "Discover creators sharing daily aesthetics, home decor, and personal vlogs.",
    categoryFilter: "Lifestyle",
    platformFilter: null,
    locationFilter: null,
  },
};

function getCategoryConfig(category: string): CategoryConfig | null {
  return CATEGORY_CONFIGS[category.toLowerCase()] || null;
}

function getFallbackCreators(config: CategoryConfig) {
  return MOCK_CREATORS
    .filter((c) => {
      let match = true;
      if (config.categoryFilter) {
        match = match && c.category.toLowerCase() === config.categoryFilter.toLowerCase();
      }
      if (config.platformFilter) {
        match = match && c.platforms.some((p: any) => p.name.toLowerCase() === config.platformFilter!.toLowerCase());
      }
      if (config.locationFilter) {
        match = match && c.location.toLowerCase().includes(config.locationFilter.toLowerCase());
      }
      return match;
    })
    .map((c) => ({
      id: c.id,
      name: c.name,
      username: c.handle.replace("@", ""),
      followers: c.totalFollowers,
      category: c.category,
      profile_image: c.avatar,
      location: c.location,
      platforms: c.platforms,
      bio: c.bio,
      engagement_rate: c.engagementRate,
      avg_reel_views: c.avgReelViews,
      verification_status: "Verified",
      visibility_status: true
    }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const config = getCategoryConfig(category);
  if (!config) return {};

  const canonicalUrl = `https://www.wecollab.in/${category}`;

  return {
    title: config.title,
    description: config.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
    },
  };
}

export default async function CategoryLandingPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const config = getCategoryConfig(category);

  if (!config) {
    notFound();
  }

  const supabase = await createAdminClient();
  let creators: any[] = [];

  try {
    let query = supabase
      .from("creators")
      .select("*")
      .eq("verification_status", "Verified")
      .eq("visibility_status", true);

    if (config.categoryFilter) {
      query = query.eq("category", config.categoryFilter);
    }

    if (config.platformFilter) {
      query = query.contains("platforms", [{ name: config.platformFilter }]);
    }

    if (config.locationFilter) {
      query = query.ilike("location", `%${config.locationFilter}%`);
    }

    const { data, error } = await query
      .order("followers", { ascending: false })
      .limit(15);

    if (error) throw error;
    creators = data || [];
  } catch (e) {
    console.error("Error fetching category creators:", e);
  }

  // Fallback to mock data if empty
  if (creators.length === 0) {
    creators = getFallbackCreators(config);
    if (creators.length === 0) {
      // Safety general list fallback
      creators = MOCK_CREATORS.slice(0, 6).map((c) => ({
        id: c.id,
        name: c.name,
        username: c.handle.replace("@", ""),
        followers: c.totalFollowers,
        category: c.category,
        profile_image: c.avatar,
        location: c.location,
        platforms: c.platforms,
        bio: c.bio,
        engagement_rate: c.engagementRate,
        avg_reel_views: c.avgReelViews,
        verification_status: "Verified",
        visibility_status: true
      }));
    }
  }

  // Schema for search engines
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": config.title,
    "description": config.description,
    "numberOfItems": creators.length,
    "itemListElement": creators.map((c, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://www.wecollab.in/creator/${c.username}`,
      "name": c.name,
      "image": c.profile_image || ""
    }))
  };

  return (
    <>
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <main className="min-h-screen bg-slate-50 pt-28 pb-20 font-sans">
        <div className="mx-auto max-w-[1140px] px-6 sm:px-8">
          
          <Breadcrumbs
            items={[
              { name: "Discover Creators", item: "/discover" },
              { name: config.breadcrumbName, item: `/${category}` }
            ]}
          />

          {/* Premium Header */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              {config.pageHeader}
            </h1>
            <p className="text-slate-500 font-medium text-base sm:text-lg">
              {config.pageSubheader}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-100 bg-violet-50 text-xs font-bold text-violet-700 uppercase tracking-wide">
              <Sparkles className="h-4 w-4 text-violet-600 animate-pulse" />
              Verified Statistics & Direct Contact
            </div>
          </div>

          {/* Creators List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((c) => {
              const followersCount = c.followers_count || c.followers || 0;
              const formattedFollowers = followersCount >= 1000000 
                ? `${(followersCount / 1000000).toFixed(1)}M` 
                : followersCount >= 1000 
                ? `${(followersCount / 1000).toFixed(0)}K` 
                : followersCount;

              const creatorPlatforms = Array.isArray(c.platforms) ? c.platforms : [];

              return (
                <div key={c.username} className="bg-white border border-slate-200 hover:border-violet-300 rounded-[24px] p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between group">
                  <div>
                    {/* Header: Profile image & verification */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative h-14 w-14 rounded-full overflow-hidden border border-slate-100 bg-slate-50">
                        {c.profile_image ? (
                          <Image
                            src={c.profile_image}
                            alt={c.name}
                            fill
                            sizes="56px"
                            className="object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="h-full w-full bg-violet-600/10 flex items-center justify-center font-bold text-violet-700 text-lg">
                            {c.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-1 group-hover:text-violet-600 transition">
                          {c.name}
                          <CheckCircle className="h-4 w-4 text-emerald-500 fill-emerald-50 shrink-0" strokeWidth={2.5} />
                        </h2>
                        <p className="text-xs font-bold text-violet-600">@{c.username}</p>
                        <p className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {c.location || "India"}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-xs leading-relaxed text-slate-500 font-medium line-clamp-3 mb-4">
                      {c.bio || `Top professional creator specializing in high-engagement ${c.category?.toLowerCase() || "digital"} media.`}
                    </p>

                    {/* Platforms list */}
                    {creatorPlatforms.length > 0 && (
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {creatorPlatforms.map((p: any, idx: number) => {
                          const isInstagram = p.name === "Instagram";
                          const isYouTube = p.name === "YouTube";
                          return (
                            <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-600 border border-slate-100">
                              {isInstagram ? <FaInstagram className="h-3 w-3 text-pink-500" /> : isYouTube ? <FaYoutube className="h-3 w-3 text-red-500" /> : <FaLinkedin className="h-3 w-3 text-blue-600" />}
                              {p.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50/60 rounded-xl p-3 border border-slate-100 text-center mb-5">
                      <div>
                        <p className="text-xs font-black text-slate-800">{formattedFollowers}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Reach</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-600">{c.engagement_rate || "3.5"}%</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Eng. Rate</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-violet-600 flex items-center justify-center gap-0.5">
                          <Flame className="h-3 w-3 shrink-0" />
                          {parseInt(c.avg_reel_views) >= 1000 
                            ? `${(parseInt(c.avg_reel_views) / 1000).toFixed(0)}K` 
                            : c.avg_reel_views || "5K"}
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Views</p>
                      </div>
                    </div>

                    {/* CTA Link */}
                    <Link
                      href={`/creator/${c.username}`}
                      className="w-full min-h-[2.5rem] inline-flex items-center justify-center rounded-xl bg-slate-900 group-hover:bg-violet-600 text-white font-bold text-xs shadow-sm hover:shadow transition-colors duration-300"
                    >
                      View Profile Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <InternalLinks
            type="category"
            currentCategory={config.categoryFilter || undefined}
            currentPlatform={config.platformFilter || undefined}
          />

        </div>
      </main>

      <Footer />
    </>
  );
}
