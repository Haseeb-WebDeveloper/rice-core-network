import { prisma } from '@/lib/prisma'

export async function getPendingWithdrawals() {
  try {
    const withdrawals = await prisma.transaction.findMany({
      where: {
        type: 'WITHDRAWAL',
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      amount: Number(withdrawal.amount),
      walletId: withdrawal.walletId,
      description: withdrawal.description,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
      proofUrl: withdrawal.proofUrl,
      user: withdrawal.user,
    }))
  } catch (error) {
    console.error('Error fetching pending withdrawals:', error)
    return []
  }
}

