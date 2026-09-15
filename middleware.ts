import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  const pathname = request.nextUrl.pathname
  
  // Protected routes
  const protectedRoutes = [
    '/patient/dashboard',
    '/doctor/dashboard',
    '/admin/dashboard',
  ]
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Role-based access
  if (session && isProtectedRoute) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        if (pathname.startsWith('/admin/') && profile.role !== 'admin') {
          return NextResponse.redirect(new URL('/', request.url))
        }
        if (pathname.startsWith('/doctor/') && profile.role !== 'doctor') {
          return NextResponse.redirect(new URL('/', request.url))
        }
        if (pathname.startsWith('/patient/') && profile.role !== 'patient') {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    }
  }
  
  // Redirect authenticated users away from auth pages
  const authRoutes = ['/auth/login', '/auth/register']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  if (isAuthRoute && session) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        const redirectMap: Record<string, string> = {
          admin: '/admin/dashboard',
          doctor: '/doctor/dashboard',
          patient: '/patient/dashboard',
        }
        return NextResponse.redirect(new URL(redirectMap[profile.role] || '/', request.url))
      }
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/patient/dashboard/:path*',
    '/doctor/dashboard/:path*',
    '/admin/dashboard/:path*',
    '/auth/login',
    '/auth/register',
  ],
}