'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

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

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error approving investment:', error)
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' }
  }
}

