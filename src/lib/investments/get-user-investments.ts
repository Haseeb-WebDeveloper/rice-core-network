import { prisma } from '@/lib/prisma'

export async function getUserInvestments(userId: string) {
  try {
    const investments = await prisma.investment.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            minInvestment: true,
            dailyProfitPercentage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Convert Decimal to number for easier handling
    return investments.map((investment) => ({
      ...investment,
      amount: Number(investment.amount),
      totalProfit: Number(investment.totalProfit),
      plan: {
        ...investment.plan,
        minInvestment: Number(investment.plan.minInvestment),
        dailyProfitPercentage: Number(investment.plan.dailyProfitPercentage),
      },
    }))
  } catch (error) {
    console.error('Error fetching user investments:', error)
    return []
  }
}

