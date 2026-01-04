import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getTeamStatistics } from "@/lib/user/get-team-statistics";
import { TeamStatisticsCards } from "@/components/user/team-statistics-cards";
import { LevelCards } from "@/components/user/level-cards";

export default async function TeamPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const teamStats = await getTeamStatistics(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">My Team</h1>
        <p className="text-muted-foreground">
          View and manage your referral team members across all levels
        </p>
      </div>

      {/* Team Statistics */}
      <TeamStatisticsCards
        stats={{
          totalTeamMembers: teamStats.totalTeamMembers,
          totalTeamInvestment: teamStats.totalTeamInvestment,
          totalCommissionEarned: teamStats.totalCommissionEarned,
          totalProfit: teamStats.totalProfit,
        }}
      />

      {/* Level Cards */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Team by Level</h2>
          <p className="text-muted-foreground">
            View team members and earnings for each referral level
          </p>
        </div>

        <LevelCards levelStats={teamStats.levelStats} />
      </div>
    </div>
  );
}

