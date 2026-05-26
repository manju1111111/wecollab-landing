"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Bolt,
  Building2,
  Check,
  Headphones,
  Lock,
  RefreshCw,
  Rocket,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import { GlassCard } from "./glass-card";
import { SectionShell } from "./section-shell";

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

const starterFeatures = [
  "Limited creator searches",
  "Basic filters",
  "Creator bookmarks",
  "Export up to 50 creators",
  "Email support",
];

const proFeatures = [
  "Unlimited creator discovery",
  "Advanced filters",
  "AI creator matching",
  "Audience insights",
  "Engagement analytics",
  "Campaign management",
  "Priority email support",
];

const entFeatures = [
  "Team access & roles",
  "Dedicated account manager",
  "API access",
  "White-label reports",
  "Custom integrations",
  "Priority onboarding & training",
  "SLA & premium support",
];

const comparisonRows: {
  label: string;
  starter: ReactNode;
  pro: ReactNode;
  ent: ReactNode;
}[] = [
  { label: "AI Creator Matching", starter: "—", pro: <Check className="mx-auto h-4 w-4 text-violet-600" />, ent: <Check className="mx-auto h-4 w-4 text-violet-600" /> },
  { label: "Advanced Filters", starter: "—", pro: <Check className="mx-auto h-4 w-4 text-violet-600" />, ent: <Check className="mx-auto h-4 w-4 text-violet-600" /> },
  { label: "Audience Insights", starter: "—", pro: <Check className="mx-auto h-4 w-4 text-violet-600" />, ent: <Check className="mx-auto h-4 w-4 text-violet-600" /> },
  { label: "Campaign Management", starter: "—", pro: <Check className="mx-auto h-4 w-4 text-violet-600" />, ent: <Check className="mx-auto h-4 w-4 text-violet-600" /> },
  { label: "API Access", starter: "—", pro: "—", ent: <Check className="mx-auto h-4 w-4 text-violet-600" /> },
  { label: "Team Members", starter: "1", pro: "5", ent: "Unlimited" },
  { label: "Export Creators", starter: "50", pro: "Unlimited", ent: "Unlimited" },
];

const bottomTrust = [
  {
    icon: Shield,
    title: "Trusted by 1,000+ Brands",
    desc: "Teams ship campaigns faster with verified discovery.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    desc: "Enterprise-grade billing and compliance-ready flows.",
  },
  {
    icon: RefreshCw,
    title: "Cancel Anytime",
    desc: "No long lock-ins on self-serve plans.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Human help when your campaign is on the clock.",
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  const starterPrice = yearly ? 1599 : 1999;
  const proPrice = yearly ? 5599 : 6999;

  return (
    <SectionShell id="pricing" className="relative bg-gradient-to-b from-violet-50/40 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pt-24 transition-colors duration-700">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-violet-100/40 dark:border-slate-800/40" />
        <div className="absolute left-1/2 top-40 h-[380px] w-[380px] -translate-x-1/2 rounded-full border border-violet-50/60 dark:border-slate-800/60" />
        {["12%", "22%", "78%", "88%", "34%", "56%"].map((left, i) => (
          <span
            key={i}
            className="absolute text-violet-200/80 dark:text-violet-900/30"
            style={{ left, top: `${18 + (i % 3) * 12}%` }}
          >
            ✦
          </span>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] space-y-12 px-5 sm:px-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
            Pricing
          </span>
          <h2 className="max-w-[720px] text-balance text-[1.85rem] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[2.35rem] lg:text-[2.5rem]">
            Simple Pricing for <span className="text-violet-600 dark:text-violet-400">Every Brand Size</span>.
          </h2>
          <p className="max-w-xl text-[1.0625rem] leading-relaxed text-slate-600 dark:text-slate-400">
            Choose the perfect plan to discover, filter, and collaborate with creators at scale.
          </p>

          <div className="inline-flex items-center gap-1 rounded-full border border-violet-100 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 p-1 shadow-sm backdrop-blur">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={clsx(
                "relative rounded-full px-5 py-2.5 text-[13px] font-semibold transition",
                !yearly ? "bg-violet-600 text-white shadow-md" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
              )}
            >
              Billed Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={clsx(
                "rounded-full px-5 py-2.5 text-[13px] font-semibold transition",
                yearly ? "bg-violet-600 text-white shadow-md" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
              )}
            >
              Billed Yearly
            </button>
            <span className="ml-1 hidden rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white sm:inline">
              Save 20%
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <GlassCard className="flex h-full flex-col p-7 dark:bg-slate-900/60 dark:border-slate-800" hover>
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                <Rocket className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Starter</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                For startups and small brands getting started.
              </p>
              <p className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {inr(starterPrice)} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">/mo</span>
              </p>
              <Link
                href="#cta"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[14px] font-semibold text-violet-700 transition hover:border-violet-200 dark:border-slate-700 dark:bg-slate-800 dark:text-violet-300 dark:hover:border-violet-500/50"
              >
                Start Free Trial
              </Link>
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Everything you need to start
              </p>
              <ul className="mt-3 space-y-2.5">
                {starterFeatures.map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] text-slate-700 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-auto flex items-center gap-2 pt-8 text-[12px] text-slate-500 dark:text-slate-400">
                <Shield className="h-4 w-4 text-violet-500" />
                7-day free trial · Cancel anytime
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06, duration: 0.45 }}
            className="lg:-translate-y-1"
          >
            <GlassCard
              className="relative flex h-full flex-col border-violet-300/80 bg-gradient-to-b from-white to-violet-50/40 p-7 shadow-xl shadow-violet-500/10 ring-1 ring-violet-200/80 dark:border-violet-500/30 dark:from-slate-900 dark:to-slate-800 dark:ring-violet-500/20"
              hover={false}
            >
              <span className="absolute right-5 top-5 rounded-full bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white">
                ★ Most Popular
              </span>
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                <Bolt className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pro</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                For growing brands and agencies that scale campaigns.
              </p>
              <p className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {inr(proPrice)} <span className="text-base font-semibold text-slate-500 dark:text-slate-400">/mo</span>
              </p>
              <Link
                href="#cta"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-violet-600 text-[14px] font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-700"
              >
                Start Free Trial
              </Link>
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                All Starter features, plus
              </p>
              <ul className="mt-3 space-y-2.5">
                {proFeatures.map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] text-slate-700 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-auto flex items-center gap-2 pt-8 text-[12px] text-slate-500 dark:text-slate-400">
                <Shield className="h-4 w-4 text-violet-500" />
                7-day free trial · Cancel anytime
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12, duration: 0.45 }}
          >
            <GlassCard className="flex h-full flex-col p-7 dark:bg-slate-900/60 dark:border-slate-800" hover>
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                <Building2 className="h-6 w-6" strokeWidth={1.75} />
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enterprise</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                For large teams and enterprises with advanced needs.
              </p>
              <p className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Custom</p>
              <Link
                href="#cta"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white text-[14px] font-semibold text-violet-700 transition hover:border-violet-200 dark:border-slate-700 dark:bg-slate-800 dark:text-violet-300 dark:hover:border-violet-500/50"
              >
                Contact Sales
              </Link>
              <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Everything in Pro, plus
              </p>
              <ul className="mt-3 space-y-2.5">
                {entFeatures.map((f) => (
                  <li key={f} className="flex gap-2 text-[13px] text-slate-700 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-auto flex items-center gap-2 pt-8 text-[12px] text-slate-500 dark:text-slate-400">
                <Shield className="h-4 w-4 text-violet-500" />
                Tailored for your organization
              </p>
            </GlassCard>
          </motion.div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-violet-100/80 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 shadow-sm backdrop-blur">
          <div className="border-b border-violet-100/80 dark:border-slate-800 px-5 py-4 sm:px-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Compare Plans &amp; Features</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-violet-100/80 dark:border-slate-800 bg-violet-50/30 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                  <th className="px-5 py-3 font-semibold sm:px-8">Feature</th>
                  <th className="px-3 py-3 text-center font-semibold">Starter</th>
                  <th className="px-3 py-3 text-center font-semibold text-violet-700 dark:text-violet-400">
                    Pro <span className="ml-1 text-[10px]">★</span>
                  </th>
                  <th className="px-3 py-3 text-center font-semibold sm:pr-8">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-300 sm:px-8">{row.label}</td>
                    <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400">{row.starter}</td>
                    <td className="px-3 py-3 text-center">{row.pro}</td>
                    <td className="px-3 py-3 text-center text-slate-600 dark:text-slate-400 sm:pr-8">{row.ent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bottomTrust.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.04 * i }}
              className="flex gap-3 rounded-2xl border border-violet-100/70 bg-white/80 dark:border-slate-800/70 dark:bg-slate-900/60 p-4 backdrop-blur-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                <b.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{b.title}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
