"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, LogOut, LayoutDashboard, Target, UserCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const CREATOR_NAV_ITEMS = [
  { href: "/creator",          label: "Dashboard",   icon: LayoutDashboard },
  { href: "/creator/campaigns", label: "My Campaigns", icon: Target },
];

interface CreatorMobileDrawerProps {
  creatorName: string;
  initials: string;
  isVerified: boolean;
  logoutAction: () => Promise<void>;
}

export function CreatorMobileDrawer({ creatorName, initials, isVerified, logoutAction }: CreatorMobileDrawerProps) {
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

  return (
    <>
      {/* Hamburger Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors cursor-pointer focus:outline-none"
        aria-label="Open navigation menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Drawer Container */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-full max-w-[280px] bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Creator Logo */}
        <div className="h-[72px] flex items-center justify-between px-6 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-black text-base shadow-sm">
              W
            </div>
            <div>
              <span className="font-bold text-[14px] tracking-tight text-white block">WeCollab</span>
              <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wider -mt-0.5">Creator Console</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu Navigation */}
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 px-2">Console Menu</p>
          <nav className="flex flex-col gap-1">
            {CREATOR_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold transition-all text-[12px] group ${
                    isActive
                      ? "text-white bg-slate-800/60"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition ${
                      isActive ? "text-violet-400" : "text-slate-500 group-hover:text-violet-400"
                    }`}
                    strokeWidth={2}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Card & Logout */}
        <div className="p-4 border-t border-slate-800/60 shrink-0 bg-slate-950">
          <div className="flex items-center gap-3 px-3.5 py-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/40 mb-2">
            <div className="h-8 w-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-[11px] shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-[12px] font-bold text-white truncate flex items-center gap-1.5">
                {creatorName}
                {isVerified && <UserCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                {isVerified ? "Verified Creator" : "Pending Audit"}
              </p>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-slate-500 hover:text-rose-400 hover:bg-rose-50/5 font-bold transition text-[12px] cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5 shrink-0 text-slate-500 hover:text-rose-400" strokeWidth={2} />
              Disconnect
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
