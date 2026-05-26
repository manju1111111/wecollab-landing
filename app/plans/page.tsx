import { getPlans } from "./actions";
import { PlansDashboard } from "@/components/plans/plans-dashboard";

export default async function PlansPage() {
  const plans = await getPlans();
  
  return <PlansDashboard initialPlans={plans} />;
}
