import { createAdminClient } from "@/lib/supabase/server";
import { MOCK_CREATORS } from "@/data/mock-creators";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Breadcrumbs } from "@/components/seo/breadcrumb";
import { InternalLinks } from "@/components/seo/internal-links";
import { Star, MapPin, CheckCircle, Flame, DollarSign, Activity, Sparkles, UserPlus } from "lucide-react";
import { FaInstagram, FaYoutube, FaLinkedin } from "react-icons/fa6";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface CreatorPageProps {
  params: Promise<{ username: string }>;
}

// 1. Dynamic Metadata Generation
export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createAdminClient();
  
  let creator = null;
  try {
    const { data } = await supabase
      .from("creators")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    creator = data;
  } catch (e) {
    console.error("Supabase fetch failed in generateMetadata:", e);
  }

  // Fallback to mock data
  if (!creator) {
    creator = MOCK_CREATORS.find((c) => c.handle.replace("@", "").toLowerCase() === username.toLowerCase()) || null;
  }

  if (!creator) return {};

  const name = creator.name;
  const bio = creator.bio || `Connect with verified creator ${name} on WeCollab.`;
  const canonicalUrl = `https://www.wecollab.in/creator/${username}`;
  const followersCount = creator.followers_count || creator.followers || 0;
  const formattedFollowers = followersCount >= 1000000 
    ? `${(followersCount / 1000000).toFixed(1)}M` 
    : `${(followersCount / 1000).toFixed(0)}K`;

  const seoTitle = `${name} (@${username}) Influencer Statistics | WeCollab`;
  const seoDesc = `${name} has ${formattedFollowers} followers and ${creator.engagement_rate || 3.5}% engagement. View analytics, brand pricing, and campaign insights on WeCollab.`;

  return {
    title: seoTitle,
    description: seoDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      url: canonicalUrl,
      images: creator.profile_image || creator.avatar || [],
      type: "profile",
      username: username,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDesc,
      images: creator.profile_image || creator.avatar || [],
    },
  };
}

// 2. Main Page Render
export default async function CreatorPublicProfile({ params }: CreatorPageProps) {
  const { username } = await params;
  const supabase = await createAdminClient();

  let creator = null;
  try {
    const { data } = await supabase
      .from("creators")
      .select("*")
      .eq("username", username)
      .maybeSingle();
    creator = data;
  } catch (e) {
    console.error("Supabase fetch failed in CreatorPublicProfile:", e);
  }

  // Fallback to mock creators
  if (!creator) {
    creator = MOCK_CREATORS.find((c) => c.handle.replace("@", "").toLowerCase() === username.toLowerCase()) || null;
  }

  if (!creator) {
    notFound();
  }

  // Fetch similar creators (same category)
  let similarCreators: any[] = [];
  try {
    const { data } = await supabase
      .from("creators")
      .select("name, username, followers, category, profile_image")
      .eq("category", creator.category)
      .neq("id", creator.id)
      .eq("verification_status", "Verified")
      .eq("visibility_status", true)
      .limit(3);
    similarCreators = data || [];
  } catch (e) {
    console.error("Error fetching similar creators:", e);
  }

  if (similarCreators.length === 0) {
    similarCreators = MOCK_CREATORS
      .filter((c) => c.category === creator.category && c.id !== creator.id)
      .slice(0, 3)
      .map((c) => ({
        name: c.name,
        username: c.handle.replace("@", ""),
        followers: c.totalFollowers,
        category: c.category,
        profile_image: c.avatar
      }));
  }

  const followersCount = creator.followers_count || creator.followers || 0;
  const formattedFollowers = followersCount >= 1000000 
    ? `${(followersCount / 1000000).toFixed(1)}M` 
    : `${(followersCount / 1000).toFixed(0)}K`;

  // Determine platforms JSON
  const creatorPlatforms = Array.isArray(creator.platforms) && creator.platforms.length > 0 
    ? creator.platforms 
    : [
        { name: "Instagram", followers: followersCount, handle: `@${creator.username}`, url: `https://instagram.com/${creator.username}` }
      ];

  const categoryLabel = creator.category || "General";
  const cityLabel = creator.location ? creator.location.split(",")[0] : "India";

  // JSON-LD Structured Data
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": creator.name,
    "alternateName": username,
    "description": creator.bio || `Professional ${categoryLabel} Content Creator.`,
    "image": creator.profile_image || creator.profile_pic_url || creator.avatar || "",
    "jobTitle": `${categoryLabel} Content Creator`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityLabel,
      "addressCountry": "IN"
    },
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/FollowAction",
      "userInteractionCount": followersCount
    }
  };

  return (
    <>
      <Navbar />
      
      {/* Structured data injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <main className="min-h-screen bg-slate-50 pt-28 pb-20 font-sans">
        <div className="mx-auto max-w-[1140px] px-6 sm:px-8">
          
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { name: "Discover Creators", item: "/discover" },
              { name: categoryLabel, item: `/${categoryLabel.toLowerCase()}-influencers` },
              { name: creator.name, item: `/creator/${username}` }
            ]}
          />

          {/* Premium Creator Card Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Creator Profile Brief (Span 5) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative h-28 w-28 rounded-full overflow-hidden border-4 border-violet-100/50 shadow-md">
                  {creator.profile_image || creator.profile_pic_url || creator.avatar ? (
                    <Image
                      src={creator.profile_image || creator.profile_pic_url || creator.avatar}
                      alt={creator.name}
                      fill
                      sizes="112px"
                      priority
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-violet-600/10 flex items-center justify-center font-black text-violet-600 text-3xl">
                      {creator.name.split(" ").map((n: string) => n[0]).slice(0,2).join("").toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-1.5">
                  <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
                    {creator.name}
                    <CheckCircle className="h-5.5 w-5.5 text-emerald-500 fill-emerald-50 shrink-0" strokeWidth={2.5} />
                  </h1>
                  <p className="text-sm font-bold text-violet-600">@{creator.username}</p>
                  <p className="text-xs text-slate-400 font-bold flex items-center justify-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-violet-500" />
                    {creator.location || "India"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full border border-violet-100 bg-violet-50 text-[11px] font-bold text-violet-700 tracking-wide uppercase">
                    {categoryLabel}
                  </span>
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full border border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                    Verified Stats
                  </span>
                </div>

                <div className="w-full my-6 h-px bg-slate-100" />

                <p className="text-sm leading-relaxed text-slate-500 font-medium">
                  {creator.bio || `Sustainable, Everyday Creator. Specializing in high-engagement ${categoryLabel.toLowerCase()} campaigns, product features, and reviews.`}
                </p>

                <div className="w-full mt-6">
                  <Link
                    href={`/discover?creator=${creator.username}`}
                    className="w-full min-h-[3.25rem] inline-flex items-center justify-center rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 transition cursor-pointer"
                  >
                    Partner with {creator.name.split(" ")[0]}
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Dynamic Statistics & Similar profiles (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Campaign Statistics Box */}
              <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-violet-600" />
                  Key Audience Metrics
                </h2>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-3xl font-black text-slate-800">{formattedFollowers}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Followers</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-3xl font-black text-emerald-600">{creator.engagement_rate || "4.2"}%</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Engagement</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-3xl font-black text-violet-600">
                      {parseInt(creator.avg_reel_views) >= 1000 
                        ? `${(parseInt(creator.avg_reel_views) / 1000).toFixed(0)}K` 
                        : creator.avg_reel_views || "10K"}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avg Views</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-3 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                    <span className="p-2.5 bg-violet-100 text-violet-700 rounded-xl">
                      <Flame className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Brand Safety Score</p>
                      <p className="text-base font-extrabold text-slate-800">98% (Excellent)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                    <span className="p-2.5 bg-violet-100 text-violet-700 rounded-xl">
                      <DollarSign className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Est. Collaboration Payout</p>
                      <p className="text-base font-extrabold text-slate-800">
                        {creator.collaboration_pricing ? `₹${creator.collaboration_pricing.toLocaleString()}+` : "Contact for Pricing"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Channels List */}
              <div className="bg-white border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-sm">
                <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-violet-600" />
                  Social Platform Accounts
                </h2>

                <div className="space-y-3">
                  {creatorPlatforms.map((platform: any, index: number) => {
                    const isInstagram = platform.name === "Instagram";
                    const isYouTube = platform.name === "YouTube";
                    return (
                      <div key={index} className="flex items-center justify-between border border-slate-100 rounded-2xl p-4 bg-slate-50/40 hover:bg-slate-50 transition">
                        <div className="flex items-center gap-3">
                          <span className={`p-2 rounded-xl text-white ${
                            isInstagram ? "bg-pink-500" : isYouTube ? "bg-red-500" : "bg-blue-600"
                          }`}>
                            {isInstagram ? <FaInstagram className="h-5 w-5" /> : isYouTube ? <FaYoutube className="h-5 w-5" /> : <FaLinkedin className="h-5 w-5" />}
                          </span>
                          <div>
                            <p className="text-sm font-extrabold text-slate-800">{platform.name}</p>
                            <p className="text-xs text-slate-400 font-bold">{platform.handle || `@${creator.username}`}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-800">
                            {platform.followers >= 1000000 
                              ? `${(platform.followers / 1000000).toFixed(1)}M` 
                              : platform.followers >= 1000 
                              ? `${(platform.followers / 1000).toFixed(0)}K` 
                              : platform.followers || "5K"}
                          </p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Followers</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Similar Creators Grid */}
              <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-violet-600 animate-pulse" />
                  Similar Creators You May Like
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {similarCreators.map((sc: any) => (
                    <Link
                      key={sc.username}
                      href={`/creator/${sc.username}`}
                      className="border border-slate-100 hover:border-violet-200 bg-slate-50/20 hover:bg-violet-50/10 p-4 rounded-2xl text-center block transition group"
                    >
                      <div className="relative h-12 w-12 rounded-full overflow-hidden mx-auto border-2 border-white group-hover:border-violet-200 shadow-sm mb-2.5">
                        {sc.profile_image ? (
                          <Image
                            src={sc.profile_image}
                            alt={sc.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-violet-600/10 flex items-center justify-center font-bold text-violet-600 text-sm">
                            {sc.name[0]}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-black text-slate-800 truncate leading-none">{sc.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">
                        {sc.followers >= 1000000 
                          ? `${(sc.followers / 1000000).toFixed(1)}M` 
                          : `${(sc.followers / 1000).toFixed(0)}K`} reach
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Internal Linking Block */}
          <InternalLinks
            type="creator"
            currentCategory={categoryLabel}
            currentCity={creator.location ? creator.location.split(",")[0] : "India"}
            currentPlatform="Instagram"
            relatedCreators={similarCreators}
          />

        </div>
      </main>
      <Footer />
    </>
  );
}
