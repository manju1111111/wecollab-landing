"use client";

import { motion } from "framer-motion";
import { Building2, FileText, Globe, Users } from "lucide-react";

const items = [
  { icon: Users, value: "10,000+", label: "Verified Creators" },
  { icon: FileText, value: "2.5M+", label: "Creator Profiles" },
  { icon: Building2, value: "5,000+", label: "Brands & Agencies" },
  { icon: Globe, value: "120+", label: "Countries Covered" },
];

export function StatsBar() {
  return (
    <section className="relative bg-transparent pb-6 pt-2 sm:pb-10 sm:pt-4 transition-colors duration-700">
      <div className="pointer-events-none absolute inset-x-0 -top-6 h-20 bg-gradient-to-b from-violet-100/20 dark:from-violet-500/5 to-transparent blur-2xl" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-[1200px] px-5 sm:px-8"
      >
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[1.25rem] border border-slate-200/80 bg-slate-200/70 dark:border-slate-800/80 dark:bg-slate-800/70 sm:rounded-2xl lg:grid-cols-4">
          {items.map((it) => (
            <div
              key={it.label}
              className="flex flex-col items-center gap-2 bg-slate-50/95 dark:bg-slate-900/95 px-4 py-6 text-center sm:px-8 sm:py-8"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                <it.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">{it.value}</p>
              <p className="text-[12px] font-medium leading-snug text-slate-600 dark:text-slate-400 sm:text-[13px]">{it.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
