"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const avatars = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&q=80",
];

const floatPos = [
  { top: "6%", left: "4%", delay: 0 },
  { top: "10%", right: "8%", delay: 0.08 },
  { top: "42%", left: "2%", delay: 0.12 },
  { top: "48%", right: "4%", delay: 0.16 },
  { top: "72%", left: "10%", delay: 0.2 },
  { top: "68%", right: "12%", delay: 0.24 },
];

export function CtaSection() {
  return (
    <section id="cta" className="relative isolate overflow-hidden bg-gradient-to-b from-violet-100/50 via-violet-50/30 to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 py-16 sm:py-20 lg:py-24 transition-colors duration-700">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-violet-200/30 dark:from-violet-500/10 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white dark:from-slate-950 via-transparent to-transparent blur-2xl" />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2rem] border border-violet-100/90 dark:border-violet-500/20 bg-gradient-to-br from-violet-100/70 via-white to-indigo-50/60 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-6 py-14 shadow-[0_28px_80px_-32px_rgba(109,40,217,0.35)] sm:px-12 sm:py-16"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, rgba(139,92,246,0.25), transparent 45%), radial-gradient(circle at 80% 70%, rgba(99,102,241,0.2), transparent 40%)",
            }}
          />

          {floatPos.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: p.delay, duration: 0.4 }}
              className="absolute hidden h-12 w-12 overflow-hidden rounded-full border-2 border-white dark:border-slate-800 shadow-lg sm:block md:h-14 md:w-14"
              style={{ top: p.top, left: p.left, right: p.right }}
            >
              <Image src={avatars[i % avatars.length]} alt="" fill sizes="56px" className="object-cover" />
            </motion.div>
          ))}

          <div className="relative mx-auto max-w-[640px] text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 dark:border-violet-500/30 dark:bg-slate-900/80 px-4 py-1.5 text-[12px] font-semibold text-violet-800 dark:text-violet-300 shadow-sm backdrop-blur">
              <BadgeCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
              10,000+ Verified Creators
            </span>
            <h2 className="mt-6 text-balance text-[1.85rem] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[2.35rem] lg:text-[2.5rem]">
              Ready to Scale Your Creator Campaigns?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-slate-600 dark:text-slate-400">
              Join thousands of brands discovering amazing creators. Start your free trial today—no credit card
              required.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/brand/login"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-violet-600 px-7 py-3.5 text-[0.9375rem] font-semibold text-white shadow-xl transition hover:bg-slate-800 dark:hover:bg-violet-700"
              >
                Get Started Free
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/brand/login"
                className="inline-flex items-center rounded-full border border-slate-300/90 bg-white/90 dark:border-slate-700 dark:bg-slate-800 px-7 py-3.5 text-[0.9375rem] font-semibold text-slate-900 dark:text-white shadow-sm backdrop-blur transition hover:bg-white dark:hover:bg-slate-700"
              >
                Book a Demo
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
                7-day free trial
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
                No credit card required
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2.5} />
                Cancel anytime
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
