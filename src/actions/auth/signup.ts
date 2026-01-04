'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { generateReferralCode } from '@/lib/auth/generate-referral-code'
import { createReferralRelationships } from '@/lib/auth/create-referral-relationships'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name must be less than 100 characters'),
  referralCode: z.string().optional(),
})

export async function signup(formData: FormData) {
  try {
    // Validate input
    const validated = signupSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      fullName: formData.get('fullName'),
      referralCode: formData.get('referralCode') || undefined,
    })

    const supabase = await createClient()

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingEmail) {
      return { error: 'Email already registered' }
    }

    // Find referrer if referral code is provided
    let referrerId: string | null = null
    if (validated.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: validated.referralCode },
        select: { id: true },
      })

      if (!referrer) {
        return { error: 'Invalid referral code' }
      }

      referrerId = referrer.id
    }

    // Create Supabase Auth user
    // Set emailRedirectTo to ensure verification links redirect to our callback route
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
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
        fullName: validated.fullName,
        referralCode,
        referrerId,
        role: 'USER',
      },
    })

    // Create referral relationships for all 4 levels
    await createReferralRelationships(user.id, referrerId)

    revalidatePath('/', 'layout')
    return { success: true, user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues[0]?.message || 'Validation error' }
    }
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

