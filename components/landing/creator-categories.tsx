"use client";

import { useCallback, useRef, type CSSProperties, type PointerEvent } from "react";
import { motion } from "framer-motion";
import {
  Bike,
  CarFront,
  ChevronDown,
  Gamepad2,
  LayoutGrid,
  Monitor,
  Plane,
  Sparkles,
  Users,
  Dumbbell,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SectionShell } from "./section-shell";

const MotionLink = motion(Link);
import { TrustedBy } from "./trusted-by";

const stats: { icon: LucideIcon; title: string; subtitle: string }[] = [
  { icon: Users, title: "10K+", subtitle: "Verified Creators" },
  { icon: LayoutGrid, title: "236+", subtitle: "Niches Covered" },
  { icon: Sparkles, title: "AI Matching", subtitle: "Smart Recommendations" },
  { icon: ShieldCheck, title: "100% Verified", subtitle: "Authentic Profiles" },
];

type Cat = {
  title: string;
  count: string;
  img: string;
  Icon: LucideIcon;
  featured: boolean;
};

const arcCategories: Cat[] = [
  {
    title: "Tech Creators",
    count: "16.4K Creators",
    img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=280&fit=crop&q=80",
    Icon: Monitor,
    featured: false,
  },
  {
    title: "Car Creators",
    count: "12.1K Creators",
    img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=280&fit=crop&q=80",
    Icon: CarFront,
    featured: false,
  },
  {
    title: "Bike Creators",
    count: "9.8K Creators",
    img: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=280&fit=crop&q=80",
    Icon: Bike,
    featured: false,
  },
  {
    title: "Gaming Creators",
    count: "22.4K Creators",
    img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=280&fit=crop&q=80",
    Icon: Gamepad2,
    featured: true,
  },
  {
    title: "Travel Creators",
    count: "14.2K Creators",
    img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=280&fit=crop&q=80",
    Icon: Plane,
    featured: false,
  },
  {
    title: "Fitness Creators",
    count: "11.6K Creators",
    img: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=280&fit=crop&q=80",
    Icon: Dumbbell,
    featured: false,
  },
  {
    title: "Fitness Creators",
    count: "10.2K Creators",
    img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=280&fit=crop&q=80",
    Icon: Dumbbell,
    featured: false,
  },
];

function arcPositions(
  index: number,
  total: number,
  W: number,
  H: number,
  R: number,
  cardW: number,
  cardH: number,
) {
  const cx = W / 2;
  const cy = H - 24;
  const theta = Math.PI + (Math.PI * index) / (total - 1);
  const x = cx + Math.cos(theta) * R - cardW / 2;
  const y = cy + Math.sin(theta) * R - cardH;
  return { leftPct: (x / W) * 100, topPct: (y / H) * 100 };
}

export function CreatorCategories() {
  const W = 1000;
  const H = 400;
  const R = 292;
  const cardW = 134;
  const cardH = 172;

  const glowCardRef = useRef<HTMLDivElement>(null);

  const updateGlowPosition = useCallback((clientX: number, clientY: number) => {
    const host = glowCardRef.current;
    if (!host) return;
    const r = host.getBoundingClientRect();
    host.style.setProperty("--gx", `${clientX - r.left}px`);
    host.style.setProperty("--gy", `${clientY - r.top}px`);
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      updateGlowPosition(e.clientX, e.clientY);
    },
    [updateGlowPosition],
  );

  const handlePointerEnter = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      glowCardRef.current?.style.setProperty("--glow", "1");
      updateGlowPosition(e.clientX, e.clientY);
    },
    [updateGlowPosition],
  );

  const handlePointerLeave = useCallback(() => {
    glowCardRef.current?.style.setProperty("--glow", "0");
  }, []);

  return (
    <SectionShell id="how-it-works" bleedTop className="relative z-20 bg-white pb-6 pt-0 sm:pb-10 sm:pt-2 lg:pt-3">
      <div id="creators" className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[58%] h-[min(92vw,700px)] w-[min(92vw,700px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-100/70"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[62%] h-[min(80vw,600px)] w-[min(80vw,600px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-50/90"
        />

        <div className="relative z-30 mx-auto -mt-6 mb-8 flex w-full max-w-[960px] justify-center sm:-mt-10 sm:mb-10 md:-mt-12 lg:-mt-16 xl:-mt-20 2xl:-mt-24">
          <div
            ref={glowCardRef}
            className="relative w-full rounded-[22px] sm:rounded-3xl [--glow:0]"
            style={
              {
                ["--gx"]: "50%",
                ["--gy"]: "50%",
              } as CSSProperties
            }
            onPointerEnter={handlePointerEnter}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-4 z-0 overflow-visible rounded-[22px] opacity-[var(--glow)] transition-opacity duration-500 ease-out sm:rounded-3xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(520px_circle_at_var(--gx)_var(--gy),rgba(139,92,246,0.42),rgba(244,114,182,0.2)_38%,transparent_58%)] blur-2xl sm:blur-3xl" />
            </div>
            <div className="relative z-10 w-full overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_16px_48px_-14px_rgba(15,23,42,0.1)] sm:rounded-3xl">
              {/* Inner subtle glow for spotlight effect */}
              <div 
                aria-hidden
                className="pointer-events-none absolute inset-0 z-0 opacity-[var(--glow)] transition-opacity duration-500 ease-out" 
                style={{ background: `radial-gradient(600px circle at var(--gx) var(--gy), rgba(139,92,246,0.08), transparent 40%)` }}
              />
              <div className="relative z-10 p-5 sm:p-6 md:p-7">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <MotionLink
                href="/discover"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-[0.9375rem] font-semibold tracking-tight text-white shadow-md shadow-slate-900/20 ring-1 ring-white/10 transition hover:bg-slate-800 hover:shadow-lg"
              >
                Explore Creator Filters
                <span aria-hidden className="text-base">
                  →
                </span>
              </MotionLink>
              <MotionLink
                href="/discover"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-slate-200/90 bg-white px-6 py-2.5 text-[0.9375rem] font-semibold tracking-tight text-slate-900 shadow-sm shadow-slate-900/[0.04] ring-1 ring-inset ring-slate-900/[0.04] transition hover:border-slate-300 hover:bg-slate-50/80"
              >
                View All Categories
              </MotionLink>
            </div>

            <div className="my-5 h-px w-full bg-slate-200/95 sm:my-6" aria-hidden />

            <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 md:grid-cols-4 md:gap-x-5 lg:justify-between">
              {stats.map((s, i) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: 0.06 * i, duration: 0.45 }}
                  className="flex min-w-0 gap-3 text-left"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 shadow-sm">
                    <s.icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[0.8125rem] font-bold leading-tight tracking-tight text-slate-900 sm:text-sm">
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] font-normal leading-snug text-slate-500 sm:text-[13px]">
                      {s.subtitle}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            </div>
            </div>
          </div>
        </div>

        <TrustedBy />


      </div>
    </SectionShell>
  );
}
