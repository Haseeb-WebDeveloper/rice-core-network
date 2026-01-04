import { prisma } from '@/lib/prisma'

export async function getUserStatistics(userId: string) {
  try {
    // Get today's date for filtering
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Execute all queries in parallel for better performance
    const [
      investmentStats,
      totalReferralIncome,
      todayReferralIncome,
      totalRankRewards,
      todayRankRewards,
      level1TeamCount,
      allLevelTeamCount,
      totalWithdrawal,
      todayDailyProfits,
    ] = await Promise.all([
      // Investment stats: total investment and total profit from investments
      prisma.investment.aggregate({
        where: {
          userId,
          deletedAt: null,
        },
        _sum: {
          amount: true,
          totalProfit: true,
        },
      }),

      // Total referral income
      prisma.referralIncome.aggregate({
        where: {
          recipientId: userId,
        },
        _sum: {
          amount: true,
        },
      }),

      // Today's referral income
      prisma.referralIncome.aggregate({
        where: {
          recipientId: userId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          amount: true,
        },
      }),

      // Total rank rewards (where rewardPaidAt is not null)
      prisma.userRank.aggregate({
        where: {
          userId,
          rewardPaidAt: {
            not: null,
          },
        },
        _sum: {
          rewardAmount: true,
        },
      }),

      // Today's rank rewards
      prisma.userRank.aggregate({
        where: {
          userId,
          rewardPaidAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          rewardAmount: true,
        },
      }),

      // Level 1 team count (direct referrals)
      prisma.user.count({
        where: {
          referrerId: userId,
        },
      }),

      // All level team count (distinct referredId from ReferralRelationship)
      prisma.referralRelationship.findMany({
        where: {
          referrerId: userId,
        },
        select: {
          referredId: true,
        },
      }),

      // Total withdrawal (completed withdrawals only)
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
        },
        _sum: {
          amount: true,
        },
      }),

      // Today's daily profits
      prisma.dailyProfit.aggregate({
        where: {
          userId,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        _sum: {
          amount: true,
        },
      }),
    ])

    // Calculate totals
    const totalInvestment = Number(investmentStats._sum.amount || 0)
    const investmentProfit = Number(investmentStats._sum.totalProfit || 0)
    const referralIncome = Number(totalReferralIncome._sum.amount || 0)
    const rankRewards = Number(totalRankRewards._sum.rewardAmount || 0)
    const totalProfit = investmentProfit + referralIncome + rankRewards

    // Calculate today's profit
    const todayDailyProfit = Number(todayDailyProfits._sum.amount || 0)
    const todayReferralIncomeAmount = Number(todayReferralIncome._sum.amount || 0)
    const todayRankRewardsAmount = Number(todayRankRewards._sum.rewardAmount || 0)
    const todayProfit = todayDailyProfit + todayReferralIncomeAmount + todayRankRewardsAmount

    // Team counts
    const level1Team = level1TeamCount
    // Count distinct referredId values (users in all levels)
    const uniqueReferredIds = new Set(allLevelTeamCount.map((rel) => rel.referredId))
    const allLevelTeam = uniqueReferredIds.size

    // Withdrawal
    const totalWithdrawalAmount = Number(totalWithdrawal._sum.amount || 0)

    return {
      totalInvestment,
      totalProfit,
      todayProfit,
      level1Team,
      allLevelTeam,
      totalWithdrawal: totalWithdrawalAmount,
    }
  } catch (error) {
    console.error('Error fetching user statistics:', error)
    // Return default values on error
    return {
      totalInvestment: 0,
      totalProfit: 0,
      todayProfit: 0,
      level1Team: 0,
      allLevelTeam: 0,
      totalWithdrawal: 0,
    }
  }
}

