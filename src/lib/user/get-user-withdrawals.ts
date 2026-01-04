import { prisma } from '@/lib/prisma'

export async function getUserWithdrawals(userId: string) {
  try {
    const withdrawals = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'WITHDRAWAL',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        status: true,
        walletId: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        proofUrl: true,
      },
    })

    return withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      amount: Number(withdrawal.amount),
      status: withdrawal.status,
      walletId: withdrawal.walletId,
      description: withdrawal.description,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
      proofUrl: withdrawal.proofUrl,
    }))
  } catch (error) {
    console.error('Error fetching user withdrawals:', error)
    return []
  }
}

