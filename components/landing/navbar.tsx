"use client";

import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { clsx } from "clsx";

const links = [
  { label: "Product", href: "#product", hasChevron: true },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Free Analytics", href: "/analytics" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Creators", href: "#creators" },
  { label: "Resources", href: "#resources", hasChevron: true },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  const [session, setSession] = useState<{
    role: "admin" | "brand" | "employee" | null;
    name: string;
    dashboardUrl: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Parse cookies
    const cookies = document.cookie.split(";").reduce((acc, c) => {
      const [key, val] = c.trim().split("=");
      if (key) acc[key] = decodeURIComponent(val || "");
      return acc;
    }, {} as Record<string, string>);

    const decodeCookie = (cookieVal: string) => {
      try {
        const parts = cookieVal.split(".");
        if (parts.length === 2) {
          const payloadStr = atob(parts[0]);
          return JSON.parse(payloadStr);
        }
        return JSON.parse(cookieVal);
      } catch (e) {
        return null;
      }
    };

    if (cookies.wecollab_admin_profile) {
      try {
        const admin = JSON.parse(cookies.wecollab_admin_profile);
        setSession({
          role: "admin",
          name: admin.fullName || "Admin",
          dashboardUrl: "/admin",
        });
        return;
      } catch (e) {}
    }

    if (cookies.brand_session) {
      try {
        const brand = decodeCookie(cookies.brand_session);
        if (brand) {
          setSession({
            role: "brand",
            name: brand.name || "Brand",
            dashboardUrl: "/discover",
          });
          return;
        }
      } catch (e) {}
    }

    if (cookies.employee_session) {
      try {
        const employee = decodeCookie(cookies.employee_session);
        if (employee) {
          setSession({
            role: "employee",
            name: employee.full_name || "Employee",
            dashboardUrl: "/employee",
          });
          return;
        }
      } catch (e) {}
    }
  }, []);

  const handleSignOut = async () => {
    if (session?.role === "admin") {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (e) {}
      localStorage.removeItem("wecollab_admin_profile");
      document.cookie = "wecollab_admin_profile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } else if (session?.role === "brand") {
      document.cookie = "brand_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } else if (session?.role === "employee") {
      try {
        const { logoutEmployee } = await import("@/app/employee/actions");
        await logoutEmployee();
      } catch (e) {
        document.cookie = "employee_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
    setSession(null);
    window.location.reload();
  };

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
          {mounted && session ? (
            <>
              <Link
                href={session.dashboardUrl}
                className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-[1.1rem] py-2.5 text-[0.9375rem] font-semibold text-white shadow-lg shadow-violet-600/15 transition hover:bg-violet-700"
              >
                Go to Console
                <span aria-hidden className="text-base leading-none">
                  →
                </span>
              </Link>
              <div className="flex items-center gap-2 pl-2 border-l border-violet-100">
                <div className="h-9 w-9 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-violet-700 font-bold text-xs" title={`${session.name} (${session.role})`}>
                  {session.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-[0.9375rem] font-semibold text-slate-500 hover:text-rose-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/brand/login"
                className="text-[0.9375rem] font-semibold text-slate-700 transition-colors hover:text-slate-900"
              >
                Login
              </Link>
              <Link
                href="/brand/login"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-[1.1rem] py-2.5 text-[0.9375rem] font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
              >
                Join for Free
                <span aria-hidden className="text-base leading-none">
                  →
                </span>
              </Link>
            </>
          )}
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
            {mounted && session ? (
              <>
                <Link
                  href={session.dashboardUrl}
                  className="rounded-xl bg-violet-50 text-violet-700 px-3 py-2.5 text-sm font-semibold hover:bg-violet-100 flex items-center justify-between"
                  onClick={() => setOpen(false)}
                >
                  <span>Go to Console ({session.name})</span>
                  <span>→</span>
                </Link>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                  className="mt-1 text-left rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 w-full"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/brand/login"
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-800"
                  onClick={() => setOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/brand/login"
                  className="mt-1 rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
                  onClick={() => setOpen(false)}
                >
                  Join for Free →
                </Link>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </motion.header>
  );
}
