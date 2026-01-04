import { getAllPlans } from "@/lib/admin/get-all-plans";
import { PlansTable } from "@/components/admin/plans-table";
import { Suspense } from "react";

export default async function AdminPlansPage() {
  const plans = await getAllPlans();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investment Plans</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage investment plans for users
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <PlansTable data={plans} />
      </Suspense>
    </div>
  );
}

