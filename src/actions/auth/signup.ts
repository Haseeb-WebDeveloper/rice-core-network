'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateReferralCode } from '@/lib/auth/generate-referral-code'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
})

export async function signup(formData: FormData) {
  try {
    // Validate input
    const validated = signupSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      username: formData.get('username'),
    })

    const supabase = await createClient()

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: validated.username },
    })

    if (existingUsername) {
      return { error: 'Username already taken' }
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingEmail) {
      return { error: 'Email already registered' }
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Failed to create user' }
    }

    // Generate unique referral code
    const referralCode = await generateReferralCode()

    // Create Prisma User record
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        username: validated.username,
        referralCode,
        role: 'USER',
      },
    })

    revalidatePath('/', 'layout')
    return { success: true, user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

