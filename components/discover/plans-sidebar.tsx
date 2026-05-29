"use client";

import { Calendar, ListMinus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PlansSidebar({
  plans,
}: {
  plans: any[];
}) {
  const router = useRouter();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-[#fafafa] overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-slate-900">All Plans</h2>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
            {plans.length}
          </span>
        </div>
        
        {plans.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-[13px] font-medium leading-snug text-slate-600">
              Create a plan to start saving influencers!
            </p>
          </div>
        )}

        <Link
          href="/plans"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/45 bg-white py-2.5 text-[14px] font-semibold text-primary transition hover:bg-primary-soft/35 shadow-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Go to Plans Dashboard
        </Link>

        <div className="mt-6 flex flex-col gap-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => router.push(`/plans/${plan.id}`)}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-5 w-5 rounded-full"
                  style={{
                    backgroundImage: `linear-gradient(to right, #4f46e5, #ec4899)`,
                  }}
                ></div>
                <h3 className="text-[14px] font-bold text-slate-800">{plan.name}</h3>
              </div>
              <div className="mt-4 flex items-center justify-between text-[12px] font-medium text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ListMinus className="h-3.5 w-3.5" />
                  {plan.totalInfluencers} creators
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(plan.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
