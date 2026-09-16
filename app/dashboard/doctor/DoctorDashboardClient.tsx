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
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RatingStars } from '@/components/common/RatingStars'
import {
  Calendar, Clock, Stethoscope, Star, Building2,
  CheckCircle, AlertCircle, Clock as ClockIcon,
  Settings, Plus, Edit, Trash2
} from 'lucide-react'
import { Doctor, Appointment, Availability, Hospital } from '@/lib/types'

interface DoctorDashboardClientProps {
  doctor: Doctor
  appointments: (Appointment & { patient?: { full_name: string; phone: string; email: string; avatar_url?: string }; hospital?: { name: string; address: string } })[]
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
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = React.useState('overview')
  const [profileEditing, setProfileEditing] = React.useState(false)
  const [showAvailabilityModal, setShowAvailabilityModal] = React.useState(false)
  const [editingAvailability, setEditingAvailability] = React.useState<Availability | null>(null)
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)

  // Availability modal state
  const [availDay, setAvailDay] = React.useState('1')
  const [availStartTime, setAvailStartTime] = React.useState('09:00')
  const [availEndTime, setAvailEndTime] = React.useState('13:00')
  const [availHospitalId, setAvailHospitalId] = React.useState('')

  // Profile editing state
  const [profileData, setProfileData] = React.useState({
    qualifications: doctor.qualifications?.join(', ') || '',
    experience_years: doctor.experience_years || 0,
    consultation_fee: doctor.consultation_fee || 0,
    gender: (doctor.gender || 'male') as 'male' | 'female' | 'other',
    languages: doctor.languages?.join(', ') || '',
    bio: doctor.bio || '',
  })

  // Local state for appointments and availability
  const [localAppointments, setLocalAppointments] = React.useState(appointments)
  const [localAvailability, setLocalAvailability] = React.useState(availability)

  React.useEffect(() => {
    setLocalAppointments(appointments)
    setLocalAvailability(availability)
  }, [appointments, availability])

  React.useEffect(() => {
    if (editingAvailability) {
      setAvailDay(editingAvailability.day_of_week.toString())
      setAvailStartTime(editingAvailability.start_time)
      setAvailEndTime(editingAvailability.end_time)
      setAvailHospitalId(editingAvailability.hospital_id)
    } else {
      setAvailDay('1')
      setAvailStartTime('09:00')
      setAvailEndTime('13:00')
      setAvailHospitalId(hospitals[0]?.id || '')
    }
  }, [editingAvailability, hospitals])

  const handleAppointmentAction = async (appointmentId: string, status: Appointment['status']) => {
    setUpdatingId(appointmentId)
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId)
    if (!error) {
      setLocalAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status } : a))
    }
    setUpdatingId(null)
  }

  const handleSaveAvailability = async () => {
    setUpdatingId('availability')
    if (editingAvailability) {
      const { error } = await supabase
        .from('availability')
        .update({
          day_of_week: parseInt(availDay),
          start_time: availStartTime,
          end_time: availEndTime,
          hospital_id: availHospitalId,
        })
        .eq('id', editingAvailability.id)
      if (!error) {
        setLocalAvailability(prev => prev.map(a =>
          a.id === editingAvailability.id
            ? { ...a, day_of_week: parseInt(availDay), start_time: availStartTime, end_time: availEndTime, hospital_id: availHospitalId, hospital: hospitals.find(h => h.id === availHospitalId) }
            : a
        ))
      }
    } else {
      const { data, error } = await supabase
        .from('availability')
        .insert({
          doctor_id: doctor.id,
          day_of_week: parseInt(availDay),
          start_time: availStartTime,
          end_time: availEndTime,
          hospital_id: availHospitalId,
          is_active: true,
        })
        .select()
        .single()
      if (!error && data) {
        setLocalAvailability(prev => [...prev, { ...data, hospital: hospitals.find(h => h.id === availHospitalId) }])
      }
    }
    setShowAvailabilityModal(false)
    setEditingAvailability(null)
    setUpdatingId(null)
  }

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm('Delete this schedule?')) return
    setUpdatingId(id)
    const { error } = await supabase.from('availability').delete().eq('id', id)
    if (!error) {
      setLocalAvailability(prev => prev.filter(a => a.id !== id))
    }
    setUpdatingId(null)
  }

  const handleSaveProfile = async () => {
    setUpdatingId('profile')
    const { error } = await supabase
      .from('doctors')
      .update({
        qualifications: profileData.qualifications.split(',').map(s => s.trim()).filter(Boolean),
        experience_years: profileData.experience_years,
        consultation_fee: profileData.consultation_fee,
        gender: profileData.gender,
        languages: profileData.languages.split(',').map(s => s.trim()).filter(Boolean),
        bio: profileData.bio,
      })
      .eq('id', doctor.id)
    if (!error) {
      setProfileEditing(false)
      router.refresh()
    }
    setUpdatingId(null)
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      pending: <Badge variant="warning">Pending</Badge>,
      confirmed: <Badge variant="success">Confirmed</Badge>,
      cancelled: <Badge variant="danger">Cancelled</Badge>,
      completed: <Badge variant="default">Completed</Badge>,
      rejected: <Badge variant="danger">Rejected</Badge>,
    }
    return badges[status] || <Badge>{status}</Badge>
  }

  const getVerificationBadge = (status: string) => {
    const badges: Record<string, React.ReactNode> = {
      pending: <Badge variant="warning">Verification Pending</Badge>,
      verified: <Badge variant="success">Verified</Badge>,
      rejected: <Badge variant="danger">Rejected</Badge>,
      suspended: <Badge variant="outline">Suspended</Badge>,
    }
    return badges[status] || <Badge>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-secondary-50">
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
          </div>
        </div>
      </div>

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
                    {localAppointments.filter(a => a.status === 'confirmed' && a.appointment_date >= new Date().toISOString().split('T')[0]).length}
                  </p>
                  <p className="text-sm text-secondary-500">Upcoming</p>
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
                    {localAppointments.filter(a => a.status === 'completed').length}
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
                    {localAppointments.filter(a => a.status === 'pending').length}
                  </p>
                  <p className="text-sm text-secondary-500">Pending</p>
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
                  <p className="text-2xl font-bold text-secondary-900">{localAvailability.length}</p>
                  <p className="text-sm text-secondary-500">Schedules</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start gap-2" onClick={() => { setEditingAvailability(null); setShowAvailabilityModal(true) }}>
                    <Plus className="h-4 w-4" />
                    Add Availability Slot
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setActiveTab('profile'); setProfileEditing(true) }}>
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Rating Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-secondary-900">{doctor.rating_average.toFixed(1)}</p>
                      <RatingStars rating={doctor.rating_average} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-sm text-secondary-600">Total Reviews</span>
                        <span className="font-medium">{doctor.rating_count}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-24 text-sm text-secondary-600">Verified</span>
                        <span className="font-medium">{doctor.verified_review_count}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <div className="space-y-4">
              {localAppointments.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                    <h3 className="text-lg font-medium text-secondary-900 mb-1">No appointments yet</h3>
                    <p className="text-secondary-500">Appointments will appear here once patients book</p>
                  </CardContent>
                </Card>
              ) : (
                localAppointments.map((appointment) => (
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
                            {formatDate(appointment.appointment_date)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-secondary-600">
                            <Clock className="h-4 w-4" />
                            {formatTime(appointment.appointment_time)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-secondary-600">
                            <Building2 className="h-4 w-4" />
                            {appointment.hospital?.name}
                          </div>
                          {getStatusBadge(appointment.status)}
                          {appointment.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="success" onClick={() => handleAppointmentAction(appointment.id, 'confirmed')} disabled={updatingId === appointment.id}>
                                Confirm
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleAppointmentAction(appointment.id, 'rejected')} disabled={updatingId === appointment.id}>
                                Reject
                              </Button>
                            </div>
                          )}
                          {appointment.status === 'confirmed' && (
                            <Button size="sm" onClick={() => handleAppointmentAction(appointment.id, 'completed')} disabled={updatingId === appointment.id}>
                              Complete
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
                const daySlots = localAvailability.filter(a => a.day_of_week === dayIndex)
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
                              <Badge variant="outline">{slot.hospital?.name}</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingAvailability(slot); setShowAvailabilityModal(true) }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDeleteAvailability(slot.id)} disabled={updatingId === slot.id}>
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
              {localAvailability.length === 0 && (
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

          <TabsContent value="profile" className="mt-6">
            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Professional Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Avatar src={doctor.photo_url} fallback={doctor.full_name} size="xl" />
                    <div>
                      <h3 className="text-lg font-semibold">Dr. {doctor.full_name}</h3>
                      <p className="text-secondary-500">{doctor.specialization?.name}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Qualifications</Label>
                      <Textarea
                        value={profileData.qualifications}
                        onChange={(e) => setProfileData(prev => ({ ...prev, qualifications: e.target.value }))}
                        disabled={!profileEditing}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Experience (Years)</Label>
                      <Input
                        type="number"
                        value={profileData.experience_years}
                        onChange={(e) => setProfileData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                        disabled={!profileEditing}
                      />
                    </div>
                    <div>
                      <Label>Consultation Fee (₹)</Label>
                      <Input
                        type="number"
                        value={profileData.consultation_fee}
                        onChange={(e) => setProfileData(prev => ({ ...prev, consultation_fee: parseInt(e.target.value) || 0 }))}
                        disabled={!profileEditing}
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={profileData.gender}
                        onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                        disabled={!profileEditing}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label>Languages</Label>
                      <Input
                        value={profileData.languages}
                        onChange={(e) => setProfileData(prev => ({ ...prev, languages: e.target.value }))}
                        disabled={!profileEditing}
                        placeholder="English, Hindi"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label>About / Bio</Label>
                      <Textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={!profileEditing}
                        rows={4}
                      />
                    </div>
                  </div>
                  {profileEditing && (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setProfileEditing(false)}>Cancel</Button>
                      <Button className="flex-1" onClick={handleSaveProfile} loading={updatingId === 'profile'}>Save Profile</Button>
                    </div>
                  )}
                  {!profileEditing && (
                    <Button onClick={() => setProfileEditing(true)} className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showAvailabilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowAvailabilityModal(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>{editingAvailability ? 'Edit Schedule' : 'Add Schedule'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Day</Label>
                <Select value={availDay} onChange={(e) => setAvailDay(e.target.value)}>
                  {DAYS.map((day, i) => (
                    <option key={i} value={i.toString()}>{day}</option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Start Time</Label>
                  <Input type="time" value={availStartTime} onChange={(e) => setAvailStartTime(e.target.value)} />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input type="time" value={availEndTime} onChange={(e) => setAvailEndTime(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Hospital</Label>
                <Select value={availHospitalId} onChange={(e) => setAvailHospitalId(e.target.value)}>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowAvailabilityModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleSaveAvailability} loading={updatingId === 'availability'}>
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
