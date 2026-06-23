import React from "react";
import Link from "next/link";
import { Link2, Sparkles, MapPin, Tag, Smartphone } from "lucide-react";

interface InternalLinksProps {
  type: "creator" | "category" | "city" | "blog";
  currentCategory?: string;
  currentCity?: string;
  currentPlatform?: string;
  relatedCreators?: { name: string; username: string }[];
}

export function InternalLinks({
  type,
  currentCategory,
  currentCity,
  currentPlatform,
  relatedCreators = [],
}: InternalLinksProps) {
  
  const popularCategories = [
    { name: "Food Influencers", href: "/food-influencers" },
    { name: "Tech Influencers", href: "/tech-influencers" },
    { name: "Fashion Influencers", href: "/fashion-influencers" },
    { name: "Travel Influencers", href: "/travel-influencers" },
    { name: "Finance Creators", href: "/finance-creators" },
    { name: "Fitness Influencers", href: "/fitness-influencers" },
    { name: "Gaming Creators", href: "/gaming-creators" },
    { name: "Lifestyle Creators", href: "/lifestyle-creators" },
  ];

  const targetCities = [
    { name: "Influencers in Bangalore", href: "/influencers/bangalore" },
    { name: "Influencers in Mumbai", href: "/influencers/mumbai" },
    { name: "Influencers in Delhi", href: "/influencers/delhi" },
    { name: "Influencers in Hyderabad", href: "/influencers/hyderabad" },
    { name: "Influencers in Chennai", href: "/influencers/chennai" },
  ];

  const platforms = [
    { name: "Instagram Influencers (India)", href: "/instagram-influencers-india" },
    { name: "YouTube Influencers (India)", href: "/youtube-influencers-india" },
    { name: "LinkedIn Creators (India)", href: "/linkedin-creators-india" },
  ];

  return (
    <div className="mt-16 pt-10 border-t border-slate-200/90 font-sans">
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-violet-600 animate-pulse" />
        Explore Influencers & Content Creators
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Section 1: Dynamic / Contextual Section */}
        {type === "creator" && relatedCreators.length > 0 && (
          <div className="bg-slate-50/60 rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h4 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Link2 className="h-4 w-4 text-violet-500" />
              Similar Creators
            </h4>
            <ul className="space-y-2.5">
              {relatedCreators.slice(0, 5).map((creator) => (
                <li key={creator.username}>
                  <Link
                    href={`/creator/${creator.username}`}
                    className="text-sm font-semibold text-slate-600 hover:text-violet-600 transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full shrink-0" />
                    {creator.name} (@{creator.username})
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(type === "category" || type === "city" || type === "blog" || relatedCreators.length === 0) && (
          <div className="bg-slate-50/60 rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h4 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-violet-500" />
              Popular Niches
            </h4>
            <ul className="space-y-2.5">
              {popularCategories
                .filter((cat) => cat.name.toLowerCase() !== currentCategory?.toLowerCase())
                .slice(0, 5)
                .map((cat) => (
                  <li key={cat.href}>
                    <Link
                      href={cat.href}
                      className="text-sm font-semibold text-slate-600 hover:text-violet-600 transition flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full shrink-0" />
                      {cat.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Section 2: City Links */}
        <div className="bg-slate-50/60 rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-violet-500" />
            Top Locations
          </h4>
          <ul className="space-y-2.5">
            {targetCities
              .filter((city) => !city.href.includes(currentCity || ""))
              .slice(0, 5)
              .map((city) => (
                <li key={city.href}>
                  <Link
                    href={city.href}
                    className="text-sm font-semibold text-slate-600 hover:text-violet-600 transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full shrink-0" />
                    {city.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        {/* Section 3: Platform Links */}
        <div className="bg-slate-50/60 rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h4 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Smartphone className="h-4 w-4 text-violet-500" />
            Social Platforms
          </h4>
          <ul className="space-y-2.5">
            {platforms
              .filter((p) => !p.href.includes(currentPlatform || ""))
              .slice(0, 5)
              .map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="text-sm font-semibold text-slate-600 hover:text-violet-600 transition flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full shrink-0" />
                    {p.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
