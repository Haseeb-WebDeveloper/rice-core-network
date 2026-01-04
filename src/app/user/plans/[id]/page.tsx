import { notFound } from "next/navigation";
import { getPlanById } from "@/lib/plans/get-plan-by-id";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubscribeForm } from "@/components/investments/subscribe-form";
import { CopyButton } from "@/components/investments/copy-button";
import { Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlanDetailPage({ params }: PageProps) {
  const { id } = await params;
  const plan = await getPlanById(id);

  if (!plan || !plan.isActive) {
    notFound();
  }

  const minInvestment = Number(plan.minInvestment);
  const dailyProfit = Number(plan.dailyProfitPercentage);
  const walletId = process.env.WALLET_ID || "";
  const tokenName = process.env.TOKEN_NAME || "USDT(BEP20)";

  // Calculate estimated values
  // const estimatedDailyProfit = (minInvestment * dailyProfit) / 100;
  // const estimatedTotalReturn = minInvestment * 2; // 200% return (2x investment)

  return (
    <div className="">
      {/* Back button and title */}
      <div className="mb-2">
        <Link
          href="/user/plans"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <Image
            src={"/icons/chevron-left.svg"}
            width={16}
            height={16}
            className="w-3 h-3"
            alt="Back to Plans"
          />
          <span className="font-">Back to Plans</span>
        </Link>
        <h1 className="text-3xl font-bold">{plan.name}</h1>
        {plan.description && (
          <p className="text-muted-foreground mt-2">{plan.description}</p>
        )}
      </div>

      {/* Plan Details Card */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Minimum Investment
          </span>
          <span className="font-medium font-mono">
            {minInvestment.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Daily Profit
          </span>
          <span className="font-medium font-mono text-green-600">
            {dailyProfit}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Total Return
          </span>
          <span className="font-medium font-mono">2X</span>
        </div>
      </div>

      {/* Wallet Information Card */}
      <div className="space-y-3 mt-12">
        <div className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payment Information
          </CardTitle>
          <CardDescription>
            Send your investment to the wallet address below
          </CardDescription>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Wallet Address
            </label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
              <code className="flex-1 text-sm font-mono break-all">
                {walletId}
              </code>
              <CopyButton text={walletId} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Token/Network
            </label>
            <div className="p-3 bg-muted rounded-md">
              <span className="text-sm font-medium">{tokenName}</span>
            </div>
          </div>
          <div className="rounded-md bg-red-50 dark:bg-red-950/20 p-4 border border-red-200 dark:border-red-900">
            <p className="text-sm text-red-600 dark:text-red-100">
              <strong>Important:</strong> After sending the payment, take a
              screenshot of the transaction and upload it when subscribing. Your
              investment will be pending until admin verification.
            </p>
          </div>
        </div>
      </div>

      {/* Subscription Form */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Subscribe to Plan</CardTitle>
          <CardDescription>
            Enter your investment amount and upload payment proof
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscribeForm planId={plan.id} minInvestment={minInvestment} />
        </CardContent>
      </Card>
    </div>
  );
}
