import { prisma } from '@/lib/prisma'

/**
 * Calculates the available balance for a user
 * Available balance = (Credits - Debits) - Pending Withdrawals
 * 
 * Credits: DAILY_PROFIT, REFERRAL_INCOME, RANK_REWARD, DEPOSIT (status: COMPLETED)
 * Debits: WITHDRAWAL, INVESTMENT (status: COMPLETED)
 * Pending: WITHDRAWAL (status: PENDING)
 * 
 * Note: We also check daily_profits, referral_incomes, and user_ranks directly
 * to ensure balance is accurate even if transactions aren't created properly
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

    // Also get daily profits directly (in case transactions weren't created)
    const dailyProfits = await prisma.dailyProfit.aggregate({
      where: {
        userId,
      },
      _sum: {
        amount: true,
      },
    })

    // Get referral incomes directly
    const referralIncomes = await prisma.referralIncome.aggregate({
      where: {
        recipientId: userId,
      },
      _sum: {
        amount: true,
      },
    })

    // Get rank rewards directly (where rewardPaidAt is not null)
    const rankRewards = await prisma.userRank.aggregate({
      where: {
        userId,
        rewardPaidAt: {
          not: null,
        },
      },
      _sum: {
        rewardAmount: true,
      },
    })

    // Get deposits from transactions
    const deposits = await prisma.transaction.aggregate({
      where: {
        userId,
        status: 'COMPLETED',
        type: 'DEPOSIT',
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

    // Calculate total credits from direct sources (source of truth)
    // Daily profits, referral incomes, and rank rewards come from their respective tables
    // Deposits come from transactions (since they might only exist there)
    const totalCredits =
      Number(dailyProfits._sum.amount || 0) +
      Number(referralIncomes._sum.amount || 0) +
      Number(rankRewards._sum.rewardAmount || 0) +
      Number(deposits._sum.amount || 0)
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

