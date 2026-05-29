"use client";

import { useState, useEffect } from "react";
import { X, Send, Calendar, User, FileText, Users } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  role: string;
  assigned_count: number;
}

interface Creator {
  id: string;
  name: string;
  username: string;
}

interface AdminTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminTaskModal({ isOpen, onClose }: AdminTaskModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedCreator, setSelectedCreator] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
      setTitle("");
      setDueDate("");
      setSelectedEmployee("");
      setSelectedCreator("");

      // Fetch employees
      fetch("/api/admin/employees")
        .then(r => r.json())
        .then(d => setEmployees((d.employees || []).filter((e: any) => e.status === "active" || e.status === "invited")))
        .catch(() => {});
    }
  }, [isOpen]);

  // When employee is selected, fetch their assigned creators
  useEffect(() => {
    if (selectedEmployee) {
      fetch(`/api/admin/employee-creators?employeeId=${selectedEmployee}`)
        .then(r => r.json())
        .then(d => setCreators(d.creators || []))
        .catch(() => setCreators([]));
    } else {
      setCreators([]);
    }
  }, [selectedEmployee]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedEmployee || !title.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/push-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployee,
          title: title.trim(),
          dueDate: dueDate || null,
          creatorId: selectedCreator || null,
        }),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create task");
      }
    } catch (e) {
      alert("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const emp = employees.find(e => e.id === selectedEmployee);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Send className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Push Task to Employee</h2>
              <p className="text-[13px] text-slate-500 font-medium mt-0.5">Assign work directly to a team member</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Send className="h-7 w-7 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Task Pushed!</h3>
            <p className="text-[14px] text-slate-600 mb-6">
              <strong>"{title}"</strong> has been sent to <strong>{emp?.full_name}</strong>.
              It will appear in their task feed immediately.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { setSuccess(false); setTitle(""); setDueDate(""); setSelectedCreator(""); }}
                className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-700 font-bold text-[14px] hover:bg-slate-50 transition-colors"
              >
                Push Another
              </button>
              <button
                onClick={onClose}
                className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-4">

            {/* Employee Picker */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Assign to
              </label>
              <select
                value={selectedEmployee}
                onChange={e => setSelectedEmployee(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">— Select employee —</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.role})</option>
                ))}
              </select>
            </div>

            {/* Task Title */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Task Description
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Contact @virat about campaign proposal"
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Due Date + Creator (side by side) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Link Creator
                </label>
                <select
                  value={selectedCreator}
                  onChange={e => setSelectedCreator(e.target.value)}
                  disabled={!selectedEmployee}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none disabled:opacity-50"
                >
                  <option value="">None</option>
                  {creators.map(c => (
                    <option key={c.id} value={c.id}>@{c.username} — {c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-2 pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 h-11 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedEmployee || !title.trim() || isSubmitting}
                className="px-6 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Pushing..." : "Push Task"}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
