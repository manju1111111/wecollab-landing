import { getPlanDetails, getCreatorsByIds } from "../actions";
import { PlanWorkspace } from "@/components/plans/plan-workspace";
import { redirect } from "next/navigation";

export default async function PlanDetailsPage({ params }: { params: { id: string } }) {
  const plan = await getPlanDetails(params.id);
  
  if (!plan) {
    redirect("/plans");
  }

  // Collect all unique creator IDs across all lists
  const allCreatorIds = new Set<string>();
  plan.lists.forEach((list: any) => {
    (list.creator_ids || []).forEach((id: string) => allCreatorIds.add(id));
  });

  const creators = await getCreatorsByIds(Array.from(allCreatorIds));

  // Map for easy lookup on client
  const creatorsMap = creators.reduce((acc: any, c: any) => {
    acc[c.id] = c;
    return acc;
  }, {});
  
  return <PlanWorkspace plan={plan} creatorsMap={creatorsMap} />;
}
