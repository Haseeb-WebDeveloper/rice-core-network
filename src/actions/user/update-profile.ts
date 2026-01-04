'use server'

import { getCurrentUser } from '@/lib/auth/get-user'
import { prisma } from '@/lib/prisma'
import { uploadImage } from '@/lib/cloudinary/upload'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name must be less than 100 characters'),
})

export async function updateProfile(formData: FormData) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { error: 'Unauthorized' }
    }

    // Validate fullName
    const validated = updateProfileSchema.parse({
      fullName: formData.get('fullName'),
    })

    // Handle avatar upload if provided
    const avatarFile = formData.get('avatar') as File | null
    let avatarUrl: string | undefined

    if (avatarFile && avatarFile.size > 0) {
      // Validate file type
      if (!avatarFile.type.startsWith('image/')) {
        return { error: 'Avatar must be an image file' }
      }

      // Validate file size (max 5MB)
      if (avatarFile.size > 5 * 1024 * 1024) {
        return { error: 'Avatar image must be less than 5MB' }
      }

      try {
        avatarUrl = await uploadImage(avatarFile, 'avatars')
      } catch (error) {
        console.error('Error uploading avatar:', error)
        return { error: 'Failed to upload avatar image' }
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: validated.fullName,
        ...(avatarUrl && { avatar: avatarUrl }),
      },
    })

    revalidatePath('/user/settings')
    revalidatePath('/user')

    return { success: true, user: updatedUser }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    console.error('Error updating profile:', error)
    return { error: error instanceof Error ? error.message : 'Failed to update profile' }
  }
}

