import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getAvailableBalance } from "@/lib/user/get-available-balance";
import { getUserWithdrawals } from "@/lib/user/get-user-withdrawals";
import { WithdrawalsTable } from "@/components/user/withdrawals-table";
import { WithdrawPageClient } from "@/components/user/withdraw-page-client";

export default async function WithdrawPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const availableBalance = await getAvailableBalance(user.id);
  const withdrawals = await getUserWithdrawals(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Withdraw</h1>
          <p className="text-muted-foreground mt-2">
            Request a withdrawal to your USDT BEP20 wallet
          </p>
        </div>
      </div>

      <WithdrawPageClient availableBalance={availableBalance} />

      <WithdrawalsTable withdrawals={withdrawals} />
    </div>
  );
}

