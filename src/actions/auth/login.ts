'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function login(formData: FormData) {
  try {
    // Validate input
    const validated = loginSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    })

    // Check user status before attempting login
    const dbUser = await prisma.user.findUnique({
      where: { email: validated.email },
      select: {
        deletedAt: true,
        isActive: true,
        isSuspended: true,
      },
    })

    // Check if user exists and is not deleted
    if (!dbUser || dbUser.deletedAt !== null) {
      return { error: 'Invalid email or password' }
    }

    // Check if user is deactivated
    if (!dbUser.isActive) {
      return { error: 'Your account has been deactivated. Please contact support.' }
    }

    // Check if user is suspended
    if (dbUser.isSuspended) {
      return { error: 'Your account has been suspended. Please contact support.' }
    }

    const supabase = await createClient()

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    if (error) {
      return { error: error.message }
    }

    if (!data.user) {
      return { error: 'Login failed' }
    }

    // Double-check user status after successful Supabase auth (in case status changed)
    const finalCheck = await prisma.user.findUnique({
      where: { email: validated.email },
      select: {
        deletedAt: true,
        isActive: true,
        isSuspended: true,
      },
    })

    if (!finalCheck || finalCheck.deletedAt !== null || !finalCheck.isActive || finalCheck.isSuspended) {
      // Sign out the user if they're not allowed
      await supabase.auth.signOut()
      return { error: 'Your account has been disabled. Please contact support.' }
    }

    revalidatePath('/', 'layout')
    return { success: true, user: data.user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.message }
    }
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

