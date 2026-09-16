'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { formatDate, formatTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RatingStars } from '@/components/common/RatingStars'
import {
  Calendar, Clock, Heart, Star, Building2, MapPin,
  X, CheckCircle, Clock as ClockIcon, Plus, Settings
} from 'lucide-react'
import { Appointment, Doctor, Review } from '@/lib/types'

interface PatientDashboardClientProps {
  user: { id: string; email?: string; full_name?: string; avatar_url?: string }
  upcomingAppointments: (Appointment & { doctor?: Doctor; hospital?: { name: string; address: string } })[]
  pastAppointments: (Appointment & { doctor?: Doctor; hospital?: { name: string; address: string } })[]
  savedDoctors: Doctor[]
  reviews: (Review & { doctor?: Doctor })[]
}

export function PatientDashboardClient({ 
  user, 
  upcomingAppointments, 
  pastAppointments, 
  savedDoctors, 
  reviews 
}: PatientDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  const [localUpcoming, setLocalUpcoming] = React.useState(upcomingAppointments)
  const [localSaved, setLocalSaved] = React.useState(savedDoctors)

  React.useEffect(() => {
    setLocalUpcoming(upcomingAppointments)
    setLocalSaved(savedDoctors)
  }, [upcomingAppointments, savedDoctors])
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="warning">Pending</Badge>,
      confirmed: <Badge variant="success">Confirmed</Badge>,
      cancelled: <Badge variant="danger">Cancelled</Badge>,
      completed: <Badge variant="default">Completed</Badge>,
      rejected: <Badge variant="danger">Rejected</Badge>,
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  const canReview = (appointment: Appointment) => {
    return appointment.status === 'completed' && 
           !reviews.some(r => r.appointment_id === appointment.id)
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Cancel this appointment?')) return
    setUpdatingId(appointmentId)
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId)
    if (!error) {
      setLocalUpcoming(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'cancelled' } : a))
    }
    setUpdatingId(null)
  }

  const handleRemoveSaved = async (doctorId: string) => {
    setUpdatingId(doctorId)
    const { error } = await supabase.from('saved_doctors').delete().eq('doctor_id', doctorId).eq('patient_id', user.id)
    if (!error) {
      setLocalSaved(prev => prev.filter(d => d.id !== doctorId))
    }
    setUpdatingId(null)
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Patient Dashboard</h1>
              <p className="text-secondary-500">Welcome back, {user.full_name || 'Patient'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/doctors">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Find Doctors
                </Button>
              </Link>
              <Link href="/patient/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">
                    {upcomingAppointments.filter(a => a.status === 'confirmed').length}
                  </p>
                  <p className="text-sm text-secondary-500">Upcoming Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">
                    {pastAppointments.filter(a => a.status === 'completed').length}
                  </p>
                  <p className="text-sm text-secondary-500">Completed Visits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{savedDoctors.length}</p>
                  <p className="text-sm text-secondary-500">Saved Doctors</p>
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
                  <p className="text-2xl font-bold text-secondary-900">{reviews.length}</p>
                  <p className="text-sm text-secondary-500">Reviews Written</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="saved">Saved Doctors</TabsTrigger>
            <TabsTrigger value="reviews">My Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {localUpcoming.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-1">No upcoming appointments</h3>
                  <p className="text-secondary-500 mb-4">Book your first appointment with a verified doctor</p>
                  <Link href="/doctors">
                    <Button>Find Doctors</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {localUpcoming.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar 
                            src={appointment.doctor?.photo_url} 
                            fallback={appointment.doctor?.full_name} 
                            size="lg"
                          />
                          <div>
                            <h3 className="font-semibold text-secondary-900">
                              Dr. {appointment.doctor?.full_name}
                            </h3>
                            <p className="text-sm text-secondary-500">
                              {appointment.doctor?.specialization?.name || 'Specialist'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-secondary-600">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(appointment.appointment_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-secondary-600">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(appointment.appointment_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-secondary-600">
                            <Building2 className="h-4 w-4" />
                            <span>{appointment.hospital?.name}</span>
                          </div>
                          {getStatusBadge(appointment.status)}
                          {appointment.status === 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelAppointment(appointment.id)} disabled={updatingId === appointment.id}>
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastAppointments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ClockIcon className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-1">No past appointments</h3>
                  <p className="text-secondary-500 mb-4">Your appointment history will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar 
                            src={appointment.doctor?.photo_url} 
                            fallback={appointment.doctor?.full_name} 
                            size="lg"
                          />
                          <div>
                            <h3 className="font-semibold text-secondary-900">
                              Dr. {appointment.doctor?.full_name}
                            </h3>
                            <p className="text-sm text-secondary-500">
                              {appointment.doctor?.specialization?.name || 'Specialist'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex items-center gap-2 text-sm text-secondary-600">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(appointment.appointment_date)}</span>
                          </div>
                          {getStatusBadge(appointment.status)}
                          {canReview(appointment) && (
                            <Link href={`/doctors/${appointment.doctor_id}`}>
                              <Button size="sm">
                                <Star className="h-4 w-4 mr-2 fill-amber-500 text-amber-500" />
                                Write Review
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            {localSaved.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Heart className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-1">No saved doctors yet</h3>
                  <p className="text-secondary-500 mb-4">Save doctors to easily compare and book later</p>
                  <Link href="/doctors">
                    <Button>Find Doctors</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {localSaved.map((doctor) => (
                  <Card key={doctor.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar 
                          src={doctor.photo_url} 
                          fallback={doctor.full_name} 
                          size="md"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-secondary-900 truncate">
                            Dr. {doctor.full_name}
                          </h3>
                          <p className="text-sm text-secondary-500 truncate">
                            {doctor.specialization?.name || 'Specialist'}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-secondary-500">
                            {doctor.rating_average > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                                {doctor.rating_average.toFixed(1)}
                              </span>
                            )}
                            {doctor.distance_km && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {doctor.distance_km.toFixed(1)} km
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Link href={`/doctors/${doctor.id}`}>
                          <Button variant="outline" size="sm" className="flex-1">View</Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveSaved(doctor.id)} disabled={updatingId === doctor.id}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Star className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                  <h3 className="text-lg font-medium text-secondary-900 mb-1">No reviews yet</h3>
                  <p className="text-secondary-500 mb-4">Your reviews will appear here after completed appointments</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <Avatar 
                            src={review.doctor?.photo_url} 
                            fallback={review.doctor?.full_name} 
                            size="md"
                          />
                          <div>
                            <h3 className="font-semibold text-secondary-900">
                              Dr. {review.doctor?.full_name}
                            </h3>
                            <p className="text-sm text-secondary-500">
                              {review.doctor?.specialization?.name || 'Specialist'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <RatingStars rating={review.rating} size="sm" showValue />
                          <Badge variant={review.status === 'published' ? 'success' : 'outline'}>
                            {review.status}
                          </Badge>
                        </div>
                      </div>
                      {review.review_text && (
                        <p className="mt-3 text-secondary-600">{review.review_text}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
