import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    // Exchange the code for a session
    // This will automatically set the session cookies
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      // Redirect to signup with error
      const url = new URL('/signup', requestUrl.origin)
      url.searchParams.set('error', 'Verification failed. Please try again.')
      return NextResponse.redirect(url)
    }

    if (data?.session && data?.user) {
      // Get user role from database
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: data.user.email! },
          select: { role: true },
        })

        // Redirect to appropriate dashboard based on role
        const redirectPath = dbUser?.role === 'ADMIN' ? '/admin' : '/user'
        const url = new URL(redirectPath, requestUrl.origin)
        
        // Create redirect response - cookies are already set by exchangeCodeForSession
        const response = NextResponse.redirect(url)
        
        // Ensure all cookies from the session are included in the response
        // The Supabase client should have already set them via setAll
        return response
      } catch (error) {
        console.error('Error fetching user role:', error)
        // Default to user dashboard if role lookup fails
        const url = new URL('/user', requestUrl.origin)
        return NextResponse.redirect(url)
      }
    }
  }

  // If no code or verification failed, redirect to signup
  const url = new URL('/signup', requestUrl.origin)
  return NextResponse.redirect(url)
}

