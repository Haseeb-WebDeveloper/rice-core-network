import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getAvailableBalance } from "@/lib/user/get-available-balance";
import { WithdrawForm } from "@/components/user/withdraw-form";

export default async function WithdrawPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const availableBalance = await getAvailableBalance(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Withdraw</h1>
        <p className="text-muted-foreground mt-2">
          Request a withdrawal to your USDT BEP20 wallet
        </p>
      </div>

      <WithdrawForm availableBalance={availableBalance} />
    </div>
  );
}

