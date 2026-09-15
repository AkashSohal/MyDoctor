'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDate, formatTime, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  Users, Stethoscope, Calendar, Clock, Star, AlertCircle, 
  CheckCircle, XCircle, Shield, Building2, Search, 
  Plus, Edit, Trash2, Eye, MoreHorizontal
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

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="warning">Pending</Badge>,
      verified: <Badge variant="success">Verified</Badge>,
      rejected: <Badge variant="danger">Rejected</Badge>,
      suspended: <Badge variant="outline">Suspended</Badge>,
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  const getAppointmentStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="warning">Pending</Badge>,
      confirmed: <Badge variant="success">Confirmed</Badge>,
      cancelled: <Badge variant="danger">Cancelled</Badge>,
      completed: <Badge variant="default">Completed</Badge>,
      rejected: <Badge variant="danger">Rejected</Badge>,
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-6">
          <h1 className="text-2xl font-bold text-secondary-900">Admin Dashboard</h1>
        </div>
      </div>

      {/* Stats */}
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

        {/* Tabs */}
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
                  <Link href="/admin/doctors">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentDoctors.length === 0 ? (
                      <p className="text-secondary-500 text-center py-4">No doctors yet</p>
                    ) : (
                      recentDoctors.map((doctor) => (
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
                            {getStatusBadge(doctor.verification_status)}
                            {doctor.verification_status === 'pending' && (
                              <Button variant="outline" size="sm" onClick={() => {}}>
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
                    <Button variant="ghost" size="sm">View All</Button>
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
                          <div className="flex items-center gap-2">
                            {getAppointmentStatusBadge(apt.status)}
                          </div>
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
                <div className="flex gap-2">
                  <Input placeholder="Search doctors..." className="w-64" />
                  <Select placeholder="All Status">
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-secondary-200">
                        <th className="text-left p-3 font-medium text-secondary-600">Doctor</th>
                        <th className="text-left p-3 font-medium text-secondary-600">Specialty</th>
                        <th className="text-left p-3 font-medium text-secondary-600">Status</th>
                        <th className="text-left p-3 font-medium text-secondary-600">Registration</th>
                        <th className="text-left p-3 font-medium text-secondary-600">Applied</th>
                        <th className="text-right p-3 font-medium text-secondary-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentDoctors.map((doctor) => (
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
                          <td className="p-3">{getStatusBadge(doctor.verification_status)}</td>
                          <td className="p-3 text-sm text-secondary-600">REG-{doctor.id.slice(0, 8)}</td>
                          <td className="p-3 text-sm text-secondary-600">{formatDate(doctor.created_at)}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {doctor.verification_status === 'pending' && (
                                <>
                                  <Button size="sm" variant="success" onClick={() => {}}>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => {}}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
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
              <CardHeader>
                <CardTitle>Review Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="warning">Pending Moderation: {stats.pendingReviews}</Badge>
                    <Badge variant="danger">Reported: {stats.reportedReviews}</Badge>
                  </div>
                  <p className="text-secondary-500">Review moderation interface would go here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary-500">Appointment management interface would go here.</p>
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
                      <h4 className="font-medium">Match Score Weights</h4>
                      <p className="text-sm text-secondary-500">Configure algorithm weighting</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
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