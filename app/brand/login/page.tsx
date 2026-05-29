"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginBrand, registerBrand } from "@/app/brand/actions";
import { Building2, Mail, Lock, Globe, Briefcase, ChevronRight, CheckCircle } from "lucide-react";

export default function BrandLoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const res = isLogin ? await loginBrand(formData) : await registerBrand(formData);
      
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        if (!isLogin) {
          setSuccess(true);
          setTimeout(() => {
            setIsLogin(true);
            setSuccess(false);
            setLoading(false);
          }, 2000);
        } else {
          router.push("/brand");
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row relative overflow-hidden font-sans text-slate-200">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px]"></div>
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[150px]"></div>

      {/* Left panel: Product Description & Wow Factor */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 relative z-10 lg:border-r lg:border-slate-800 bg-slate-950/20">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
            <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-400">Self-Serve Brand Portal</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mb-6">
            Partner with the world's finest <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300 bg-clip-text text-transparent">Creators</span>.
          </h1>
          
          <p className="text-[14px] text-slate-400 leading-relaxed mb-10">
            Welcome to the WeCollab Client Portal. Pitch briefs, track campaigns, monitor live performance metrics, and approve collaboration payouts in one dashboard.
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <span className="h-10 w-10 shrink-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold">
                1
              </span>
              <div>
                <h4 className="text-[14px] font-bold text-white mb-1">Create Campaign Briefs</h4>
                <p className="text-[12px] text-slate-400">Specify budgets, niches, and target metrics for creators.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="h-10 w-10 shrink-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold">
                2
              </span>
              <div>
                <h4 className="text-[14px] font-bold text-white mb-1">One-Click Approvals</h4>
                <p className="text-[12px] text-slate-400">Accept or decline creator pricing proposals instantly.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="h-10 w-10 shrink-0 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold">
                3
              </span>
              <div>
                <h4 className="text-[14px] font-bold text-white mb-1">Real-Time CRM Tracker</h4>
                <p className="text-[12px] text-slate-400">Full visibility into team notes, contracts, and deal stages.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Premium Glass Form Container */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md bg-slate-950/40 border border-slate-800/80 rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl flex flex-col">
          {/* Logo / Header */}
          <div className="flex items-center gap-3.5 mb-8">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              W
            </div>
            <div>
              <span className="font-bold text-[18px] tracking-tight text-white block leading-tight">WeCollab</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Brand Console</span>
            </div>
          </div>

          {/* Toggle Tab */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition ${
                isLogin 
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-350"
              }`}
            >
              Client Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold transition ${
                !isLogin 
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-350"
              }`}
            >
              Onboard Brand
            </button>
          </div>

          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <CheckCircle className="h-14 w-14 text-emerald-500 mb-4 animate-bounce" />
              <h3 className="text-lg font-black text-white mb-2">Onboarding Successful!</h3>
              <p className="text-[12px] text-slate-400">Loading Client Dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold rounded-2xl p-3.5 leading-normal">
                  ⚠️ {error}
                </div>
              )}

              {/* Register exclusive fields */}
              {!isLogin && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Company Name
                    </label>
                    <div className="relative flex items-center">
                      <Building2 className="absolute left-3.5 h-4 w-4 text-slate-500" />
                      <input
                        required
                        type="text"
                        name="name"
                        placeholder="Nike India, Inc."
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Website
                    </label>
                    <div className="relative flex items-center">
                      <Globe className="absolute left-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        name="website"
                        placeholder="https://nike.com"
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                      Industry
                    </label>
                    <div className="relative flex items-center">
                      <Briefcase className="absolute left-3.5 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        name="industry"
                        placeholder="Sports & Fitness"
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="nike@wecollab.in"
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Password
                  </label>
                  {isLogin && (
                    <a href="#" className="text-[10px] font-black text-indigo-400 hover:text-indigo-300">
                      Forgot?
                    </a>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type="password"
                    name="password"
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-2xl text-[12px] transition flex items-center justify-center gap-1.5 shadow-md mt-4 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Onboard Brand"}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Preset Demo Account helper */}
          {isLogin && (
            <div className="bg-slate-900 border border-indigo-500/10 rounded-2xl p-4 mt-8 flex flex-col gap-1.5">
              <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Demo Credentials</h5>
              <p className="text-[11px] text-slate-400 font-semibold leading-normal">
                Email: <span className="text-white font-bold">nike@wecollab.in</span><br />
                Password: <span className="text-white font-bold">nike@2026</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
