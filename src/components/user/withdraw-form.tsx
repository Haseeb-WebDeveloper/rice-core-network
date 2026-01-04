"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWithdrawal } from "@/actions/user/create-withdrawal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wallet, Lock } from "lucide-react";

type WithdrawFormProps = {
  availableBalance: number;
};

export function WithdrawForm({ availableBalance }: WithdrawFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append(
      "amount",
      (e.currentTarget.elements.namedItem("amount") as HTMLInputElement).value
    );
    formData.append(
      "walletId",
      (e.currentTarget.elements.namedItem("walletId") as HTMLInputElement).value
    );
    formData.append(
      "pin",
      (e.currentTarget.elements.namedItem("pin") as HTMLInputElement).value
    );

    startTransition(() => {
      createWithdrawal(formData).then((result) => {
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(true);
          // Reset form
          (e.currentTarget as HTMLFormElement).reset();
          // Refresh page after a short delay
          setTimeout(() => {
            router.refresh();
          }, 2000);
        }
      });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Withdrawal</CardTitle>
        <CardDescription>
          Withdraw funds to your USDT BEP20 wallet address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Available Balance</span>
            <span className="text-2xl font-bold text-foreground">
              ${availableBalance.toFixed(2)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (USD)</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min={5}
              placeholder="Minimum: $5.00"
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Minimum withdrawal amount is $5.00
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletId">USDT BEP20 Wallet Address</Label>
            <div className="relative">
              <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="walletId"
                name="walletId"
                type="text"
                placeholder="Enter your USDT BEP20 wallet address"
                className="pl-10"
                required
                disabled={isPending}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Make sure to enter the correct wallet address. Funds cannot be recovered if sent to the wrong address.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">Withdraw PIN</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="pin"
                name="pin"
                type="password"
                maxLength={4}
                placeholder="Enter your 4-digit withdraw PIN"
                className="pl-10"
                required
                disabled={isPending}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your 4-digit withdrawal PIN to confirm this transaction
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-500">
              Withdrawal request submitted successfully! It will be reviewed by an admin shortly.
            </div>
          )}

          <Button
            type="submit"
            className="w-full font-medium mt-2 text-md h-12"
            variant="default"
            disabled={isPending || availableBalance < 5}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Submit Withdrawal Request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

