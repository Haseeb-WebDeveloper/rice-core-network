import { prisma } from '@/lib/prisma'

/**
 * Generates a unique referral code
 * Format: 8-character alphanumeric (uppercase)
 */
export async function generateReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code: string
  let isUnique = false

  while (!isUnique) {
    code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    })

    if (!existing) {
      isUnique = true
    }
  }

  return code!
}

