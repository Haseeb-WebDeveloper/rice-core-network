import { prisma } from '@/lib/prisma'

export async function getPlanById(id: string) {
  try {
    const plan = await prisma.investmentPlan.findUnique({
      where: {
        id,
      },
    })

    return plan
  } catch (error) {
    console.error('Error fetching investment plan:', error)
    return null
  }
}

