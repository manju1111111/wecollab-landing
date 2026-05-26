import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { OverviewMetricsStrip } from "@/components/admin/dashboard/overview-metrics-strip";
import { AdminProfile } from "@/components/admin/dashboard/admin-profile";
import { QuickActionsList } from "@/components/admin/dashboard/quick-actions-list";
import { ProgressOverview } from "@/components/admin/dashboard/progress-overview";
import { TimeTracker } from "@/components/admin/dashboard/time-tracker";
import { EmployeeActivityList } from "@/components/admin/dashboard/employee-activity-list";
import { OnboardingProgress } from "@/components/admin/dashboard/onboarding-progress";
import { CreatorGrowthChart } from "@/components/admin/dashboard/creator-growth-chart";
import { CreatorsByCategory } from "@/components/admin/dashboard/creators-by-category";
import { PlatformDistribution } from "@/components/admin/dashboard/platform-distribution";
import { UpcomingSchedule } from "@/components/admin/dashboard/upcoming-schedule";
import { RecentActivityFeed } from "@/components/admin/dashboard/recent-activity-feed";
import { TopSearchInsights } from "@/components/admin/dashboard/top-search-insights";
import { Scissors, CheckCircle, FileSpreadsheet, UserPlus } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  // 1. Fetch total creators
  const { count: totalCreators } = await supabase
    .from("creators")
    .select("*", { count: "exact", head: true });

  // 2. Fetch today's creators
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: newCreatorsToday } = await supabase
    .from("creators")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  // 3. Fetch pending verifications
  const { count: pendingVerifications } = await supabase
    .from("creators")
    .select("*", { count: "exact", head: true })
    .eq("verified", false);

  // 4. Fetch recent creators for activity feed
  const { data: recentCreators } = await supabase
    .from("creators")
    .select("id, name, created_at, profile_image")
    .order("created_at", { ascending: false })
    .limit(5);

  const activities = recentCreators?.map(c => {
    // calculate time ago roughly
    const diff = Math.floor((new Date().getTime() - new Date(c.created_at).getTime()) / 60000);
    const timeStr = diff < 60 ? `${diff} min ago` : `${Math.floor(diff/60)} hr ago`;
    return {
      type: "new_creator",
      content: `New creator ${c.name} added`,
      time: timeStr,
      icon: c.profile_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
      isImage: !!c.profile_image
    };
  }) || [];

  // 5. Fetch all creators to aggregate categories, platforms, and growth
  const { data: allCreators } = await supabase
    .from("creators")
    .select("tags, platforms, created_at");

  // Aggregate tags (categories)
  const categoryCounts: Record<string, number> = {};
  // Aggregate platforms
  const platformCounts: Record<string, number> = {};

  if (allCreators) {
    allCreators.forEach(c => {
      if (c.tags && Array.isArray(c.tags)) {
        c.tags.forEach((tag: string) => {
          categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
        });
      }
      if (c.platforms && Array.isArray(c.platforms)) {
        c.platforms.forEach((p: any) => {
          if (p.name) {
            platformCounts[p.name] = (platformCounts[p.name] || 0) + 1;
          }
        });
      }
    });
  }

  const categoryColors = ['#3b82f6', '#2563eb', '#f59e0b', '#fcd34d', '#10b981', '#8b5cf6'];
  const platformColors = ['#ef4444', '#3b82f6', '#1e3a8a', '#60a5fa', '#2563eb'];

  const totalTags = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, val], i) => ({
      name,
      value: totalTags > 0 ? Math.round((val / totalTags) * 100) : 0,
      color: categoryColors[i % categoryColors.length]
    }));

  const totalPlats = Object.values(platformCounts).reduce((a, b) => a + b, 0);
  const topPlatforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, val], i) => ({
      name,
      value: totalPlats > 0 ? Math.round((val / totalPlats) * 100) : 0,
      color: platformColors[i % platformColors.length]
    }));

  // 6. Aggregate growth data (mocking the last 7 days based on actual DB creation dates for MVP)
  const growthDataMap: Record<string, number> = {};
  if (allCreators) {
    allCreators.forEach((c: any) => {
      // Assuming we selected created_at. Let's add it to the select query above!
      if (c.created_at) {
        const date = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        growthDataMap[date] = (growthDataMap[date] || 0) + 1;
      }
    });
  }

  // Convert map to sorted array of {name, value}
  let cumulativeCount = 0;
  const growthData = Object.entries(growthDataMap)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, count]) => {
      cumulativeCount += count;
      return { name: date, value: cumulativeCount };
    });

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <PageHeader />

      {/* Metrics Strip */}
      <OverviewMetricsStrip 
        totalCreators={totalCreators || 0}
        activeCreators={totalCreators ? Math.floor(totalCreators * 0.8) : 0} // mock active
        newCreatorsToday={newCreatorsToday || 0}
        pendingVerifications={pendingVerifications || 0}
      />

      {/* Main Complex Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        
        {/* Left Column (Span 3) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
          <AdminProfile />
          <QuickActionsList />
        </div>

        {/* Right Area (Span 9) */}
        <div className="xl:col-span-9 flex flex-col gap-6">
          
          {/* Row 1: Progress, Tracker, Activity, Onboarding */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <ProgressOverview />
            <TimeTracker />
            <EmployeeActivityList />
            <OnboardingProgress />
          </div>

          {/* Row 2: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CreatorGrowthChart data={growthData} />
            </div>
            <div className="lg:col-span-1">
              <CreatorsByCategory 
                data={topCategories.length > 0 ? topCategories : undefined} 
                total={totalCreators || 0}
              />
            </div>
            <div className="lg:col-span-1">
              <PlatformDistribution 
                data={topPlatforms.length > 0 ? topPlatforms : undefined}
                total={totalCreators || 0}
              />
            </div>
          </div>

          {/* Row 3: Schedule, Activity, Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <UpcomingSchedule />
            <RecentActivityFeed activities={activities.length > 0 ? activities : undefined} />
            <TopSearchInsights />
          </div>

        </div>
      </div>
    </div>
  );
}
