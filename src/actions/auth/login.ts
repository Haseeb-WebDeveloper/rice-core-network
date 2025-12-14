'use server'

import { createClient } from '@/lib/supabase/server'
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

    revalidatePath('/', 'layout')
    return { success: true, user: data.user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

