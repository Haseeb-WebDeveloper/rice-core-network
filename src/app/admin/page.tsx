import { getPendingInvestments } from "@/lib/admin/get-pending-investments";
import { getAdminStatistics } from "@/lib/admin/get-statistics";
import { Card, CardContent } from "@/components/ui/card";
import { PendingInvestmentCard } from "@/components/admin/pending-investment-card";
import { AdminStatisticsCards } from "@/components/admin/admin-statistics-cards";
import { Clock } from "lucide-react";

export default async function AdminPage() {
  const [pendingInvestments, statistics] = await Promise.all([
    getPendingInvestments(),
    getAdminStatistics(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage investments and monitor platform activity
        </p>
      </div>

      {/* Statistics Cards */}
      <AdminStatisticsCards
        statistics={{
          ...statistics,
          totalInvestmentAmount: Number(statistics.totalInvestmentAmount),
          pendingInvestmentAmount: Number(statistics.pendingInvestmentAmount),
        }}
      />

      {/* Pending Investments */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Pending Investments</h2>
          <p className="text-muted-foreground">
            Review and approve investment requests from users
          </p>
        </div>

        {pendingInvestments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">
                No pending investments
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                All investment requests have been processed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingInvestments.map((investment) => (
              <PendingInvestmentCard
                key={investment.id}
                investment={investment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
