"use client";

import { useState } from "react";
import { createAccount } from "@/app/employee/actions";
import { Lock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function CreateAccountForm({ token, email }: { token: string, email: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const pwd1 = formData.get("password") as string;
    const pwd2 = formData.get("confirmPassword") as string;

    if (pwd1 !== pwd2) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (pwd1.length < 8) {
      setError("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    const res = await createAccount(token, formData);
    if (res.error) {
      setError(res.error);
    } else {
      setIsSuccess(true);
    }
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Account Created Successfully</h2>
        <p className="text-[14px] text-slate-500 font-medium mb-8">
          Your workspace account is now ready. You can log in to access your assigned tasks.
        </p>
        <Link 
          href="/employee/login"
          className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-200"
        >
          Continue to Login <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-700 ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="email" 
              value={email}
              disabled
              className="w-full h-12 pl-11 pr-4 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] text-slate-500 cursor-not-allowed" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-700 ml-1">Create Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-700 ml-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              name="confirmPassword" 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full h-12 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" 
            />
          </div>
        </div>

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? "Setting up account..." : "Create Account"}
          </button>
        </div>

      </form>
    </div>
  );
}
