import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import {
  DOCTOR_STATUS_LABELS,
  doctorStatusVariant,
  formatDate,
  formatFee,
} from '@/lib/admin/format'
import { DoctorDetailClient } from './DoctorDetailClient'
import { PageHeader } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDoctorDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { supabase } = await requireAdmin()

  const [{ data: doctor }, { data: specialties }, { data: allHospitals }] = await Promise.all([
    supabase
      .from('doctors')
      .select(
        `*,
         specialization:specialties(id, name),
         user:profiles(id, email, phone, full_name, status, created_at),
         doctor_hospitals(hospital:hospitals(id, name, address)),
         availability(id, day_of_week, start_time, end_time, is_active, hospital_id)`
      )
      .eq('id', params.id)
      .maybeSingle(),
    supabase.from('specialties').select('id, name').order('name'),
    supabase.from('hospitals').select('id, name').order('name'),
  ])

  if (!doctor) notFound()

  const availabilityByDay = (doctor.availability ?? [])
    .filter((a: any) => a.is_active)
    .reduce((acc: Record<number, any[]>, a: any) => {
      ;(acc[a.day_of_week] ??= []).push(a)
      return acc
    }, {})

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div>
      <Link
        href="/admin/doctors"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-secondary-500 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to doctors
      </Link>

      <PageHeader
        title={doctor.full_name}
        description={`Medical registration: ${doctor.medical_registration_number} · Registered ${formatDate(doctor.created_at)}`}
        actions={
          <Badge variant={doctorStatusVariant(doctor.verification_status)} size="lg">
            {DOCTOR_STATUS_LABELS[doctor.verification_status] ?? doctor.verification_status}
          </Badge>
        }
      />

      <DoctorDetailClient
        doctor={{
          id: doctor.id,
          full_name: doctor.full_name,
          photo_url: doctor.photo_url,
          bio: doctor.bio,
          qualifications: doctor.qualifications ?? [],
          languages: doctor.languages ?? [],
          specialization_id: doctor.specialization_id,
          experience_years: doctor.experience_years,
          consultation_fee: doctor.consultation_fee,
          medical_registration_number: doctor.medical_registration_number,
          registration_council: doctor.registration_council,
          gender: doctor.gender,
          address: doctor.address,
          verification_status: doctor.verification_status,
          rating_average: doctor.rating_average,
          rating_count: doctor.rating_count,
          user: doctor.user,
        }}
        specialties={(specialties ?? []) as any[]}
        allHospitals={(allHospitals ?? []) as any[]}
        linkedHospitals={((doctor as any).doctor_hospitals ?? [])
          .map((link: any) => link.hospital)
          .filter(Boolean) as any[]}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-secondary-600">{doctor.bio || 'No bio provided.'}</p>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary-400">
                Qualifications
              </p>
              {doctor.qualifications?.length ? (
                <ul className="list-inside list-disc space-y-1 text-secondary-700">
                  {doctor.qualifications.map((q: string) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-secondary-500">—</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-400">Experience</p>
                <p className="text-secondary-800">{doctor.experience_years} years</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-400">
                  Consultation fee
                </p>
                <p className="text-secondary-800">{formatFee(doctor.consultation_fee)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-400">
                  Registration council
                </p>
                <p className="text-secondary-800">{doctor.registration_council || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-400">Rating</p>
                <p className="inline-flex items-center gap-1 text-secondary-800">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {doctor.rating_average != null ? Number(doctor.rating_average).toFixed(1) : '—'}
                  <span className="text-xs text-secondary-400">({doctor.rating_count ?? 0} reviews)</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-400">Languages</p>
                <p className="text-secondary-800">{doctor.languages?.join(', ') || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-secondary-400">Gender</p>
                <p className="capitalize text-secondary-800">{doctor.gender || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(availabilityByDay).length > 0 ? (
              <ul className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 0].filter((d) => availabilityByDay[d]).map((day) => (
                  <li key={day} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="w-24 font-semibold text-secondary-800">{dayNames[day]}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {availabilityByDay[day].map((slot: any) => (
                        <span
                          key={slot.id}
                          className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
                        >
                          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-secondary-500">No active availability slots configured.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
