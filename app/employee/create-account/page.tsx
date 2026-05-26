import { verifyToken, createAccount } from "@/app/employee/actions";
import { redirect } from "next/navigation";
import { CreateAccountForm } from "./create-account-form";

export default async function CreateAccountPage(props: { searchParams: Promise<{ token?: string }> }) {
  const searchParams = await props.searchParams;
  const token = searchParams?.token;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Link</h1>
          <p className="text-slate-500 text-[14px]">This invitation link is missing or invalid.</p>
        </div>
      </div>
    );
  }

  const result = await verifyToken(token);

  if (result.error || !result.employee) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Expired Invitation</h1>
          <p className="text-slate-500 text-[14px]">{result.error || "This invitation has expired or the account was already created."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-indigo-50 to-slate-50 z-0"></div>
      <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl z-0"></div>
      <div className="absolute top-[100px] -left-[100px] w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl z-0"></div>

      <div className="w-full max-w-md z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-xl mb-6 shadow-lg shadow-indigo-200">
            W
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Your Workspace Account</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-2">Welcome to WeCollab, {result.employee.full_name.split(' ')[0]}</p>
        </div>

        <CreateAccountForm token={token} email={result.employee.email} />
      </div>
    </div>
  );
}
