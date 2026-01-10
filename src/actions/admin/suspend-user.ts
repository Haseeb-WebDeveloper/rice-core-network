'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const suspendUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  suspend: z.boolean(),
})

export async function suspendUser(userId: string, suspend: boolean) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    const validated = suspendUserSchema.parse({ userId, suspend })

    // Prevent admin from suspending themselves
    if (validated.userId === user.id) {
      return { error: 'You cannot suspend your own account' }
    }

    // Prevent suspending other admins
    const targetUser = await prisma.user.findUnique({
      where: { id: validated.userId },
      select: { role: true },
    })

    if (targetUser?.role === 'ADMIN') {
      return { error: 'Cannot suspend another admin user' }
    }

    await prisma.user.update({
      where: { id: validated.userId },
      data: {
        isSuspended: validated.suspend,
      },
    })

    revalidatePath('/admin/users')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Error suspending user:', error)
    return { error: error instanceof Error ? error.message : 'Failed to update user status' }
  }
}

