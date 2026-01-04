'use server'

import { prisma } from '@/lib/prisma'

export async function getReferrerByCode(referralCode: string) {
  try {
    const referrer = await prisma.user.findUnique({
      where: { referralCode },
      select: { 
        id: true,
        fullName: true, 
        avatar: true,
        referralCode: true,
      },
    })

    if (!referrer) {
      return { error: 'Invalid referral code', referrer: null }
    }

    return { referrer, error: null }
  } catch (error) {
    console.error('Error fetching referrer:', error)
    return { error: 'Failed to fetch referrer', referrer: null }
  }
}

