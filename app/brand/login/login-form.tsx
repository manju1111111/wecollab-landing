"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginBrand, registerBrand, requestPasswordReset } from "@/app/brand/actions";
import { createClient } from "@/lib/supabase/client";
import { 
  CheckCircle, 
  Eye, 
  EyeOff
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type OAuthProvider = "google" | "azure" | "github";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

// Custom Google SVG Logo
const GoogleIcon = () => (
  <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

// Custom Microsoft SVG Logo
const MicrosoftIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 23 23" fill="currentColor">
    <path d="M0 0h11v11H0z" fill="#F25022" />
    <path d="M12 0h11v11H12z" fill="#7FBA00" />
    <path d="M0 12h11v11H0z" fill="#00A4EF" />
    <path d="M12 12h11v11H12z" fill="#FFB900" />
  </svg>
);

// Custom GitHub SVG Logo
const GithubIcon = () => (
  <svg className="w-4 h-4 text-slate-800" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

export function BrandLoginPageClient() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(null);

  // Check URL query parameters for errors on load (e.g. from OAuth redirects)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      queueMicrotask(() => setError(decodeURIComponent(err)));
    }
  }, []);

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
            setPassword("");
          }, 2000);
        } else {
          router.push("/discover");
          router.refresh();
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An unexpected error occurred."));
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setForgotSuccess(false);

    try {
      const res = await requestPasswordReset(forgotEmail, window.location.origin);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setForgotSuccess(true);
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "An unexpected error occurred."));
      setLoading(false);
    }
  }

  async function handleOAuthSignIn(provider: OAuthProvider) {
    setLoading(true);
    setOauthProvider(provider);
    setError(null);
    try {
      const supabase = createClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("role", "brand");

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
          scopes: provider === "google" ? "openid email profile" : undefined,
          skipBrowserRedirect: true,
        }
      });
      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
        setOauthProvider(null);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      setError(`Could not start ${provider === "google" ? "Google" : provider} sign-in. Please try again.`);
      setLoading(false);
      setOauthProvider(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "OAuth sign-in failed."));
      setLoading(false);
      setOauthProvider(null);
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row select-none font-sans bg-white">
      
      {/* Left Column: Full height Violet Panel with Shadow Overlay */}
      <div className="hidden md:flex md:w-[40%] flex-col justify-between p-10 lg:p-12 relative overflow-hidden h-full bg-[#7166e5] z-10 shadow-[8px_0_30px_rgba(15,23,42,0.15)]">
        
        {/* Full-bleed animated backdrop mimicking a video loop */}
        <motion.div 
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 w-full h-full z-0"
        >
          <Image 
            src="/assets/login_3d_workspace.png" 
            alt="3D Creative Workspace Scene" 
            fill
            className="object-cover object-center"
            priority
          />
          {/* Shifting ambient lighting overlay to create video-like illumination */}
          <motion.div 
            animate={{
              opacity: [0.35, 0.55, 0.35],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-[#7166e5] mix-blend-multiply" 
          />
        </motion.div>

        {/* Ambient floating light ray */}
        <motion.div 
          animate={{
            x: [-40, 40, -40],
            y: [-30, 30, -30],
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-20 -left-20 w-[300px] h-[300px] rounded-full bg-violet-400/20 blur-[100px] pointer-events-none z-0"
        />

        {/* Logo / Header */}
        <div className="relative z-10 text-white flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight">wecollab</span>
          </div>
          <span className="text-xs opacity-75 font-semibold">Partner with Creators, Grow Campaigns</span>
        </div>

        {/* Large Title */}
        <div className="relative z-10 text-white my-auto max-w-xs">
          <h2 className="text-[28px] lg:text-[32px] font-extrabold tracking-tight leading-tight drop-shadow-sm">
            Partner With World&apos;s Best Creators Around The Globe.
          </h2>
        </div>

        {/* Footer info tag */}
        <div className="relative z-10 text-white/90 text-[11px] font-medium">
          © {new Date().getFullYear()} Wecollab Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column: Full height White Form Panel */}
      <div className="w-full md:w-[60%] h-full p-6 sm:p-10 md:p-14 lg:p-20 flex flex-col justify-between bg-white relative overflow-y-auto">
        
        {/* Top helper text */}
        <div className="text-right text-[11px] text-slate-400 font-semibold select-none mb-4 md:mb-0">
          English (USA) ▾
        </div>

        <div className="w-full max-w-[400px] mx-auto my-auto py-6">
          {/* Header Title */}
          <div className="text-left mb-7">
            <h2 className="text-[28px] sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-none mb-2">
              {isForgot ? "Reset Password" : isLogin ? "Sign In" : "Create Account"}
            </h2>
            {isForgot && !forgotSuccess && (
              <p className="text-slate-500 text-[11px] font-semibold">
                Provide your email to receive a password recovery link.
              </p>
            )}
          </div>

          {success ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <CheckCircle className="h-12 w-12 text-emerald-500 mb-3 animate-bounce" />
              </motion.div>
              <h3 className="text-base font-bold text-slate-950 mb-1">Onboarding Successful!</h3>
              <p className="text-[11px] text-slate-500">Preparing your client console...</p>
            </div>
          ) : isForgot ? (
            /* Forgot Password Form */
            <div className="flex flex-col gap-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 border border-rose-100 text-rose-600 text-[10.5px] font-semibold rounded-lg p-2.5 text-center leading-normal"
                >
                  ⚠️ {error}
                </motion.div>
              )}

              {forgotSuccess ? (
                <div className="py-6 flex flex-col items-center justify-center text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <CheckCircle className="h-10 w-10 text-emerald-500 mb-2.5 animate-bounce" />
                  </motion.div>
                  <h3 className="text-sm font-bold text-slate-950 mb-1">Check your inbox</h3>
                  <p className="text-[11px] text-slate-500 leading-normal max-w-xs mx-auto">
                    If an account is associated with {forgotEmail}, we have sent a link to reset your password.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4.5">
                  <input
                    required
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={loading}
                    placeholder="Email Address"
                    className="w-full bg-transparent border-b border-slate-200 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#7166e5] disabled:opacity-60 transition placeholder-slate-400"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#7166e5] hover:bg-[#5e53c7] text-white font-extrabold py-3.5 px-4 rounded-full text-xs tracking-wider transition shadow-sm active:scale-[0.99] disabled:opacity-50 select-none mt-3 cursor-pointer"
                  >
                    {loading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full mx-auto"></div>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Sign In / Sign Up Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 border border-rose-100 text-rose-600 text-[10.5px] font-semibold rounded-lg p-2.5 text-center leading-normal"
                >
                  ⚠️ {error}
                </motion.div>
              )}

              {/* Onboarding fields (Sign Up only) */}
              <AnimatePresence initial={false} mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex flex-col gap-4.5 overflow-hidden"
                  >
                    {/* Company Name */}
                    <input
                      required
                      type="text"
                      name="name"
                      disabled={loading}
                      placeholder="Company Name"
                      className="w-full bg-transparent border-b border-slate-200 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#7166e5] disabled:opacity-60 transition placeholder-slate-400"
                    />

                    {/* Website & Industry grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="url"
                        name="website"
                        pattern="https?://.*"
                        disabled={loading}
                        placeholder="Website (https://brand.com)"
                        className="w-full bg-transparent border-b border-slate-200 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#7166e5] disabled:opacity-60 transition placeholder-slate-400"
                      />

                      <input
                        type="text"
                        name="industry"
                        disabled={loading}
                        placeholder="Industry (e.g. Tech, Fashion)"
                        className="w-full bg-transparent border-b border-slate-200 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#7166e5] disabled:opacity-60 transition placeholder-slate-400"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Field */}
              <input
                required
                type="email"
                name="email"
                disabled={loading}
                placeholder="Email Address"
                className="w-full bg-transparent border-b border-slate-200 py-3 text-xs font-semibold text-slate-800 outline-none focus:border-[#7166e5] disabled:opacity-60 transition placeholder-slate-400"
              />

              {/* Password Field */}
              <div className="relative flex flex-col gap-1.5">
                <div className="relative flex items-center">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Password"
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
                
                {/* Forgot Password Button */}
                {isLogin && (
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setIsForgot(true);
                        setError(null);
                        setForgotEmail("");
                        setForgotSuccess(false);
                      }}
                      className="text-[10px] font-extrabold text-[#7166e5] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
                
                {/* Password Strength Indicator (Sign Up only) */}
                {!isLogin && password && (
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

              {/* Checkbox (Terms and agreement) */}
              <div className="flex items-center gap-2 mt-1 select-none">
                <input 
                  type="checkbox" 
                  id="agree" 
                  disabled={loading}
                  required={!isLogin}
                  defaultChecked={isLogin}
                  className="w-3.5 h-3.5 accent-[#7166e5] border-slate-350 rounded cursor-pointer disabled:opacity-50" 
                />
                <label htmlFor="agree" className="text-[11px] text-slate-400 font-semibold cursor-pointer">
                  I agree to the <a href="#" className="text-[#7166e5] underline hover:text-[#5e53c7]">terms of service</a> and <a href="#" className="text-[#7166e5] underline hover:text-[#5e53c7]">privacy policy</a>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7166e5] hover:bg-[#5e53c7] text-white font-extrabold py-3.5 px-4 rounded-full text-xs tracking-wider transition shadow-sm active:scale-[0.99] disabled:opacity-50 select-none mt-3 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full mx-auto"></div>
                ) : (
                  <span>{isLogin ? "Sign In" : "Sign Up"}</span>
                )}
              </button>
            </form>
          )}

          {/* Social Splitter */}
          {!success && !isForgot && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="h-[1px] bg-slate-100 flex-1"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Or {isLogin ? "Sign In" : "Sign Up"} With
                </span>
                <div className="h-[1px] bg-slate-100 flex-1"></div>
              </div>

              {/* Circular Social Connectors */}
              <div className="flex justify-center gap-3.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleOAuthSignIn("google")}
                  aria-label="Sign in with Google"
                  className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer bg-white disabled:opacity-50"
                >
                  {oauthProvider === "google" ? (
                    <div className="h-4 w-4 border-2 border-slate-200 border-t-[#7166e5] animate-spin rounded-full" />
                  ) : (
                    <GoogleIcon />
                  )}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleOAuthSignIn("azure")}
                  aria-label="Sign in with Microsoft"
                  className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer bg-white disabled:opacity-50"
                >
                  {oauthProvider === "azure" ? (
                    <div className="h-4 w-4 border-2 border-slate-200 border-t-[#7166e5] animate-spin rounded-full" />
                  ) : (
                    <MicrosoftIcon />
                  )}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleOAuthSignIn("github")}
                  aria-label="Sign in with GitHub"
                  className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition cursor-pointer bg-white disabled:opacity-50"
                >
                  {oauthProvider === "github" ? (
                    <div className="h-4 w-4 border-2 border-slate-200 border-t-[#7166e5] animate-spin rounded-full" />
                  ) : (
                    <GithubIcon />
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Switcher */}
        {!success && (
          <div className="mt-4">
            <div className="text-center text-[11px] font-semibold text-slate-500">
              {isForgot ? (
                <>
                  Remembered your password?{" "}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setIsForgot(false);
                      setError(null);
                    }}
                    className="text-[#7166e5] font-extrabold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                      setPassword("");
                    }}
                    className="text-[#7166e5] font-extrabold hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
