import { getPendingInvestments } from "@/lib/admin/get-pending-investments";
import { getAdminStatistics } from "@/lib/admin/get-statistics";
import { Card, CardContent } from "@/components/ui/card";
import { PendingInvestmentCard } from "@/components/admin/pending-investment-card";
import { AdminStatisticsCards } from "@/components/admin/admin-statistics-cards";
import { Clock } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { maxChar } from "@/lib/max-char";
import { ReferralLink } from "@/components/user/referral-link";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch referrer if exists
  const referrer = user.referrerId
    ? await prisma.user.findUnique({
        where: { id: user.referrerId },
        select: { fullName: true, avatar: true },
      })
    : null;

  const [pendingInvestments, statistics] = await Promise.all([
    getPendingInvestments(),
    getAdminStatistics(),
  ]);

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <Image
              src={user.avatar || ""}
              alt="Avatar"
              width={100}
              height={100}
              className="w-20 h-20 rounded-full border border-foreground/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-semibold text-xl flex items-center justify-center border border-foreground/40">
              <span>
                {user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <p className="text-xl font-bold">{maxChar(user.fullName, 20)}</p>
            <div className="flex flex-col gap-2">
              <ReferralLink referralCode={user.referralCode} />
            </div>

            {referrer ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Referred by: {' '}
                </span>
                {referrer.avatar ? (
                  <Image
                    src={referrer.avatar}
                    alt={referrer.fullName}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-semibold text-[8px] leading-0 flex items-center justify-center border border-foreground/60">
                    <span>
                      {referrer.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">
                  {maxChar(referrer.fullName, 20)}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Referred by: {' '}
                <span className="font-semibold text-foreground font-mono">
                  Ricecore
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage investments and monitor platform activity
        </p>
      </div>

      {/* Statistics Cards */}
      <AdminStatisticsCards
        statistics={{
          ...statistics,
          totalInvestmentAmount: Number(statistics.totalInvestmentAmount),
          pendingInvestmentAmount: Number(statistics.pendingInvestmentAmount),
        }}
      />

      {/* Pending Investments */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Pending Investments</h2>
          <p className="text-muted-foreground">
            Review and approve investment requests from users
          </p>
        </div>

        {pendingInvestments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">
                No pending investments
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                All investment requests have been processed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingInvestments.map((investment) => (
              <PendingInvestmentCard
                key={investment.id}
                investment={investment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
