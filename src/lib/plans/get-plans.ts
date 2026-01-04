import { prisma } from '@/lib/prisma'

export async function getInvestmentPlans() {
  try {
    const plans = await prisma.investmentPlan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        minInvestment: 'asc',
      },
    })

    return plans
  } catch (error) {
    console.error('Error fetching investment plans:', error)
    return []
  }
}

