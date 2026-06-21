"use client";

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
} from "lucide-react";
import { AdminProfileDropdown } from "@/components/admin/layout/admin-profile-dropdown";
import { AdminProfileProvider } from "@/components/admin/layout/admin-profile-context";
import { NotificationBell } from "@/components/notifications/notification-bell";

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Creators", href: "/admin/creators", icon: Users },
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
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-5">
            <NotificationBell userId="00000000-0000-0000-0000-000000000000" userType="admin" />
            
            <button className="text-slate-500 hover:text-slate-800 transition-colors">
              <Settings className="h-5 w-5" />
            </button>

            <AdminProfileDropdown onLogout={handleLogout} />
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
          <div className="bg-white rounded-[32px] w-full min-h-[calc(100vh-140px)] shadow-sm overflow-hidden p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminProfileProvider>
  );
}
