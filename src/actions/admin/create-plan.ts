'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(100, 'Plan name must be less than 100 characters'),
  description: z.string().optional(),
  minInvestment: z.number().min(0.01, 'Minimum investment must be greater than 0'),
  maxInvestment: z.number().min(0.01, 'Maximum investment must be greater than 0'),
  dailyProfitPercentage: z.number().min(0, 'Daily profit percentage must be 0 or greater').max(100, 'Daily profit percentage cannot exceed 100%'),
  isActive: z.boolean().default(true),
}).refine((data) => data.maxInvestment >= data.minInvestment, {
  message: 'Maximum investment must be greater than or equal to minimum investment',
  path: ['maxInvestment'],
})

export async function createPlan(formData: FormData) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    // Validate input
    const validated = createPlanSchema.parse({
      name: formData.get('name'),
      description: formData.get('description') || undefined,
      minInvestment: parseFloat(formData.get('minInvestment') as string),
      maxInvestment: parseFloat(formData.get('maxInvestment') as string),
      dailyProfitPercentage: parseFloat(formData.get('dailyProfitPercentage') as string),
      isActive: formData.get('isActive') === 'true' || formData.get('isActive') === 'on',
    })

    // Create plan
    const plan = await prisma.investmentPlan.create({
      data: {
        name: validated.name,
        description: validated.description,
        minInvestment: validated.minInvestment,
        maxInvestment: validated.maxInvestment,
        dailyProfitPercentage: validated.dailyProfitPercentage,
        isActive: validated.isActive,
        createdBy: user.id,
      },
    })

    revalidatePath('/admin/plans')
    revalidatePath('/user/plans')

    return { success: true, plan }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.message }
    }
    console.error('Error creating plan:', error)
    return { error: error instanceof Error ? error.message : 'Failed to create plan' }
  }
}

