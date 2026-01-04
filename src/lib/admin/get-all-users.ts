import { prisma } from '@/lib/prisma'

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            investments: true,
            referralRelationshipsAsReferred: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      investmentCount: user._count.investments,
      referralCount: user._count.referralRelationshipsAsReferred,
    }))
  } catch (error) {
    console.error('Error fetching all users:', error)
    return []
  }
}

