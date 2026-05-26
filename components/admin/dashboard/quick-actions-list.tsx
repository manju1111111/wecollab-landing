"use client";

import { UserPlus, Upload, Download, Users, Bell, CheckCircle2, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImportCSVModal } from "@/components/admin/dashboard/import-csv-modal";
import { AddEmployeeModal } from "@/components/admin/dashboard/add-employee-modal";

export function QuickActionsList() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);

  const actions = [
    { 
      name: "Add Creator", 
      icon: UserPlus, 
      color: "text-blue-600 bg-blue-50 border-blue-100",
      onClick: () => router.push("/admin/creators?action=add")
    },
    { 
      name: "Import CSV", 
      icon: Upload, 
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      onClick: () => setIsImportModalOpen(true)
    },
    { 
      name: "Export Database", 
      icon: Download, 
      color: "text-amber-600 bg-amber-50 border-amber-100",
      loading: isExporting,
      onClick: async () => {
        setIsExporting(true);
        try {
          window.location.href = "/api/creators/export";
        } finally {
          setTimeout(() => setIsExporting(false), 1000);
        }
      }
    },
    { 
      name: "Add Employee", 
      icon: Users, 
      color: "text-purple-600 bg-purple-50 border-purple-100",
      onClick: () => setIsAddEmployeeModalOpen(true)
    },
    { name: "Send Notification", icon: Bell, color: "text-rose-600 bg-rose-50 border-rose-100" },
    { name: "Assign Task", icon: CheckCircle2, color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
      <h3 className="text-[14px] font-bold text-slate-900 mb-4 px-1">Quick Actions</h3>
      <div className="flex flex-col gap-1">
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button 
              key={i} 
              onClick={() => {
                if (action.onClick) action.onClick();
                else console.log("Action coming soon:", action.name);
              }}
              disabled={action.loading}
              className={`flex items-center justify-between p-3 rounded-2xl transition-colors group ${
                action.loading ? 'opacity-70 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white border border-slate-100 shadow-sm p-1.5 rounded-lg flex items-center justify-center">
                  <Icon className={`h-4 w-4 ${action.color} ${action.loading ? 'animate-bounce' : ''}`} strokeWidth={2.5} />
                </div>
                <span className="text-[13px] font-semibold text-slate-700">
                  {action.name} {action.loading && '...'}
                </span>
              </div>
              <ChevronRight className={`h-4 w-4 text-slate-300 transition-colors ${!action.loading && 'group-hover:text-slate-500'}`} />
            </button>
          );
        })}
      </div>
      
      <ImportCSVModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
      />
    </div>
  );
}
