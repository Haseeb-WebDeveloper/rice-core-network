'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const deleteUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
})

export async function deleteUser(userId: string) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    const validated = deleteUserSchema.parse({ userId })

    // Prevent admin from deleting themselves
    if (validated.userId === user.id) {
      return { error: 'You cannot delete your own account' }
    }

    // Prevent deleting other admins
    const targetUser = await prisma.user.findUnique({
      where: { id: validated.userId },
      select: { role: true },
    })

    if (targetUser?.role === 'ADMIN') {
      return { error: 'Cannot delete another admin user' }
    }

    // Soft delete user by setting deletedAt
    await prisma.user.update({
      where: { id: validated.userId },
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
    console.error('Error deleting user:', error)
    return { error: error instanceof Error ? error.message : 'Failed to delete user' }
  }
}

