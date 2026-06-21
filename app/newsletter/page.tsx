import { createAdminClient } from "@/lib/supabase/server";
import { getNewsletters } from "@/lib/supabase/fallback-db";
import { NewsletterArchive } from "@/components/newsletter/newsletter-archive";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { MOCK_NEWSLETTERS } from "@/data/mock-newsletters";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  const supabase = await createAdminClient();
  let dbNewsletters = await getNewsletters(supabase, false);

  // Auto seed newsletters in memory if database is empty
  const newslettersList = dbNewsletters.length > 0 ? dbNewsletters : MOCK_NEWSLETTERS;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white bg-[url('/assets/newsletter-hero-bg.png')] bg-no-repeat bg-[length:100%_auto] bg-top pt-32 pb-24 font-sans">
        <div className="mx-auto max-w-[1240px] px-6 sm:px-8">
          
          {/* Two-Column Hero Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
            
            {/* Left Column: Copy & Social Proof */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/70 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-violet-700">
                  <span className="text-sm">✨</span> Your weekly edge in the creator economy
                </span>
                <Link
                  href="/admin/newsletter"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-white/80 hover:bg-white text-slate-700 border border-slate-200 rounded-full text-xs font-bold transition shadow-sm"
                >
                  Admin Portal
                </Link>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0f172a] leading-[1.1]">
                Insights. Strategies.<br />
                <span className="text-violet-600">Growth.</span>
              </h1>
              
              <p className="text-[1.1rem] leading-relaxed text-slate-500 max-w-xl">
                Actionable insights, expert analysis, and the latest trends shaping the creator economy—delivered to your inbox every week.
              </p>
              
              {/* Social Proof Avatars */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex -space-x-3">
                  <img src="/assets/jannat_profile.png" alt="Subscriber" className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm" />
                  <img src="/assets/discover-creator-1.png" alt="Subscriber" className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm" />
                  <img src="/assets/discover-creator-2.png" alt="Subscriber" className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm" />
                  <img src="/assets/discover-creator-3.png" alt="Subscriber" className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm" />
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  Join <span className="font-extrabold text-[#0f172a]">12,548+</span> creators, marketers & founders
                </p>
              </div>
            </div>

            {/* Right Column: Subscriber Box Card */}
            <div className="lg:col-span-5">
              <NewsletterArchiveCard />
            </div>

          </div>

          {/* Render the search, category, tag, author, and sorting filters + card lists */}
          <NewsletterArchive initialNewsletters={newslettersList} />
          
        </div>
      </main>
      <Footer />
    </>
  );
}

// Separate component for the Hero signup card to clean up server component
import { NewsletterHeroCard } from "@/components/newsletter/newsletter-hero-card";

function NewsletterArchiveCard() {
  return <NewsletterHeroCard />;
}
