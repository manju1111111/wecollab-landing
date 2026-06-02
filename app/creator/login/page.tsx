"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginCreator } from "@/app/creator/actions";
import { Mail, Lock, Eye, EyeOff, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function CreatorLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginCreator(formData);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push("/creator");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected login error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row relative overflow-hidden font-sans text-slate-200">
      {/* Decorative ambient background lights */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[150px]"></div>
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[150px]"></div>

      {/* Left panel: Info */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 relative z-10 lg:border-r lg:border-slate-800 bg-slate-950/20">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Creator Console</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mb-6">
            Access Your Creator Command Center.
          </h1>
          
          <p className="text-[14px] text-slate-400 leading-relaxed mb-10">
            Sign in to access your direct collaborations database, update your media kit stats, pitch proposals to high-budget brands, and track payments.
          </p>
        </div>
      </div>

      {/* Right panel: Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md bg-slate-950/40 border border-slate-800/80 rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              W
            </div>
            <div>
              <span className="font-bold text-[18px] tracking-tight text-white block leading-tight">WeCollab</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Creator Portal</span>
            </div>
          </div>

          <h2 className="text-xl font-extrabold text-white mb-2">Log in to your workspace</h2>
          <p className="text-[12px] text-slate-400 mb-8">New to WeCollab? <Link href="/creator/onboard" className="text-violet-400 hover:text-violet-300 font-bold">Onboard here</Link></p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold rounded-2xl p-3.5 leading-normal">
                ⚠️ {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-4 w-4 text-slate-500" />
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="ananya@rao.in"
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3.5 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-violet-500 transition"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <a href="#" className="text-[10px] font-black text-violet-400 hover:text-violet-350">Forgot?</a>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-500" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3.5 pl-11 pr-11 text-[12px] font-bold text-white outline-none focus:border-violet-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-500 hover:text-slate-400 outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-650 hover:bg-violet-750 text-white font-bold py-3.5 px-4 rounded-2xl text-[12px] transition flex items-center justify-center gap-1.5 shadow-md mt-4 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
              ) : (
                <>
                  Log In Workspace
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Preset Demo credentials helper to match the brand panel */}
          <div className="bg-slate-900 border border-violet-500/10 rounded-2xl p-4 mt-8 flex flex-col gap-1.5">
            <h5 className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Onboarding Tip</h5>
            <p className="text-[11px] text-slate-400 font-semibold leading-normal">
              New profiles go directly into the pending review queue. Register to start tracking!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
