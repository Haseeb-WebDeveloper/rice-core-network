'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const updateWithdrawPinSchema = z.object({
  pin: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => /^\d{4}$/.test(val), {
      message: 'PIN must be exactly 4 digits',
    }),
  confirmPin: z.string().transform((val) => val.trim()),
  currentPin: z.string().optional(),
})

export async function updateWithdrawPin(formData: FormData) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Get current user with PIN
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { withdrawPin: true },
    })

    if (!currentUser) {
      return { error: 'User not found' }
    }

    // Validate input
    const rawData = {
      pin: formData.get('pin') as string,
      confirmPin: formData.get('confirmPin') as string,
      currentPin: formData.get('currentPin') as string | null,
    }

    // If user already has a PIN, require current PIN verification
    if (currentUser.withdrawPin) {
      if (!rawData.currentPin || rawData.currentPin.trim().length === 0) {
        return { error: 'Current PIN is required to change PIN' }
      }

      // Verify current PIN
      const isCurrentPinValid = await bcrypt.compare(rawData.currentPin.trim(), currentUser.withdrawPin)
      if (!isCurrentPinValid) {
        return { error: 'Current PIN is incorrect' }
      }
    }

    const validated = updateWithdrawPinSchema.parse(rawData)

    // Verify PINs match
    if (validated.pin !== validated.confirmPin) {
      return { error: 'PINs do not match' }
    }

    // Hash the new PIN
    const hashedPin = await bcrypt.hash(validated.pin, 10)

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        withdrawPin: hashedPin,
      },
    })

    revalidatePath('/user/settings')

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Error updating withdraw PIN:', error)
    return { error: error instanceof Error ? error.message : 'Failed to update withdraw PIN' }
  }
}

