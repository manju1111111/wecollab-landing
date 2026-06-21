"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Mail, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  Loader2,
  ChevronDown,
  Send,
  SlidersHorizontal
} from "lucide-react";
import { subscribeAction } from "@/app/admin/newsletter/actions";

interface Newsletter {
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
  published_at?: string | null;
  created_at: string;
}

interface NewsletterArchiveProps {
  initialNewsletters: Newsletter[];
}

export function NewsletterArchive({ initialNewsletters }: NewsletterArchiveProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedTag, setSelectedTag] = useState("All Tags");
  const [selectedAuthor, setSelectedAuthor] = useState("All Authors");
  const [sortBy, setSortBy] = useState("Newest First");

  // Bottom subscribe states
  const [bottomEmail, setBottomEmail] = useState("");
  const [submittingBottom, setSubmittingBottom] = useState(false);
  const [subscribedBottom, setSubscribedBottom] = useState(false);
  const [bottomError, setBottomError] = useState("");

  const handleSubscribeBottom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bottomEmail) return;

    setSubmittingBottom(true);
    setBottomError("");

    try {
      const res = await subscribeAction(bottomEmail);
      if (res.success) {
        setSubscribedBottom(true);
        setBottomEmail("");
      } else {
        setBottomError(res.error || "Failed to subscribe. Please try again.");
      }
    } catch (err) {
      setBottomError("An unexpected error occurred.");
    } finally {
      setSubmittingBottom(false);
    }
  };

  // Derive filter options dynamically from input data
  const categories = ["All Categories", ...Array.from(new Set(initialNewsletters.map(n => n.category)))];
  
  const tags = ["All Tags"];
  initialNewsletters.forEach(n => {
    if (n.tags) {
      n.tags.forEach(t => {
        if (!tags.includes(t)) tags.push(t);
      });
    }
  });

  const authors = ["All Authors", ...Array.from(new Set(initialNewsletters.map(n => n.author_name).filter(Boolean)))] as string[];

  // Filtering logic
  let filtered = initialNewsletters.filter((post) => {
    const matchesCategory = selectedCategory === "All Categories" || post.category === selectedCategory;
    const matchesTag = selectedTag === "All Tags" || (post.tags && post.tags.includes(selectedTag));
    const matchesAuthor = selectedAuthor === "All Authors" || post.author_name === selectedAuthor;
    const matchesSearch = 
      post.title.toLowerCase().includes(search.toLowerCase()) || 
      post.summary.toLowerCase().includes(search.toLowerCase());
    
    return matchesCategory && matchesTag && matchesAuthor && matchesSearch;
  });

  // Sorting logic
  filtered = [...filtered].sort((a, b) => {
    const timeA = a.published_at ? new Date(a.published_at).getTime() : new Date(a.created_at).getTime();
    const timeB = b.published_at ? new Date(b.published_at).getTime() : new Date(b.created_at).getTime();
    
    return sortBy === "Newest First" ? timeB - timeA : timeA - timeB;
  });

  const getReadingTime = (text: string) => {
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.ceil(words / 225);
    return `${minutes} min read`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Draft";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Custom premium graphic renderer for specific posts to match mockup reference exactly
  const renderCardGraphic = (title: string) => {
    if (title.toLowerCase().includes("micro-communities")) {
      return (
        <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="grad1" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#312E81" />
            </radialGradient>
          </defs>
          <rect width="200" height="120" fill="url(#grad1)" />
          {/* Nodes connections */}
          <line x1="100" y1="60" x2="50" y2="40" stroke="#C084FC" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="100" y1="60" x2="60" y2="90" stroke="#C084FC" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="100" y1="60" x2="140" y2="40" stroke="#C084FC" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="100" y1="60" x2="150" y2="90" stroke="#C084FC" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="50" y1="40" x2="60" y2="90" stroke="#C084FC" strokeWidth="0.5" />
          <line x1="140" y1="40" x2="150" y2="90" stroke="#C084FC" strokeWidth="0.5" />
          {/* Avatar bubbles */}
          <circle cx="100" cy="60" r="16" fill="#7C3AED" stroke="#F5F3FF" strokeWidth="2" />
          <circle cx="50" cy="40" r="11" fill="#7C3AED" stroke="#E9D5FF" strokeWidth="1.5" />
          <circle cx="60" cy="90" r="10" fill="#7C3AED" stroke="#E9D5FF" strokeWidth="1.5" />
          <circle cx="140" cy="40" r="12" fill="#7C3AED" stroke="#E9D5FF" strokeWidth="1.5" />
          <circle cx="150" cy="90" r="11" fill="#7C3AED" stroke="#E9D5FF" strokeWidth="1.5" />
          
          {/* Glowing particle circles */}
          <circle cx="100" cy="30" r="3" fill="#A78BFA" />
          <circle cx="160" cy="65" r="2" fill="#A78BFA" />
          <circle cx="40" cy="70" r="3" fill="#A78BFA" />
          
          {/* Icons inside circles */}
          <path d="M97 56c0-1.7 1.3-3 3-3s3 1.3 3 3v2h-6v-2zM94 65c0-3.3 2.7-6 6-6s6 2.7 6 6v1H94v-1z" fill="#F5F3FF" />
          <path d="M48 37c0-1.1.9-2 2-2s2 .9 2 2v1h-4v-1zM46 43.5c0-2.2 1.8-4 4-4s4 1.8 4 4v.5h-8v-.5z" fill="#F3E8FF" className="opacity-80" />
          <path d="M138 37c0-1.1.9-2 2-2s2 .9 2 2v1h-4v-1zM136 43.5c0-2.2 1.8-4 4-4s4 1.8 4 4v.5h-8v-.5z" fill="#F3E8FF" className="opacity-80" />
        </svg>
      );
    }
    if (title.toLowerCase().includes("reels search seo") || title.toLowerCase().includes("tiktok vs. reels")) {
      return (
        <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="grad2" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1E1B4B" />
              <stop offset="100%" stopColor="#0F172A" />
            </radialGradient>
          </defs>
          <rect width="200" height="120" fill="url(#grad2)" />
          {/* Divider line */}
          <line x1="100" y1="0" x2="100" y2="120" stroke="#334155" strokeWidth="1" />
          
          {/* TikTok representation (Left) */}
          <g transform="translate(45, 40)">
            <circle cx="15" cy="15" r="22" fill="#000000" stroke="#00F2FE" strokeWidth="1.5" />
            {/* TikTok D note icon */}
            <path d="M17 6v14a4 4 0 11-4-4c1.2 0 2.2.7 2.7 1.7V4h4a3 3 0 003-3h-3a3 3 0 01-3 3h-2.7z" fill="#FFFFFF" />
            <path d="M16.5 6.5v14a4 4 0 11-4-4c1.2 0 2.2.7 2.7 1.7V4.5h4a3 3 0 003-3h-3a3 3 0 01-3 3h-2.7z" fill="#FF007F" className="opacity-60" />
          </g>

          {/* Reels representation (Right) */}
          <g transform="translate(115, 40)">
            <circle cx="15" cy="15" r="22" fill="url(#reelsGrad)" stroke="#FF007F" strokeWidth="1.5" />
            <defs>
              <linearGradient id="reelsGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FED7AA" />
                <stop offset="50%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#D946EF" />
              </linearGradient>
            </defs>
            {/* Reels clapper logo */}
            <rect x="7" y="7" width="16" height="16" rx="3" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <path d="M7 12h16M12 7l-2 5M18 7l-2 5M12 12v11M15 15l4 2.5-4 2.5v-5z" fill="#FFFFFF" />
          </g>

          {/* VS Center Badge */}
          <circle cx="100" cy="60" r="12" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          <text x="100" y="64" fill="#94A3B8" fontSize="10" fontWeight="bold" textAnchor="middle">vs</text>
        </svg>
      );
    }
    if (title.toLowerCase().includes("contracts") || title.toLowerCase().includes("negotiating")) {
      return (
        <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="grad3" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#065F46" />
              <stop offset="100%" stopColor="#022C22" />
            </radialGradient>
          </defs>
          <rect width="200" height="120" fill="url(#grad3)" />
          {/* Contract sheet tilted */}
          <g transform="translate(65, 20) rotate(-5)">
            <rect width="70" height="85" rx="4" fill="#FFFFFF" />
            {/* Lines representing contract text */}
            <text x="8" y="16" fill="#047857" fontSize="8" fontWeight="bold">CONTRACT</text>
            <line x1="8" y1="26" x2="62" y2="26" stroke="#94A3B8" strokeWidth="1.5" />
            <line x1="8" y1="34" x2="62" y2="34" stroke="#E2E8F0" strokeWidth="1.5" />
            <line x1="8" y1="42" x2="50" y2="42" stroke="#E2E8F0" strokeWidth="1.5" />
            <line x1="8" y1="50" x2="62" y2="50" stroke="#E2E8F0" strokeWidth="1.5" />
            <line x1="8" y1="58" x2="40" y2="58" stroke="#E2E8F0" strokeWidth="1.5" />
            <line x1="8" y1="68" x2="30" y2="68" stroke="#F1F5F9" strokeWidth="3" />
            <line x1="38" y1="68" x2="60" y2="68" stroke="#F1F5F9" strokeWidth="3" />
          </g>
          {/* Fountain pen drawing */}
          <path d="M140 30l-15 45-4 4 1-5 18-44z" fill="#F59E0B" />
          <path d="M125 75l-4 4 1-5 3 1z" fill="#000000" />
        </svg>
      );
    }
    if (title.toLowerCase().includes("sponsorship") || title.toLowerCase().includes("trends")) {
      return (
        <svg className="w-full h-full" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EA580C" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#BE123C" />
            </linearGradient>
          </defs>
          <rect width="200" height="120" fill="url(#grad4)" />
          {/* Rising Chart Bars */}
          <rect x="35" y="85" width="18" height="15" fill="#FFFFFF" fillOpacity="0.15" rx="2" />
          <rect x="65" y="70" width="18" height="30" fill="#FFFFFF" fillOpacity="0.25" rx="2" />
          <rect x="95" y="50" width="18" height="50" fill="#FFFFFF" fillOpacity="0.4" rx="2" />
          <rect x="125" y="35" width="18" height="65" fill="#FFFFFF" fillOpacity="0.6" rx="2" />
          <rect x="155" y="20" width="18" height="80" fill="#FFFFFF" fillOpacity="0.9" rx="2" />
          
          {/* Glowing arrow trend line */}
          <path d="M44 80L74 65L104 45L134 30L164 15" stroke="#F5F3FF" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M156 15h9v9" stroke="#F5F3FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600 p-6 text-white text-center text-sm font-bold">
        {title}
      </div>
    );
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Creator Economy": return "bg-violet-600 text-white";
      case "Platform Insights": return "bg-blue-600 text-white";
      case "Business": return "bg-emerald-600 text-white";
      case "Industry Trends": return "bg-amber-600 text-white";
      default: return "bg-slate-600 text-white";
    }
  };

  return (
    <div className="space-y-12">
      
      {/* Redesigned Filter row */}
      <div className="bg-white/75 border border-slate-100 p-3 rounded-2xl flex flex-wrap lg:flex-nowrap items-center gap-3 w-full shadow-sm backdrop-blur-md">
        
        {/* Search Input */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search newsletters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20 text-slate-800 font-medium transition"
          />
        </div>

        {/* Categories Dropdown */}
        <div className="relative shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold bg-white text-slate-700 outline-none cursor-pointer focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 min-w-[150px]"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Tags Dropdown */}
        <div className="relative shrink-0">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="appearance-none border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold bg-white text-slate-700 outline-none cursor-pointer focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 min-w-[130px]"
          >
            {tags.map(t => (
              <option key={t} value={t}>{t === "All Tags" ? "All Tags" : `#${t}`}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Authors Dropdown */}
        <div className="relative shrink-0">
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="appearance-none border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold bg-white text-slate-700 outline-none cursor-pointer focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 min-w-[140px]"
          >
            {authors.map(auth => (
              <option key={auth} value={auth}>{auth}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Sorting Dropdown */}
        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none border border-slate-200 rounded-xl pl-4 pr-10 py-3 text-sm font-semibold bg-white text-slate-700 outline-none cursor-pointer focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 min-w-[140px]"
          >
            <option value="Newest First">Newest First</option>
            <option value="Oldest First">Oldest First</option>
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

      </div>

      {/* Redesigned Cards Grid (4 columns desktop) */}
      {filtered.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-violet-200 bg-white/40 p-16 text-center backdrop-blur-sm">
          <Mail className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-xl font-bold text-slate-900">No newsletters found</h3>
          <p className="mt-2 text-slate-500 max-w-md mx-auto">We couldn't find any issues matching your filter criteria. Try adjusting the search text or reset the dropdowns.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((post) => (
            <article
              key={post.id}
              className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-violet-200/15"
            >
              {/* Graphic Card Cover */}
              <Link href={`/newsletter/${post.id}`} className="relative block h-40 overflow-hidden shrink-0">
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                ) : (
                  renderCardGraphic(post.title)
                )}
                
                {/* Category Pill (top-left) */}
                <span className={`absolute top-4.5 left-4.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${getCategoryBadgeClass(post.category)}`}>
                  {post.category}
                </span>

                {/* Read Time (top-right) */}
                <span className="absolute top-4.5 right-4.5 rounded-full bg-black/40 text-white text-[10px] font-bold py-1 px-2.5 flex items-center gap-1 backdrop-blur-sm">
                  <Clock className="h-3 w-3" />
                  {getReadingTime(post.content)}
                </span>
              </Link>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-[1.05rem] font-bold text-slate-900 leading-snug group-hover:text-violet-600 transition-colors line-clamp-2">
                  <Link href={`/newsletter/${post.id}`}>{post.title}</Link>
                </h3>
                
                <p className="mt-2 text-[0.875rem] leading-relaxed text-slate-500 line-clamp-2 flex-1">
                  {post.summary}
                </p>
                
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-violet-100 border border-violet-200 overflow-hidden flex items-center justify-center font-bold text-[10px] text-violet-700">
                      {post.author_avatar ? (
                        <img src={post.author_avatar} alt="Author" className="h-full w-full object-cover" />
                      ) : (
                        "W"
                      )}
                    </div>
                    <span className="text-[12px] font-extrabold text-slate-800">{post.author_name || "WeCollab Team"}</span>
                  </div>
                  
                  <span className="text-[12px] font-bold text-slate-400">
                    {formatDate(post.published_at || post.created_at)}
                  </span>
                </div>
              </div>

            </article>
          ))}
        </div>
      )}

      {/* Redesigned Bottom banner call-to-action */}
      <div className="bg-violet-50/40 border border-violet-100/50 rounded-3xl md:rounded-full p-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm mt-16 max-w-5xl mx-auto">
        <div className="flex items-center gap-4 text-left px-2">
          <div className="h-11 w-11 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <Send className="h-5 w-5 transform rotate-45" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 text-base">Never miss an insight</h4>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Subscribe now and get the best of creator economy delivered weekly.</p>
          </div>
        </div>

        <form onSubmit={handleSubscribeBottom} className="flex items-center gap-2 w-full md:w-auto shrink-0 md:pr-1">
          <div className="relative flex-1 md:w-64">
            <input
              type="email"
              required
              disabled={submittingBottom || subscribedBottom}
              value={bottomEmail}
              onChange={(e) => setBottomEmail(e.target.value)}
              placeholder={subscribedBottom ? "Subscribed!" : "Enter your email address"}
              className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 px-4 text-xs font-semibold outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/10 text-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={submittingBottom || subscribedBottom || !bottomEmail}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold transition disabled:bg-slate-300 shadow-sm"
          >
            {submittingBottom ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : subscribedBottom ? (
              "Subscribed"
            ) : (
              "Subscribe"
            )}
          </button>
        </form>
      </div>

    </div>
  );
}
