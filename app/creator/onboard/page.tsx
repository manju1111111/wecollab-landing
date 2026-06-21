"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { onboardCreator } from "@/app/creator/actions";
import { User, Mail, Lock, Phone, MapPin, Sparkles, ChevronRight, CheckCircle } from "lucide-react";
import Link from "next/link";

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const CATEGORIES = [
  "Fashion & Style",
  "Tech & Gadgets",
  "Fitness",
  "Sports",
  "Food & Beverage",
  "Travel & Outdoors",
  "Finance & Business",
  "Gaming & Entertainment",
  "Skin & Beauty",
  "General / Other"
];

export default function CreatorOnboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await onboardCreator(formData);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/creator");
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected onboarding error occurred.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row relative overflow-hidden font-sans text-slate-200">
      {/* Decorative ambient background lights */}
      <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-violet-600/10 blur-[150px]"></div>
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[150px]"></div>

      {/* Left panel: Pitching to Creators */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 relative z-10 lg:border-r lg:border-slate-800 bg-slate-950/20">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
            <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse"></span>
            <span className="text-[11px] font-black uppercase tracking-widest text-violet-400">Creator Onboarding</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight mb-6">
            Land Premium Brand Campaigns <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Seamlessly</span>.
          </h1>
          
          <p className="text-[14px] text-slate-400 leading-relaxed mb-10">
            Welcome to the WeCollab Creator Portal. Onboard your profile, show off your live stats, sync your channels, receive exclusive campaign briefs, and secure fast payouts.
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <span className="h-10 w-10 shrink-0 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-bold">
                ✓
              </span>
              <div>
                <h4 className="text-[14px] font-bold text-white mb-1">Verify Your Profile</h4>
                <p className="text-[12px] text-slate-400">Unlock a verification checkmark to prove your authenticity to major B2B brands.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="h-10 w-10 shrink-0 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-bold">
                ✓
              </span>
              <div>
                <h4 className="text-[14px] font-bold text-white mb-1">Receive Campiagn Offers</h4>
                <p className="text-[12px] text-slate-400">Brands discover your profile, pitching deals directly to your portal dashboard.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="h-10 w-10 shrink-0 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-bold">
                ✓
              </span>
              <div>
                <h4 className="text-[14px] font-bold text-white mb-1">Escrow Payout Protection</h4>
                <p className="text-[12px] text-slate-400">Get guaranteed payments released the moment your collaboration deliverables go live.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Sign-Up form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-lg bg-slate-950/40 border border-slate-800/80 rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              W
            </div>
            <div>
              <span className="font-bold text-[18px] tracking-tight text-white block leading-tight">WeCollab</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Creator Console</span>
            </div>
          </div>

          <h2 className="text-xl font-extrabold text-white mb-2">Create your creator profile</h2>
          <p className="text-[12px] text-slate-400 mb-6">Already registered? <Link href="/creator/login" className="text-violet-400 hover:text-violet-300 font-bold">Log in here</Link></p>

          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <CheckCircle className="h-14 w-14 text-emerald-500 mb-4 animate-bounce" />
              <h3 className="text-lg font-black text-white mb-2">Onboarding Successful!</h3>
              <p className="text-[12px] text-slate-400">Setting up your creator dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[500px] overflow-y-auto pr-2">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold rounded-2xl p-3.5 leading-normal">
                  ⚠️ {error}
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 h-4 w-4 text-slate-500" />
                    <input
                      required
                      type="text"
                      name="name"
                      placeholder="Ananya Rao"
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mobile</label>
                  <div className="relative flex items-center">
                    <Phone className="absolute left-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="ananya@rao.in"
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 h-4 w-4 text-slate-500" />
                  <input
                    required
                    type="password"
                    name="password"
                    placeholder="Min. 8 characters"
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              {/* Social Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Instagram Handle</label>
                  <div className="relative flex items-center">
                    <InstagramIcon className="absolute left-3.5 h-4 w-4 text-slate-500" />
                    <input
                      required
                      type="text"
                      name="instagram"
                      placeholder="@ananya.fitness"
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">YouTube Channel (Opt.)</label>
                  <div className="relative flex items-center">
                    <YoutubeIcon className="absolute left-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      name="youtube"
                      placeholder="@ananyaraofitness"
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Niche & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Niche Category</label>
                  <select
                    name="category"
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 px-4 text-[12px] font-bold text-slate-300 outline-none focus:border-violet-500 transition"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location</label>
                  <div className="relative flex items-center">
                    <MapPin className="absolute left-3.5 h-4 w-4 text-slate-500" />
                    <input
                      required
                      type="text"
                      name="location"
                      placeholder="Mumbai, India"
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-2xl py-3 pl-11 pr-4 text-[12px] font-bold text-white outline-none focus:border-violet-500 transition"
                    />
                  </div>
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
                    Complete Onboarding
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
