"use client";

import { NumberFlowGroup } from "@number-flow/react";
import { useEffect, useState } from "react";
import { StatCard } from "./stat-card";
import { Users, DollarSign, TrendingUp } from "lucide-react";

type TeamStats = {
  totalTeamMembers: number;
  totalTeamInvestment: number;
  totalCommissionEarned: number;
  totalProfit: number;
};

type TeamStatisticsCardsProps = {
  stats: TeamStats;
};

export function TeamStatisticsCards({ stats }: TeamStatisticsCardsProps) {
  const [displayStats, setDisplayStats] = useState<TeamStats>({
    totalTeamMembers: 0,
    totalTeamInvestment: 0,
    totalCommissionEarned: 0,
    totalProfit: 0,
  });

  useEffect(() => {
    setDisplayStats(stats);
  }, [stats]);

  return (
    <NumberFlowGroup>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
        <StatCard
          icon={Users}
          label="Total Team Members"
          value={displayStats.totalTeamMembers}
          className="border"
        />

        <StatCard
          icon={DollarSign}
          label="Total Team Investment"
          value={displayStats.totalTeamInvestment}
          format={{
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }}
          className="border-y border-r"
        />

        <StatCard
          icon={TrendingUp}
          label="Total Commission Earned"
          value={displayStats.totalCommissionEarned}
          format={{
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }}
          valueClassName="text-emerald-600 dark:text-emerald-400"
          className="border border-t-0 lg:border-l-0 lg:border-t"
        />

        <StatCard
          icon={TrendingUp}
          label="Total Profit"
          value={displayStats.totalProfit}
          format={{
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }}
          className="border-b border-r lg:border-t"
        />
      </div>
    </NumberFlowGroup>
  );
}

