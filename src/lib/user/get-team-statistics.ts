import { prisma } from '@/lib/prisma'
import { getUserStatistics } from './get-user-statistics'

type LevelStats = {
  level: number
  memberCount: number
  totalInvestment: number
  totalCommission: number
}

export type TeamStatistics = {
  totalTeamMembers: number
  totalTeamInvestment: number
  totalCommissionEarned: number
  totalProfit: number
  levelStats: LevelStats[]
}

export async function getTeamStatistics(userId: string): Promise<TeamStatistics> {
  try {
    // Get user's total profit (includes investment profit + referral income + rank rewards)
    const userStats = await getUserStatistics(userId)

    // Get all team members (all levels) - distinct referredId
    const allTeamRelationships = await prisma.referralRelationship.findMany({
      where: {
        referrerId: userId,
      },
      select: {
        referredId: true,
        level: true,
      },
    })

    // Count total team members (distinct referredId)
    const uniqueTeamMemberIds = new Set(allTeamRelationships.map((rel) => rel.referredId))
    const totalTeamMembers = uniqueTeamMemberIds.size

    // Get all team member IDs
    const teamMemberIds = Array.from(uniqueTeamMemberIds)

    // Calculate total team investment (sum of all investments from team members)
    const teamInvestmentStats = await prisma.investment.aggregate({
      where: {
        userId: {
          in: teamMemberIds,
        },
        deletedAt: null,
      },
      _sum: {
        amount: true,
      },
    })

    const totalTeamInvestment = Number(teamInvestmentStats._sum.amount || 0)

    // Get total commission earned from ReferralIncome
    const totalCommissionFromIncome = await prisma.referralIncome.aggregate({
      where: {
        recipientId: userId,
      },
      _sum: {
        amount: true,
      },
    })

    const totalCommissionEarnedActual = Number(totalCommissionFromIncome._sum.amount || 0)

    // Get level-wise statistics
    const levelStats: LevelStats[] = []

    for (let level = 1; level <= 4; level++) {
      // Get team member IDs for this level
      const levelTeamMemberIds = allTeamRelationships
        .filter((rel) => rel.level === level)
        .map((rel) => rel.referredId)

      // Count distinct members for this level
      const uniqueLevelMemberIds = new Set(levelTeamMemberIds)
      const memberCount = uniqueLevelMemberIds.size

      // Get total investment for this level's team members
      const levelInvestmentStats = await prisma.investment.aggregate({
        where: {
          userId: {
            in: Array.from(uniqueLevelMemberIds),
          },
          deletedAt: null,
        },
        _sum: {
          amount: true,
        },
      })

      const totalInvestment = Number(levelInvestmentStats._sum.amount || 0)

      // Get total commission earned from this level
      const levelCommissionStats = await prisma.referralIncome.aggregate({
        where: {
          recipientId: userId,
          level: level,
        },
        _sum: {
          amount: true,
        },
      })

      const totalCommission = Number(levelCommissionStats._sum.amount || 0)

      levelStats.push({
        level,
        memberCount,
        totalInvestment,
        totalCommission,
      })
    }

    return {
      totalTeamMembers,
      totalTeamInvestment,
      totalCommissionEarned: totalCommissionEarnedActual,
      totalProfit: userStats.totalProfit,
      levelStats,
    }
  } catch (error) {
    console.error('Error fetching team statistics:', error)
    // Return default values on error
    return {
      totalTeamMembers: 0,
      totalTeamInvestment: 0,
      totalCommissionEarned: 0,
      totalProfit: 0,
      levelStats: [
        { level: 1, memberCount: 0, totalInvestment: 0, totalCommission: 0 },
        { level: 2, memberCount: 0, totalInvestment: 0, totalCommission: 0 },
        { level: 3, memberCount: 0, totalInvestment: 0, totalCommission: 0 },
        { level: 4, memberCount: 0, totalInvestment: 0, totalCommission: 0 },
      ],
    }
  }
}

