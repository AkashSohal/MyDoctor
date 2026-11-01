import * as React from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { HospitalForm } from '@/components/admin/hospitals/HospitalForm'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NewHospitalPage() {
  const { supabase } = await requireAdmin()
  const { data: specialties } = await supabase.from('specialties').select('id, name').order('name')

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/hospitals"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-secondary-500 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to hospitals
      </Link>
      <PageHeader title="Add hospital" description="Register a new hospital or clinic on MyDoctor." />
      <Card>
        <CardContent className="pt-6">
          <HospitalForm specialties={(specialties ?? []) as any[]} />
        </CardContent>
      </Card>
    </div>
  )
}
