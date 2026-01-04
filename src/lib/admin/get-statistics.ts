import { prisma } from '@/lib/prisma'

export async function getAdminStatistics() {
  try {
    const [
      totalUsers,
      totalInvestments,
      pendingInvestments,
      activeInvestments,
      totalInvestmentAmount,
      pendingInvestmentAmount,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: 'USER',
          deletedAt: null,
        },
      }),
      prisma.investment.count({
        where: {
          deletedAt: null,
        },
      }),
      prisma.investment.count({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
      }),
      prisma.investment.count({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
        },
      }),
      prisma.investment.aggregate({
        where: {
          deletedAt: null,
        },
        _sum: {
          amount: true,
        },
      }),
      prisma.investment.aggregate({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
        _sum: {
          amount: true,
        },
      }),
    ])

    return {
      totalUsers,
      totalInvestments,
      pendingInvestments,
      activeInvestments,
      totalInvestmentAmount: totalInvestmentAmount._sum.amount || 0,
      pendingInvestmentAmount: pendingInvestmentAmount._sum.amount || 0,
    }
  } catch (error) {
    console.error('Error fetching admin statistics:', error)
    return {
      totalUsers: 0,
      totalInvestments: 0,
      pendingInvestments: 0,
      activeInvestments: 0,
      totalInvestmentAmount: 0,
      pendingInvestmentAmount: 0,
    }
  }
}

