'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { formatDate, formatTime, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Avatar } from '@/components/ui/avatar'
import { 
  Calendar, Clock, User, Phone, Mail, Stethoscope, Building2, 
  ArrowLeft, CheckCircle, AlertCircle, Loader2
} from 'lucide-react'
import { Doctor, Hospital, Availability } from '@/lib/types'

const supabase = createClient()

export function NewAppointmentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const doctorId = searchParams.get('doctor')
  
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [doctor, setDoctor] = React.useState<Doctor | null>(null)
  const [hospitals, setHospitals] = React.useState<Hospital[]>([])
  const [availability, setAvailability] = React.useState<Availability[]>([])
  const [selectedHospital, setSelectedHospital] = React.useState<string>('')
  const [selectedDate, setSelectedDate] = React.useState<string>('')
  const [selectedSlot, setSelectedSlot] = React.useState<string>('')
  const [formData, setFormData] = React.useState({
    fullName: '',
    phone: '',
    email: '',
    age: '',
    message: '',
  })

  React.useEffect(() => {
    if (doctorId) {
      loadDoctor()
    }
  }, [doctorId])

  const loadDoctor = async () => {
    const { data } = await supabase
      .from('doctors')
      .select(`
        *,
        specialization:specialties(name),
        availability(*)
      `)
      .eq('id', doctorId)
      .eq('verification_status', 'verified')
      .single()

    if (data) {
      // Fetch hospitals via junction table
      const { data: doctorHospitals } = await supabase
        .from('doctor_hospitals')
        .select('hospital:hospitals(id, name, address, latitude, longitude)')
        .eq('doctor_id', doctorId)

      const hospitalsList = (doctorHospitals?.map(dh => dh.hospital).filter(Boolean) || []) as unknown as Hospital[]
      
      setDoctor(data)
      setHospitals(hospitalsList)
      setAvailability(data.availability || [])
      if (hospitalsList[0]) {
        setSelectedHospital(hospitalsList[0].id)
      }
    }
  }

  const filteredSlots = availability.filter(a => 
    a.hospital_id === selectedHospital && 
    a.is_active &&
    a.day_of_week === new Date(selectedDate).getDay()
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login?redirect=/appointments/new')
      return
    }

    const { error } = await supabase
      .from('appointments')
      .insert({
        doctor_id: doctorId,
        hospital_id: selectedHospital,
        patient_id: user.id,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        patient_message: formData.message,
        status: 'pending',
      })

    if (error) {
      alert('Failed to book appointment: ' + error.message)
    } else {
      setStep(6)
    }
    setLoading(false)
  }

  const steps = [
    { num: 1, label: 'Doctor' },
    { num: 2, label: 'Hospital' },
    { num: 3, label: 'Date' },
    { num: 4, label: 'Time' },
    { num: 5, label: 'Details' },
  ]

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Progress Steps */}
      <div className="bg-white border-b border-secondary-200 sticky top-0 z-40">
        <div className="container">
          <div className="flex items-center justify-between py-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-1 overflow-x-auto px-4">
              {steps.map((s, i) => (
                <React.Fragment key={s.num}>
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                    i < step - 1 ? 'bg-primary-100 text-primary-700' :
                    i === step - 1 ? 'bg-primary-600 text-white' :
                    'bg-secondary-100 text-secondary-500'
                  )}>
                    {i < step - 1 ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium">
                        {s.num}
                      </span>
                    )}
                    <span className="hidden sm:inline font-medium">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      'h-1 w-12 rounded transition-colors',
                      i < step - 1 ? 'bg-primary-600' : 'bg-secondary-200'
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {!doctor ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600 mb-3" />
              <p className="text-secondary-500">Loading doctor details...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Step 1: Doctor Confirmation */}
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Confirm Doctor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar src={doctor.photo_url} fallback={doctor.full_name} size="xl" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-secondary-900">Dr. {doctor.full_name}</h3>
                      <p className="text-secondary-500">{doctor.specialization?.name || 'Specialist'}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-secondary-600">
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-4 w-4" />
                          {doctor.experience_years} years exp
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {doctor.hospitals?.length || 0} hospitals
                        </span>
                        <span className="flex items-center gap-1">
                          ₹{doctor.consultation_fee} consultation
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button onClick={() => setStep(2)} className="flex-1" size="lg">
                      Continue
                    </Button>
                    <Button variant="outline" onClick={() => router.back()}>
                      Change Doctor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Hospital Selection */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Hospital / Clinic</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {hospitals.map((hospital) => (
                      <button
                        key={hospital.id}
                        onClick={() => { setSelectedHospital(hospital.id); setStep(3); }}
                        className={cn(
                          'w-full p-4 rounded-lg border-2 text-left transition-colors',
                          selectedHospital === hospital.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-secondary-200 hover:border-primary-300'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center',
                            selectedHospital === hospital.id
                              ? 'bg-primary-600 text-white'
                              : 'bg-secondary-100 text-secondary-600'
                          )}>
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-secondary-900">{hospital.name}</h4>
                            <p className="text-sm text-secondary-500">{hospital.address}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Date Selection */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="text-center text-sm font-medium text-secondary-500 py-2">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 42 }, (_, i) => {
                        const date = new Date()
                        date.setDate(date.getDate() + i - new Date().getDay())
                        const dateStr = date.toISOString().split('T')[0]
                        const isPast = date < new Date(new Date().setHours(0,0,0,0))
                        const isSelected = selectedDate === dateStr
                        const hasSlots = availability.some(a => 
                          a.hospital_id === selectedHospital && 
                          a.day_of_week === date.getDay() && 
                          a.is_active
                        )
                        
                        return (
                          <button
                            key={dateStr}
                            onClick={() => !isPast && hasSlots && setSelectedDate(dateStr)}
                            disabled={isPast || !hasSlots}
                            className={cn(
                              'aspect-square rounded-lg text-sm font-medium transition-colors',
                              isPast ? 'text-secondary-300 cursor-not-allowed' :
                              isSelected ? 'bg-primary-600 text-white' :
                              hasSlots ? 'hover:bg-primary-100 text-primary-700 cursor-pointer' :
                              'text-secondary-400 cursor-not-allowed'
                            )}
                          >
                            {date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <Button onClick={() => setStep(4)} disabled={!selectedDate} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Time Slot Selection */}
            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Time Slot</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary-500 mb-4">
                    Available on {selectedDate ? formatDate(selectedDate) : 'selected date'}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredSlots.map((slot) => (
                      <button
                        key={`${slot.start_time}-${slot.end_time}`}
                        onClick={() => { setSelectedSlot(slot.start_time); setStep(5); }}
                        className={cn(
                          'p-4 rounded-lg border-2 text-center transition-colors',
                          selectedSlot === slot.start_time
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-secondary-200 hover:border-primary-300'
                        )}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Clock className={cn('h-5 w-5', selectedSlot === slot.start_time ? 'text-white' : 'text-primary-600')} />
                          <span className={cn('font-medium', selectedSlot === slot.start_time ? 'text-white' : 'text-secondary-900')}>
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {filteredSlots.length === 0 && (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                      <p className="text-secondary-500">No available slots for this date</p>
                    </div>
                  )}
                  <div className="mt-4 flex gap-3">
                    <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
                    <Button onClick={() => setStep(5)} disabled={!selectedSlot} className="flex-1">
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Patient Details */}
            {step === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Patient Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          value={formData.age}
                          onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="message">Optional Message for Doctor</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        rows={3}
                        placeholder="Any symptoms, concerns, or specific reason for visit..."
                      />
                    </div>

                    {/* Appointment Summary */}
                    <div className="bg-secondary-50 rounded-xl p-4">
                      <h4 className="font-medium text-secondary-900 mb-3">Appointment Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-secondary-600">Doctor</span>
                          <span className="font-medium">Dr. {doctor.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary-600">Hospital</span>
                          <span className="font-medium">
                            {hospitals.find(h => h.id === selectedHospital)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary-600">Date</span>
                          <span className="font-medium">{selectedDate ? formatDate(selectedDate) : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary-600">Time</span>
                          <span className="font-medium">{selectedSlot ? formatTime(selectedSlot) : '-'}</span>
                        </div>
                        <div className="flex justify-between border-t border-secondary-200 pt-2">
                          <span className="text-secondary-600">Fee</span>
                          <span className="font-medium">₹{doctor.consultation_fee}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" onClick={() => setStep(4)}>Back</Button>
                      <Button type="submit" className="flex-1" loading={loading}>
                        {loading ? 'Booking...' : 'Confirm Appointment'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Confirmation */}
            {step === 6 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary-900 mb-2">Appointment Booked!</h3>
                  <p className="text-secondary-500 mb-6">
                    Your appointment with Dr. {doctor?.full_name} has been confirmed.
                    You'll receive a confirmation via SMS and email.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/dashboard/patient">
                      <Button size="lg">View Dashboard</Button>
                    </Link>
                    <Link href="/doctors">
                      <Button variant="outline" size="lg">Book Another</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}