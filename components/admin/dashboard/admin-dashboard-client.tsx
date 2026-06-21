"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/dashboard/page-header";
import { OverviewMetricsStrip } from "@/components/admin/dashboard/overview-metrics-strip";
import { AdminProfile } from "@/components/admin/dashboard/admin-profile";
import { QuickActionsList } from "@/components/admin/dashboard/quick-actions-list";
import { ProgressOverview } from "@/components/admin/dashboard/progress-overview";
import { TimeTracker } from "@/components/admin/dashboard/time-tracker";
import { EmployeeActivityList } from "@/components/admin/dashboard/employee-activity-list";
import { TeamOverviewWidget } from "@/components/admin/dashboard/team-overview-widget";
import { CreatorGrowthChart } from "@/components/admin/dashboard/creator-growth-chart";
import { CreatorsByCategory } from "@/components/admin/dashboard/creators-by-category";
import { PlatformDistribution } from "@/components/admin/dashboard/platform-distribution";
import { UpcomingSchedule } from "@/components/admin/dashboard/upcoming-schedule";
import { RecentActivityFeed } from "@/components/admin/dashboard/recent-activity-feed";
import { TopSearchInsights } from "@/components/admin/dashboard/top-search-insights";

interface DashboardStats {
  metrics: {
    totalCreators: number;
    activeCreators: number;
    newCreatorsToday: number;
    pendingVerifications: number;
    totalEmployees: number;
    activeEmployeesToday: number;
    tasksPending: number;
    campaignsRunning: number;
  };
  topCategories: any[];
  topPlatforms: any[];
  growthData: any[];
  enrichedEmployees: any[];
  upcomingTasks: any[];
  activities: any[];
  searchInsights: any[];
}

export function AdminDashboardClient({ initialData }: { initialData: DashboardStats }) {
  const [data, setData] = useState<DashboardStats>(initialData);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      const json = await res.json();
      if (json && !json.error) {
        setData(json);
      }
    } catch (e) {
      console.error("[DASHBOARD_CLIENT_REFRESH_ERROR]", e);
    }
  };

  useEffect(() => {
    // 1. Set up BroadcastChannel listeners for instant updates
    let bcCreators: BroadcastChannel | null = null;
    let bcUpdates: BroadcastChannel | null = null;

    try {
      bcCreators = new BroadcastChannel("wecollab-creators");
      bcCreators.onmessage = (event) => {
        console.log("[BROADCAST] Received creator change update, refetching dashboard...", event.data);
        fetchStats();
      };
    } catch (e) {
      console.warn("[BROADCAST] bcCreators not supported:", e);
    }

    try {
      bcUpdates = new BroadcastChannel("wecollab-updates");
      bcUpdates.onmessage = (event) => {
        console.log("[BROADCAST] Received system update, refetching dashboard...", event.data);
        fetchStats();
      };
    } catch (e) {
      console.warn("[BROADCAST] bcUpdates not supported:", e);
    }

    // 2. Set up a backup periodic polling interval (every 15 seconds)
    const interval = setInterval(() => {
      fetchStats();
    }, 15000);

    return () => {
      if (bcCreators) bcCreators.close();
      if (bcUpdates) bcUpdates.close();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <PageHeader />

      {/* Metrics Strip */}
      <OverviewMetricsStrip 
        totalCreators={data.metrics.totalCreators}
        activeCreators={data.metrics.activeCreators}
        newCreatorsToday={data.metrics.newCreatorsToday}
        pendingVerifications={data.metrics.pendingVerifications}
        totalEmployees={data.metrics.totalEmployees}
        activeEmployeesToday={data.metrics.activeEmployeesToday}
        tasksPending={data.metrics.tasksPending}
        campaignsRunning={data.metrics.campaignsRunning}
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
            <TeamOverviewWidget employees={data.enrichedEmployees} />
          </div>

          {/* Row 2: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <CreatorGrowthChart data={data.growthData} />
            </div>
            <div className="lg:col-span-1">
              <CreatorsByCategory 
                data={data.topCategories.length > 0 ? data.topCategories : undefined} 
                total={data.metrics.totalCreators || 0}
              />
            </div>
            <div className="lg:col-span-1">
              <PlatformDistribution 
                data={data.topPlatforms.length > 0 ? data.topPlatforms : undefined}
                total={data.metrics.totalCreators || 0}
              />
            </div>
          </div>

          {/* Row 3: Schedule, Activity, Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <UpcomingSchedule tasks={data.upcomingTasks} />
            <RecentActivityFeed activities={data.activities.length > 0 ? data.activities : undefined} />
            <TopSearchInsights insights={data.searchInsights} />
          </div>

        </div>
      </div>
    </div>
  );
}
