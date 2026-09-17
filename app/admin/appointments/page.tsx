'use client'

import * as React from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AppointmentStatusBadge } from '@/components/admin/AdminStatusBadges'
import { Calendar, Clock, Loader2, XCircle, Eye } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'

const supabase = createClient()

type AppointmentRow = {
  id: string
  doctor_id: string
  hospital_id: string
  patient_id: string
  appointment_date: string
  appointment_time: string
  status: string
  patient_message: string | null
  created_at: string
  doctor: { full_name: string; specialization?: { name: string } } | null
  patient: { full_name: string; email: string } | null
  hospital: { name: string; address: string } | null
}

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'cancelled', 'completed', 'rejected']

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = React.useState<AppointmentRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [statusFilter, setStatusFilter] = React.useState('all')
  const [search, setSearch] = React.useState('')
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = React.useState<AppointmentRow | null>(null)

  React.useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    setLoading(true)
    let query = supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctors(full_name, specialization:specialties(name)),
        patient:users(full_name, email),
        hospital:hospitals(name, address)
      `)
      .order('appointment_date', { ascending: false })
      .order('appointment_time', { ascending: false })

    const { data } = await query
    if (data) setAppointments(data as any)
    setLoading(false)
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Cancel this appointment?')) return
    setUpdatingId(appointmentId)
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId)
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'cancelled' } : a))
    setUpdatingId(null)
  }

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    setUpdatingId(appointmentId)
    await supabase.from('appointments').update({ status: newStatus }).eq('id', appointmentId)
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: newStatus } : a))
    setUpdatingId(null)
  }

  const filtered = appointments.filter(a => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    const matchesSearch = !search ||
      a.patient?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.hospital?.name?.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    for (const s of STATUS_OPTIONS) {
      counts[s] = s === 'all' ? appointments.length : appointments.filter(a => a.status === s).length
    }
    return counts
  }, [appointments])

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Appointment Management</h1>
              <p className="text-sm text-secondary-500 mt-1">{appointments.length} total appointments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                statusFilter === status
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-secondary-200 bg-white hover:bg-secondary-50'
              }`}
            >
              <p className="text-lg font-bold text-secondary-900">{statusCounts[status]}</p>
              <p className="text-xs text-secondary-500 capitalize">{status === 'all' ? 'Total' : status}</p>
            </button>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Input placeholder="Search by patient, doctor, or hospital..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-secondary-500 py-12">No appointments found</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell className="font-medium">{apt.patient?.full_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <div>
                            <p>Dr. {apt.doctor?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-secondary-500">{apt.doctor?.specialization?.name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-secondary-500">{apt.hospital?.name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-secondary-400" />
                            {formatDate(apt.appointment_date)}
                            <Clock className="h-4 w-4 text-secondary-400" />
                            {formatTime(apt.appointment_time)}
                          </div>
                        </TableCell>
                        <TableCell><AppointmentStatusBadge status={apt.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedAppointment(apt)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(apt.status === 'pending' || apt.status === 'confirmed') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:bg-red-50"
                                onClick={() => handleCancelAppointment(apt.id)}
                                disabled={updatingId === apt.id}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedAppointment(null)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Appointment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary-500">Patient</p>
                  <p className="font-medium">{selectedAppointment.patient?.full_name}</p>
                  <p className="text-sm text-secondary-500">{selectedAppointment.patient?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Doctor</p>
                  <p className="font-medium">Dr. {selectedAppointment.doctor?.full_name}</p>
                  <p className="text-sm text-secondary-500">{selectedAppointment.doctor?.specialization?.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary-500">Hospital</p>
                  <p className="font-medium">{selectedAppointment.hospital?.name}</p>
                  <p className="text-sm text-secondary-500">{selectedAppointment.hospital?.address}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-500">Date & Time</p>
                  <p className="font-medium">{formatDate(selectedAppointment.appointment_date)}</p>
                  <p className="text-sm text-secondary-500">{formatTime(selectedAppointment.appointment_time)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-secondary-500">Status</p>
                <AppointmentStatusBadge status={selectedAppointment.status} />
              </div>
              {selectedAppointment.patient_message && (
                <div>
                  <p className="text-sm text-secondary-500">Patient Message</p>
                  <p className="text-sm bg-secondary-50 p-3 rounded-lg">{selectedAppointment.patient_message}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                  <Button variant="destructive" onClick={() => { handleCancelAppointment(selectedAppointment.id); setSelectedAppointment(null); }}>
                    Cancel Appointment
                  </Button>
                )}
                {selectedAppointment.status === 'pending' && (
                  <Button onClick={() => { handleStatusChange(selectedAppointment.id, 'confirmed'); setSelectedAppointment(null); }}>
                    Confirm
                  </Button>
                )}
                {selectedAppointment.status === 'confirmed' && (
                  <Button onClick={() => { handleStatusChange(selectedAppointment.id, 'completed'); setSelectedAppointment(null); }}>
                    Mark Completed
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedAppointment(null)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
