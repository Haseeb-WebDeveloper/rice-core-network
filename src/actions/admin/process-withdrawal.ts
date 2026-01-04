'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/get-user'
import { uploadImage } from '@/lib/cloudinary/upload'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const processWithdrawalSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID'),
  proofFile: z.instanceof(File).refine((file) => file.size > 0, 'Proof file is required'),
})

export async function processWithdrawal(formData: FormData) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== 'ADMIN') {
      return { error: 'Unauthorized' }
    }

    const transactionId = formData.get('transactionId') as string
    const proofFile = formData.get('proofFile') as File

    const validated = processWithdrawalSchema.parse({
      transactionId,
      proofFile,
    })

    // Get the withdrawal transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: validated.transactionId },
    })

    if (!transaction) {
      return { error: 'Withdrawal transaction not found' }
    }

    if (transaction.type !== 'WITHDRAWAL') {
      return { error: 'Transaction is not a withdrawal' }
    }

    if (transaction.status !== 'PENDING') {
      return { error: 'Withdrawal is not pending' }
    }

    // Validate file type and size
    if (!proofFile.type.startsWith('image/')) {
      return { error: 'Proof must be an image file' }
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (proofFile.size > maxSize) {
      return { error: 'Proof image must be less than 5MB' }
    }

    // Upload proof to Cloudinary
    let proofUrl: string
    try {
      proofUrl = await uploadImage(proofFile, 'withdrawal-proofs')
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      return { error: 'Failed to upload proof. Please try again.' }
    }

    // Update transaction status to COMPLETED and add proof URL
    await prisma.transaction.update({
      where: { id: validated.transactionId },
      data: {
        status: 'COMPLETED',
        proofUrl,
      },
    })

    revalidatePath('/admin/withdrawals')
    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.message }
    }
    console.error('Error processing withdrawal:', error)
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

