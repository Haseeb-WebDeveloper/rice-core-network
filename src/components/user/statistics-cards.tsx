"use client";

import { NumberFlowGroup } from "@number-flow/react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  ArrowDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "./stat-card";

type Statistics = {
  totalInvestment: number;
  totalProfit: number;
  todayProfit: number;
  level1Team: number;
  allLevelTeam: number;
  totalWithdrawal: number;
};

type StatisticsCardsProps = {
  statistics: Statistics;
};

const currencyFormat = {
  style: "currency" as const,
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export function StatisticsCards({ statistics }: StatisticsCardsProps) {
  const [displayStats, setDisplayStats] = useState<Statistics>({
    totalInvestment: 0,
    totalProfit: 0,
    todayProfit: 0,
    level1Team: 0,
    allLevelTeam: 0,
    totalWithdrawal: 0,
  });

  useEffect(() => {
    // Animate from 0 to actual values after component mounts
    setDisplayStats(statistics);
  }, [statistics]);

  return (
    <NumberFlowGroup>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-0">
        <StatCard
          icon={DollarSign}
          label="Total Investment"
          value={displayStats.totalInvestment}
          format={currencyFormat}
          className="border"
        />

        <StatCard
          icon={TrendingUp}
          label="Total Profit"
          value={displayStats.totalProfit}
          format={currencyFormat}
          className="border-y border-r"
        />

        <StatCard
          icon={Calendar}
          label="Today Profit"
          value={displayStats.todayProfit}
          format={currencyFormat}
          className="border lg:border-l-0"
        />

        <StatCard
          icon={Users}
          label="Level 1 Team"
          value={displayStats.level1Team}
          className="border-y border-r lg:border-l lg:border-t-0"
        />

        <StatCard
          icon={Users}
          label="All Level Team"
          value={displayStats.allLevelTeam}
          className="border lg:border-l-0 lg:border-t-0"
        />

        <StatCard
          icon={ArrowDown}
          label="Total Withdrawal"
          value={displayStats.totalWithdrawal}
          format={currencyFormat}
          className="border-y border-r lg:border-l-0 lg:border-t-0"
        />
      </div>
    </NumberFlowGroup>
  );
}

