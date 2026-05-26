import { AdvancedFilters } from "@/components/landing/advanced-filters";
import { CreatorCategories } from "@/components/landing/creator-categories";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Pricing } from "@/components/landing/pricing";
import { StatsBar } from "@/components/landing/stats-bar";
import { Testimonials } from "@/components/landing/testimonials";

import { ThemeTrigger } from "@/components/landing/theme-trigger";

export default function Home() {
  return (
    <>
      <Navbar />
      <div id="login" className="h-0 w-0 overflow-hidden" aria-hidden />
      <main className="overflow-x-hidden bg-transparent">
        <Hero />
        <CreatorCategories />
        <AdvancedFilters />
        
        <ThemeTrigger>
          <Pricing />
          <Testimonials />
          <StatsBar />
          <CtaSection />
          <Footer />
        </ThemeTrigger>
      </main>
    </>
  );
}
