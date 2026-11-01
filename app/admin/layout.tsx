import * as React from 'react'
import { requireAdmin } from '@/lib/admin/auth'
import { AdminShell } from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin | MyDoctor',
  description: 'MyDoctor administration dashboard.',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, userId, profile } = await requireAdmin()

  const [{ count: pendingVerifications }, { data: extra }] = await Promise.all([
    supabase
      .from('doctors')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),
    supabase.from('profiles').select('avatar_url').eq('id', userId).single(),
  ])

  return (
    <AdminShell
      profile={{
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        avatar_url: extra?.avatar_url ?? null,
      }}
      pendingVerifications={pendingVerifications ?? 0}
    >
      {children}
    </AdminShell>
  )
}
