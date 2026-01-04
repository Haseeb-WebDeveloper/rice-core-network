import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { getUserInvestments } from "@/lib/investments/get-user-investments";
import { getUserStatistics } from "@/lib/user/get-user-statistics";
import { InvestmentCard } from "@/components/investments/investment-card";
import { StatisticsCards } from "@/components/user/statistics-cards";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import Image from "next/image";
import { CopyButton } from "@/components/investments/copy-button";
import { maxChar } from "@/lib/max-char";
import { prisma } from "@/lib/prisma";
import { ReferralLink } from "@/components/user/referral-link";

export default async function UserPage() {
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

  const investments = await getUserInvestments(user.id);
  const statistics = await getUserStatistics(user.id);

  // Calculate investment counts for display
  const stats = {
    total: investments.length,
    pending: investments.filter((inv) => inv.status === "PENDING").length,
    active: investments.filter((inv) => inv.status === "ACTIVE").length,
    completed: investments.filter((inv) => inv.status === "COMPLETED").length,
    cancelled: investments.filter((inv) => inv.status === "CANCELLED").length,
  };

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

      {/* Statistics Cards */}
      <Suspense fallback={<div>Loading...</div>}>
        <StatisticsCards statistics={statistics} />
      </Suspense>

      {/* Investments List */}
      <div className="pt-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">All Investments</h2>
          <p className="text-muted-foreground">
            {stats.total === 0
              ? "You haven't made any investments yet"
              : `You have ${stats.total} investment${
                  stats.total === 1 ? "" : "s"
                }`}
          </p>
        </div>

        {investments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">
                No investments yet
              </p>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Start investing to grow your wealth
              </p>
              <Link href="/user/plans">
                <Button size="lg">Browse Investment Plans</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {investments.map((investment) => (
              <InvestmentCard key={investment.id} investment={investment} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile CTA - Browse Plans */}
      <Link
        href="/user/plans"
        className="md:hidden block border-t border-border pt-4 mt-16"
      >
        <div className="border bg-green-500/10 hover:bg-green-500/10 transition-colors rounded-md">
          <div className="p-4 flex items-center justify-between">
            <div className="flex flex-col items-start justify-start">
              <p className="font-medium text-foreground">
                Browse Investment Plans
              </p>
              <p className="text-sm text-muted-foreground">
                Start a new investment
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-green-500" />
          </div>
        </div>
      </Link>
    </div>
  );
}
