'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'
import { distributeReferralCommissions } from '@/lib/admin/distribute-referral-commissions'

export async function approveInvestment(investmentId: string, amount?: number) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: { plan: true },
    })

    if (!investment) {
      return { error: 'Investment not found' }
    }

    if (investment.status !== 'PENDING') {
      return { error: 'Investment is not pending' }
    }

    // Update investment status to ACTIVE and optionally update amount
    await prisma.investment.update({
      where: { id: investmentId },
      data: {
        status: 'ACTIVE',
        ...(amount !== undefined && { amount }),
      },
    })

    // Distribute referral commissions (don't fail approval if commission fails)
    try {
      await distributeReferralCommissions(investmentId)
    } catch (commissionError) {
      // Log error but don't fail the approval
      console.error(
        `Failed to distribute referral commissions for investment ${investmentId}:`,
        commissionError
      )
      // Continue with approval even if commission distribution fails
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error approving investment:', error)
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' }
  }
}

