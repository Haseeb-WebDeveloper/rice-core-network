import { prisma } from '@/lib/prisma'
import { getUserStatistics } from '@/lib/user/get-user-statistics'
import { getTeamStatistics } from '@/lib/user/get-team-statistics'

export async function getUserDetails(userId: string) {
  try {
    // Get user basic info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        isSuspended: true,
        referralCode: true,
        createdAt: true,
        referrer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            referralCode: true,
          },
        },
      },
    })

    if (!user) {
      return null
    }

    // Get user statistics (investments, profit, etc.)
    const userStats = await getUserStatistics(userId)

    // Get team statistics
    const teamStats = await getTeamStatistics(userId)

    // Get investments list
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        amount: true,
        status: true,
        startDate: true,
        totalProfit: true,
        plan: {
          select: {
            name: true,
            dailyProfitPercentage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Limit to last 10 investments
    })

    return {
      user,
      statistics: userStats,
      teamStatistics: teamStats,
      recentInvestments: investments.map((inv) => ({
        ...inv,
        amount: Number(inv.amount),
        totalProfit: Number(inv.totalProfit),
        dailyProfitPercentage: Number(inv.plan.dailyProfitPercentage),
      })),
    }
  } catch (error) {
    console.error('Error fetching user details:', error)
    return null
  }
}

