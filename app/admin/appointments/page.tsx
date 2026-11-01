import * as React from 'react'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin/auth'
import {
  APPOINTMENT_STATUS_LABELS,
  appointmentStatusVariant,
  formatDate,
  formatTime,
} from '@/lib/admin/format'
import { AppointmentRowActions } from './AppointmentRowActions'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { UrlPagination } from '@/components/admin/UrlPagination'
import { CalendarDays, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PER_PAGE = 20

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; from?: string; to?: string; page?: string }
}) {
  const { supabase } = await requireAdmin()

  const page = Math.max(1, Number(searchParams.page) || 1)
  const q = (searchParams.q ?? '').trim()
  const status = (searchParams.status ?? '').trim()
  const from = (searchParams.from ?? '').trim()
  const to = (searchParams.to ?? '').trim()

  let query = supabase.from('appointments').select(
    `id, status, appointment_date, appointment_time, patient_message, created_at,
     doctor:doctors(id, full_name, specialization:specialties(name)),
     patient:profiles(id, full_name, email),
     hospital:hospitals(id, name)`,
    { count: 'exact' }
  )

  if (['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    query = query.eq('status', status)
  }
  if (from) query = query.gte('appointment_date', from)
  if (to) query = query.lte('appointment_date', to)
  if (q) {
    query = query.or(`doctor.full_name.ilike.%${q}%,patient.full_name.ilike.%${q}%`)
  }

  const { data, count, error } = await query
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1)

  const appointments = (data ?? []) as any[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

  const statusCounts: Record<string, number> = {}
  {
    const counts = await Promise.all(
      ['pending', 'confirmed', 'completed', 'cancelled'].map((s) =>
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', s)
      )
    )
    ;['pending', 'confirmed', 'completed', 'cancelled'].forEach((s, i) => {
      statusCounts[s] = counts[i].count ?? 0
    })
  }

  return (
    <div>
      <PageHeader
        title="Appointments"
        description={`${total} appointment${total === 1 ? '' : 's'} on the platform.`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map((s) => (
          <Link key={s} href={`/admin/appointments?status=${s}`}>
            <Card
              className={`transition-all hover:shadow-card-hover ${
                status === s ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-secondary-400">
                  {APPOINTMENT_STATUS_LABELS[s]}
                </p>
                <p className="mt-1 text-2xl font-bold text-secondary-900">{statusCounts[s]}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6" action="/admin/appointments" method="get">
            <Input
              name="q"
              defaultValue={searchParams.q ?? ''}
              placeholder="Patient or doctor name…"
              leftIcon={<Search className="h-4 w-4" />}
              className="xl:col-span-2"
            />
            <Select name="status" defaultValue={status}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Input name="from" type="date" defaultValue={from} aria-label="From date" />
            <Input name="to" type="date" defaultValue={to} aria-label="To date" />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent>
            <EmptyState title="Failed to load appointments" description={error.message} />
          </CardContent>
        </Card>
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<CalendarDays className="h-8 w-8 text-secondary-400" />}
              title="No appointments found"
              description="Try adjusting the filters."
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
                    <th className="px-5 py-3 font-semibold">Patient</th>
                    <th className="px-5 py-3 font-semibold">Doctor</th>
                    <th className="px-5 py-3 font-semibold">Hospital</th>
                    <th className="px-5 py-3 font-semibold">Date & time</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {appointments.map((a) => (
                    <tr key={a.id} className="transition-colors hover:bg-primary-50/30">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-secondary-900">{a.patient?.full_name ?? '—'}</p>
                        <p className="text-xs text-secondary-400">{a.patient?.email ?? ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/doctors/${a.doctor?.id}`}
                          className="font-medium text-secondary-800 hover:text-primary-600"
                        >
                          {a.doctor?.full_name ?? '—'}
                        </Link>
                        <p className="text-xs text-secondary-400">
                          {a.doctor?.specialization?.name ?? ''}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-secondary-600">{a.hospital?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-secondary-600">
                        {formatDate(a.appointment_date)}
                        <span className="block text-xs text-secondary-400">
                          {formatTime(a.appointment_time)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={appointmentStatusVariant(a.status)}>
                          {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <AppointmentRowActions
                          id={a.id}
                          status={a.status}
                          patientMessage={a.patient_message}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <UrlPagination totalPages={totalPages} totalItems={total} itemsPerPage={PER_PAGE} />
    </div>
  )
}
