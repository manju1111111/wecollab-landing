import { LoginForm } from "./login-form";

export default function EmployeeLoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-slate-100 to-slate-50 z-0"></div>
      <div className="absolute -bottom-[200px] -left-[200px] w-[600px] h-[600px] bg-slate-200/50 rounded-full blur-3xl z-0"></div>
      
      <div className="w-full max-w-[420px] z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-black text-xl mb-6 shadow-xl">
            W
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Log in to your workspace</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-2">Enter your email and password below</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
