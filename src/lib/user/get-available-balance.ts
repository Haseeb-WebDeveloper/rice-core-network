import { prisma } from '@/lib/prisma'

/**
 * Calculates the available balance for a user
 * Available balance = (Credits - Debits) - Pending Withdrawals
 * 
 * Credits: DAILY_PROFIT, REFERRAL_INCOME, RANK_REWARD, DEPOSIT (status: COMPLETED)
 * Debits: WITHDRAWAL, INVESTMENT (status: COMPLETED)
 * Pending: WITHDRAWAL (status: PENDING)
 */
export async function getAvailableBalance(userId: string): Promise<number> {
  try {
    // Get all completed credit transactions
    const credits = await prisma.transaction.aggregate({
      where: {
        userId,
        status: 'COMPLETED',
        type: {
          in: ['DAILY_PROFIT', 'REFERRAL_INCOME', 'RANK_REWARD', 'DEPOSIT'],
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Get all completed debit transactions
    const debits = await prisma.transaction.aggregate({
      where: {
        userId,
        status: 'COMPLETED',
        type: {
          in: ['WITHDRAWAL', 'INVESTMENT'],
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Get pending withdrawals
    const pendingWithdrawals = await prisma.transaction.aggregate({
      where: {
        userId,
        status: 'PENDING',
        type: 'WITHDRAWAL',
      },
      _sum: {
        amount: true,
      },
    })

    const totalCredits = Number(credits._sum.amount || 0)
    const totalDebits = Number(debits._sum.amount || 0)
    const totalPendingWithdrawals = Number(pendingWithdrawals._sum.amount || 0)

    // Available balance = (Credits - Debits) - Pending Withdrawals
    const availableBalance = totalCredits - totalDebits - totalPendingWithdrawals

    return Math.max(0, availableBalance) // Ensure balance is never negative
  } catch (error) {
    console.error('Error calculating available balance:', error)
    return 0
  }
}

