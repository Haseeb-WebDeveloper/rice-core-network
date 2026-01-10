import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  // Get user from Prisma database
  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
  })

  // Return null if user doesn't exist, is deleted, deactivated, or suspended
  if (!user || user.deletedAt !== null || !user.isActive || user.isSuspended) {
    // Sign out the user if their account is invalid
    await supabase.auth.signOut()
    return null
  }

  return user
}

