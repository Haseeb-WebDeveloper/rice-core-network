'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deletePlanSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
})

export async function deletePlan(planId: string) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    const validated = deletePlanSchema.parse({ planId })

    // Check if plan exists
    const plan = await prisma.investmentPlan.findUnique({
      where: { id: validated.planId },
      select: { id: true },
    })

    if (!plan) {
      return { error: 'Investment plan not found' }
    }

    // Soft delete plan by setting deletedAt
    await prisma.investmentPlan.update({
      where: { id: validated.planId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })

    revalidatePath('/admin/plans')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.message }
    }
    console.error('Error deleting investment plan:', error)
    return { error: error instanceof Error ? error.message : 'Failed to delete investment plan' }
  }
}

