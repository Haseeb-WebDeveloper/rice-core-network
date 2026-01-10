"use client";

import { NumberFlowGroup } from "@number-flow/react";
import {
  Users,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/user/stat-card";

type AdminStatistics = {
  totalUsers: number;
  totalInvestments: number;
  pendingInvestments: number;
  activeInvestments: number;
  totalInvestmentAmount: number;
  pendingInvestmentAmount: number;
};

type AdminStatisticsCardsProps = {
  statistics: AdminStatistics;
};

const currencyFormat = {
  style: "currency" as const,
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export function AdminStatisticsCards({ statistics }: AdminStatisticsCardsProps) {
  const [displayStats, setDisplayStats] = useState<AdminStatistics>({
    totalUsers: 0,
    totalInvestments: 0,
    pendingInvestments: 0,
    activeInvestments: 0,
    totalInvestmentAmount: 0,
    pendingInvestmentAmount: 0,
  });

  useEffect(() => {
    // Animate from 0 to actual values after component mounts
    setDisplayStats(statistics);
  }, [statistics]);

  return (
    <NumberFlowGroup>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0">
        <StatCard
          icon={Users}
          label="Total Users"
          value={displayStats.totalUsers}
          className="border"
        />

        <StatCard
          icon={TrendingUp}
          label="Active Investments"
          value={displayStats.activeInvestments}
          className="border-y border-r lg:border-r-0"
        />

        <StatCard
          icon={Clock}
          label="Pending Approvals"
          value={displayStats.pendingInvestments}
          className="border-x border-b lg:border-t"
        />

        <StatCard
          icon={DollarSign}
          label="Total Investment"
          value={Number(displayStats.totalInvestmentAmount)}
          format={currencyFormat}
          className="border-r border-b lg:border-t"
        />
      </div>
    </NumberFlowGroup>
  );
}

