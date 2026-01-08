import { prisma } from '@/lib/prisma'

export async function getAllPlans() {
  try {
    const plans = await prisma.investmentPlan.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            investments: true,
          },
        },
      },
      orderBy: {
        minInvestment: 'asc',
      },
    })

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      minInvestment: Number(plan.minInvestment),
      maxInvestment: Number(plan.maxInvestment),
      dailyProfitPercentage: Number(plan.dailyProfitPercentage),
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      investmentCount: plan._count.investments,
    }))
  } catch (error) {
    console.error('Error fetching all plans:', error)
    return []
  }
}

