"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { NumberTicker } from "./number-ticker";
import {
  LayoutGrid,
  ShieldCheck,
  Users,
  Sparkles,
  BarChart3,
  Heart,
  User,
} from "lucide-react";

const miniStats = [
  {
    icon: Users,
    numValue: 10,
    suffix: "K+",
    label: "Verified Creators",
  },
  {
    icon: LayoutGrid,
    numValue: 236,
    suffix: "+",
    label: "Niches Covered",
  },
  {
    icon: Sparkles,
    value: "AI Matching",
    label: "Smart Recommendations",
  },
  {
    icon: ShieldCheck,
    value: "100% Verified",
    label: "Authentic Profiles",
  },
];

/** Decorative creator faces on the Discover Creators CTA. */
const discoverCreatorAvatars = [
  "/assets/discover-creator-1.png",
  "/assets/discover-creator-2.png",
  "/assets/discover-creator-3.png",
] as const;

const gradientWord = "bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent";

export function Hero() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 150]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const y3 = useTransform(scrollY, [0, 1000], [0, 80]);

  const textRevealVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <section className="relative z-0 flex min-h-dvh flex-col overflow-x-clip overflow-y-visible bg-white">
      {/* Ambient page glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-10%] top-[14%] h-[min(520px,58vw)] w-[min(520px,58vw)] rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.2)_0%,rgba(243,232,255,0.08)_42%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-12%] right-[-14%] h-[min(480px,55vw)] w-[min(480px,55vw)] rounded-full bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.12)_0%,rgba(196,181,253,0.12)_38%,transparent_72%)]"
      />

      <div className="relative z-10 flex w-full flex-1 flex-col justify-center px-5 pb-12 pt-[calc(4.25rem+clamp(2rem,8vmin,4.5rem))] sm:px-8 sm:pb-16 sm:pt-[calc(4.25rem+clamp(2.5rem,10vmin,5.5rem))] lg:px-10 lg:pb-20 lg:pt-[calc(4.25rem+clamp(3rem,9vmin,6rem))]">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="grid grid-cols-1 items-start gap-10 sm:gap-12 lg:grid-cols-2 lg:grid-rows-[auto_auto] lg:gap-x-10 lg:gap-y-0 xl:gap-x-14">
            {/* Left column — copy + CTAs (row 1) */}
            <div className="flex max-w-2xl flex-col items-start text-left lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:max-w-none">
              <motion.h1
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-900 text-[2.375rem] sm:text-[2.875rem] sm:leading-[1.06] md:text-[3.25rem] lg:text-[3.5rem] xl:text-[3.75rem] 2xl:text-[4rem]"
              >
                <motion.span variants={textRevealVariants} className="block inline-block mr-2">Find</motion.span>
                <motion.span variants={textRevealVariants} className="block inline-block mr-2">the</motion.span>
                <motion.span variants={textRevealVariants} className="block inline-block mr-2">
                  <span className={gradientWord}>Right</span>
                </motion.span>
                <br />
                <motion.span variants={textRevealVariants} className="block inline-block mr-2">
                  <span className={gradientWord}>Creator</span>
                </motion.span>
                <motion.span variants={textRevealVariants} className="block inline-block mr-2">for</motion.span>
                <motion.span variants={textRevealVariants} className="block inline-block mr-2">Every</motion.span>
                <br />
                <motion.span variants={textRevealVariants} className="block inline-block">Campaign</motion.span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-3 max-w-[36rem] text-[1.0625rem] leading-relaxed text-slate-600 sm:mt-4 sm:text-[1.125rem] lg:text-lg lg:leading-relaxed"
              >
                <span className="block">Connect with creators that match your brand,</span>
                <span className="block">audience, and campaign goals.</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mt-5 flex w-full flex-wrap items-center gap-4 sm:mt-6 sm:gap-5"
              >
                <Link href="#cta" passHref legacyBehavior>
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="group inline-flex min-h-[3.25rem] shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 px-8 text-[0.9375rem] font-semibold tracking-tight text-white shadow-md shadow-slate-900/15 ring-1 ring-white/10 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                  Join for Free
                  <span
                    aria-hidden
                    className="text-base transition-transform duration-200 ease-out group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                  </motion.a>
                </Link>
                <Link href="/discover" passHref legacyBehavior>
                  <motion.a
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="group inline-flex min-h-[3.25rem] shrink-0 items-center gap-2.5 rounded-full border border-slate-200/90 bg-white/85 pl-2 pr-8 text-[0.9375rem] font-semibold tracking-tight text-slate-900 shadow-sm shadow-slate-900/[0.04] ring-1 ring-inset ring-slate-900/[0.04] backdrop-blur-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md hover:shadow-slate-900/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                  >
                  <span className="flex shrink-0 -space-x-2 pr-0.5" aria-hidden>
                    {discoverCreatorAvatars.map((src) => (
                      <span
                        key={src}
                        className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm transition duration-200 group-hover:border-slate-100"
                      >
                        <Image
                          src={src}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </span>
                    ))}
                  </span>
                  Discover Creators
                  </motion.a>
                </Link>
              </motion.div>
            </div>

            <div
              className="relative z-20 mt-3 w-full max-w-2xl lg:col-span-1 lg:col-start-1 lg:row-start-2 lg:mt-4 lg:max-w-none lg:translate-y-0 lg:translate-x-0"
              aria-label="Platform highlights"
            >
              <div className="relative flex overflow-hidden pb-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: 20,
                  }}
                  className="flex w-max flex-nowrap gap-3 sm:gap-4 lg:gap-3 xl:gap-4 pr-3 sm:pr-4 lg:pr-3 xl:pr-4"
                >
                  {[...miniStats, ...miniStats, ...miniStats].map((row, idx) => (
                    <div
                      key={`${row.value}-${idx}`}
                      className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-violet-50/65 border border-violet-100/45 px-3.5 py-2 shadow-[0_4px_12px_rgba(139,92,246,0.02)] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-violet-50/90 sm:gap-3"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100/90 text-violet-600 sm:h-10 sm:w-10">
                        <row.icon className="h-[1.125rem] w-[1.125rem] sm:h-5 sm:w-5" strokeWidth={1.75} aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-[13px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[14px]">
                          {'numValue' in row ? (
                            <NumberTicker value={row.numValue as number} suffix={row.suffix as string} />
                          ) : (
                            row.value
                          )}
                        </p>
                        {row.label ? (
                          <p className="mt-0.5 whitespace-nowrap text-[10px] font-medium leading-snug text-slate-500 sm:text-[11px]">
                            {row.label}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* Right column — glow + hero art (spans both rows beside copy + stats) */}
            <div className="relative mx-auto min-w-0 w-full max-w-lg lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:-mr-20 lg:max-w-none lg:w-[calc(100%+5rem)] xl:-mr-40 xl:w-[calc(100%+9rem)] 2xl:-mr-48 2xl:w-[calc(100%+11rem)]">
              <motion.div
                style={{ y: y1 }}
                aria-hidden
                className="pointer-events-none absolute bottom-[5%] left-1/2 h-[min(1120px,92%)] w-[min(100%,1240px)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.32)_0%,rgba(167,139,250,0.12)_40%,transparent_70%)] blur-2xl sm:h-[min(1280px,94%)] sm:w-[min(100%,1400px)]"
              />
              <motion.div
                style={{ y: y2 }}
                aria-hidden
                className="pointer-events-none absolute right-[5%] top-[18%] h-60 w-60 rounded-full bg-fuchsia-400/20 blur-3xl sm:right-[8%] lg:h-72 lg:w-72"
              />

              <div className="relative z-10 flex h-full min-h-[min(60vw,320px)] w-full justify-center pt-2 sm:min-h-[min(56vw,380px)] sm:pt-0 lg:min-h-0 lg:justify-end lg:pt-0">
                <div className="relative mx-auto w-full max-w-[min(100%,80rem)] sm:max-w-[min(100%,88rem)] lg:mx-0 lg:ml-auto lg:max-w-[min(100%,min(100rem,calc(96vw-0.5rem)))] xl:max-w-[min(100%,132rem)] lg:right-16 xl:right-24 2xl:right-28">
                  {/* Floating Decorative Cards */}
                  {/* Chart Icon Card */}
                  <motion.div
                    style={{ y: y1 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="absolute left-[3%] top-[20%] z-10 hidden sm:flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/50 bg-white/95 text-violet-600 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-sm"
                  >
                    <BarChart3 className="h-5 w-5" strokeWidth={2} />
                  </motion.div>

                  {/* User Profile Card */}
                  <motion.div
                    style={{ y: y2 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="absolute right-[-2%] top-[38%] z-10 hidden sm:flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-[0_8px_30px_rgba(109,40,217,0.25)]"
                  >
                    <User className="h-5 w-5" strokeWidth={2} />
                  </motion.div>

                  {/* Heart Icon Card */}
                  <motion.div
                    style={{ y: y3 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="absolute right-[4%] bottom-[20%] z-10 hidden sm:flex h-11 w-11 items-center justify-center rounded-full bg-white text-rose-500 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                  >
                    <Heart className="h-5 w-5 fill-rose-500" strokeWidth={2} />
                  </motion.div>

                  {/* Bottom fade + soft corner blur into next section */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[clamp(3.25rem,16vw,7rem)] bg-gradient-to-t from-white/55 from-25% via-white/25 to-transparent backdrop-blur-[1px] sm:from-white/45 sm:via-white/18 sm:backdrop-blur-[2px]"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 right-0 z-[2] h-[min(38%,10rem)] w-[min(55%,18rem)] translate-y-1/4 rounded-full bg-gradient-to-tl from-white/35 via-white/15 to-transparent blur-xl sm:h-40 sm:w-72 sm:translate-y-0 sm:blur-2xl"
                  />
                  <Image
                    src="/assets/hero-creators.png"
                    alt="Diverse creators with cameras, phones, mics, and creative gear"
                    width={997}
                    height={608}
                    priority
                    quality={100}
                    unoptimized
                    sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 90vw, min(100vw, 132rem)"
                    className="pointer-events-none relative z-[1] h-auto w-full max-h-[min(100vh,1150px)] object-contain object-bottom drop-shadow-[0_18px_40px_rgba(15,23,42,0.09)] drop-shadow-[0_6px_14px_rgba(15,23,42,0.05)] sm:max-h-[min(100vh,1280px)] lg:max-h-[min(100vh,1380px)] lg:object-right xl:max-h-[min(100vh,1480px)] 2xl:max-h-[min(100vh,1580px)]"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
