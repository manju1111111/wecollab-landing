"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, CheckSquare, TrendingUp, Target, Clock, Mail, Briefcase, Shield } from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  designation: string;
  status: string;
  assigned_count: number;
  tasks_completed: number;
  created_at: string;
}

interface Creator {
  id: string;
  name: string;
  username: string;
  followers: number;
  engagement_rate: number;
  category: string;
}

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function Initials({ name, size = "lg" }: { name: string; size?: "lg" | "sm" }) {
  const initials = name.split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const colors = ["from-indigo-400 to-violet-500", "from-rose-400 to-pink-500", "from-fuchsia-400 to-primary", "from-emerald-400 to-teal-500"];
  const g = colors[name.charCodeAt(0) % colors.length];
  const sz = size === "lg" ? "h-16 w-16 text-xl" : "h-8 w-8 text-[11px]";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${g} flex items-center justify-center text-white font-bold shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        // Fetch employee
        const empRes = await fetch("/api/admin/employees");
        const empData = await empRes.json();
        const emp = (empData.employees || []).find((e: Employee) => e.id === employeeId);
        setEmployee(emp || null);

        // Fetch assigned creators
        const creatorsRes = await fetch(`/api/admin/employee-creators?employeeId=${employeeId}`);
        const creatorsData = await creatorsRes.json();
        setCreators(creatorsData.creators || []);

        // Fetch tasks
        const tasksRes = await fetch(`/api/admin/employee-tasks?employeeId=${employeeId}`);
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
      } catch (e) {
        console.error("[EMPLOYEE_DETAIL]", e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [employeeId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Users className="h-10 w-10 text-slate-200 mb-3" />
        <h2 className="text-lg font-bold text-slate-700 mb-1">Employee Not Found</h2>
        <Link href="/admin/employees" className="text-[14px] text-indigo-600 font-semibold mt-2">← Back to Team</Link>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.completed_at).length;
  const pendingTasks = tasks.filter(t => !t.completed_at).length;
  const overdueTasks = tasks.filter(t => !t.completed_at && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString())).length;
  const totalFollowers = creators.reduce((s, c) => s + (c.followers || 0), 0);

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    invited: "bg-amber-100 text-amber-700 border-amber-200",
    deactivated: "bg-rose-100 text-rose-600 border-rose-200",
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Back + Header */}
      <div>
        <Link href="/admin/employees" className="text-[13px] text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-1 mb-4 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Team
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-5">
          <Initials name={employee.full_name} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{employee.full_name}</h1>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[employee.status] || STATUS_COLORS.active}`}>
                {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[13px] text-slate-500 font-medium flex-wrap">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {employee.email}</span>
              <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {employee.role}</span>
              {employee.department && <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {employee.department}</span>}
              {employee.designation && <span className="text-slate-400">· {employee.designation}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Assigned Creators" value={creators.length} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={TrendingUp} label="Total Reach" value={fmt(totalFollowers)} color="bg-blue-50 text-blue-600" />
        <StatCard icon={CheckSquare} label="Tasks Done" value={completedTasks} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Target} label="Pending / Overdue" value={`${pendingTasks} / ${overdueTasks}`} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Two columns: Creators + Tasks */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

        {/* Assigned Creators */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-[15px]">Assigned Creators ({creators.length})</h3>
          </div>
          {creators.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-slate-400">No creators assigned yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="text-left px-5 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Creator</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Category</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">Followers</th>
                    <th className="text-right px-5 py-3 font-semibold text-slate-400 text-[11px] uppercase tracking-wider">ER%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {creators.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3">
                        <div>
                          <span className="font-semibold text-slate-900">{c.name}</span>
                          <span className="text-slate-400 ml-1 text-[12px]">@{c.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-1 rounded-full">{c.category || "General"}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">{fmt(c.followers || 0)}</td>
                      <td className="px-5 py-3 text-right font-bold text-slate-600">{c.engagement_rate || 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-[15px]">Tasks ({tasks.length})</h3>
            <div className="flex gap-2 text-[11px] font-bold">
              <span className="text-emerald-600">{completedTasks} done</span>
              <span className="text-slate-300">·</span>
              <span className="text-amber-600">{pendingTasks} pending</span>
            </div>
          </div>
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-slate-400">No tasks yet.</div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {tasks.slice(0, 20).map(t => {
                const done = !!t.completed_at;
                const overdue = !done && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString());
                return (
                  <div key={t.id} className="flex items-start gap-3 px-5 py-3">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${done ? "bg-emerald-400" : overdue ? "bg-rose-400" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${done ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {t.title}
                      </p>
                      {t.due_date && (
                        <p className={`text-[11px] font-medium flex items-center gap-1 ${overdue ? "text-rose-500" : "text-slate-400"}`}>
                          <Clock className="h-3 w-3" />
                          {overdue ? "Overdue · " : ""}{new Date(t.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
