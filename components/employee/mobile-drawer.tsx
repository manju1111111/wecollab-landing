"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SidebarLinks } from "@/components/employee/sidebar-links";
import { SidebarProfileCard } from "@/components/employee/sidebar-profile-card";

interface EmployeeMobileDrawerProps {
  initials: string;
  name: string;
  role: string;
  logoutAction: () => Promise<void>;
}

export function EmployeeMobileDrawer({ initials, name, role, logoutAction }: EmployeeMobileDrawerProps) {
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
        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer md:hidden focus:outline-none"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sliding Drawer Container */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 w-full max-w-[260px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Logo */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden shadow-sm shrink-0 border border-slate-200/50">
              <Image src="/assets/logo.jpg" alt="WeCollab Logo" fill className="object-cover" />
            </div>
            <div>
              <span className="font-bold text-[13.5px] tracking-tight text-slate-950 block">WeCollab</span>
              <span className="block text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wider -mt-0.5">Employee Portal</span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Close menu"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Nav Links Section */}
        <div className="p-3.5 flex-1 overflow-y-auto flex flex-col gap-4">
          <div>
            <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 px-2.5">Workspace</p>
            <SidebarLinks />
          </div>
        </div>

        {/* Bottom Section: Settings + Profile */}
        <div className="p-3.5 border-t border-slate-100 shrink-0 flex flex-col gap-2.5 bg-white">
          <div className="flex flex-col gap-0.5">
            <Link
              href="/employee/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold transition-all text-[12px]"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={2} />
              Settings
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-55/50 font-bold transition-all text-[12px] cursor-pointer text-left"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-400 shrink-0" strokeWidth={2} />
                Log out
              </button>
            </form>
          </div>

          <div className="h-px bg-slate-100" />

          <SidebarProfileCard
            initials={initials}
            name={name}
            role={role}
          />
        </div>
      </div>
    </>
  );
}
