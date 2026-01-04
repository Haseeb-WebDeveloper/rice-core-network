import { getPendingWithdrawals } from "@/lib/admin/get-pending-withdrawals";
import { WithdrawalCard } from "@/components/admin/withdrawal-card";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default async function AdminWithdrawalsPage() {
  const withdrawals = await getPendingWithdrawals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Withdrawals</h1>
        <p className="text-muted-foreground mt-2">
          Review and process withdrawal requests from users
        </p>
      </div>

      {withdrawals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              No pending withdrawals
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              All withdrawal requests have been processed
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {withdrawals.map((withdrawal) => (
            <WithdrawalCard key={withdrawal.id} withdrawal={withdrawal} />
          ))}
        </div>
      )}
    </div>
  );
}

