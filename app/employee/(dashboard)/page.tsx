import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { CheckSquare, RefreshCcw } from "lucide-react";

export default async function EmployeeDashboardPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("employee_session");
  const session = sessionCookie ? JSON.parse(sessionCookie.value) : null;

  const supabase = await createClient();
  
  // Fetch employee details
  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", session?.id)
    .single();

  // Fetch assigned creators
  const { data: assignedCreators } = await supabase
    .from("creators")
    .select("id")
    .eq("assigned_employee", session?.id);

  const firstName = employee?.full_name?.split(' ')[0] || "There";
  const tasksCount = assignedCreators?.length || 0;

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back, {firstName}</h1>
          <p className="text-slate-500 text-[14px] font-medium mt-1">Here is what's happening in your workspace today.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex flex-col min-w-[120px]">
            <span className="text-[12px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Assigned</span>
            <span className="text-2xl font-black text-indigo-900">{tasksCount}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex flex-col min-w-[120px]">
            <span className="text-[12px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Completed</span>
            <span className="text-2xl font-black text-emerald-900">0</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      {tasksCount > 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex-1">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Your Pending Tasks</h2>
          {/* List tasks here... */}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 border-dashed flex-1 flex flex-col items-center justify-center text-center p-12">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
            <CheckSquare className="h-8 w-8 text-slate-300" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">No Tasks Assigned Yet</h2>
          <p className="text-[14px] text-slate-500 font-medium max-w-[300px] mb-8">
            Once an Admin imports creators or assigns them to you, they will appear here automatically.
          </p>
          <button className="h-11 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] rounded-xl shadow-lg shadow-slate-200 transition-colors flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh Workspace
          </button>
        </div>
      )}
      
    </div>
  );
}
