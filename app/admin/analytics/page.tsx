import * as React from 'react'
import { requireAdmin } from '@/lib/admin/auth'
import { lastNMonths, monthKeyOf } from '@/lib/admin/stats'
import {
  AppointmentStatsChart,
  RegistrationTrendChart,
  StatusDonutChart,
  type AppointmentPoint,
  type MonthPoint,
} from '@/components/admin/charts'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatCard } from '@/components/admin/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, Star, TrendingUp, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

function startOfMonthISO(monthsBack: number): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  d.setMonth(d.getMonth() - monthsBack)
  return d.toISOString()
}

export default async function AdminAnalyticsPage() {
  const { supabase } = await requireAdmin()
  const seriesStart = startOfMonthISO(11)
  const today = new Date().toISOString().slice(0, 10)

  const [
    patientsSeriesRaw,
    doctorsSeriesRaw,
    appointmentsSeriesRaw,
    statusCounts,
    specialtyDist,
    topRated,
    totalPatients,
    totalAppointments,
  ] = await Promise.all([
    supabase.from('profiles').select('created_at').eq('role', 'patient').gte('created_at', seriesStart).limit(10000),
    supabase.from('doctors').select('created_at').gte('created_at', seriesStart).limit(10000),
    supabase
      .from('appointments')
      .select('status, appointment_date')
      .gte('appointment_date', seriesStart.slice(0, 10))
      .limit(10000),
    Promise.all(
      ['pending', 'confirmed', 'completed', 'cancelled'].map((s) =>
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('status', s)
      )
    ),
    supabase
      .from('doctors')
      .select('specialization_id, specialization:specialties(name)')
      .not('specialization_id', 'is', null)
      .limit(5000),
    supabase
      .from('doctors')
      .select('id, full_name, rating_average, rating_count, specialization:specialties(name)')
      .eq('verification_status', 'verified')
      .not('rating_count', 'is', null)
      .gt('rating_count', 0)
      .order('rating_average', { ascending: false })
      .order('rating_count', { ascending: false })
      .limit(8),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('appointments').select('id', { count: 'exact', head: true }),
  ])

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
    const bucket = appointmentAgg.get(monthKeyOf(row.appointment_date))
    if (bucket && row.status in bucket) {
      ;(bucket as unknown as Record<string, number>)[row.status] += 1
    }
  }
  const appointmentSeries = buckets.map((b) => appointmentAgg.get(b.key)!)

  const donutData = [
    { name: 'Pending', value: statusCounts[0].count ?? 0 },
    { name: 'Confirmed', value: statusCounts[1].count ?? 0 },
    { name: 'Completed', value: statusCounts[2].count ?? 0 },
    { name: 'Cancelled', value: statusCounts[3].count ?? 0 },
  ]

  const specAgg = new Map<string, number>()
  const specNames = new Map<string, string>()
  for (const row of specialtyDist.data ?? []) {
    const id = row.specialization_id as string
    const name = (row.specialization as any)?.name ?? 'Unknown'
    specAgg.set(id, (specAgg.get(id) ?? 0) + 1)
    specNames.set(id, name)
  }
  const specialtyDonut = Array.from(specAgg.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, value]) => ({ name: specNames.get(id) ?? 'Unknown', value }))

  const currentMonthPatients = patientCounts.get(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  ) ?? 0

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Platform growth, appointment trends and specialty distribution."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total patients" value={totalPatients.count ?? 0} icon={Users} tone="green" />
        <StatCard label="Total appointments" value={totalAppointments.count ?? 0} icon={CalendarDays} tone="blue" />
        <StatCard
          label="New patients this month"
          value={currentMonthPatients}
          icon={TrendingUp}
          tone="teal"
        />
        <StatCard
          label="Completed appointments"
          value={statusCounts[2].count ?? 0}
          icon={Star}
          tone="amber"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Registrations (last 12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <RegistrationTrendChart data={registrationSeries} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appointments by month & status</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentStatsChart data={appointmentSeries} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointment status breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={donutData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Doctors per specialty</CardTitle>
          </CardHeader>
          <CardContent>
            {specialtyDonut.length > 0 ? (
              <StatusDonutChart data={specialtyDonut} />
            ) : (
              <p className="py-16 text-center text-sm text-secondary-500">
                No doctors with a specialization yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Top rated doctors</CardTitle>
        </CardHeader>
        <CardContent>
          {topRated.data && topRated.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-secondary-100 text-left text-xs uppercase tracking-wide text-secondary-400">
                    <th className="pb-2 pr-4 font-semibold">#</th>
                    <th className="pb-2 pr-4 font-semibold">Doctor</th>
                    <th className="pb-2 pr-4 font-semibold">Specialty</th>
                    <th className="pb-2 pr-4 font-semibold">Rating</th>
                    <th className="pb-2 font-semibold">Reviews</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-50">
                  {(topRated.data as any[]).map((doctor, index) => (
                    <tr key={doctor.id}>
                      <td className="py-2.5 pr-4 text-secondary-400">{index + 1}</td>
                      <td className="py-2.5 pr-4 font-medium text-secondary-900">{doctor.full_name}</td>
                      <td className="py-2.5 pr-4 text-secondary-600">
                        {doctor.specialization?.name ?? '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-secondary-800">
                        ★ {Number(doctor.rating_average).toFixed(1)}
                      </td>
                      <td className="py-2.5 text-secondary-600">{doctor.rating_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-secondary-500">No rated doctors yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
