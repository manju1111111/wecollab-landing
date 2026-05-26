"use client";

import { useEffect, useRef } from "react";
import { useInView, useScroll, useTransform, motion } from "framer-motion";

export function ThemeTrigger({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { margin: "-5% 0px 0px 0px" });

  useEffect(() => {
    if (isInView) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isInView]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 90%", "start 25%"],
  });

  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ["inset(40px 5% 0px 5% round 3rem 3rem 0px 0px)", "inset(0px 0% 0px 0% round 0px 0px 0px 0px)"]
  );

  return (
    <motion.div
      ref={containerRef}
      style={{ clipPath }}
      className="relative bg-[#020617] will-change-transform"
    >
      {/* Blend overlay to soften the top edge against the light page */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-[#fafbff] via-[#fafbff]/50 to-transparent dark:from-[#fafbff] dark:via-[#fafbff]/40 dark:to-transparent" />
      {children}
    </motion.div>
  );
}
