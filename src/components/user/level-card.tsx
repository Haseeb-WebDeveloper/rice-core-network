"use client";

import NumberFlow from "@number-flow/react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type LevelCardProps = {
  level: number;
  commissionPercentage: number;
  memberCount: number;
  totalInvestment: number;
  totalCommission: number;
};

export function LevelCard({
  level,
  commissionPercentage,
  memberCount,
  totalInvestment,
  totalCommission,
}: LevelCardProps) {
  return (
    <div className="bg-primary/10 border rounded-lg">
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Level {level}</h3>
            <p className="text-sm text-muted-foreground">
              {commissionPercentage}% Commission
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-foreground">Members</p>
            <div className="font-semibold font-mono [font-variant-numeric:tabular-nums]">
              <NumberFlow value={memberCount} locales="en-US" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-foreground">Total Investment</p>
            <div className="font-semibold font-mono [font-variant-numeric:tabular-nums]">
              <NumberFlow
                value={totalInvestment}
                locales="en-US"
                format={{
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-foreground">Total Commission</p>
            <div className="font-semibold font-mono text-emerald-600 dark:text-emerald-400 [font-variant-numeric:tabular-nums]">
              <NumberFlow
                value={totalCommission}
                locales="en-US"
                format={{
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
            </div>
          </div>
        </div>

        {/* View Team Button */}
        <Link href={`/user/team/level/${level}`} className="block">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            View Team
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

