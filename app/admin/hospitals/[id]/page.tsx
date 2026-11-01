import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { formatDate } from '@/lib/admin/format'
import { HospitalDetailClient } from './HospitalDetailClient'
import { PageHeader } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Globe, Mail, MapPin, Phone } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminHospitalDetailPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin()

  const [{ data: hospital }, { data: specialties }, { data: linkedDoctors }, { data: allDoctors }] =
    await Promise.all([
      supabase
        .from('hospitals')
        .select(
          `*,
           specialties:hospital_specialties(specialty_id, specialty:specialties(id, name))`
        )
        .eq('id', params.id)
        .maybeSingle(),
      supabase.from('specialties').select('id, name').order('name'),
      supabase
        .from('doctor_hospitals')
        .select('doctor_id, doctors(id, full_name, verification_status, specialization:specialties(name))')
        .eq('hospital_id', params.id),
      supabase
        .from('doctors')
        .select('id, full_name, verification_status, specialization:specialties(name)')
        .order('full_name')
        .limit(500),
    ])

  if (!hospital) notFound()

  const linkedIds = new Set((linkedDoctors ?? []).map((l: any) => l.doctor_id))
  const availableDoctors = ((allDoctors ?? []) as any[]).filter((d) => !linkedIds.has(d.id))

  return (
    <div>
      <Link
        href="/admin/hospitals"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-secondary-500 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to hospitals
      </Link>

      <PageHeader
        title={(hospital as any).name}
        description={`Added ${formatDate((hospital as any).created_at)}`}
        actions={
          !(hospital as any).is_active ? (
            <Badge variant="danger" size="lg">Inactive</Badge>
          ) : (
            <Badge variant="success" size="lg">Active</Badge>
          )
        }
      />

      <HospitalDetailClient
        hospital={{
          id: (hospital as any).id,
          name: (hospital as any).name,
          address: (hospital as any).address,
          phone: (hospital as any).phone,
          website: (hospital as any).website,
          email: (hospital as any).email,
          image_url: (hospital as any).image_url,
          latitude: (hospital as any).latitude,
          longitude: (hospital as any).longitude,
          facilities: (hospital as any).facilities ?? [],
          is_active: (hospital as any).is_active,
          specialty_ids: ((hospital as any).specialties ?? []).map((s: any) => s.specialty_id),
        }}
        specialties={(specialties ?? []) as any[]}
        linkedDoctors={(linkedDoctors ?? []).map((l: any) => l.doctors).filter(Boolean)}
        availableDoctors={availableDoctors}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-3 p-5 text-sm">
            <p className="flex items-start gap-2 text-secondary-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary-400" />
              {(hospital as any).address}
            </p>
            {(hospital as any).phone && (
              <p className="flex items-center gap-2 text-secondary-700">
                <Phone className="h-4 w-4 text-secondary-400" /> {(hospital as any).phone}
              </p>
            )}
            {(hospital as any).email && (
              <p className="flex items-center gap-2 text-secondary-700">
                <Mail className="h-4 w-4 text-secondary-400" /> {(hospital as any).email}
              </p>
            )}
            {(hospital as any).website && (
              <p className="flex items-center gap-2 truncate text-secondary-700">
                <Globe className="h-4 w-4 text-secondary-400" /> {(hospital as any).website}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-secondary-500">
              Facilities
            </h3>
            {((hospital as any).facilities ?? []).length > 0 ? (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {((hospital as any).facilities as string[]).map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 rounded-xl bg-secondary-50 px-3 py-2 text-sm text-secondary-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-secondary-500">No facilities listed.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
