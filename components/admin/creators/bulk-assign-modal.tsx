"use client";

import { useState, useEffect } from "react";
import { X, Users, CheckCircle2, UserPlus } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  role: string;
  assigned_count: number;
  status?: string;
}

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onAssign: (employeeId: string) => Promise<void>;
}

export function BulkAssignModal({ isOpen, onClose, selectedCount, onAssign }: BulkAssignModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setSelected("");
      fetch("/api/admin/employees")
        .then(r => r.json())
        .then(d => setEmployees((d.employees || []).filter((e: Employee) => e.status === "active" || e.status === "invited")))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!selected) return;
    setIsLoading(true);
    try {
      await onAssign(selected);
      setSuccess(true);
    } catch (e) {
      alert("Failed to assign creators. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const emp = employees.find(e => e.id === selected);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Assign to Employee</h2>
              <p className="text-[13px] text-slate-500 font-medium mt-0.5">
                {selectedCount} creator{selectedCount !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Assigned Successfully</h3>
            <p className="text-[14px] text-slate-600 mb-6">
              {selectedCount} creator{selectedCount !== 1 ? "s" : ""} assigned to <strong>{emp?.full_name}</strong>.
              They will appear in the employee's workspace immediately.
            </p>
            <button
              onClick={onClose}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700">Select Employee</label>
              <select
                value={selected}
                onChange={e => setSelected(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">— Choose an employee —</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.role}) — {emp.assigned_count} creators
                  </option>
                ))}
              </select>
            </div>

            {selected && emp && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 font-bold text-[13px] shrink-0">
                  {emp.full_name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">{emp.full_name}</p>
                  <p className="text-[12px] text-indigo-600 font-medium">
                    Currently managing {emp.assigned_count} creators · Will become {emp.assigned_count + selectedCount}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-2 pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 h-11 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selected || isLoading}
                className="px-5 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? "Assigning..." : `Assign ${selectedCount} Creator${selectedCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
