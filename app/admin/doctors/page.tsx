import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { DoctorFilters } from '@/components/admin/doctors/DoctorFilters'
import { PageHeader } from '@/components/admin/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { UrlPagination } from '@/components/admin/UrlPagination'
import { EmptyState } from '@/components/common/EmptyState'
import {
  DOCTOR_STATUS_LABELS,
  doctorStatusVariant,
  formatDate,
  formatFee,
} from '@/lib/admin/format'
import { Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PER_PAGE = 20

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; specialty?: string; hospital?: string; page?: string }
}) {
  const { supabase } = await requireAdmin()

  const page = Math.max(1, Number(searchParams.page) || 1)
  const q = (searchParams.q ?? '').trim()
  const status = (searchParams.status ?? '').trim()
  const specialty = (searchParams.specialty ?? '').trim()
  const hospital = (searchParams.hospital ?? '').trim()

  let query = supabase
    .from('doctors')
    .select(
      `id, full_name, photo_url, verification_status, experience_years, consultation_fee,
       rating_average, rating_count, medical_registration_number, created_at,
       specialization:specialties(id, name),
       user:profiles(email, phone, status)`,
      { count: 'exact' }
    )

  if (status) query = query.eq('verification_status', status)
  if (specialty) query = query.eq('specialization_id', specialty)

  if (hospital) {
    const { data: links } = await supabase
      .from('doctor_hospitals')
      .select('doctor_id')
      .eq('hospital_id', hospital)
      .limit(500)
    const ids = (links ?? []).map((l) => l.doctor_id)
    if (ids.length === 0) {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000')
    } else {
      query = query.in('id', ids)
    }
  }

  if (q) {
    if (q.includes('@')) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', `%${q}%`)
        .limit(200)
      const userIds = (users ?? []).map((u) => u.id)
      if (userIds.length === 0) {
        query = query.eq('id', '00000000-0000-0000-0000-000000000000')
      } else {
        query = query.in('user_id', userIds)
      }
    } else {
      query = query.or(`full_name.ilike.%${q}%,medical_registration_number.ilike.%${q}%`)
    }
  }

  const [{ data, count, error }, { data: specialties }, { data: hospitals }] = await Promise.all([
    query
      .order('created_at', { ascending: false })
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1),
    supabase.from('specialties').select('id, name').order('name'),
    supabase.from('hospitals').select('id, name').order('name'),
  ])

  if (error) {
    return (
      <div>
        <PageHeader title="Doctors" />
        <Card>
          <CardContent>
            <EmptyState title="Failed to load doctors" description={error.message} />
          </CardContent>
        </Card>
      </div>
    )
  }

  const doctors = (data ?? []) as any[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div>
      <PageHeader
        title="Doctors"
        description={`${total} doctor${total === 1 ? '' : 's'} registered on the platform.`}
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <DoctorFilters
            specialties={specialties ?? []}
            hospitals={hospitals ?? []}
            values={searchParams}
          />
        </CardContent>
      </Card>

      {doctors.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No doctors found"
              description="Try adjusting the search or filters, or register a doctor through onboarding."
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-200 bg-secondary-50/60 text-left text-xs uppercase tracking-wide text-secondary-500">
                    <th className="px-5 py-3 font-semibold">Doctor</th>
                    <th className="px-5 py-3 font-semibold">Specialization</th>
                    <th className="px-5 py-3 font-semibold">Contact</th>
                    <th className="px-5 py-3 font-semibold">Experience</th>
                    <th className="px-5 py-3 font-semibold">Fee</th>
                    <th className="px-5 py-3 font-semibold">Rating</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="transition-colors hover:bg-primary-50/30">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {doctor.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={doctor.photo_url}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover ring-1 ring-secondary-200"
                            />
                          ) : (
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                              {(doctor.full_name || 'D')
                                .split(' ')
                                .map((p: string) => p[0])
                                .slice(0, 2)
                                .join('')}
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-secondary-900">{doctor.full_name}</p>
                            <p className="truncate text-xs text-secondary-400">
                              Reg. {doctor.medical_registration_number}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-secondary-600">
                        {doctor.specialization?.name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="truncate text-secondary-700">{doctor.user?.email ?? '—'}</p>
                        <p className="text-xs text-secondary-400">{doctor.user?.phone ?? ''}</p>
                      </td>
                      <td className="px-5 py-3.5 text-secondary-600">{doctor.experience_years} yrs</td>
                      <td className="px-5 py-3.5 font-medium text-secondary-800">
                        {formatFee(doctor.consultation_fee)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-secondary-700">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {doctor.rating_average != null ? Number(doctor.rating_average).toFixed(1) : '—'}
                          <span className="text-xs text-secondary-400">({doctor.rating_count ?? 0})</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={doctorStatusVariant(doctor.verification_status)}>
                          {DOCTOR_STATUS_LABELS[doctor.verification_status] ?? doctor.verification_status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-secondary-500">{formatDate(doctor.created_at)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/admin/doctors/${doctor.id}`}
                          className="font-medium text-primary-600 hover:text-primary-700"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <UrlPagination
        totalPages={totalPages}
        totalItems={total}
        itemsPerPage={PER_PAGE}
      />
    </div>
  )
}
