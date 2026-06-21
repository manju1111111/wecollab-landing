"use client";

import { motion } from "framer-motion";
import {
  Award,
  BarChart3,
  Headphones,
  Layers,
  Lock,
  Search,
  Shield,
  SlidersHorizontal,
  Users,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { GlassCard } from "./glass-card";
import { SectionShell } from "./section-shell";

const bullets = [
  {
    title: "Niche & Category",
    desc: "236+ niches across multiple content categories.",
    icon: Layers,
  },
  {
    title: "Content & Format",
    desc: "Find creators by video type, length, style & content format.",
    icon: Video,
  },
  {
    title: "Audience Insights",
    desc: "Filter by audience demographics, location, age, and interests.",
    icon: Users,
  },
  {
    title: "Engagement & Reach",
    desc: "Filter by engagement rate, reach, impressions & more.",
    icon: BarChart3,
  },
];

const trust = [
  {
    icon: Shield,
    body: (
      <>
        Every creator is manually verified for authenticity and quality.
      </>
    ),
  },
  {
    icon: Headphones,
    body: (
      <>
        <span className="font-bold text-slate-900">24/7 Support</span> We&apos;re here to help you anytime.
      </>
    ),
  },
  {
    icon: Lock,
    body: (
      <>
        <span className="font-bold text-slate-900">Secure Platform</span> Your data and privacy are our priority.
      </>
    ),
  },
  {
    icon: Award,
    body: (
      <>
        <span className="font-bold text-slate-900">Trusted by 1,000+ Brands</span> From startups to enterprise
        companies.
      </>
    ),
  },
];

const tags = [
  "Unboxing",
  "Tech Review",
  "Skincare",
  "Gym Workouts",
  "Food Vlogs",
  "Gaming",
  "Fashion",
  "Travel",
];

export function AdvancedFilters() {
  const router = useRouter();

  return (
    <SectionShell id="product" className="bg-white pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16">
      <div className="mx-auto max-w-[1200px] space-y-12 px-5 sm:px-8 lg:space-y-14">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start lg:gap-16">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Powerful filters</p>
            <h2 className="text-balance text-[1.75rem] font-extrabold leading-[1.15] tracking-tight text-slate-900 sm:text-[2.125rem] lg:text-[2.25rem]">
              Advanced Filters for{" "}
              <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                Perfect Creator Match
              </span>
            </h2>
            <p className="max-w-md text-[1.0625rem] leading-relaxed text-slate-600">
              Our smart filtering system helps you find the right creators based on what matters most for your
              campaign.
            </p>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={{
                visible: { transition: { staggerChildren: 0.15 } }
              }}
              className="grid gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6"
            >
              {bullets.map((b) => (
                <motion.div
                  key={b.title}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                  }}
                  className="flex gap-3 rounded-2xl border border-transparent p-1 transition hover:border-violet-100/80 hover:bg-violet-50/30"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                    <b.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-slate-900">{b.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard 
              className="border-white/80 p-6 sm:p-8 relative overflow-hidden group cursor-pointer transition hover:border-violet-350 active:scale-[0.99]" 
              hover={false}
              onClick={() => router.push("/brand/login")}
            >
              {/* Unlock Overlay on Hover */}
              <div className="absolute inset-0 bg-violet-950/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[0.5px] pointer-events-none z-10">
                <span className="bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <Lock className="w-3.5 h-3.5 text-violet-300 animate-pulse" />
                  Sign In to Unlock Filters
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
                <div className="relative min-h-[48px] flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                  <input
                    readOnly
                    placeholder="Search creators, niches or keywords..."
                    className="h-12 w-full rounded-xl border border-slate-200/90 bg-white py-2 pl-11 pr-3 text-[14px] text-slate-800 shadow-sm outline-none ring-violet-200/50 placeholder:text-slate-400 focus:ring-2"
                  />
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-800 transition hover:border-violet-200"
                  >
                    Save Search
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-900 px-4 text-[13px] font-semibold text-white shadow-md transition hover:bg-slate-800"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-violet-300" />
                    Apply Filters
                    <span className="rounded-md bg-violet-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                      120
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                {["Category (All Categories)", "Niche (Select Niche)", "Content Type (All Types)"].map((label) => (
                  <div
                    key={label}
                    className="flex h-11 items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/50 px-3 text-[13px] font-medium text-slate-800"
                  >
                    <span className="truncate">{label}</span>
                    <span className="text-slate-400">▾</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2 text-[13px] font-semibold text-violet-800 transition hover:bg-violet-100"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  More Filters
                  <span className="rounded-md bg-violet-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    (3)
                  </span>
                </button>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Popular searches</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-violet-100 bg-violet-50/90 px-3 py-1.5 text-[12px] font-semibold text-violet-800 transition hover:border-violet-200 hover:bg-violet-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-6 rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/50 via-white to-indigo-50/40 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <p className="text-[15px] font-extrabold leading-snug text-slate-900">
                    12,540 Creators Found
                    <span className="mt-1 block text-[13px] font-semibold text-slate-600">
                      Across 236+ niches
                    </span>
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white"
                        >
                          {i + 1}
                        </span>
                      ))}
                    </div>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[12px] font-bold text-violet-700">
                      +12K
                    </span>
                  </div>
                </div>
                <div className="sm:text-right">
                  <p className="text-[12px] font-semibold text-slate-600">Avg. Engagement Rate</p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">
                    4.7%
                    <span className="ml-2 text-sm font-bold text-emerald-600">+1.4%</span>
                  </p>
                  <div className="mt-2 flex h-11 items-end justify-start gap-1 sm:justify-end">
                    {[32, 48, 40, 62, 55, 70, 58, 78, 65, 82].map((h, idx) => (
                      <span
                        key={idx}
                        className="w-1.5 rounded-full bg-gradient-to-t from-violet-600 to-violet-300"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <div className="grid gap-0 divide-y divide-violet-100 rounded-2xl border border-violet-100/80 bg-white/80 backdrop-blur-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {trust.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i }}
              className="flex gap-3 px-5 py-5 sm:py-6"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <t.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="text-[13px] leading-relaxed text-slate-600">{t.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
