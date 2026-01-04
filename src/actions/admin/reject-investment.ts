'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function rejectInvestment(investmentId: string) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
    })

    if (!investment) {
      return { error: 'Investment not found' }
    }

    if (investment.status !== 'PENDING') {
      return { error: 'Investment is not pending' }
    }

    // Update investment status to CANCELLED
    await prisma.investment.update({
      where: { id: investmentId },
      data: {
        status: 'CANCELLED',
      },
    })

    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error rejecting investment:', error)
    return { error: error instanceof Error ? error.message : 'An unknown error occurred' }
  }
}

