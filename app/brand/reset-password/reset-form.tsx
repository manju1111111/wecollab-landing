"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordWithToken } from "@/app/brand/actions";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score, label: "Weak", color: "bg-rose-500", w: "25%" };
    if (score <= 3) return { score, label: "Medium", color: "bg-amber-500", w: "60%" };
    return { score, label: "Strong", color: "bg-emerald-500", w: "100%" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPasswordWithToken(token, password);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/brand/login");
        }, 2500);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto py-8">
      <div className="text-left mb-6">
        <h2 className="text-[28px] font-extrabold text-slate-800 tracking-tight leading-none mb-2">
          Reset Password
        </h2>
        <p className="text-slate-500 text-xs font-semibold">
          Enter your new password below to update your brand account.
        </p>
      </div>

      {success ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <CheckCircle className="h-12 w-12 text-emerald-500 mb-3 animate-bounce" />
          </motion.div>
          <h3 className="text-base font-bold text-slate-950 mb-1">Password Reset Successful!</h3>
          <p className="text-[11px] text-slate-500">Redirecting to login portal...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-100 text-rose-600 text-[10.5px] font-semibold rounded-lg p-2.5 text-center leading-normal"
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* New Password Field */}
          <div className="relative flex flex-col gap-1.5">
            <div className="relative flex items-center">
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 py-3 pr-10 text-xs font-semibold text-slate-800 outline-none focus:border-[#7166e5] disabled:opacity-60 transition placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password && (
              <motion.div
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1"
              >
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.w }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[9px] text-slate-400 font-semibold">Password Strength</span>
                  <span className={`text-[9px] font-bold ${strength.score >= 3 ? "text-emerald-665" : strength.score === 2 ? "text-amber-665" : "text-rose-665"}`}>
                    {strength.label}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Confirm Password Field */}
          <input
            required
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            disabled={loading}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-transparent border-b border-slate-200 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#7166e5] disabled:opacity-60 transition placeholder-slate-400"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7166e5] hover:bg-[#5e53c7] text-white font-extrabold py-3.5 px-4 rounded-full text-xs tracking-wider transition shadow-sm active:scale-[0.99] disabled:opacity-50 select-none mt-3 cursor-pointer"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full mx-auto"></div>
            ) : (
              <span>Reset Password</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
