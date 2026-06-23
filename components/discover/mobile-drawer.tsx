"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Lightbulb,
  Search,
  LayoutDashboard,
  ClipboardList,
  Bookmark,
  MessageSquare,
  PieChart,
  Bell,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface DiscoverMobileDrawerProps {
  initials: string;
  hasSession: boolean;
  logoutAction?: () => Promise<void>;
}

export function DiscoverMobileDrawer({ initials, hasSession, logoutAction }: DiscoverMobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on path change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navItems = [
    { label: "Creator Search", href: "/discover", icon: Search, active: pathname === "/discover" },
    { label: "Campaign Plans", href: "/plans", icon: ClipboardList, active: pathname === "/plans" },
    { label: "Client Console", href: "/brand", icon: LayoutDashboard, active: pathname.startsWith("/brand") },
    { label: "Inspirations", href: "#", icon: Lightbulb, active: false },
    { label: "Saved Creators", href: "#", icon: Bookmark, active: false },
    { label: "Messages", href: "#", icon: MessageSquare, active: false },
    { label: "Analytics", href: "#", icon: PieChart, active: false },
  ];

  return (
    <>
      {/* Hamburger Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer md:hidden focus:outline-none"
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Drawer Container */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-full max-w-[280px] bg-[#1e2330] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Logo */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
              <Image src="/assets/logo.jpg" alt="WeCollab Logo" fill className="object-cover" />
            </div>
            <div>
              <span className="font-bold text-[14px] tracking-tight text-white block">WeCollab</span>
              <span className="block text-[8.5px] text-slate-500 font-bold uppercase tracking-wider -mt-0.5">Discovery Panel</span>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Console Menu</p>
          <nav className="flex flex-col gap-1.5">
            {navItems.map(({ label, href, icon: Icon, active }) => (
              <Link
                key={label}
                href={href}
                onClick={() => href !== "#" && setIsOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold transition-all text-[12.5px] ${
                  active
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? "text-violet-400" : "text-slate-500"}`} strokeWidth={2} />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Actions & User Profile */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-[#191d29] flex flex-col gap-3">
          <div className="flex items-center justify-between px-2">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-850 hover:text-white transition-colors">
              <Bell className="h-5 w-5" strokeWidth={1.5} />
              <span className="absolute right-2.5 top-2.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#191d29]"></span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                {initials}
              </div>
              <span className="text-[10px] font-bold text-violet-400">28.4k</span>
            </div>
          </div>

          {hasSession && logoutAction && (
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 font-bold transition text-[12px] cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0 text-slate-500 hover:text-rose-400" strokeWidth={2} />
                Disconnect
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
