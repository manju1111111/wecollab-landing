"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Link2, 
  CheckCircle, 
  Mail, 
  Loader2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Sparkles
} from "lucide-react";
import { subscribeAction } from "@/app/admin/newsletter/actions";

const Twitter = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

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

interface NewsletterDetailClientProps {
  post: Newsletter;
  prevPost?: Newsletter | null;
  nextPost?: Newsletter | null;
  relatedPosts?: Newsletter[];
  latestPosts?: Newsletter[];
}

// Extract raw text from React elements to create clean URL IDs
function getRawText(children: any): string {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(getRawText).join('');
  if (children && children.props && children.props.children) return getRawText(children.props.children);
  return '';
}

// Generate table of contents items dynamically
function getHeadings(markdown: string) {
  if (!markdown) return [];
  const lines = markdown.split("\n");
  const headings: { text: string; id: string; level: number }[] = [];
  
  lines.forEach((line) => {
    const match = line.match(/^(##|###) (.*)$/);
    if (match) {
      const level = match[1].length; // 2 or 3
      const text = match[2].trim().replace(/\*\*|\*|`/g, "");
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      headings.push({ text, id, level });
    }
  });
  
  return headings;
}

export function NewsletterDetailClient({ 
  post, 
  prevPost, 
  nextPost, 
  relatedPosts = [], 
  latestPosts = [] 
}: NewsletterDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [activeId, setActiveId] = useState("");

  const headings = getHeadings(post.content);

  // Track scrolling to update progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
      if (window.scrollY < 150) {
        setActiveId("");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Monitor intersection of headings to highlight active item in TOC
  useEffect(() => {
    if (headings.length === 0) return;
    
    const headingElements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const visibleEntries = entries.filter((entry) => entry.isIntersecting);
      if (visibleEntries.length > 0) {
        // Sort by closest to top viewport margin
        const sorted = visibleEntries.sort((a, b) => Math.abs(a.boundingClientRect.top - 120) - Math.abs(b.boundingClientRect.top - 120));
        setActiveId(sorted[0].target.id);
      }
    };

    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "-100px 0px -75% 0px",
      threshold: 0.1,
    });

    headingElements.forEach((el) => observer.observe(el));
    return () => {
      headingElements.forEach((el) => observer.unobserve(el));
    };
  }, [headings, post.content]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await subscribeAction(email);
      if (res.success) {
        setSubscribed(true);
        setEmail("");
      } else {
        setErrorMessage(res.error || "Failed to subscribe. Please try again.");
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getReadingTime = (text: string) => {
    const words = text ? text.split(/\s+/).length : 0;
    const minutes = Math.ceil(words / 225);
    return `${minutes} min read`;
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Draft";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 120; // top offset to account for navbar/progress bar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      
      window.history.pushState(null, "", `#${id}`);
      setActiveId(id);
    }
  };

  const shareOnTwitter = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(`Check out this article: "${post.title}"`);
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank");
    }
  };

  const shareOnLinkedin = () => {
    if (typeof window !== "undefined") {
      const url = encodeURIComponent(window.location.href);
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
    }
  };

  return (
    <div className="relative">
      
      {/* 7. Reading Progress Bar (Gradient from purple to blue) */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-100/50 dark:bg-slate-900/30 z-50">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-100" 
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <Link
          href="/newsletter"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to briefings
        </Link>
        <Link
          href="/admin/newsletter"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-800/40 rounded-xl text-xs font-bold transition shadow-xs"
        >
          Back to Admin Dashboard
        </Link>
      </div>

      {/* 4. Hero Section Redesign (Spacious py-16 layout, Category, Title, Meta, Cover) */}
      <header className="py-16 text-center max-w-4xl mx-auto space-y-6">
        <span className="inline-flex items-center rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-purple-750 dark:text-purple-400">
          {post.category}
        </span>
        
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15] max-w-4xl mx-auto">
          {post.title}
        </h1>
        
        <div className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-500 pt-2">
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950/40 flex items-center justify-center font-bold text-purple-750 dark:text-purple-400 text-xs border border-purple-200/50 dark:border-purple-900/50 overflow-hidden">
            {post.author_avatar ? (
              <img src={post.author_avatar} alt={post.author_name || "Author"} className="h-full w-full object-cover" />
            ) : (
              (post.author_name || "W").substring(0, 1)
            )}
          </div>
          <div className="text-left leading-tight">
            <div className="text-slate-900 dark:text-white font-extrabold">{post.author_name || "WeCollab Team"}</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider mt-0.5">
              <span>{formatDate(post.published_at)}</span>
              <span>•</span>
              <span>{getReadingTime(post.content)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Cover Image */}
      {post.cover_image && (
        <div className="mb-16 overflow-hidden rounded-3xl shadow-md border border-slate-100 dark:border-slate-850 max-h-[500px] w-full">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover max-h-[500px]" />
        </div>
      )}

      {/* 2. Page Layout: [Share Rail] [Article Content] [Sticky Sidebar] */}
      <div className="grid grid-cols-1 lg:grid-cols-[80px_minmax(0,1fr)_340px] gap-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        
        {/* 1. Share Rail (Desktop Sticky Left Column, Hidden on Mobile) */}
        <aside className="hidden lg:flex flex-col gap-4 sticky top-32 h-fit items-center z-10">
          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-slate-800/50 p-3.5 rounded-full shadow-sm backdrop-blur-md flex flex-col gap-4 items-center">
            <button 
              onClick={handleCopyLink} 
              title="Copy Link" 
              className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-full transition-all hover:scale-110 active:scale-95 duration-200 cursor-pointer"
            >
              {copied ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500" /> : <Link2 className="h-4.5 w-4.5" />}
            </button>
            <button 
              onClick={shareOnTwitter} 
              title="Share on X" 
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-850 rounded-full transition-all hover:scale-110 active:scale-95 duration-200 cursor-pointer"
            >
              <Twitter className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={shareOnLinkedin} 
              title="Share on LinkedIn" 
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-full transition-all hover:scale-110 active:scale-95 duration-200 cursor-pointer"
            >
              <Linkedin className="h-4.5 w-4.5" />
            </button>
            <a 
              href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent("Check out this article: " + (typeof window !== "undefined" ? window.location.href : ""))}`} 
              title="Share via Email" 
              className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-full transition-all hover:scale-110 active:scale-95 duration-200"
            >
              <Mail className="h-4.5 w-4.5" />
            </a>
          </div>
        </aside>

        {/* 6. CENTER COLUMN: Article Body (Max-width 780px, Prose styled) */}
        <div className="min-w-0 max-w-[780px] w-full mx-auto">
          
          {/* Mobile TOC Accordion */}
          {headings.length > 0 && (
            <div className="lg:hidden bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-850 rounded-3xl p-4 mb-8">
              <button 
                onClick={() => setTocOpen(!tocOpen)} 
                className="w-full flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-350 cursor-pointer"
              >
                <span>Table of Contents</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${tocOpen ? 'rotate-180' : ''}`} />
              </button>
              {tocOpen && (
                <ul className="mt-3 pl-3.5 space-y-2.5 border-l-2 border-purple-200 dark:border-purple-850">
                  {headings.map((h, hIdx) => (
                    <li key={hIdx} className={h.level === 3 ? "pl-4" : ""}>
                      <a 
                        href={`#${h.id}`} 
                        className={`text-xs font-semibold transition ${
                          activeId === h.id ? "text-purple-600 dark:text-purple-400 font-bold" : "text-slate-650 dark:text-slate-400"
                        }`}
                        onClick={(e) => {
                          setTocOpen(false);
                          handleAnchorClick(e, h.id);
                        }}
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 4. Highlight Summary Box */}
          <div className="bg-purple-50/20 dark:bg-purple-950/10 border border-purple-100/60 dark:border-purple-900/30 p-6 sm:p-8 rounded-3xl mb-8 shadow-xs">
            <span className="text-[10px] font-extrabold text-purple-650 dark:text-purple-400 uppercase tracking-widest block mb-2">Article Brief / Summary</span>
            <p className="text-base sm:text-[18px] font-semibold text-slate-750 dark:text-slate-200 leading-relaxed italic">
              "{post.summary}"
            </p>
          </div>

          {/* 3. Editorial Typography Article Body */}
          <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-strong:text-slate-900 dark:prose-strong:text-white">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h1: ({ node, ...props }) => <h1 className="text-5xl font-bold text-slate-900 dark:text-white mt-16 mb-8 tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2" {...props} />,
                h2: ({ node, children, ...props }) => {
                  const rawText = getRawText(children);
                  const id = rawText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                  return (
                    <h2 id={id} className="text-3xl font-semibold text-slate-900 dark:text-white mt-16 mb-8 tracking-tight pb-2.5 border-b border-slate-100 dark:border-slate-850/50 scroll-mt-28" {...props}>
                      {children}
                    </h2>
                  );
                },
                h3: ({ node, children, ...props }) => {
                  const rawText = getRawText(children);
                  const id = rawText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                  return (
                    <h3 id={id} className="text-2xl font-semibold text-slate-900 dark:text-white mt-12 mb-6 tracking-tight scroll-mt-28" {...props}>
                      {children}
                    </h3>
                  );
                },
                h4: ({ node, ...props }) => <h4 className="text-xl font-semibold text-slate-900 dark:text-white mt-8 mb-4 tracking-tight" {...props} />,
                p: ({ node, ...props }) => (
                  <p className="text-[18px] leading-[1.9] tracking-[-0.01em] text-slate-700 dark:text-slate-300 mb-8 font-normal" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-purple-600 bg-purple-50/30 dark:bg-purple-950/10 pl-6 py-5 pr-5 rounded-r-[16px] text-[1.05rem] md:text-[1.15rem] text-slate-700 dark:text-slate-300 italic my-10 leading-relaxed font-semibold shadow-xs" {...props} />
                ),
                ul: ({ node, ...props }) => <ul className="list-disc pl-6 space-y-4 text-slate-700 dark:text-slate-300 my-6 text-[18px] leading-[1.9] tracking-[-0.01em]" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-6 space-y-4 text-slate-700 dark:text-slate-300 my-6 text-[18px] leading-[1.9] tracking-[-0.01em]" {...props} />,
                li: ({ node, ...props }) => <li className="pl-2" {...props} />,
                a: ({ node, ...props }) => <a className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:underline font-bold transition duration-200" {...props} />,
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-8 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xs bg-white dark:bg-slate-900">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-[14px]" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-slate-50 dark:bg-slate-950" {...props} />,
                tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900" {...props} />,
                tr: ({ node, ...props }) => <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-950/25 transition" {...props} />,
                th: ({ node, ...props }) => <th className="px-5 py-4 text-left font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]" {...props} />,
                td: ({ node, ...props }) => <td className="px-5 py-4 text-slate-750 dark:text-slate-300 font-semibold" {...props} />,
                img: ({ node, ...props }) => (
                  <div className="my-9 flex flex-col items-center">
                    <img className="rounded-3xl shadow-sm border border-slate-150 dark:border-slate-800 max-h-[460px] w-full object-cover" {...props} />
                    {props.alt && <span className="mt-2.5 text-xs text-slate-400 dark:text-slate-550 font-bold italic">{props.alt}</span>}
                  </div>
                ),
                iframe: ({ node, ...props }) => (
                  <div className="my-10 overflow-hidden rounded-3xl shadow-sm border border-slate-150 dark:border-slate-800 max-w-full aspect-video">
                    <iframe className="w-full h-full" {...props} />
                  </div>
                ),
                code: ({ node, inline, className, children, ...props }: any) => {
                  return inline ? (
                    <code className="bg-slate-100 dark:bg-slate-800/80 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded font-mono text-[12px] border border-slate-200/50 dark:border-slate-700/50" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="bg-slate-950 text-slate-100 p-4 rounded-2xl font-mono text-[13px] sm:text-[14px] overflow-x-auto my-6 border border-slate-850 shadow-sm leading-relaxed">
                      <code {...props}>{children}</code>
                    </pre>
                  );
                }
              }}
            >
              {post.content}
            </ReactMarkdown>
          </article>
          
        </div>

        {/* 5. Sticky Right Sidebar (Stacks below article on mobile) */}
        <aside className="lg:col-span-1 space-y-8 h-fit sticky top-24">
          
          {/* Active TOC list card (Desktop only inside sticky sidebar) */}
          {headings.length > 0 && (
            <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
                <BookOpen className="h-4 w-4 text-purple-500" />
                <span>On This Page</span>
              </h4>
              <ul className="space-y-3.5 pl-1.5 border-l border-slate-100 dark:border-slate-800">
                {headings.map((h, hIdx) => (
                  <li key={hIdx} className={`${h.level === 3 ? "pl-3.5" : ""} relative -left-[1.5px]`}>
                    <a 
                      href={`#${h.id}`} 
                      className={`text-xs font-semibold block transition border-l-2 pl-2.5 -ml-[1px] leading-relaxed truncate ${
                        activeId === h.id 
                          ? "text-purple-600 border-purple-500 font-bold dark:text-purple-400" 
                          : "text-slate-500 border-transparent hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200"
                      }`}
                      title={h.text}
                      onClick={(e) => handleAnchorClick(e, h.id)}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Upgraded Subscribe Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Mail className="h-5 w-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-4">Subscribe to WeCollab Brief</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Get our daily insights, strategies, and growth briefs delivered straight to your inbox.
            </p>

            <form onSubmit={handleSubscribe} className="mt-4 space-y-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting || subscribed}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 py-2.5 px-3.5 text-xs text-slate-900 dark:text-slate-200 outline-none transition focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-purple-500/25 font-semibold"
              />
              <button
                type="submit"
                disabled={submitting || subscribed || !email}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-xs font-extrabold text-white transition hover:opacity-95 disabled:bg-slate-200 shadow-xs cursor-pointer active:scale-98"
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : subscribed ? (
                  <>
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    Subscribed!
                  </>
                ) : (
                  "Subscribe Now"
                )}
              </button>
            </form>

            {subscribed && (
              <div className="mt-3 flex gap-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Success! You're in for our briefs.</span>
              </div>
            )}

            {errorMessage && (
              <div className="mt-3 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                {errorMessage}
              </div>
            )}
          </div>

          {/* Trending Articles Card (5 latest posts) */}
          {latestPosts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 mb-4 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span>Trending Articles</span>
              </h4>
              <ul className="space-y-4">
                {latestPosts.map((trendPost, tIdx) => (
                  <li key={trendPost.id}>
                    <Link href={`/blog/${trendPost.slug || trendPost.id}`} className="flex gap-3 group hover:text-purple-600 transition">
                      <span className="text-lg font-black text-slate-250 dark:text-slate-800 group-hover:text-purple-400 transition leading-none shrink-0 w-5">0{tIdx + 1}</span>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider block">{trendPost.category}</span>
                        <h5 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition line-clamp-2 leading-snug mt-0.5">{trendPost.title}</h5>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Try WeCollab Campaign CTA Card */}
          <div className="bg-slate-950 border border-slate-850 rounded-3xl p-6 text-white hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-[-30%] right-[-10%] w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-110 transition duration-300" />
            <h3 className="text-base font-extrabold">Launch your next creator campaign</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Connect with vetted influencers, automate custom pitches, and analyze metrics in real-time.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/brand/login"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 py-3 text-xs font-extrabold text-white transition-all shadow-md active:scale-98"
              >
                Try WeCollab <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="#cta"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 py-3 text-xs font-extrabold text-slate-200 transition-all active:scale-98"
              >
                Book Demo
              </Link>
            </div>
          </div>

        </aside>

      </div>

      {/* 9. Related Reading Section (3-column grid, translate-y hover transition) */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="mt-20 border-t border-slate-100 dark:border-slate-800/80 pt-16 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Continue Reading</h3>
            <Link 
              href="/newsletter" 
              className="text-xs font-bold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition flex items-center gap-1"
            >
              View all briefings <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedPosts.map((rPost) => (
              <Link 
                key={rPost.id}
                href={`/blog/${rPost.slug || rPost.id}`}
                className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-[24px] overflow-hidden hover:shadow-lg hover:border-purple-100/50 dark:hover:border-purple-900/40 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                {rPost.cover_image && (
                  <div className="h-44 w-full overflow-hidden shrink-0 border-b border-slate-50 dark:border-slate-850">
                    <img 
                      src={rPost.cover_image} 
                      alt={rPost.title} 
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500" 
                    />
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="inline-block bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-[6px] text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      {rPost.category}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition line-clamp-2">
                      {rPost.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold tracking-wide uppercase pt-4 border-t border-slate-50 dark:border-slate-850 mt-4 shrink-0">
                    <span>{formatDate(rPost.published_at)}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getReadingTime(rPost.content)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Next / Previous Issue Navigation */}
      {(prevPost || nextPost) && (
        <div className="mt-12 border-t border-slate-100 dark:border-slate-800 pt-8 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            {prevPost ? (
              <Link
                href={`/blog/${prevPost.slug || prevPost.id}`}
                className="group flex-1 flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-purple-100 hover:bg-purple-50/10 transition-all text-left"
              >
                <div className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:border-purple-350 dark:group-hover:text-purple-400 transition-colors shrink-0">
                  <ChevronLeft className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550">Previous Brief</span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-350 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-1 mt-0.5">{prevPost.title}</h4>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}

            {nextPost ? (
              <Link
                href={`/blog/${nextPost.slug || nextPost.id}`}
                className="group flex-1 flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-purple-100 hover:bg-purple-50/10 transition-all text-right flex-row-reverse"
              >
                <div className="h-9 w-9 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-purple-600 group-hover:border-purple-350 dark:group-hover:text-purple-400 transition-colors shrink-0">
                  <ChevronRight className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550">Next Brief</span>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-350 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-1 mt-0.5">{nextPost.title}</h4>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      )}
      
    </div>
  );
}
