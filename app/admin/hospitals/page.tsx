import * as React from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import { formatDate } from '@/lib/admin/format'
import { HospitalForm } from '@/components/admin/hospitals/HospitalForm'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/common/EmptyState'
import { UrlPagination } from '@/components/admin/UrlPagination'
import { HOSPITAL_STATUS_META } from '@/lib/hospitals'
import { Building2, Globe, MapPin, Phone, Plus, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PER_PAGE = 20

export default async function AdminHospitalsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const { supabase } = await requireAdmin()

  const page = Math.max(1, Number(searchParams.page) || 1)
  const q = (searchParams.q ?? '').trim()

  const baseSelect = `id, name, address, phone, website, email, image_url, facilities, is_active, created_at,
       doctors:doctor_hospitals(count),
       specialties:hospital_specialties(specialty:specialties(name))`
  const enrichedSelect = `id, name, address, phone, website, email, image_url, facilities, is_active, created_at,
       hospital_type, city, state, pin_code, verification_status,
       doctors:doctor_hospitals(count),
       specialties:hospital_specialties(specialty:specialties(name))`

  let query = supabase
    .from('hospitals')
    .select(enrichedSelect, { count: 'exact' })

  if (q) query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%`)

  let { data, count, error } = await query
    .order('name')
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

  // Fall back when the hospital verification migration is not applied yet
  if (error) {
    let retry: any = supabase
      .from('hospitals')
      .select(baseSelect, { count: 'exact' })
    if (q) retry = retry.or(`name.ilike.%${q}%,address.ilike.%${q}%`)
    const fallback = await retry
      .order('name')
      .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
    data = fallback.data
    count = fallback.count
    error = fallback.error
  }

  const hospitals = (data ?? []) as any[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <div>
      <PageHeader
        title="Hospitals & Clinics"
        description={`${total} facility registered on the platform.`}
        actions={
          <Button asChild>
            <Link href="/admin/hospitals/new">
              <Plus className="mr-2 h-4 w-4" /> Add hospital
            </Link>
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="flex gap-2" action="/admin/hospitals" method="get">
            <Input
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="Search by name or address…"
              leftIcon={<Search className="h-4 w-4" />}
            />
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent>
            <EmptyState title="Failed to load hospitals" description={error.message} />
          </CardContent>
        </Card>
      ) : hospitals.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Building2 className="h-8 w-8 text-secondary-400" />}
              title="No hospitals found"
              description="Add the first hospital to get started."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hospitals.map((hospital) => {
            const doctorCount = hospital.doctors?.[0]?.count ?? 0
            const specNames = (hospital.specialties ?? [])
              .map((s: any) => s?.specialty?.name)
              .filter(Boolean)
            const statusMeta = hospital.verification_status
              ? HOSPITAL_STATUS_META[hospital.verification_status as keyof typeof HOSPITAL_STATUS_META]
              : undefined
            return (
              <Card key={hospital.id} className="transition-shadow hover:shadow-card-hover">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    {hospital.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={hospital.image_url}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-secondary-200"
                      />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Building2 className="h-6 w-6 text-blue-500" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-bold text-secondary-900">{hospital.name}</h3>
                        {statusMeta && (
                          <Badge variant={statusMeta.variant ?? 'outline'} size="sm">
                            {statusMeta.label}
                          </Badge>
                        )}
                        {!hospital.is_active && <Badge variant="danger">Inactive</Badge>}
                      </div>
                      <p className="mt-0.5 flex items-start gap-1 text-xs text-secondary-500">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {hospital.address}
                        {hospital.city ? `, ${hospital.city}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-secondary-500">
                    {hospital.phone && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {hospital.phone}
                      </p>
                    )}
                    {hospital.website && (
                      <p className="flex items-center gap-1 truncate">
                        <Globe className="h-3 w-3" /> {hospital.website}
                      </p>
                    )}
                  </div>

                  {specNames.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {specNames.slice(0, 4).map((name: string) => (
                        <span
                          key={name}
                          className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700"
                        >
                          {name}
                        </span>
                      ))}
                      {specNames.length > 4 && (
                        <span className="text-[11px] text-secondary-400">+{specNames.length - 4} more</span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-secondary-100 pt-3">
                    <span className="text-xs text-secondary-500">
                      {doctorCount} doctor{doctorCount === 1 ? '' : 's'} · Added {formatDate(hospital.created_at)}
                    </span>
                    <Link
                      href={`/admin/hospitals/${hospital.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Manage
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <UrlPagination totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} />
    </div>
  )
}
