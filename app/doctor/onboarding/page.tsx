'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, ArrowRight, CheckCircle, Stethoscope, Building2, 
  Clock, User, GraduationCap, Briefcase, MapPin, Plus, Trash2, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const supabase = createClient()

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Specialty {
  id: string
  name: string
}

interface Hospital {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
}

export default function DoctorOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [specialties, setSpecialties] = React.useState<Specialty[]>([])
  const [hospitals, setHospitals] = React.useState<Hospital[]>([])
  const [error, setError] = React.useState('')

  const [formData, setFormData] = React.useState({
    // Step 1: Professional Details
    medical_registration_number: '',
    registration_council: '',
    qualifications: [] as string[],
    qualificationInput: '',
    specialization_id: '',
    
    // Step 2: Personal Details
    experience_years: 0,
    gender: 'male' as 'male' | 'female' | 'other',
    languages: [] as string[],
    languageInput: '',
    bio: '',
    consultation_fee: 0,
    
    // Step 3: Hospital Affiliations
    selectedHospitals: [] as string[],
    
    // Step 4: Availability
    availability: [] as Array<{
      day_of_week: number
      start_time: string
      end_time: string
      hospital_id: string
    }>,
  })

  React.useEffect(() => {
    checkUser()
    loadData()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login?role=doctor')
      return
    }
    setUserId(user.id)
  }

  const loadData = async () => {
    const [specialtiesRes, hospitalsRes] = await Promise.all([
      supabase.from('specialties').select('id, name').order('name'),
      supabase.from('hospitals').select('id, name, address, latitude, longitude').order('name'),
    ])
    if (specialtiesRes.data) setSpecialties(specialtiesRes.data)
    if (hospitalsRes.data) setHospitals(hospitalsRes.data)
  }

  const addQualification = () => {
    if (formData.qualificationInput.trim() && !formData.qualifications.includes(formData.qualificationInput.trim())) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, prev.qualificationInput.trim()],
        qualificationInput: '',
      }))
    }
  }

  const removeQualification = (q: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter(item => item !== q),
    }))
  }

  const addLanguage = () => {
    if (formData.languageInput.trim() && !formData.languages.includes(formData.languageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, prev.languageInput.trim()],
        languageInput: '',
      }))
    }
  }

  const removeLanguage = (l: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(item => item !== l),
    }))
  }

  const toggleHospital = (hospitalId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedHospitals: prev.selectedHospitals.includes(hospitalId)
        ? prev.selectedHospitals.filter(id => id !== hospitalId)
        : [...prev.selectedHospitals, hospitalId],
    }))
  }

  const addAvailability = () => {
    setFormData(prev => ({
      ...prev,
      availability: [
        ...prev.availability,
        { day_of_week: 1, start_time: '09:00', end_time: '17:00', hospital_id: prev.selectedHospitals[0] || '' },
      ],
    }))
  }

  const updateAvailability = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }))
  }

  const removeAvailability = (index: number) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!userId) return
    setLoading(true)
    setError('')

    try {
      // Create doctor profile
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .insert({
          user_id: userId,
          full_name: (await supabase.auth.getUser()).data.user?.user_metadata?.full_name || 'Doctor',
          medical_registration_number: formData.medical_registration_number,
          registration_council: formData.registration_council,
          qualifications: formData.qualifications,
          specialization_id: formData.specialization_id || null,
          experience_years: formData.experience_years,
          gender: formData.gender,
          languages: formData.languages,
          bio: formData.bio,
          consultation_fee: formData.consultation_fee,
          verification_status: 'pending',
          profile_completion_percentage: calculateCompletion(),
        })
        .select()
        .single()

      if (doctorError) throw doctorError

      // Add hospital affiliations
      if (formData.selectedHospitals.length > 0) {
        const hospitalInserts = formData.selectedHospitals.map(hospital_id => ({
          doctor_id: doctor.id,
          hospital_id,
        }))
        const { error: hospitalError } = await supabase.from('doctor_hospitals').insert(hospitalInserts)
        if (hospitalError) console.error('Error adding hospital affiliations:', hospitalError)
      }

      // Add availability
      if (formData.availability.length > 0) {
        const validSlots = formData.availability.filter(slot => slot.hospital_id)
        if (validSlots.length > 0) {
          const availabilityInserts = validSlots.map(slot => ({
            doctor_id: doctor.id,
            hospital_id: slot.hospital_id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: true,
          }))
          const { error: availError } = await supabase.from('availability').insert(availabilityInserts)
          if (availError) console.error('Error adding availability:', availError)
        }
      }

      // Update user role to doctor
      await supabase
        .from('users')
        .update({ role: 'doctor' })
        .eq('id', userId)

      router.push('/dashboard/doctor')
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const calculateCompletion = () => {
    let completed = 0
    let total = 8

    if (formData.medical_registration_number) completed++
    if (formData.registration_council) completed++
    if (formData.qualifications.length > 0) completed++
    if (formData.specialization_id) completed++
    if (formData.experience_years > 0) completed++
    if (formData.languages.length > 0) completed++
    if (formData.selectedHospitals.length > 0) completed++
    if (formData.availability.length > 0) completed++

    return Math.round((completed / total) * 100)
  }

  const steps = [
    { num: 1, label: 'Professional', icon: GraduationCap },
    { num: 2, label: 'Personal', icon: User },
    { num: 3, label: 'Hospitals', icon: Building2 },
    { num: 4, label: 'Schedule', icon: Clock },
  ]

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 sticky top-0 z-40">
        <div className="container">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary-900">MediNear</span>
            </Link>
            <div className="flex items-center gap-1">
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
                      <s.icon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline font-medium text-sm">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={cn(
                      'h-1 w-8 rounded transition-colors',
                      i < step - 1 ? 'bg-primary-600' : 'bg-secondary-200'
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-secondary-900">Complete Your Profile</h1>
              <span className="text-sm text-secondary-500">{calculateCompletion()}% complete</span>
            </div>
            <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 rounded-full transition-all"
                style={{ width: `${calculateCompletion()}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Professional Details */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Professional Details
                </CardTitle>
                <CardDescription>
                  Your medical registration and qualifications information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="reg_number">Medical Registration Number *</Label>
                  <Input
                    id="reg_number"
                    placeholder="e.g., MCI-12345"
                    value={formData.medical_registration_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, medical_registration_number: e.target.value }))}
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Your Medical Council of India or State Medical Council registration number
                  </p>
                </div>

                <div>
                  <Label htmlFor="council">Registration Council *</Label>
                  <Select
                    value={formData.registration_council}
                    onChange={(e) => setFormData(prev => ({ ...prev, registration_council: e.target.value }))}
                  >
                    <option value="">Select council</option>
                    <option value="MCI">Medical Council of India (MCI)</option>
                    <option value="Delhi Medical Council">Delhi Medical Council</option>
                    <option value="Maharashtra Medical Council">Maharashtra Medical Council</option>
                    <option value="Karnataka Medical Council">Karnataka Medical Council</option>
                    <option value="Tamil Nadu Medical Council">Tamil Nadu Medical Council</option>
                    <option value="Other">Other State Medical Council</option>
                  </Select>
                </div>

                <div>
                  <Label>Specialization</Label>
                  <Select
                    value={formData.specialization_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization_id: e.target.value }))}
                  >
                    <option value="">Select specialization</option>
                    {specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Qualifications *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., MBBS, MD (Cardiology)"
                      value={formData.qualificationInput}
                      onChange={(e) => setFormData(prev => ({ ...prev, qualificationInput: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                    />
                    <Button type="button" variant="outline" onClick={addQualification}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.qualifications.map(q => (
                      <Badge key={q} variant="outline" className="gap-1">
                        {q}
                        <button onClick={() => removeQualification(q)} className="ml-1 hover:text-red-600">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Details
                </CardTitle>
                <CardDescription>
                  Your professional background and consultation details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Experience (Years) *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.experience_years}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>Gender *</Label>
                    <Select
                      value={formData.gender}
                      onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Consultation Fee (₹) *</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 500"
                    value={formData.consultation_fee}
                    onChange={(e) => setFormData(prev => ({ ...prev, consultation_fee: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    This is the fee patients will see on your profile
                  </p>
                </div>

                <div>
                  <Label>Languages *</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., English, Hindi"
                      value={formData.languageInput}
                      onChange={(e) => setFormData(prev => ({ ...prev, languageInput: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                    />
                    <Button type="button" variant="outline" onClick={addLanguage}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.languages.map(l => (
                      <Badge key={l} variant="outline" className="gap-1">
                        {l}
                        <button onClick={() => removeLanguage(l)} className="ml-1 hover:text-red-600">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>About / Bio</Label>
                  <Textarea
                    placeholder="Tell patients about your approach, specialties, and experience..."
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Hospital Affiliations */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Hospital Affiliations
                </CardTitle>
                <CardDescription>
                  Select hospitals where you practice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-secondary-500">
                  You can add more hospitals later from your dashboard.
                </p>
                <div className="space-y-3">
                  {hospitals.map(hospital => (
                    <button
                      key={hospital.id}
                      onClick={() => toggleHospital(hospital.id)}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-colors',
                        formData.selectedHospitals.includes(hospital.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-secondary-200 hover:border-primary-300'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          formData.selectedHospitals.includes(hospital.id)
                            ? 'bg-primary-600 text-white'
                            : 'bg-secondary-100 text-secondary-600'
                        )}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-secondary-900">{hospital.name}</h4>
                          <p className="text-sm text-secondary-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {hospital.address}
                          </p>
                        </div>
                        {formData.selectedHospitals.includes(hospital.id) && (
                          <CheckCircle className="h-5 w-5 text-primary-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {hospitals.length === 0 && (
                  <div className="text-center py-8">
                    <Building2 className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                    <p className="text-secondary-500">No hospitals available. You can add them later.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Availability */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Weekly Schedule
                </CardTitle>
                <CardDescription>
                  Set your availability for patient bookings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.selectedHospitals.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                    <p className="text-secondary-500">Please select at least one hospital in the previous step</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {formData.availability.map((slot, index) => (
                        <div key={index} className="p-4 bg-secondary-50 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-secondary-900">Schedule {index + 1}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => removeAvailability(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div>
                              <Label className="text-xs">Day</Label>
                              <Select
                                value={slot.day_of_week.toString()}
                                onChange={(e) => updateAvailability(index, 'day_of_week', parseInt(e.target.value))}
                              >
                                {DAYS.map((day, i) => (
                                  <option key={i} value={i}>{day}</option>
                                ))}
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Start Time</Label>
                              <Input
                                type="time"
                                value={slot.start_time}
                                onChange={(e) => updateAvailability(index, 'start_time', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">End Time</Label>
                              <Input
                                type="time"
                                value={slot.end_time}
                                onChange={(e) => updateAvailability(index, 'end_time', e.target.value)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Hospital</Label>
                            <Select
                              value={slot.hospital_id}
                              onChange={(e) => updateAvailability(index, 'hospital_id', e.target.value)}
                            >
                              {hospitals
                                .filter(h => formData.selectedHospitals.includes(h.id))
                                .map(h => (
                                  <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" onClick={addAvailability} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Schedule Slot
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} className="flex-1">
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="flex-1" loading={loading}>
                {loading ? 'Submitting...' : 'Complete Registration'}
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-secondary-500 mt-6">
            You can skip for now and complete your profile later from the dashboard.
            <br />
            <Link href="/dashboard/doctor" className="text-primary-600 hover:underline">
              Skip for now →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}