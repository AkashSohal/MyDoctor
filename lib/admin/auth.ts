import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AdminContext = {
  supabase: SupabaseClient
  userId: string
  profile: { id: string; full_name: string | null; email: string | null; role: string }
}

/**
 * Server-side admin authorization. Verifies the session AND that the
 * profiles row (trusted DB record, not JWT metadata) has role = 'admin'.
 * Redirects to login (unauthenticated) or home (unauthorized).
 */
export async function requireAdmin(): Promise<AdminContext> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/auth/login?redirect=/admin')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  if (profile.status === 'suspended') {
    redirect('/auth/login')
  }

  return {
    supabase,
    userId: user.id,
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
    },
  }
}

/**
 * Non-redirecting variant for server actions / API routes.
 * Returns null when the caller is not an authenticated admin.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || profile.status === 'suspended') return null

  return {
    supabase,
    userId: user.id,
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
    },
  }
}
