import * as React from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { formatDate } from '@/lib/admin/format'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { VerificationActions } from './VerificationActions'
import { HospitalVerificationActions } from './HospitalVerificationActions'
import { Building2, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminVerificationPage() {
  const { supabase } = await requireAdmin()

  const [{ data: pending }, { data: pendingHospitals }] = await Promise.all([
    supabase
      .from('doctors')
      .select(
        `id, full_name, medical_registration_number, registration_council, qualifications,
         experience_years, created_at, bio,
         specialization:specialties(name),
         user:profiles(email, phone)`
      )
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(100),
    // Hospital submissions from doctors (null until the Part 1 migration is applied)
    supabase
      .from('hospitals')
      .select(
        'id, name, address, city, state, pin_code, hospital_type, created_at, added_by:profiles(email)'
      )
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true })
      .limit(100),
  ])

  const doctors = (pending ?? []) as any[]
  const hospitals = (pendingHospitals ?? []) as any[]

  return (
    <div>
      <PageHeader
        title="Verification"
        description="Review doctor registrations and hospital submissions before they go public."
      />

      <h2 className="mb-4 text-base font-bold text-secondary-900">
        Doctor Verification
        <span className="ml-2 text-sm font-medium text-secondary-500">({doctors.length})</span>
      </h2>

      {doctors.length === 0 ? (
        <Card className="mb-10">
          <CardContent>
            <EmptyState
              icon={<ShieldCheck className="h-8 w-8 text-primary-500" />}
              title="No pending verifications"
              description="Every doctor application has been reviewed. New applications will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="mb-10 space-y-4">
          {doctors.map((doctor) => (
            <Card key={doctor.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/doctors/${doctor.id}`}
                        className="text-base font-bold text-secondary-900 hover:text-primary-600"
                      >
                        {doctor.full_name}
                      </Link>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-secondary-500">
                      {doctor.specialization?.name ?? 'No specialization'} · {doctor.experience_years} yrs
                      experience · Applied {formatDate(doctor.created_at)}
                    </p>
                    <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="inline font-semibold text-secondary-700">Registration:{' '}</dt>
                        <dd className="inline text-secondary-600">
                          {doctor.medical_registration_number} ({doctor.registration_council})
                        </dd>
                      </div>
                      <div>
                        <dt className="inline font-semibold text-secondary-700">Contact:{' '}</dt>
                        <dd className="inline text-secondary-600">
                          {doctor.user?.email ?? '—'} {doctor.user?.phone ? `· ${doctor.user.phone}` : ''}
                        </dd>
                      </div>
                      {doctor.qualifications?.length > 0 && (
                        <div className="sm:col-span-2">
                          <dt className="font-semibold text-secondary-700">Qualifications:</dt>
                          <dd className="mt-0.5 flex flex-wrap gap-1.5">
                            {doctor.qualifications.map((q: string) => (
                              <span
                                key={q}
                                className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-700"
                              >
                                {q}
                              </span>
                            ))}
                          </dd>
                        </div>
                      )}
                      {doctor.bio && (
                        <div className="sm:col-span-2">
                          <dt className="font-semibold text-secondary-700">Bio:</dt>
                          <dd className="mt-0.5 text-secondary-600">{doctor.bio}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <VerificationActions doctorId={doctor.id} doctorName={doctor.full_name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hospital submissions (Part 1) */}
      <h2 className="mb-4 text-base font-bold text-secondary-900">
        Hospital Verification
        <span className="ml-2 text-sm font-medium text-secondary-500">({hospitals.length})</span>
      </h2>

      {hospitals.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Building2 className="h-8 w-8 text-primary-500" />}
              title="No pending hospitals"
              description="Facilities submitted by doctors during registration will appear here for review."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {hospitals.map((hospital) => (
            <Card key={hospital.id}>
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/hospitals/${hospital.id}`}
                        className="text-base font-bold text-secondary-900 hover:text-primary-600"
                      >
                        {hospital.name}
                      </Link>
                      <Badge variant="warning">Pending</Badge>
                      {hospital.hospital_type && <Badge variant="outline">{hospital.hospital_type}</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-secondary-500">
                      {hospital.address}
                      {hospital.city ? `, ${hospital.city}` : ''}
                      {hospital.state ? `, ${hospital.state}` : ''}
                      {hospital.pin_code ? ` — ${hospital.pin_code}` : ''}
                    </p>
                    <p className="mt-1 text-sm text-secondary-500">
                      Submitted {formatDate(hospital.created_at)}
                      {hospital.added_by?.email ? ` by ${hospital.added_by.email}` : ''}
                    </p>
                  </div>

                  <HospitalVerificationActions
                    hospitalId={hospital.id}
                    hospitalName={hospital.name}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
