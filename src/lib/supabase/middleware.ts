import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname === '/signup' || pathname === '/login'
  const isAuthCallback = pathname === '/auth/callback'
  const isAdminRoute = pathname.startsWith('/admin')
  const isUserRoute = pathname.startsWith('/user')

  // Get user role and status if authenticated
  let userRole: 'ADMIN' | 'USER' | null = null
  let isUserValid = false
  if (user?.email) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: {
          role: true,
          deletedAt: true,
          isActive: true,
          isSuspended: true,
        },
      })
      
      // Check if user exists, is not deleted, is active, and not suspended
      if (dbUser && dbUser.deletedAt === null && dbUser.isActive && !dbUser.isSuspended) {
        userRole = dbUser.role || null
        isUserValid = true
      } else {
        // User is deleted, deactivated, or suspended - sign them out
        isUserValid = false
        // Sign out - this will clear auth cookies through Supabase's cookie management
        await supabase.auth.signOut()
        // Redirect to login - cookies will be cleared by the signOut call above
        // which updates supabaseResponse through the setAll callback
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        const logoutResponse = NextResponse.redirect(url)
        // Copy all cookies from supabaseResponse (including cleared auth cookies from signOut)
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          logoutResponse.cookies.set(cookie.name, cookie.value, cookie)
        })
        return logoutResponse
      }
    } catch (error) {
      console.error('Error fetching user in middleware:', error)
      isUserValid = false
    }
  }

  // Redirect unauthenticated users to signup (except auth pages and callback)
  if (!user && !isAuthPage && !isAuthCallback) {
    const url = request.nextUrl.clone()
    url.pathname = '/signup'
    const redirectResponse = NextResponse.redirect(url)
    // Preserve cookies from supabaseResponse
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // Handle authenticated users (only if user is valid)
  if (user && isUserValid) {
    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'ADMIN' ? '/admin' : '/user'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }

    // Protect admin routes - only admins can access
    if (isAdminRoute && userRole !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/user'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }

    // Protect user routes - only regular users can access (admins should use /admin)
    if (isUserRoute && userRole === 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }

    // Redirect root path based on role
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = userRole === 'ADMIN' ? '/admin' : '/user'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }
  } else if (user && !isUserValid) {
    // User is authenticated but invalid (deleted/deactivated/suspended)
    // Sign them out and redirect to login page
    await supabase.auth.signOut()
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    // Copy cookies from supabaseResponse which will include cleared auth cookies from signOut
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}

