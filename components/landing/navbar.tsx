"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { clsx } from "clsx";

const links = [
  { label: "Product", href: "#product", hasChevron: true },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Creators", href: "#creators" },
  { label: "Resources", href: "#resources", hasChevron: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 8);
  });

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }}
      className={clsx(
        "fixed inset-x-0 top-0 z-50 border-b transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled
          ? "border-violet-100/70 bg-white/80 shadow-[0_1px_0_rgba(255,255,255,0.8)] shadow-violet-200/20 backdrop-blur-xl"
          : "border-transparent bg-white/50 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-[1200px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-md">
            <Image src="/assets/logo.jpg" alt="Wecollab Logo" fill className="object-cover" />
          </div>
          <span className="text-[1.05rem] font-bold tracking-tight text-slate-900">Wecollab</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="group flex items-center gap-0.5 rounded-full px-3.5 py-2 text-[0.9375rem] font-medium text-slate-700 transition-colors hover:bg-violet-50/80 hover:text-slate-900"
            >
              {l.label}
              {l.hasChevron ? (
                <ChevronDown className="h-[0.95rem] w-[0.95rem] opacity-55" strokeWidth={2} />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 sm:flex">
          <Link
            href="#login"
            className="text-[0.9375rem] font-semibold text-slate-700 transition-colors hover:text-slate-900"
          >
            Login
          </Link>
          <Link
            href="#cta"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-[1.1rem] py-2.5 text-[0.9375rem] font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
          >
            Join for Free
            <span aria-hidden className="text-base leading-none">
              →
            </span>
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex rounded-full border border-violet-100/90 bg-white/90 p-2 text-slate-800 shadow-sm backdrop-blur lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-violet-100/80 bg-white/95 px-4 py-4 backdrop-blur-xl lg:hidden"
        >
          <div className="flex flex-col gap-0.5">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-violet-50"
              >
                {l.label}
              </Link>
            ))}
            <hr className="my-2 border-violet-100/80" />
            <Link
              href="#login"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-800"
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
            <Link
              href="#cta"
              className="mt-1 rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Join for Free →
            </Link>
          </div>
        </motion.div>
      ) : null}
    </motion.header>
  );
}
