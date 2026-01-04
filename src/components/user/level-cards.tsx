"use client";

import { useEffect, useState } from "react";
import { LevelCard } from "./level-card";
import { COMMISSION_PERCENTAGES } from "@/constants/limit";

type LevelStat = {
  level: number;
  memberCount: number;
  totalInvestment: number;
  totalCommission: number;
};

type LevelCardsProps = {
  levelStats: LevelStat[];
};

export function LevelCards({ levelStats }: LevelCardsProps) {
  const [displayStats, setDisplayStats] = useState<LevelStat[]>(
    levelStats.map((stat) => ({
      ...stat,
      memberCount: 0,
      totalInvestment: 0,
      totalCommission: 0,
    }))
  );

  useEffect(() => {
    setDisplayStats(levelStats);
  }, [levelStats]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {displayStats.map((levelStat) => (
        <LevelCard
          key={levelStat.level}
          level={levelStat.level}
          commissionPercentage={
            COMMISSION_PERCENTAGES[levelStat.level as keyof typeof COMMISSION_PERCENTAGES]
          }
          memberCount={levelStat.memberCount}
          totalInvestment={levelStat.totalInvestment}
          totalCommission={levelStat.totalCommission}
        />
      ))}
    </div>
  );
}

