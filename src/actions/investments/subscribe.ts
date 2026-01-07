'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { getPlanById } from '@/lib/plans/get-plan-by-id'
import { uploadImage } from '@/lib/cloudinary/upload'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const subscribeSchema = z.object({
  planId: z.string().uuid('Invalid plan ID'),
  amount: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, 'Amount must be a valid number'),
  paymentProof: z.instanceof(File).refine((file) => file.size > 0, 'Payment proof is required'),
})

export async function subscribeToPlan(formData: FormData) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'You must be logged in to subscribe to a plan' }
    }

    // Validate and parse form data
    const planId = formData.get('planId') as string
    const amount = formData.get('amount') as string
    const paymentProof = formData.get('paymentProof') as File

    const validated = subscribeSchema.parse({
      planId,
      amount,
      paymentProof,
    })

    // Get plan
    const plan = await getPlanById(validated.planId)
    if (!plan) {
      return { error: 'Investment plan not found' }
    }

    if (!plan.isActive) {
      return { error: 'This investment plan is not available' }
    }

    // Validate amount
    const minInvestment = Number(plan.minInvestment)
    const maxInvestment = Number(plan.maxInvestment)
    if (validated.amount < minInvestment) {
      return {
        error: `Minimum investment amount is ${minInvestment.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })}`,
      }
    }
    if (validated.amount > maxInvestment) {
      return {
        error: `Maximum investment amount is ${maxInvestment.toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        })}`,
      }
    }

    // Validate file type and size
    if (!paymentProof.type.startsWith('image/')) {
      return { error: 'Payment proof must be an image file' }
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (paymentProof.size > maxSize) {
      return { error: 'Payment proof image must be less than 5MB' }
    }

    // Upload payment proof to Cloudinary
    let paymentProofUrl: string
    try {
      paymentProofUrl = await uploadImage(paymentProof, 'payment-proofs')
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      return { error: 'Failed to upload payment proof. Please try again.' }
    }

    // Create investment with PENDING status
    // totalProfit starts at 0 and will increase as user receives daily profits
    // Investment completes when totalProfit >= 2 * amount (200% return)
    const investment = await prisma.investment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: validated.amount,
        startDate: new Date(),
        status: 'PENDING',
        paymentProofUrl,
        totalProfit: 0,
      },
    })

    revalidatePath('/user')
    revalidatePath('/user/plans')

    return { success: true, investment }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.message }
    }
    console.error('Subscribe error:', error)
    return { error: error instanceof Error ? error.message : 'An error occurred while subscribing' }
  }
}

