"use client";

import { useState, useTransition } from "react";
import { Mail, Check, Loader2, CheckCircle } from "lucide-react";
import { subscribeAction } from "@/app/admin/newsletter/actions";

export function NewsletterHeroCard() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const res = await subscribeAction(email);
      if (res.success) {
        setSubscribed(true);
        setEmail("");
      } else {
        setErrorMessage(res.error || "Failed to subscribe. Please try again.");
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-8 md:p-10 shadow-xl shadow-slate-100/40 relative">
      {/* Mail Icon Square */}
      <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-6">
        <Mail className="h-6 w-6" />
      </div>

      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Join the Newsletter</h3>
      <p className="mt-2 text-[0.9375rem] text-slate-500 font-medium">
        Get weekly actionable insights straight to your inbox.
      </p>

      {/* Subscription Input Form Group */}
      <form onSubmit={handleSubscribe} className="mt-6">
        <div className="relative flex items-center border border-slate-200 rounded-2xl bg-white p-1.5 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
          <input
            type="email"
            required
            disabled={submitting || subscribed}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full bg-transparent px-3 py-2 text-sm text-slate-800 outline-none border-none placeholder-slate-400 font-medium"
          />
          <button
            type="submit"
            disabled={submitting || subscribed || !email}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-1.5 transition shrink-0 disabled:bg-slate-300"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Wait...
              </>
            ) : subscribed ? (
              "Subscribed"
            ) : (
              <>
                Subscribe <span className="text-base leading-none">&rarr;</span>
              </>
            )}
          </button>
        </div>

        {subscribed && (
          <div className="mt-4 flex gap-2 rounded-xl bg-emerald-50/80 p-3.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Success! Thank you for subscribing to WeCollab briefs.</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 text-xs font-semibold text-rose-600 px-1">
            {errorMessage}
          </div>
        )}
      </form>

      {/* Bullet Points with Checkmarks */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-3 justify-between items-center text-xs font-bold text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
            <Check className="h-3 w-3" strokeWidth={3} />
          </div>
          <span>No spam, ever</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
            <Check className="h-3 w-3" strokeWidth={3} />
          </div>
          <span>Unsubscribe anytime</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
            <Check className="h-3 w-3" strokeWidth={3} />
          </div>
          <span>100% free</span>
        </div>
      </div>

    </div>
  );
}
