"use client";

import { useState } from "react";
import { X, Mail, CheckCircle2, User, Briefcase, Phone, Users } from "lucide-react";
import { inviteEmployee } from "@/app/employee/actions";

export function AddEmployeeModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessLink(null);

    const formData = new FormData(e.currentTarget);
    const result = await inviteEmployee(formData);

    if (result.error) {
      setError(result.error);
    } else if (result.success && result.link) {
      setSuccessLink(result.link);
    }
    
    setIsLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Invite Employee</h2>
            <p className="text-[13px] text-slate-500 font-medium mt-0.5">Send a secure workspace invitation.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {successLink ? (
          <div className="p-8 flex flex-col items-center text-center overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4 shrink-0">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Invitation Created</h3>
            <p className="text-[14px] text-slate-600 mb-6">
              The secure setup link has been generated. In production, this would be emailed automatically. For now, copy it below:
            </p>
            <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-[12px] font-mono text-slate-700 break-all mb-6 select-all">
              {successLink}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(successLink);
                alert("Copied to clipboard!");
              }}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Copy Link
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input name="fullName" required type="text" placeholder="Akash Sharma" className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-slate-700">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input name="email" required type="email" placeholder="akash@wecollab.com" className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700">Role</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select name="role" required className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                    <option value="Employee">Employee</option>
                    <option value="Researcher">Researcher</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700">Department</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input name="department" type="text" placeholder="Creator Ops" className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700">Designation</label>
                <input name="designation" type="text" placeholder="Senior Analyst" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input name="phone" type="tel" placeholder="+1 234 567 8900" className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={onClose} className="px-5 h-11 rounded-xl text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="px-5 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold shadow-sm shadow-indigo-200 transition-colors disabled:opacity-70 flex items-center gap-2 cursor-pointer">
                {isLoading ? "Sending..." : "Send Invitation"}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
