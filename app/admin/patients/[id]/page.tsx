import * as React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import {
  APPOINTMENT_STATUS_LABELS,
  appointmentStatusVariant,
  formatDateTime,
  formatDate,
  formatTime,
} from '@/lib/admin/format'
import { PatientActions } from './PatientActions'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminPatientDetailPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin()

  const [{ data: patient }, { data: appointmentRows }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, status, created_at, last_login_at')
      .eq('id', params.id)
      .maybeSingle(),
    supabase
      .from('appointments')
      .select(
        `id, status, appointment_date, appointment_time, patient_message, created_at,
         doctor:doctors(full_name, specialization:specialties(name)),
         hospital:hospitals(name)`
      )
      .eq('patient_id', params.id)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })
      .limit(50),
  ])

  if (!patient || patient.role === 'admin') notFound()

  const patientRow = patient as any
  const appointmentList = (appointmentRows ?? []) as any[]

  return (
    <div>
      <Link
        href="/admin/patients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-secondary-500 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Link>

      <PageHeader
        title={patientRow.full_name || 'Unnamed patient'}
        description={`Registered ${formatDate(patientRow.created_at)}`}
        actions={
          patientRow.status === 'suspended' ? (
            <Badge variant="danger" size="lg">Suspended</Badge>
          ) : (
            <Badge variant="success" size="lg">Active</Badge>
          )
        }
      />

      <PatientActions
        patient={{
          id: patientRow.id,
          full_name: patientRow.full_name ?? '',
          email: patientRow.email ?? '',
          phone: patientRow.phone ?? '',
          status: patientRow.status ?? 'active',
        }}
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact & account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center gap-2 text-secondary-700">
              <Mail className="h-4 w-4 text-secondary-400" /> {patientRow.email ?? '—'}
            </p>
            <p className="flex items-center gap-2 text-secondary-700">
              <Phone className="h-4 w-4 text-secondary-400" /> {patientRow.phone ?? '—'}
            </p>
            <p className="flex items-center gap-2 text-secondary-700">
              <ShieldCheck className="h-4 w-4 text-secondary-400" />
              Last sign-in: {formatDateTime(patientRow.last_login_at)}
            </p>
            <div className="rounded-xl bg-secondary-50 p-3 text-xs text-secondary-500">
              Sensitive medical records are not accessible from the admin area. Only appointment
              metadata is shown.
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointment history</CardTitle>
          </CardHeader>
          <CardContent>
            {appointmentList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-secondary-100 text-left text-xs uppercase tracking-wide text-secondary-400">
                      <th className="pb-2 pr-4 font-semibold">Doctor</th>
                      <th className="pb-2 pr-4 font-semibold">Hospital</th>
                      <th className="pb-2 pr-4 font-semibold">When</th>
                      <th className="pb-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary-50">
                    {appointmentList.map((a: any) => (
                      <tr key={a.id}>
                        <td className="py-2.5 pr-4">
                          <p className="font-medium text-secondary-900">{a.doctor?.full_name ?? '—'}</p>
                          <p className="text-xs text-secondary-400">
                            {a.doctor?.specialization?.name ?? ''}
                          </p>
                        </td>
                        <td className="py-2.5 pr-4 text-secondary-600">{a.hospital?.name ?? '—'}</td>
                        <td className="py-2.5 pr-4 text-secondary-600">
                          {formatDate(a.appointment_date)} · {formatTime(a.appointment_time)}
                        </td>
                        <td className="py-2.5">
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
              <p className="py-6 text-center text-sm text-secondary-500">No appointments yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
