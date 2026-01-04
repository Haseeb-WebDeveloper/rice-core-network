"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";

type UserDetailsDialogProps = {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UserDetailsDialog({
  userId,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user details when dialog opens
  useEffect(() => {
    if (!open || !userId) {
      if (!open) {
        setUserDetails(null);
      }
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}/details`);
        if (cancelled) return;

        if (response.ok) {
          const data = await response.json();
          if (!cancelled) {
            setUserDetails(data);
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching user details:", error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchUserDetails();

    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View comprehensive information about this user
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : userDetails ? (
          <div className="space-y-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {userDetails.user.avatar ? (
                    <Image
                      src={userDetails.user.avatar}
                      alt={userDetails.user.fullName}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-semibold">
                      {userDetails.user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-xl font-semibold">
                      {userDetails.user.fullName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {userDetails.user.email}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge
                        className={
                          userDetails.user.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-500 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20"
                        }
                      >
                        {userDetails.user.role}
                      </Badge>
                      {userDetails.user.isActive && (
                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20">
                          Active
                        </Badge>
                      )}
                      {userDetails.user.isSuspended && (
                        <Badge className="bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20">
                          Suspended
                        </Badge>
                      )}
                      {userDetails.user.isVerified && (
                        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Referral Code
                    </div>
                    <div className="font-medium">
                      {userDetails.user.referralCode}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Joined</div>
                    <div className="font-medium">
                      {new Date(
                        userDetails.user.createdAt
                      ).toLocaleDateString()}
                    </div>
                  </div>
                  {userDetails.user.referrer && (
                    <div className="col-span-2">
                      <div className="text-sm text-muted-foreground">
                        Referred By
                      </div>
                      <div className="font-medium">
                        {userDetails.user.referrer.fullName} (
                        {userDetails.user.referrer.email})
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Investment
                    </div>
                    <div className="text-xl font-semibold">
                      $
                      {userDetails.statistics.totalInvestment.toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Profit
                    </div>
                    <div className="text-xl font-semibold text-green-600 dark:text-green-500">
                      $
                      {userDetails.statistics.totalProfit.toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Today Profit
                    </div>
                    <div className="text-xl font-semibold text-green-600 dark:text-green-500">
                      $
                      {userDetails.statistics.todayProfit.toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Level 1 Team
                    </div>
                    <div className="text-xl font-semibold">
                      {userDetails.statistics.level1Team}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      All Level Team
                    </div>
                    <div className="text-xl font-semibold">
                      {userDetails.statistics.allLevelTeam}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Withdrawal
                    </div>
                    <div className="text-xl font-semibold">
                      $
                      {userDetails.statistics.totalWithdrawal.toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Team Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Team Members
                    </div>
                    <div className="text-xl font-semibold">
                      {userDetails.teamStatistics.totalTeamMembers}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Team Investment
                    </div>
                    <div className="text-xl font-semibold">
                      $
                      {userDetails.teamStatistics.totalTeamInvestment.toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Total Commission
                    </div>
                    <div className="text-xl font-semibold text-green-600 dark:text-green-500">
                      $
                      {userDetails.teamStatistics.totalCommissionEarned.toLocaleString(
                        "en-US",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  {userDetails.teamStatistics.levelStats.map((level: any) => (
                    <div key={level.level} className="p-3 border rounded-lg">
                      <div className="text-sm font-medium mb-2">
                        Level {level.level}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Members:
                          </span>
                          <span className="font-medium">
                            {level.memberCount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Investment:
                          </span>
                          <span className="font-medium">
                            $
                            {level.totalInvestment.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Commission:
                          </span>
                          <span className="font-medium text-green-600 dark:text-green-500">
                            $
                            {level.totalCommission.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Investments */}
            {userDetails.recentInvestments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Investments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userDetails.recentInvestments.map((investment: any) => (
                      <div
                        key={investment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">
                            {investment.plan.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(
                              investment.startDate
                            ).toLocaleDateString()}{" "}
                            • {investment.dailyProfitPercentage}% daily
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            $
                            {investment.amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <div className="text-sm text-green-600 dark:text-green-500">
                            Profit: $
                            {investment.totalProfit.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <Badge
                            className={
                              investment.status === "ACTIVE"
                                ? "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20"
                                : investment.status === "COMPLETED"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20"
                                : investment.status === "PENDING"
                                ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20"
                            }
                          >
                            {investment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
