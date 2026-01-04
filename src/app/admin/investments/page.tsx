import { getAllInvestments } from "@/lib/admin/get-all-investments";
import { InvestmentsTable } from "@/components/admin/investments-table";
import { Suspense } from "react";

export default async function AdminInvestmentsPage() {
  const investments = await getAllInvestments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Investments</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all investment requests from users
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <InvestmentsTable data={investments} />
      </Suspense>
    </div>
  );
}
