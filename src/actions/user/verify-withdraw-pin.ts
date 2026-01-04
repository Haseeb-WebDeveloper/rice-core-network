'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const verifyWithdrawPinSchema = z.object({
  pin: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => /^\d{4}$/.test(val), {
      message: 'PIN must be exactly 4 digits',
    }),
})

export async function verifyWithdrawPin(formData: FormData) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { error: 'Unauthorized', isValid: false }
    }

    // Validate input
    const validated = verifyWithdrawPinSchema.parse({
      pin: formData.get('pin'),
    })

    // Get user with PIN
    const userWithPin = await prisma.user.findUnique({
      where: { id: user.id },
      select: { withdrawPin: true },
    })

    if (!userWithPin || !userWithPin.withdrawPin) {
      return { error: 'Withdraw PIN is not set', isValid: false }
    }

    // Compare PIN
    const isValid = await bcrypt.compare(validated.pin, userWithPin.withdrawPin)

    return { isValid, error: isValid ? undefined : 'Invalid PIN' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, isValid: false }
    }
    console.error('Error verifying withdraw PIN:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to verify withdraw PIN',
      isValid: false,
    }
  }
}

