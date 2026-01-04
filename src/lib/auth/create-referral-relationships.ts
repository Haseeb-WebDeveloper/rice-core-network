import { prisma } from '@/lib/prisma'

/**
 * Creates referral relationships for all 4 levels when a new user signs up.
 * 
 * How it works:
 * - When User B signs up with User A's referral code, User A becomes Level 1 referrer
 * - The system then traverses up the referral chain to find all referrers (up to 4 levels)
 * - For each referrer found, it creates a ReferralRelationship record
 * 
 * Example:
 * - User A refers User B (Level 1)
 * - User B refers User C (User C is Level 1 of B, Level 2 of A)
 * - User C refers User D (User D is Level 1 of C, Level 2 of B, Level 3 of A)
 * 
 * @param newUserId - The ID of the newly registered user
 * @param referrerId - The ID of the direct referrer (Level 1), if any
 */
export async function createReferralRelationships(
  newUserId: string,
  referrerId: string | null
): Promise<void> {
  if (!referrerId) {
    // No referrer, no relationships to create
    return
  }

  try {
    // Get all referrers up to 4 levels
    const referrers: Array<{ id: string; level: number }> = []
    let currentReferrerId: string | null = referrerId
    let level = 1

    // Traverse up the referral chain to find all referrers (up to 4 levels)
    while (currentReferrerId && level <= 4) {
      const referrer: { id: string; referrerId: string | null } | null = await prisma.user.findUnique({
        where: { id: currentReferrerId },
        select: { id: true, referrerId: true },
      })

      if (!referrer) {
        // Referrer not found, stop traversing
        break
      }

      // Add this referrer to the list
      referrers.push({ id: referrer.id, level })

      // Move to the next level (the referrer's referrer)
      currentReferrerId = referrer.referrerId
      level++
    }

    // Create referral relationship records for each level
    if (referrers.length > 0) {
      const relationships = referrers.map((referrer) => ({
        referrerId: referrer.id,
        referredId: newUserId,
        level: referrer.level,
      }))

      await prisma.referralRelationship.createMany({
        data: relationships,
        skipDuplicates: true, // Skip if relationship already exists (safety check)
      })
    }
  } catch (error) {
    // Log error but don't throw - we don't want to fail user registration
    // if referral relationship creation fails
    console.error('Error creating referral relationships:', error)
    throw error // Re-throw to let caller handle it
  }
}

