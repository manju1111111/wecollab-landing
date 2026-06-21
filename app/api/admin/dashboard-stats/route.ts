import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTasks, getActivities } from "@/lib/supabase/fallback-db";

function getSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();

    // 1. Fetch total creators count
    const { count: totalCreators } = await supabase
      .from("creators")
      .select("*", { count: "exact", head: true });

    // 2. Fetch active creators (verified creators)
    const { count: activeCreators } = await supabase
      .from("creators")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "Verified");

    // 3. Fetch creators added today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: newCreatorsToday } = await supabase
      .from("creators")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString());

    // 4. Fetch pending verifications (ready for review)
    const { count: pendingVerifications } = await supabase
      .from("creators")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "Ready for Review");

    // 5. Fetch employees count
    const { count: totalEmployees } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // 6. Fetch employee activities (online/offline status)
    const activitiesList = await getActivities(supabase);
    const activeEmployeesToday = activitiesList.filter((a: any) => a.status !== "offline").length;

    // 7. Fetch all tasks
    const allTasks = await getTasks(supabase);
    const tasksPending = allTasks.filter((t: any) => !t.completed_at).length;

    // 8. Fetch active campaigns
    const { count: campaignsRunning } = await supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // 9. Fetch all creators for distribution & growth charts
    const { data: allCreators } = await supabase
      .from("creators")
      .select("tags, platforms, created_at, assigned_employee");

    // 10. Compute category and platform distributions
    const categoryCounts: Record<string, number> = {};
    const platformCounts: Record<string, number> = {};
    const employeeCreatorCountMap: Record<string, number> = {};

    if (allCreators) {
      allCreators.forEach(c => {
        if (c.tags && Array.isArray(c.tags)) {
          c.tags.forEach((tag: string) => {
            categoryCounts[tag] = (categoryCounts[tag] || 0) + 1;
          });
        }
        if (c.platforms && Array.isArray(c.platforms)) {
          c.platforms.forEach((p: any) => {
            const pName = typeof p === 'string' ? p : p.name;
            if (pName) {
              platformCounts[pName] = (platformCounts[pName] || 0) + 1;
            }
          });
        }
        if (c.assigned_employee) {
          employeeCreatorCountMap[c.assigned_employee] = (employeeCreatorCountMap[c.assigned_employee] || 0) + 1;
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

    // 11. Growth data (last 7 days cumulative)
    const growthDataMap: Record<string, number> = {};
    const dateRange: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      dateRange.push(dateStr);
      growthDataMap[dateStr] = 0;
    }

    if (allCreators) {
      allCreators.forEach(c => {
        if (c.created_at) {
          const dateStr = new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          if (dateStr in growthDataMap) {
            growthDataMap[dateStr]++;
          }
        }
      });
    }

    // Cumulative sum
    let cumulative = (totalCreators || 0) - Object.values(growthDataMap).reduce((a, b) => a + b, 0);
    const growthData = dateRange.map(date => {
      cumulative += growthDataMap[date];
      return { name: date, value: cumulative };
    });

    // 12. Team Overview Widget
    const { data: employeesData } = await supabase
      .from("employees")
      .select("id, full_name, email, role, department, designation, status")
      .eq("status", "active");

    const employeeTaskCompletedMap: Record<string, number> = {};
    allTasks.forEach((t: any) => {
      if (t.completed_at && t.employee_id) {
        employeeTaskCompletedMap[t.employee_id] = (employeeTaskCompletedMap[t.employee_id] || 0) + 1;
      }
    });

    const enrichedEmployees = (employeesData || []).map(emp => ({
      id: emp.id,
      full_name: emp.full_name,
      role: emp.role,
      status: emp.status,
      assigned_count: employeeCreatorCountMap[emp.id] || 0,
      tasks_completed: employeeTaskCompletedMap[emp.id] || 0
    }));

    // 13. Upcoming Schedule (next tasks due)
    const upcomingTasks = allTasks
      .filter((t: any) => !t.completed_at && t.due_date)
      .slice(0, 5)
      .map((t: any) => {
        const d = new Date(t.due_date);
        return {
          id: t.id,
          title: t.title,
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          date: d.toLocaleDateString('en-US', { day: '2-digit' }),
          time: "09:00 AM", // Mock time since tasks table only has date
          creatorId: t.creator_id,
          employeeId: t.employee_id
        };
      });

    // 14. Recent Activity Log
    const { data: activitiesLog } = await supabase
      .from("employee_activity_log")
      .select("id, employee_id, type, description, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const logWithEmployees = await Promise.all(
      (activitiesLog || []).map(async (log) => {
        const emp = (employeesData || []).find(e => e.id === log.employee_id);
        const diff = Math.floor((new Date().getTime() - new Date(log.created_at).getTime()) / 60000);
        const timeStr = diff < 1 ? "Just now" : diff < 60 ? `${diff}m ago` : `${Math.floor(diff/60)}h ago`;

        return {
          type: log.type,
          content: log.description,
          time: timeStr,
          icon: log.type === 'create' ? 'create' : log.type === 'verify' ? 'verify' : 'update',
          isImage: false,
          color: log.type === 'create' ? 'bg-indigo-100 text-indigo-500' : log.type === 'verify' ? 'bg-emerald-100 text-emerald-500' : 'bg-blue-100 text-blue-500'
        };
      })
    );

    // 15. Search Insights
    const { data: searchLogs } = await supabase
      .from("search_logs")
      .select("query");

    const searchCounts: Record<string, number> = {};
    (searchLogs || []).forEach(log => {
      if (log.query) {
        searchCounts[log.query] = (searchCounts[log.query] || 0) + 1;
      }
    });

    const searchInsights = Object.entries(searchCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, searches]) => ({
        query,
        searches
      }));

    return NextResponse.json({
      metrics: {
        totalCreators: totalCreators || 0,
        activeCreators: activeCreators || 0,
        newCreatorsToday: newCreatorsToday || 0,
        pendingVerifications: pendingVerifications || 0,
        totalEmployees: totalEmployees || 0,
        activeEmployeesToday,
        tasksPending,
        campaignsRunning: campaignsRunning ?? 0
      },
      topCategories,
      topPlatforms,
      growthData,
      enrichedEmployees,
      upcomingTasks,
      activities: logWithEmployees,
      searchInsights
    });
  } catch (error: any) {
    console.error("[DASHBOARD_STATS_API_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
