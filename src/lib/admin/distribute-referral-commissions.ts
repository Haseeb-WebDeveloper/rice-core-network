import { prisma } from '@/lib/prisma'
import { COMMISSION_PERCENTAGES } from '@/constants/limit'

/**
 * Distributes referral commissions to up to 4 levels of referrers when an investment is approved.
 * 
 * Commission structure:
 * - Level 1: 10% of investment amount
 * - Level 2: 5% of investment amount
 * - Level 3: 3% of investment amount
 * - Level 4: 2% of investment amount
 * 
 * @param investmentId - The ID of the approved investment
 */
export async function distributeReferralCommissions(investmentId: string): Promise<void> {
  try {
    // Get investment with user and plan details
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        user: {
          select: {
            id: true,
            isActive: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!investment) {
      throw new Error(`Investment ${investmentId} not found`)
    }

    // Get referral relationships for the investor (up to 4 levels)
    const referralRelationships = await prisma.referralRelationship.findMany({
      where: {
        referredId: investment.userId,
      },
      orderBy: {
        level: 'asc',
      },
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            isActive: true,
            isSuspended: true,
          },
        },
      },
    })

    if (referralRelationships.length === 0) {
      // No referrers found, nothing to do
      return
    }

    const investmentAmount = Number(investment.amount)

    // Process commissions for each level (up to 4)
    const commissionPromises = referralRelationships.map(async (relationship) => {
      const level = relationship.level
      const referrer = relationship.referrer

      // Skip if referrer is inactive or suspended
      if (!referrer.isActive || referrer.isSuspended) {
        console.log(
          `Skipping commission for level ${level} referrer ${referrer.id}: inactive or suspended`
        )
        return
      }

      // Get commission percentage for this level
      const percentage = COMMISSION_PERCENTAGES[level as keyof typeof COMMISSION_PERCENTAGES]
      if (!percentage) {
        console.log(`No commission percentage defined for level ${level}`)
        return
      }

      // Calculate commission amount
      const commissionAmount = investmentAmount * (percentage / 100)

      // Use transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Create ReferralIncome record
        const referralIncome = await tx.referralIncome.create({
          data: {
            investmentId: investment.id,
            recipientId: referrer.id,
            level: level,
            percentage: percentage,
            amount: commissionAmount,
            isPaid: false,
          },
        })

        // Create Transaction record
        await tx.transaction.create({
          data: {
            userId: referrer.id,
            type: 'REFERRAL_INCOME',
            status: 'COMPLETED',
            amount: commissionAmount,
            description: `Referral commission (Level ${level}) from investment in ${investment.plan.name}`,
            relatedId: referralIncome.id,
            relatedType: 'ReferralIncome',
          },
        })
      })

      console.log(
        `Created commission for level ${level} referrer ${referrer.email}: $${commissionAmount.toFixed(2)} (${percentage}% of $${investmentAmount.toFixed(2)})`
      )
    })

    // Execute all commission creations
    await Promise.all(commissionPromises)
  } catch (error) {
    console.error(`Error distributing referral commissions for investment ${investmentId}:`, error)
    throw error
  }
}

