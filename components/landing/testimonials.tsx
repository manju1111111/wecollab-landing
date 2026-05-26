"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "./glass-card";
import { SectionShell } from "./section-shell";

const logos = [
  { label: "boat", className: "tracking-tight" },
  { label: "zomato", className: "font-semibold lowercase" },
  { label: "mamaearth", className: "font-semibold lowercase" },
  { label: "SWIGGY", className: "font-black tracking-wide" },
  { label: "CRED", className: "font-black tracking-widest" },
  { label: "lenskart", className: "font-semibold lowercase" },
];

const items = [
  {
    quote:
      "Wecollab has completely transformed how we discover creators. The advanced filters save us countless hours, and the quality of creators we find is consistently outstanding.",
    name: "Sarah Chen",
    title: "Head of Marketing",
    company: "CRED",
    initials: "SC",
  },
  {
    quote:
      "The AI matching feature is a game-changer. We have been able to scale our influencer campaigns 3x while maintaining authentic brand partnerships.",
    name: "Marcus Rodriguez",
    title: "CMO",
    company: "Swiggy",
    initials: "MR",
  },
  {
    quote:
      "As an agency managing 50+ brands, Wecollab's enterprise features and dedicated support have made all the difference. Highly recommend for any serious marketing team.",
    name: "Priya Sharma",
    title: "Founder & CEO",
    company: "Northside Social",
    initials: "PS",
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const prev = () => setIndex((i) => (i === 0 ? items.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === items.length - 1 ? 0 : i + 1));

  return (
    <SectionShell className="bg-transparent pb-8 pt-16 sm:pb-12 sm:pt-20 lg:pt-24 transition-colors duration-700">
      <div className="mx-auto max-w-[1200px] space-y-10 px-5 sm:space-y-12 sm:px-8">
        <div className="mx-auto max-w-[820px] text-center">
          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
            Trusted by modern brands
          </span>
          <h2 className="mt-5 text-balance text-[1.85rem] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[2.35rem] lg:text-[2.5rem]">
            Loved by Brands &amp; Agencies That Move Fast
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-slate-600 dark:text-slate-400">
            Join thousands of companies using Wecollab to discover creators, run campaigns, and scale their
            influencer marketing.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-80 grayscale sm:gap-x-14">
          {logos.map((l) => (
            <span
              key={l.label}
              className={`text-[15px] text-slate-700 dark:text-slate-300 sm:text-[16px] ${l.className}`}
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              {l.label}
            </span>
          ))}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 z-20 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 lg:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 z-20 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 lg:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="hidden gap-5 px-6 lg:grid lg:grid-cols-3">
            {[0, 1, 2].map((offset) => {
              const t = items[(index + offset) % items.length];
              return (
                <motion.div
                  key={`${index}-${offset}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <GlassCard className="flex h-full flex-col p-7 dark:bg-slate-900/60 dark:border-slate-800" hover>
                    <Quote className="h-7 w-7 text-violet-500" strokeWidth={1.5} />
                    <p className="mt-5 flex-1 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{t.quote}</p>
                    <div className="mt-8 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5">
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                        {t.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-bold text-slate-900 dark:text-white">{t.name}</p>
                        <p className="truncate text-[13px] text-slate-500 dark:text-slate-400">{t.title}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {t.company}
                      </span>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>

          <div className="lg:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.28 }}
              >
                <GlassCard className="p-6 dark:bg-slate-900/60 dark:border-slate-800" hover={false}>
                  <Quote className="h-7 w-7 text-violet-500" strokeWidth={1.5} />
                  <p className="mt-4 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{items[index].quote}</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                      {items[index].initials}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{items[index].name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{items[index].title}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </AnimatePresence>
            <div className="mt-4 flex justify-center gap-2">
              <button
                type="button"
                onClick={prev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow"
                aria-label="Previous"
              >
                <ChevronLeft className="h-5 w-5 dark:text-slate-400" />
              </button>
              <button
                type="button"
                onClick={next}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 shadow"
                aria-label="Next"
              >
                <ChevronRight className="h-5 w-5 dark:text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
