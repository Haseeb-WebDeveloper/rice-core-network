import { prisma } from '@/lib/prisma'

export type TeamMember = {
  id: string
  fullName: string
  avatar: string | null
  email: string
  joinedDate: Date
  totalInvested: number
  investmentCount: number
}

export async function getTeamByLevel(
  userId: string,
  level: number
): Promise<TeamMember[]> {
  try {
    // Validate level
    if (level < 1 || level > 4) {
      return []
    }

    // Get all referral relationships for this level
    const relationships = await prisma.referralRelationship.findMany({
      where: {
        referrerId: userId,
        level: level,
      },
      select: {
        referredId: true,
      },
      distinct: ['referredId'],
    })

    const teamMemberIds = relationships.map((rel) => rel.referredId)

    if (teamMemberIds.length === 0) {
      return []
    }

    // Get user details with investment totals
    const teamMembers = await prisma.user.findMany({
      where: {
        id: {
          in: teamMemberIds,
        },
      },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        email: true,
        createdAt: true,
        investments: {
          where: {
            deletedAt: null,
          },
          select: {
            amount: true,
          },
        },
      },
    })

    // Get investment totals for each user
    const membersWithStats: TeamMember[] = teamMembers.map((member) => {
      const totalInvested = member.investments.reduce(
        (sum, inv) => sum + Number(inv.amount),
        0
      )

      return {
        id: member.id,
        fullName: member.fullName,
        avatar: member.avatar,
        email: member.email,
        joinedDate: member.createdAt,
        totalInvested,
        investmentCount: member.investments.length,
      }
    })

    // Sort by total invested (descending)
    return membersWithStats.sort((a, b) => b.totalInvested - a.totalInvested)
  } catch (error) {
    console.error(`Error fetching team members for level ${level}:`, error)
    return []
  }
}

