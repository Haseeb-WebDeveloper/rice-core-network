'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deleteUsersSchema = z.object({
  userIds: z.array(z.string().min(1, 'User ID is required')).min(1, 'At least one user ID is required'),
})

export async function deleteUsers(userIds: string[]) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    const validated = deleteUsersSchema.parse({ userIds })

    // Prevent admin from deleting themselves
    if (validated.userIds.includes(user.id)) {
      return { error: 'You cannot delete your own account' }
    }

    // Soft delete users by setting deletedAt
    await prisma.user.updateMany({
      where: {
        id: {
          in: validated.userIds,
        },
        role: {
          not: 'ADMIN', // Prevent deleting other admins
        },
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.message }
    }
    console.error('Error deleting users:', error)
    return { error: error instanceof Error ? error.message : 'Failed to delete users' }
  }
}

