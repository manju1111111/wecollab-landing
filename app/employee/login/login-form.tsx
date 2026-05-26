"use client";

import { useState } from "react";
import { loginEmployee } from "@/app/employee/actions";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await loginEmployee(formData);

    if (res.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      // Redirect to employee workspace
      window.location.href = "/employee";
    }
  };

  return (
    <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-xl text-center">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[13px] font-bold text-slate-700 ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              name="email"
              type="email" 
              required
              placeholder="name@wecollab.com"
              className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[13px] font-bold text-slate-700">Password</label>
            <a href="#" className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700">Forgot password?</a>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              name="password"
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              className="w-full h-12 pl-11 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all" 
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 ml-1">
          <input type="checkbox" id="remember" className="rounded text-slate-900 focus:ring-slate-900 h-4 w-4 border-slate-300" />
          <label htmlFor="remember" className="text-[13px] font-medium text-slate-600 cursor-pointer">Remember me for 7 days</label>
        </div>

        <div className="pt-3">
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] rounded-xl transition-all shadow-md shadow-slate-200 disabled:opacity-70 flex items-center justify-center"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </div>

      </form>
    </div>
  );
}
