"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Investment = {
  id: string;
  amount: number;
  totalProfit: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  paymentProofUrl: string | null;
  startDate: Date;
  createdAt: Date;
  plan: {
    id: string;
    name: string;
    minInvestment: number;
    dailyProfitPercentage: number;
  };
};

type InvestmentCardProps = {
  investment: Investment;
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "PENDING":
      return {
        label: "Pending",
        color: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
        icon: Clock,
      };
    case "ACTIVE":
      return {
        label: "Active",
        color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        icon: TrendingUp,
      };
    case "COMPLETED":
      return {
        label: "Completed",
        color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        icon: CheckCircle2,
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        color: "bg-red-500/10 text-red-700 dark:text-red-400",
        icon: XCircle,
      };
    default:
      return {
        label: status,
        color: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
        icon: AlertCircle,
      };
  }
};

export function InvestmentCard({ investment }: InvestmentCardProps) {
  const [showImageModal, setShowImageModal] = useState(false);

  // Calculate progress
  const targetProfit = investment.amount * 2; // 200% return
  const progressPercentage = Math.min(
    (investment.totalProfit / targetProfit) * 100,
    100
  );

  // Calculate daily profit
  const estimatedDailyProfit =
    (investment.amount * investment.plan.dailyProfitPercentage) / 100;

  const statusConfig = getStatusConfig(investment.status);
  const StatusIcon = statusConfig.icon;

  return (
    <>
      <Card className="border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-medium text-foreground truncate">
              {investment.plan.name}
            </h3>
            <Badge className={cn("shrink-0 text-xs px-2.5 py-1", statusConfig.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Main Investment Amount */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Invested Amount</p>
            <p className="text-2xl font-semibold text-foreground">
              ${investment.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Profit Metrics */}
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Profit</p>
              <p className="text-lg font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                ${investment.totalProfit.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Daily Profit</p>
              <p className="text-lg font-semibold font-mono text-foreground">
                ${estimatedDailyProfit.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Plan Details & Progress */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Daily Rate</span>
              <span className="font-medium">{investment.plan.dailyProfitPercentage}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Return</span>
              <span className="font-medium">2X</span>
            </div>
            {investment.status === "ACTIVE" && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Proof - For PENDING */}
          {investment.status === "PENDING" && investment.paymentProofUrl && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-2">Payment Proof</p>
              <button
                onClick={() => setShowImageModal(true)}
                className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <Image
                  src={investment.paymentProofUrl}
                  alt="Payment proof"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                  <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Modal */}
      {showImageModal && investment.paymentProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImageModal(false);
              }}
              className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <XCircle className="h-6 w-6" />
            </button>
            <div className="rounded-md overflow-hidden">
              <Image
                src={investment.paymentProofUrl}
                alt="Payment proof"
                width={800}
                height={600}
                className="max-h-[90vh] max-w-[90vw] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
