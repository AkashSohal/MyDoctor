'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDate, formatTime, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calendar, Clock, Stethoscope, Heart, Star, Building2, MapPin, 
  X, CheckCircle, AlertCircle, Clock as ClockIcon, 
  User, Settings, LogOut, Plus, ArrowRight, Edit, Trash2,
  Stethoscope as StethoscopeIcon, GraduationCap, Briefcase, MapPin as MapPinIcon
} from 'lucide-react'
import { Doctor, Appointment, Availability, Hospital } from '@/lib/types'

interface DoctorDashboardClientProps {
  doctor: Doctor
  appointments: (Appointment & { patient?: { full_name: string; phone: string; email: string }; hospital?: { name: string; address: string } })[]
  availability: (Availability & { hospital?: Hospital })[]
  hospitals: Hospital[]
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function DoctorDashboardClient({ 
  doctor, 
  appointments, 
  availability, 
  hospitals 
}: DoctorDashboardClientProps) {
  const [activeTab, setActiveTab] = React.useState('overview')
  const [profileEditing, setProfileEditing] = React.useState(false)
  const [showAvailabilityModal, setShowAvailabilityModal] = React.useState(false)
  const [editingAvailability, setEditingAvailability] = React.useState<Availability | null>(null)

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

  const getVerificationBadge = (status: string) => {
    const badges = {
      pending: <Badge variant="warning">Verification Pending</Badge>,
      verified: <Badge variant="success">Verified</Badge>,
      rejected: <Badge variant="danger">Rejected</Badge>,
      suspended: <Badge variant="outline">Suspended</Badge>,
    }
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar src={doctor.photo_url} fallback={doctor.full_name} size="xl" />
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">Dr. {doctor.full_name}</h1>
                <p className="text-secondary-500">{doctor.specialization?.name || 'Specialist'} • {doctor.experience_years} years exp</p>
                <div className="flex items-center gap-2 mt-1">
                  {getVerificationBadge(doctor.verification_status)}
                  <Badge variant="outline">{doctor.consultation_fee ? `₹${doctor.consultation_fee}` : 'Fee not set'}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/doctor/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
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
                    {appointments.filter(a => a.status === 'confirmed' && a.appointment_date >= new Date().toISOString().split('T')[0]).length}
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
                    {appointments.filter(a => a.status === 'completed').length}
                  </p>
                  <p className="text-sm text-secondary-500">Completed</p>
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
                  <p className="text-2xl font-bold text-secondary-900">
                    {appointments.filter(a => a.status === 'pending').length}
                  </p>
                  <p className="text-sm text-secondary-500">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary-900">{availability.length}</p>
                  <p className="text-sm text-secondary-500">Active Schedules</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <StethoscopeIcon className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/appointments/new">
                    <Button className="w-full justify-start gap-2">
                      <Plus className="h-4 w-4" />
                      Add Availability Slot
                    </Button>
                  </Link>
                  <Link href="/doctor/hospitals">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Building2 className="h-4 w-4" />
                      Manage Hospitals
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setProfileEditing(true)}>
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Rating Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-secondary-900">{doctor.rating_average.toFixed(1)}</p>
                      <RatingStars rating={doctor.rating_average} size="lg" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-sm text-secondary-600">Total Reviews</span>
                        <span className="font-medium">{doctor.rating_count}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-sm text-secondary-600">Verified Reviews</span>
                        <span className="font-medium">{doctor.verified_review_count}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-sm text-secondary-600">Profile Completion</span>
                        <div className="flex-1 h-2 bg-secondary-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-600 rounded-full transition-all" 
                            style={{ width: `${doctor.profile_completion_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{doctor.profile_completion_percentage}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointments */}
          <TabsContent value="appointments" className="mt-6">
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                    <h3 className="text-lg font-medium text-secondary-900 mb-1">No appointments yet</h3>
                    <p className="text-secondary-500">Appointments will appear here once patients book</p>
                  </CardContent>
                </Card>
              ) : (
                appointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar 
                            src={appointment.patient?.avatar_url} 
                            fallback={appointment.patient?.full_name} 
                            size="lg"
                          />
                          <div>
                            <h3 className="font-semibold text-secondary-900">{appointment.patient?.full_name}</h3>
                            <p className="text-sm text-secondary-500">{appointment.patient?.phone}</p>
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
                            <div className="flex gap-2">
                              <Button size="sm" variant="success" onClick={() => {}}>
                                Confirm
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => {}}>
                                Reject
                              </Button>
                            </div>
                          )}
                          {appointment.status === 'confirmed' && (
                            <Button size="sm" onClick={() => {}}>
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                      {appointment.patient_message && (
                        <p className="mt-3 text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                          <strong>Patient message:</strong> {appointment.patient_message}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Availability */}
          <TabsContent value="availability" className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-xl font-semibold text-secondary-900">Weekly Schedule</h2>
              <Button onClick={() => { setEditingAvailability(null); setShowAvailabilityModal(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </div>

            <div className="space-y-4">
              {DAYS.map((day, dayIndex) => {
                const daySlots = availability.filter(a => a.day_of_week === dayIndex)
                if (daySlots.length === 0) return null
                
                return (
                  <Card key={day}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-secondary-900 mb-3">{day}</h3>
                      <div className="space-y-2">
                        {daySlots.map((slot) => (
                          <div key={slot.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-secondary-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                              <Badge variant="outline" size="sm">{slot.hospital?.name}</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingAvailability(slot); setShowAvailabilityModal(true) }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => {}}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              {availability.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ClockIcon className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                    <h3 className="text-lg font-medium text-secondary-900 mb-1">No schedules set</h3>
                    <p className="text-secondary-500 mb-4">Add your weekly availability for patients to book</p>
                    <Button onClick={() => { setEditingAvailability(null); setShowAvailabilityModal(true) }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Schedule
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile" className="mt-6">
            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar src={doctor.photo_url} fallback={doctor.full_name} size="2xl" />
                    <div>
                      <h3 className="text-lg font-semibold">Dr. {doctor.full_name}</h3>
                      <p className="text-secondary-500">{doctor.specialization?.name}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Qualifications</Label>
                      <Textarea 
                        value={doctor.qualifications?.join(', ') || ''} 
                        disabled={!profileEditing}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Experience (Years)</Label>
                      <Input 
                        type="number" 
                        value={doctor.experience_years} 
                        disabled={!profileEditing} 
                      />
                    </div>
                    <div>
                      <Label>Consultation Fee (₹)</Label>
                      <Input 
                        type="number" 
                        value={doctor.consultation_fee} 
                        disabled={!profileEditing} 
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select value={doctor.gender || ''} disabled={!profileEditing}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Languages</Label>
                      <Input 
                        value={doctor.languages?.join(', ') || ''} 
                        disabled={!profileEditing}
                        placeholder="English, Hindi, Punjabi"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>About / Bio</Label>
                      <Textarea 
                        value={doctor.bio || ''} 
                        disabled={!profileEditing}
                        rows={4}
                        placeholder="Tell patients about your approach, specialties, etc."
                      />
                    </div>
                  </div>

                  <div className="border-t border-secondary-200 pt-6">
                    <h3 className="text-lg font-semibold mb-4">Hospital Affiliations</h3>
                    <div className="space-y-3">
                      {doctor.hospitals?.map((hospital) => (
                        <div key={hospital.id} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-secondary-400" />
                            <div>
                              <p className="font-medium">{hospital.name}</p>
                              <p className="text-sm text-secondary-500">{hospital.address}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => {}}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" onClick={() => {}}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Hospital
                      </Button>
                    </div>
                  </div>

                  {!profileEditing && (
                    <Button onClick={() => setProfileEditing(true)} className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Verification Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {getVerificationBadge(doctor.verification_status)}
                    <div>
                      <p className="text-secondary-600">Your profile is {doctor.verification_status}.</p>
                      {doctor.verification_status === 'pending' && (
                        <p className="text-sm text-secondary-500 mt-1">Admin review typically takes 2-3 business days.</p>
                      )}
                      {doctor.verification_status === 'rejected' && (
                        <p className="text-sm text-red-600 mt-1">Please check your email for rejection reasons and resubmit.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingAvailability ? 'Edit Schedule' : 'Add Schedule'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select placeholder="Select day">
                {DAYS.map((day, i) => (
                  <option key={i} value={i.toString()}>{day}</option>
                ))}
              </Select>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Input type="time" placeholder="Start time" />
                <Input type="time" placeholder="End time" />
              </div>
              
              <Select placeholder="Select hospital">
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </Select>
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAvailabilityModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={() => { setShowAvailabilityModal(false) }}>
                  {editingAvailability ? 'Save Changes' : 'Add Schedule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

import { RatingStars } from '@/components/common/RatingStars'