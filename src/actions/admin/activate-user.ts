'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const activateUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  activate: z.boolean(),
})

export async function activateUser(userId: string, activate: boolean) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    const validated = activateUserSchema.parse({ userId, activate })

    // Prevent admin from deactivating themselves
    if (validated.userId === user.id && !validated.activate) {
      return { error: 'You cannot deactivate your own account' }
    }

    // Prevent deactivating other admins
    if (!validated.activate) {
      const targetUser = await prisma.user.findUnique({
        where: { id: validated.userId },
        select: { role: true },
      })

      if (targetUser?.role === 'ADMIN') {
        return { error: 'Cannot deactivate another admin user' }
      }
    }

    await prisma.user.update({
      where: { id: validated.userId },
      data: {
        isActive: validated.activate,
      },
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Error activating user:', error)
    return { error: error instanceof Error ? error.message : 'Failed to update user status' }
  }
}

