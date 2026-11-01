import * as React from 'react'
import Link from 'next/link'
import {
  Building2,
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  Clock3,
  HeartPulse,
  Star,
  Stethoscope,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react'
import { requireAdmin } from '@/lib/admin/auth'
import { lastNMonths, monthKeyOf } from '@/lib/admin/stats'
import {
  APPOINTMENT_STATUS_LABELS,
  appointmentStatusVariant,
  doctorStatusVariant,
  DOCTOR_STATUS_LABELS,
  formatDate,
  formatDateTime,
  formatTime,
} from '@/lib/admin/format'
import { StatCard } from '@/components/admin/StatCard'
import { PageHeader } from '@/components/admin/PageHeader'
import {
  AppointmentStatsChart,
  RegistrationTrendChart,
  type AppointmentPoint,
  type MonthPoint,
} from '@/components/admin/charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'

export const dynamic = 'force-dynamic'

function startOfMonthISO(monthsBack: number): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  d.setMonth(d.getMonth() - monthsBack)
  return d.toISOString()
}

export default async function AdminDashboardPage() {
  const { supabase, profile } = await requireAdmin()
  const today = new Date().toISOString().slice(0, 10)
  const seriesStart = startOfMonthISO(11)

  const [
    patientsCount,
    doctorsCount,
    verifiedDoctors,
    pendingDoctors,
    hospitalsCount,
    appointmentsCount,
    todayAppointments,
    cancelledAppointments,
    specialtiesCount,
    reviewsCount,
    patientsSeriesRaw,
    doctorsSeriesRaw,
    appointmentsSeriesRaw,
    recentAppointments,
    recentDoctors,
    pendingDoctorsList,
    recentActivities,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('doctors').select('id', { count: 'exact', head: true }),
    supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
    supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
    supabase.from('hospitals').select('id', { count: 'exact', head: true }),
    supabase.from('appointments').select('id', { count: 'exact', head: true }),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
    supabase.from('specialties').select('id', { count: 'exact', head: true }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('created_at')
      .eq('role', 'patient')
      .gte('created_at', seriesStart)
      .limit(10000),
    supabase
      .from('doctors')
      .select('created_at')
      .gte('created_at', seriesStart)
      .limit(10000),
    supabase
      .from('appointments')
      .select('status, appointment_date')
      .gte('appointment_date', seriesStart.slice(0, 10))
      .limit(10000),
    supabase
      .from('appointments')
      .select(
        `id, status, appointment_date, appointment_time, created_at,
         doctor:doctors(full_name), patient:profiles(full_name)`
      )
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('doctors')
      .select('id, full_name, verification_status, created_at, rating_average, specialization:specialties(name)')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('doctors')
      .select('id, full_name, medical_registration_number, created_at, specialization:specialties(name)')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('admin_audit_logs')
      .select('id, action, entity_type, entity_id, reason, created_at, admin:profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  // ---- chart series -------------------------------------------------------
  const buckets = lastNMonths(12)
  const patientCounts = new Map<string, number>()
  for (const row of patientsSeriesRaw.data ?? []) {
    const key = monthKeyOf(row.created_at)
    patientCounts.set(key, (patientCounts.get(key) ?? 0) + 1)
  }
  const doctorCounts = new Map<string, number>()
  for (const row of doctorsSeriesRaw.data ?? []) {
    const key = monthKeyOf(row.created_at)
    doctorCounts.set(key, (doctorCounts.get(key) ?? 0) + 1)
  }

  const registrationSeries: MonthPoint[] = buckets.map((b) => ({
    month: b.label,
    patients: patientCounts.get(b.key) ?? 0,
    doctors: doctorCounts.get(b.key) ?? 0,
  }))

  const appointmentAgg = new Map<string, AppointmentPoint>()
  for (const b of buckets) {
    appointmentAgg.set(b.key, { month: b.label, pending: 0, confirmed: 0, completed: 0, cancelled: 0 })
  }
  for (const row of appointmentsSeriesRaw.data ?? []) {
    if (!row.appointment_date) continue
    const key = monthKeyOf(row.appointment_date)
    const bucket = appointmentAgg.get(key)
    if (bucket && ['pending', 'confirmed', 'completed', 'cancelled'].includes(row.status)) {
      ;(bucket as unknown as Record<string, number>)[row.status] += 1
    }
  }
  const appointmentSeries: AppointmentPoint[] = buckets.map((b) => appointmentAgg.get(b.key)!)

  // ---- recent activity helper --------------------------------------------
  const actionLabel = (action: string) =>
    action
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile.full_name || 'Administrator'}`}
        description="Real-time overview of the MyDoctor platform."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <StatCard label="Registered Patients" value={patientsCount.count ?? 0} icon={UserRound} tone="green" />
        <StatCard label="Registered Doctors" value={doctorsCount.count ?? 0} icon={Stethoscope} tone="teal" />
        <StatCard label="Verified Doctors" value={verifiedDoctors.count ?? 0} icon={UserCheck} tone="blue" />
        <StatCard
          label="Pending Verifications"
          value={pendingDoctors.count ?? 0}
          icon={Clock3}
          tone="amber"
          hint={pendingDoctors.count ? 'Needs your attention' : 'All caught up'}
        />
        <StatCard label="Hospitals & Clinics" value={hospitalsCount.count ?? 0} icon={Building2} tone="purple" />
        <StatCard label="Total Appointments" value={appointmentsCount.count ?? 0} icon={CalendarDays} tone="green" />
        <StatCard label="Today's Appointments" value={todayAppointments.count ?? 0} icon={CalendarCheck2} tone="blue" />
        <StatCard label="Cancelled Appointments" value={cancelledAppointments.count ?? 0} icon={CalendarX2} tone="red" />
        <StatCard label="Specialties" value={specialtiesCount.count ?? 0} icon={HeartPulse} tone="teal" />
        <StatCard label="Total Reviews" value={reviewsCount.count ?? 0} icon={Star} tone="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Patient & Doctor Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <RegistrationTrendChart data={registrationSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appointment Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentStatsChart data={appointmentSeries} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent appointments */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Appointments</CardTitle>
              <Link href="/admin/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentAppointments.data && recentAppointments.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-100 text-left text-xs uppercase tracking-wide text-secondary-400">
                      <th className="pb-3 pr-4 font-semibold">Patient</th>
                      <th className="pb-3 pr-4 font-semibold">Doctor</th>
                      <th className="pb-3 pr-4 font-semibold">Date & Time</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-50">
                    {recentAppointments.data.map((a: any) => (
                      <tr key={a.id} className="transition-colors hover:bg-secondary-50/60">
                        <td className="py-3 pr-4 font-medium text-secondary-900">
                          {(a.patient as any)?.full_name ?? '—'}
                        </td>
                        <td className="py-3 pr-4 text-secondary-600">
                          {(a.doctor as any)?.full_name ?? '—'}
                        </td>
                        <td className="py-3 pr-4 text-secondary-600">
                          {formatDate(a.appointment_date)} · {formatTime(a.appointment_time)}
                        </td>
                        <td className="py-3">
                          <Badge variant={appointmentStatusVariant(a.status)}>
                            {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No appointments yet" description="Booked appointments will appear here." />
            )}
          </CardContent>
        </Card>

        {/* Recent activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activities</CardTitle>
              <Link href="/admin/logs" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Logs
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivities.data && recentActivities.data.length > 0 ? (
              <ul className="space-y-4">
                {recentActivities.data.map((log: any) => (
                  <li key={log.id} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                    <div className="min-w-0">
                      <p className="text-sm text-secondary-800">
                        <span className="font-semibold">{(log.admin as any)?.full_name ?? 'Admin'}</span>{' '}
                        {actionLabel(log.action).toLowerCase()}
                      </p>
                      <p className="text-xs text-secondary-400">
                        {log.entity_type} · {formatDateTime(log.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No activity yet" description="Administrative actions will be logged here." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recently registered doctors */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recently Registered Doctors</CardTitle>
              <Link href="/admin/doctors" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentDoctors.data && recentDoctors.data.length > 0 ? (
              <ul className="divide-y divide-secondary-50">
                {recentDoctors.data.map((d: any) => (
                  <li key={d.id}>
                    <Link
                      href={`/admin/doctors/${d.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-secondary-50/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-secondary-900">{d.full_name}</p>
                        <p className="truncate text-xs text-secondary-500">
                          {(d.specialization as any)?.name ?? 'No specialization'} · {formatDate(d.created_at)}
                        </p>
                      </div>
                      <Badge variant={doctorStatusVariant(d.verification_status)}>
                        {DOCTOR_STATUS_LABELS[d.verification_status] ?? d.verification_status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No doctors yet" description="Newly registered doctors will appear here." />
            )}
          </CardContent>
        </Card>

        {/* Pending verifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Verification Requests</CardTitle>
              <Link href="/admin/verification" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Review all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {pendingDoctorsList.data && pendingDoctorsList.data.length > 0 ? (
              <ul className="divide-y divide-secondary-50">
                {pendingDoctorsList.data.map((d: any) => (
                  <li key={d.id}>
                    <Link
                      href={`/admin/verification?doctor=${d.id}`}
                      className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-secondary-50/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-secondary-900">{d.full_name}</p>
                        <p className="truncate text-xs text-secondary-500">
                          Reg. {d.medical_registration_number} · Applied {formatDate(d.created_at)}
                        </p>
                      </div>
                      <Badge variant="warning">Pending</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No pending verifications" description="Every doctor application has been reviewed." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
