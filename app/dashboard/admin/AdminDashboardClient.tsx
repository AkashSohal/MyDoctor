'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { formatDate, formatTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DoctorVerificationBadge, AppointmentStatusBadge } from '@/components/admin/AdminStatusBadges'
import {
  Users, Stethoscope, Calendar, Clock, Star, AlertCircle,
  CheckCircle, XCircle, Eye, ArrowRight
} from 'lucide-react'

interface AdminDashboardClientProps {
  stats: {
    totalUsers: number
    totalDoctors: number
    pendingDoctors: number
    totalAppointments: number
    pendingReviews: number
    reportedReviews: number
  }
  recentDoctors: Array<{
    id: string
    full_name: string
    specialization: { name: string } | null
    verification_status: string
    created_at: string
    rating_average: number
  }>
  recentAppointments: Array<{
    id: string
    status: string
    appointment_date: string
    appointment_time: string
    doctor: { full_name: string } | null
    patient: { full_name: string } | null
  }>
}

export function AdminDashboardClient({ stats, recentDoctors, recentAppointments }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = React.useState('overview')
  const [doctors, setDoctors] = React.useState(recentDoctors)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleVerify = async (doctorId: string) => {
    setUpdatingId(doctorId)
    const { error } = await supabase
      .from('doctors')
      .update({ verification_status: 'verified' })
      .eq('id', doctorId)
    if (!error) {
      setDoctors(prev => prev.map(d =>
        d.id === doctorId ? { ...d, verification_status: 'verified' } : d
      ))
    }
    setUpdatingId(null)
  }

  const handleReject = async (doctorId: string) => {
    setUpdatingId(doctorId)
    const { error } = await supabase
      .from('doctors')
      .update({ verification_status: 'rejected' })
      .eq('id', doctorId)
    if (!error) {
      setDoctors(prev => prev.map(d =>
        d.id === doctorId ? { ...d, verification_status: 'rejected' } : d
      ))
    }
    setUpdatingId(null)
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-6">
          <h1 className="text-2xl font-bold text-secondary-900">Admin Dashboard</h1>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalUsers}</p>
                  <p className="text-sm text-secondary-500">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalDoctors}</p>
                  <p className="text-sm text-secondary-500">Verified Doctors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{stats.pendingDoctors}</p>
                  <p className="text-sm text-secondary-500">Pending Verification</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{stats.totalAppointments}</p>
                  <p className="text-sm text-secondary-500">Total Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{stats.pendingReviews}</p>
                  <p className="text-sm text-secondary-500">Pending Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{stats.reportedReviews}</p>
                  <p className="text-sm text-secondary-500">Reported Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="doctors">Doctors ({stats.pendingDoctors})</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({stats.pendingReviews + stats.reportedReviews})</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Doctor Registrations</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('doctors')}>View All</Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {doctors.length === 0 ? (
                      <p className="text-secondary-500 text-center py-4">No doctors yet</p>
                    ) : (
                      doctors.map((doctor) => (
                        <div key={doctor.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <Stethoscope className="h-5 w-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium">Dr. {doctor.full_name}</p>
                              <p className="text-sm text-secondary-500">{doctor.specialization?.name || 'Specialist'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <DoctorVerificationBadge status={doctor.verification_status} />
                            {doctor.verification_status === 'pending' && (
                              <Button variant="ghost" size="sm" onClick={() => setActiveTab('doctors')}>
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Appointments</CardTitle>
                  <Link href="/admin/appointments">
                    <Button variant="ghost" size="sm">View All <ArrowRight className="h-4 w-4 ml-1" /></Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAppointments.length === 0 ? (
                      <p className="text-secondary-500 text-center py-4">No appointments yet</p>
                    ) : (
                      recentAppointments.map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{apt.patient?.full_name} → Dr. {apt.doctor?.full_name}</p>
                              <p className="text-sm text-secondary-500">
                                {formatDate(apt.appointment_date)} at {formatTime(apt.appointment_time)}
                              </p>
                            </div>
                          </div>
                          <AppointmentStatusBadge status={apt.status} />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="doctors" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Doctor Verification Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="text-left p-3 font-medium text-secondary-600">Doctor</th>
                        <th className="text-left p-3 font-medium text-secondary-600">Specialty</th>
                        <th className="text-left p-3 font-medium text-secondary-600">Status</th>
                        <th className="text-right p-3 font-medium text-secondary-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map((doctor) => (
                        <tr key={doctor.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                                <Stethoscope className="h-5 w-5 text-primary-600" />
                              </div>
                              <div>
                                <p className="font-medium">Dr. {doctor.full_name}</p>
                                <p className="text-sm text-secondary-500">{doctor.specialization?.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">{doctor.specialization?.name || '-'}</td>
                          <td className="p-3"><DoctorVerificationBadge status={doctor.verification_status} /></td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {doctor.verification_status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => handleVerify(doctor.id)}
                                    disabled={updatingId === doctor.id}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {updatingId === doctor.id ? '...' : 'Approve'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(doctor.id)}
                                    disabled={updatingId === doctor.id}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    {updatingId === doctor.id ? '...' : 'Reject'}
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Review Moderation</CardTitle>
                <Link href="/admin/reviews">
                  <Button variant="ghost" size="sm">Manage Reviews <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-700">{stats.pendingReviews}</p>
                    <p className="text-sm text-amber-600">Pending Moderation</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-700">{stats.reportedReviews}</p>
                    <p className="text-sm text-red-600">Reported Reviews</p>
                  </div>
                </div>
                <p className="text-secondary-500 mt-4">Review and moderate patient reviews. Approve, hide, or resolve reports.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Appointment Management</CardTitle>
                <Link href="/admin/appointments">
                  <Button variant="ghost" size="sm">Manage Appointments <ArrowRight className="h-4 w-4 ml-1" /></Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-700">{stats.totalAppointments}</p>
                    <p className="text-sm text-blue-600">Total</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-2xl font-bold text-amber-700">{recentAppointments.filter(a => a.status === 'pending').length}</p>
                    <p className="text-sm text-amber-600">Pending</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">{recentAppointments.filter(a => a.status === 'confirmed').length}</p>
                    <p className="text-sm text-green-600">Confirmed</p>
                  </div>
                </div>
                <p className="text-secondary-500 mt-4">View and manage all appointments. Cancel, confirm, or mark as completed.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Specialties Management</h4>
                      <p className="text-sm text-secondary-500">Add/edit medical specialties</p>
                    </div>
                    <Link href="/admin/specialties">
                      <Button>Manage</Button>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Hospitals Management</h4>
                      <p className="text-sm text-secondary-500">Add/edit hospital information</p>
                    </div>
                    <Link href="/admin/hospitals">
                      <Button>Manage</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
