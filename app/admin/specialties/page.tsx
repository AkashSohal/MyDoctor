import * as React from 'react'
import { requireAdmin } from '@/lib/admin/auth'
import { SpecialtyManager } from './SpecialtyManager'
import { PageHeader } from '@/components/admin/PageHeader'

export const dynamic = 'force-dynamic'

export default async function AdminSpecialtiesPage() {
  const { supabase } = await requireAdmin()

  const { data } = await supabase
    .from('specialties')
    .select('id, name, description, icon, created_at, doctors:doctors(count)')
    .order('name')

  const specialties = ((data ?? []) as any[]).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    created_at: s.created_at,
    doctorCount: s.doctors?.[0]?.count ?? 0,
  }))

  return (
    <div>
      <PageHeader
        title="Specialties"
        description="Manage medical specialties available on MyDoctor."
      />
      <SpecialtyManager specialties={specialties} />
    </div>
  )
}
