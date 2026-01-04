import { getPendingInvestments } from "@/lib/admin/get-pending-investments";
import { getAdminStatistics } from "@/lib/admin/get-statistics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PendingInvestmentCard } from "@/components/admin/pending-investment-card";
import { Users, TrendingUp, Clock, DollarSign } from "lucide-react";

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Investments
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalInvestments}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics.activeInvestments} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
              {statistics.pendingInvestments}
            </div>
            <p className="text-xs text-muted-foreground">
              ${Number(statistics.pendingInvestmentAmount).toFixed(2)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Investment
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(statistics.totalInvestmentAmount).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

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
