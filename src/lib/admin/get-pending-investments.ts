import { prisma } from '@/lib/prisma'

export async function getPendingInvestments() {
  try {
    const investments = await prisma.investment.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
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
      plan: {
        ...investment.plan,
        minInvestment: Number(investment.plan.minInvestment),
        dailyProfitPercentage: Number(investment.plan.dailyProfitPercentage),
      },
    }))
  } catch (error) {
    console.error('Error fetching pending investments:', error)
    return []
  }
}

