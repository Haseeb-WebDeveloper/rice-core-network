'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updatePlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Plan name must be less than 100 characters'),
  description: z.string().optional(),
  minInvestment: z.number().min(0.01, 'Minimum investment must be greater than 0'),
  dailyProfitPercentage: z.number().min(0, 'Daily profit percentage must be 0 or greater').max(100, 'Daily profit percentage cannot exceed 100%'),
  isActive: z.boolean(),
})

export async function updatePlan(planId: string, formData: FormData) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    // Check if plan exists
    const existingPlan = await prisma.investmentPlan.findUnique({
      where: { id: planId },
    })

    if (!existingPlan) {
      return { error: 'Plan not found' }
    }

    // Validate input
    const validated = updatePlanSchema.parse({
      name: formData.get('name'),
      description: formData.get('description') || undefined,
      minInvestment: parseFloat(formData.get('minInvestment') as string),
      dailyProfitPercentage: parseFloat(formData.get('dailyProfitPercentage') as string),
      isActive: formData.get('isActive') === 'true' || formData.get('isActive') === 'on',
    })

    // Update plan
    const plan = await prisma.investmentPlan.update({
      where: { id: planId },
      data: {
        name: validated.name,
        description: validated.description,
        minInvestment: validated.minInvestment,
        dailyProfitPercentage: validated.dailyProfitPercentage,
        isActive: validated.isActive,
      },
    })

    revalidatePath('/admin/plans')
    revalidatePath('/user/plans')

    return { success: true, plan }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Error updating plan:', error)
    return { error: error instanceof Error ? error.message : 'Failed to update plan' }
  }
}

