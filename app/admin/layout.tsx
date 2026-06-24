"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { 
  LayoutDashboard, 
  Users, 
  Building2,
  UserCog,
  CheckSquare,
  CheckCircle,
  BarChart, 
  Mail,
  Calendar,
  Activity,
  Settings, 
  Search, 
  Bell, 
  Plus,
  Menu,
  X,
} from "lucide-react";
import { AdminProfileDropdown } from "@/components/admin/layout/admin-profile-dropdown";
import { AdminProfileProvider } from "@/components/admin/layout/admin-profile-context";
import { NotificationBell } from "@/components/notifications/notification-bell";

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Creators", href: "/admin/creators", icon: Users },
  { name: "Instagram Sync", href: "/admin/instagram-sync", icon: Instagram },
  { name: "Brands", href: "/admin/brands", icon: Building2 },
  { name: "Employees", href: "/admin/employees", icon: UserCog },
  { name: "Tasks", href: "/admin/tasks", icon: CheckSquare },
  { name: "Approvals", href: "/admin/approvals", icon: CheckCircle },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart },
  { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { name: "Calendar", href: "/admin/calendar", icon: Calendar },
  { name: "Activity", href: "/admin/activity", icon: Activity },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close drawer on path change
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Don't show custom layout on login page
  if (pathname === "/admin/login") {
    return <AdminProfileProvider>{children}</AdminProfileProvider>;
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear only device-local UI preferences
    localStorage.removeItem("wecollab_ui_prefs");
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <AdminProfileProvider>
      <div className="flex flex-col min-h-screen bg-[#f1f5f9] font-sans">
        {/* Top Navbar */}
        <header className="flex h-20 shrink-0 items-center justify-between px-4 xl:px-8 bg-[#f1f5f9]">
          {/* Left: Logo & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-all shadow-sm bg-white cursor-pointer focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="bg-white px-4 py-2 rounded-full shadow-sm flex items-center justify-center">
              <span className="text-xl font-bold tracking-tight text-slate-900">WeCollab</span>
            </div>
          </div>

          {/* Center: Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-white p-1 rounded-full shadow-sm">
            {sidebarLinks.map((link) => {
              const isActive = link.href === "/admin" 
                ? pathname === "/admin" 
                : pathname.startsWith(link.href);
                
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-[#0b3b84] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-3 sm:gap-5">
            <NotificationBell userId="00000000-0000-0000-0000-000000000000" userType="admin" />
            
            <button className="text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
              <Settings className="h-5 w-5" />
            </button>

            <AdminProfileDropdown onLogout={handleLogout} />
          </div>
        </header>

        {/* Sliding Mobile Drawer Overlay */}
        {isDrawerOpen && (
          <div 
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />
        )}

        {/* Sliding Mobile Drawer Container */}
        <div 
          className={`fixed top-0 bottom-0 left-0 z-50 w-full max-w-[280px] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
            <span className="text-xl font-bold tracking-tight text-slate-900">WeCollab</span>
            <button 
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
            {sidebarLinks.map((link) => {
              const isActive = link.href === "/admin" 
                ? pathname === "/admin" 
                : pathname.startsWith(link.href);
              const Icon = link.icon;
                
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsDrawerOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[13.5px] font-bold transition-all ${
                    isActive
                      ? "bg-[#0b3b84] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="bg-white rounded-2xl md:rounded-[32px] w-full min-h-[calc(100vh-140px)] shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminProfileProvider>
  );
}
