import { verifyResetToken } from "@/app/brand/actions";
import { ResetPasswordForm } from "./reset-form";
import Link from "next/link";
import Image from "next/image";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams?.token || "";

  const { isValid } = await verifyResetToken(token);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row select-none font-sans bg-white">
      
      {/* Left Column: Full height Violet Panel with Shadow Overlay */}
      <div className="hidden md:flex md:w-[40%] flex-col justify-between p-10 lg:p-12 relative overflow-hidden h-full bg-[#7166e5] z-10 shadow-[8px_0_30px_rgba(15,23,42,0.15)]">
        
        {/* Backdrop image mimicking video loop */}
        <div className="absolute inset-0 w-full h-full z-0">
          <Image 
            src="/assets/login_3d_workspace.png" 
            alt="3D Creative Workspace Scene" 
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-[#7166e5] mix-blend-multiply opacity-45" />
        </div>

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
            Secure your credentials and scale partnerships.
          </h2>
        </div>

        {/* Footer info tag */}
        <div className="relative z-10 text-white/90 text-[11px] font-medium">
          © {new Date().getFullYear()} Wecollab Inc. All rights reserved.
        </div>
      </div>

      {/* Right Column: Full height White Form Panel */}
      <div className="w-full md:w-[60%] h-full p-6 sm:p-10 md:p-14 lg:p-20 flex flex-col justify-between bg-white relative overflow-y-auto">
        
        {/* Top language selector */}
        <div className="text-right text-[11px] text-slate-400 font-semibold select-none mb-4 md:mb-0">
          English (USA) ▾
        </div>

        <div className="w-full max-w-[400px] mx-auto my-auto py-6">
          {!isValid ? (
            <div className="text-center py-8">
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">Invalid or Expired Link</h2>
              <p className="text-slate-500 text-xs font-semibold mb-6">
                This password reset link is invalid, expired, or has already been used. Please request a new one from the login page.
              </p>
              <Link 
                href="/brand/login"
                className="inline-block bg-[#7166e5] hover:bg-[#5e53c7] text-white font-extrabold py-3 px-6 rounded-full text-xs tracking-wider transition cursor-pointer"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <ResetPasswordForm token={token} />
          )}
        </div>

        {/* Switcher back to sign in */}
        <div className="mt-4">
          <div className="text-center text-[11px] font-semibold text-slate-500">
            Remembered your password?{" "}
            <Link
              href="/brand/login"
              className="text-[#7166e5] font-extrabold hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
