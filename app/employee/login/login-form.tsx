"use client";

import { useState } from "react";
import { loginEmployee, requestEmployeePasswordReset } from "@/app/employee/actions";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password states
  const [isForgot, setIsForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

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

  const handleForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setIsForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(false);

    try {
      const res = await requestEmployeePasswordReset(forgotEmail, window.location.origin);
      if (res.error) {
        setForgotError(res.error);
      } else {
        setForgotSuccess(true);
      }
    } catch (err: any) {
      setForgotError("An unexpected error occurred. Please try again.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  if (isForgot) {
    return (
      <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5">
          
          {forgotError && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium rounded-xl text-center">
              {forgotError}
            </div>
          )}

          {forgotSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Check your email</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                If an account is associated with <span className="font-bold text-slate-800">{forgotEmail}</span>, we have sent a link to reset your password.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-slate-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    name="email"
                    type="email" 
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@wecollab.com"
                    className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all" 
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isForgotLoading}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] rounded-xl transition-all shadow-md shadow-slate-200 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isForgotLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </div>
            </>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsForgot(false);
                setForgotSuccess(false);
                setForgotError(null);
              }}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </button>
          </div>

        </form>
      </div>
    );
  }

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
            <button 
              type="button"
              onClick={() => {
                setIsForgot(true);
                setForgotEmail("");
                setForgotSuccess(false);
                setForgotError(null);
              }}
              className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 focus:outline-none cursor-pointer"
            >
              Forgot password?
            </button>
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
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
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
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] rounded-xl transition-all shadow-md shadow-slate-200 disabled:opacity-70 flex items-center justify-center cursor-pointer"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </div>

      </form>
    </div>
  );
}
