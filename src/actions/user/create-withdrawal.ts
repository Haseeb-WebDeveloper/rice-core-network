'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { getAvailableBalance } from '@/lib/user/get-available-balance'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcrypt'

const createWithdrawalSchema = z.object({
  amount: z
    .string()
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val > 0, 'Amount must be a valid number')
    .refine((val) => val >= 5, 'Minimum withdrawal amount is $5'),
  walletId: z
    .string()
    .min(1, 'Wallet ID is required')
    .trim()
    .refine((val) => val.length >= 20, 'Please enter a valid USDT BEP20 wallet address'),
  pin: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => /^\d{4}$/.test(val), {
      message: 'PIN must be exactly 4 digits',
    }),
})

export async function createWithdrawal(formData: FormData) {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { error: 'You must be logged in to create a withdrawal request' }
    }

    // Validate and parse form data
    const amount = formData.get('amount') as string
    const walletId = formData.get('walletId') as string
    const pin = formData.get('pin') as string

    const validated = createWithdrawalSchema.parse({
      amount,
      walletId,
      pin,
    })

    // Get user with PIN
    const userWithPin = await prisma.user.findUnique({
      where: { id: user.id },
      select: { withdrawPin: true },
    })

    if (!userWithPin || !userWithPin.withdrawPin) {
      return { error: 'Withdraw PIN is not set. Please set your withdraw PIN in settings first.' }
    }

    // Verify PIN
    const isValidPin = await bcrypt.compare(validated.pin, userWithPin.withdrawPin)
    if (!isValidPin) {
      return { error: 'Invalid withdraw PIN' }
    }

    // Check available balance
    const availableBalance = await getAvailableBalance(user.id)
    if (availableBalance < validated.amount) {
      return {
        error: `Insufficient balance. Available balance: $${availableBalance.toFixed(2)}`,
      }
    }

    // Create withdrawal transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'WITHDRAWAL',
        amount: validated.amount,
        status: 'PENDING',
        walletId: validated.walletId,
        description: `Withdrawal request to USDT BEP20 wallet`,
      },
    })

    revalidatePath('/user/withdraw')
    revalidatePath('/user')

    return { success: true, transaction }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Create withdrawal error:', error)
    return {
      error: error instanceof Error ? error.message : 'An error occurred while creating withdrawal request',
    }
  }
}

