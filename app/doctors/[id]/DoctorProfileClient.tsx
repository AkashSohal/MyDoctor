'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDistance, cn } from '@/lib/utils'
import { RatingStars } from '@/components/common/RatingStars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MapPin, Clock, Calendar, Stethoscope, Heart, Building2, Shield, CheckCircle, Star, Phone, Mail, ExternalLink, ArrowRight, Award, Languages, GraduationCap, Briefcase, Info, AlertCircle, Share2, Bookmark } from 'lucide-react'
import { Doctor } from '@/lib/types'
import { MapView } from '@/components/map/MapView'
import { ScrollReveal } from '@/components/common/ScrollReveal'

interface DoctorProfileClientProps {
  doctor: Doctor
}

export function DoctorProfileClient({ doctor }: DoctorProfileClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState('overview')
  const [selectedHospital, setSelectedHospital] = React.useState<string | null>(null)

  const today = new Date().getDay()
  const currentTime = new Date().toTimeString().slice(0, 5)

  const getTodaysAvailability = () => {
    return doctor.availability?.filter(a => a.day_of_week === today && a.is_active) || []
  }

  const getUpcomingAvailability = () => {
    return doctor.availability?.filter(a => a.is_active).sort((a, b) => {
      const dayDiff = (a.day_of_week - today + 7) % 7 - (b.day_of_week - today + 7) % 7
      if (dayDiff !== 0) return dayDiff
      return a.start_time.localeCompare(b.start_time)
    }) || []
  }

  const isAvailableNow = (availability: any) => {
    return availability.start_time <= currentTime && availability.end_time >= currentTime
  }

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[day] || ''
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-teal-600">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-teal-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-10" />
        </div>

        <div className="relative z-10 container py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar
                src={doctor.photo_url}
                fallback={doctor.full_name}
                size="2xl"
                className="ring-4 ring-white/20 shadow-xl"
              />
              {getTodaysAvailability().some(a => isAvailableNow(a)) && (
                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Available Now
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 text-white">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  Dr. {doctor.full_name}
                </h1>
                {doctor.verification_status === 'verified' && (
                  <Badge className="gap-1.5 bg-white/20 backdrop-blur-sm text-white border-white/30">
                    <CheckCircle className="h-4 w-4" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-white/90">
                <span className="flex items-center gap-1.5 font-medium">
                  <Stethoscope className="h-4 w-4" />
                  {doctor.specialization?.name || 'Specialist'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4" />
                  {doctor.experience_years} years exp
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {doctor.qualifications?.join(', ') || 'MBBS'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <RatingStars rating={doctor.rating_average} size="md" showValue maxRating={5} />
                  <span className="text-white/80 text-sm">({doctor.rating_count} reviews)</span>
                </div>
                {doctor.distance_km && (
                  <span className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-sm">
                    <MapPin className="h-4 w-4" />
                    {formatDistance(doctor.distance_km)} away
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-white/90 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl text-sm font-semibold">
                  ₹{doctor.consultation_fee}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {doctor.languages?.map((lang) => (
                  <span key={lang} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm">
                    <Languages className="h-3 w-3" />
                    {lang}
                  </span>
                ))}
                {doctor.gender && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm">
                    {doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 lg:shrink-0">
              <Button 
                size="lg" 
                onClick={() => router.push(`/appointments/new?doctor=${doctor.id}`)} 
                className="w-full lg:w-auto bg-white text-primary-600 hover:bg-primary-50 shadow-lg hover:shadow-xl transition-all duration-300 btn-shine font-semibold"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Book Appointment
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                disabled={!doctor.latitude || !doctor.longitude}
                onClick={() => window.open(`https://maps.google.com/?daddr=${doctor.latitude},${doctor.longitude}`, '_blank')}
                className="border-white/30 text-white hover:bg-white/10"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Directions
              </Button>
              <Button 
                size="lg" 
                variant="ghost" 
                disabled={!doctor.hospitals?.[0]?.phone}
                onClick={() => {
                  const phone = doctor.hospitals?.[0]?.phone || ''
                  const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`
                  window.open(`tel:${formattedPhone}`, '_self')
                }}
                className="text-white hover:bg-white/10"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-secondary-200 sticky top-16 z-40 shadow-sm">
        <div className="container">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5 h-14 bg-transparent">
              {['overview', 'availability', 'hospitals', 'reviews', 'map'].map((tab) => (
                <TabsTrigger 
                  key={tab} 
                  value={tab} 
                  className={cn(
                    'capitalize rounded-none border-b-2 transition-all duration-200 font-medium',
                    activeTab === tab 
                      ? 'border-primary-600 text-primary-600 bg-transparent' 
                      : 'border-transparent text-secondary-500 hover:text-secondary-900 bg-transparent'
                  )}
                >
                  {tab === 'reviews' ? `Reviews (${doctor.rating_count})` : tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-4xl">
            <ScrollReveal>
              {/* About */}
              {doctor.bio && (
                <Card className="border-0 shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 rounded-xl bg-primary-100">
                        <Info className="h-5 w-5 text-primary-600" />
                      </div>
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-secondary-600 leading-relaxed whitespace-pre-wrap">{doctor.bio}</p>
                  </CardContent>
                </Card>
              )}
            </ScrollReveal>

            <ScrollReveal delay={100}>
              {/* Qualifications */}
              {doctor.qualifications && doctor.qualifications.length > 0 && (
                <Card className="border-0 shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 rounded-xl bg-blue-100">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                      </div>
                      Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {doctor.qualifications.map((qual, i) => (
                        <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-secondary-700 font-medium">{qual}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </ScrollReveal>

            <ScrollReveal delay={200}>
              {/* Registration Details */}
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-xl bg-purple-100">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                    </div>
                    Medical Registration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-xl bg-secondary-50">
                      <p className="text-sm text-secondary-500 mb-1">Registration Number</p>
                      <p className="font-semibold text-secondary-900">{doctor.medical_registration_number}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary-50">
                      <p className="text-sm text-secondary-500 mb-1">Registration Council</p>
                      <p className="font-semibold text-secondary-900">{doctor.registration_council}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              {/* Why This Doctor */}
              <Card className="border-0 shadow-card bg-gradient-to-br from-primary-50 to-teal-50 border-primary-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-xl bg-primary-100">
                      <Heart className="h-5 w-5 text-primary-600" />
                    </div>
                    Why This Doctor?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 p-3 rounded-xl bg-white/60">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-secondary-700">Relevant specialist for your search</span>
                    </li>
                    <li className="flex items-start gap-3 p-3 rounded-xl bg-white/60">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-secondary-700">Verified doctor profile with valid medical registration</span>
                    </li>
                    {doctor.rating_count > 0 && (
                      <li className="flex items-start gap-3 p-3 rounded-xl bg-white/60">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary-700">
                          {(doctor.rating_average || 0).toFixed(1)} rating from {doctor.rating_count} verified patients
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-3 p-3 rounded-xl bg-white/60">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-secondary-700">{doctor.experience_years} years of relevant experience</span>
                    </li>
                    {getTodaysAvailability().length > 0 && (
                      <li className="flex items-start gap-3 p-3 rounded-xl bg-white/60">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary-700">Available today</span>
                      </li>
                    )}
                    {doctor.distance_km && (
                      <li className="flex items-start gap-3 p-3 rounded-xl bg-white/60">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-secondary-700">{formatDistance(doctor.distance_km)} from your location</span>
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-secondary-900">Weekly Schedule</h2>
              <Badge 
                variant={getTodaysAvailability().some(a => isAvailableNow(a)) ? 'success' : 'outline'}
                className="gap-1.5"
              >
                {getTodaysAvailability().some(a => isAvailableNow(a)) && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
                {getTodaysAvailability().some(a => isAvailableNow(a)) ? 'Available Now' : 'Not Available Now'}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {getUpcomingAvailability().map((slot) => {
                const hospital = doctor.hospitals?.find(h => h.id === slot.hospital_id)
                const isNow = isAvailableNow(slot) && slot.day_of_week === today
                return (
                  <Card 
                    key={`${slot.day_of_week}-${slot.start_time}-${slot.hospital_id}`} 
                    className={cn(
                      'border-0 shadow-card transition-all duration-300',
                      isNow && 'ring-2 ring-green-500 shadow-glow'
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-secondary-900 text-lg">{getDayName(slot.day_of_week)}</span>
                        {isNow && (
                          <Badge className="gap-1 bg-green-500 text-white border-0">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            Live
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-secondary-600">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-100 text-sm">
                          <Clock className="h-4 w-4 text-primary-600" />
                          {slot.start_time} - {slot.end_time}
                        </span>
                        {hospital && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-100 text-sm">
                            <Building2 className="h-4 w-4 text-primary-600" />
                            {hospital.name}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {getUpcomingAvailability().length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-secondary-100 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-secondary-400" />
                  </div>
                  <p className="text-secondary-500">No availability scheduled for this week</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'hospitals' && (
          <div className="space-y-4 max-w-4xl">
            {doctor.hospitals?.map((hospital) => (
              <Card key={hospital.id} className="border-0 shadow-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Building2 className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-secondary-900 text-lg">{hospital.name}</h3>
                          <p className="text-secondary-500 text-sm">{hospital.address}</p>
                          {hospital.phone && (
                            <a href={`tel:${hospital.phone}`} className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1 mt-2 font-medium">
                              <Phone className="h-4 w-4" />
                              {hospital.phone}
                            </a>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedHospital(selectedHospital === hospital.id ? null : hospital.id)} className="gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {selectedHospital === hospital.id ? 'Hide Schedule' : 'View Schedule'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(`https://maps.google.com/?daddr=${hospital.latitude},${hospital.longitude}`, '_blank')} className="gap-1.5">
                          <MapPin className="h-4 w-4" />
                          Directions
                        </Button>
                      </div>
                    </div>
                  </div>

                  {selectedHospital === hospital.id && (
                    <div className="border-t border-secondary-100 p-5 bg-secondary-50">
                      <h4 className="font-medium text-secondary-900 mb-4">Weekly Schedule at {hospital.name}</h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {doctor.availability
                          ?.filter(a => a.hospital_id === hospital.id && a.is_active)
                          .sort((a, b) => a.day_of_week - b.day_of_week)
                          .map((slot) => (
                            <div key={`${slot.day_of_week}-${slot.start_time}`} className="flex items-center justify-between p-3 rounded-xl bg-white">
                              <span className="font-medium text-secondary-900">{getDayName(slot.day_of_week)}</span>
                              <span className="text-secondary-600 text-sm">{slot.start_time} - {slot.end_time}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {(!doctor.hospitals || doctor.hospitals.length === 0) && (
              <Card className="border-0 shadow-card">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary-100 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-secondary-400" />
                  </div>
                  <p className="text-secondary-500">No hospital affiliations listed</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-secondary-900">Patient Reviews</h2>
              <Button variant="outline" size="sm" className="gap-1.5">
                Write a Review
              </Button>
            </div>

            <Card className="border-0 shadow-card overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary-500 to-teal-500" />
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="text-5xl font-bold text-secondary-900 mb-2">{(doctor.rating_average || 0).toFixed(1)}</div>
                    <RatingStars rating={doctor.rating_average} size="lg" maxRating={5} />
                    <p className="text-secondary-500 mt-2">{doctor.rating_count} verified reviews</p>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {['Communication', 'Professionalism', 'Waiting Time', 'Overall Experience'].map((category) => (
                      <div key={category}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-secondary-600">{category}</span>
                          <span className="font-semibold text-secondary-900">{(doctor.rating_average || 0).toFixed(1)}</span>
                        </div>
                        <div className="h-2.5 bg-secondary-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(0, Math.min(100, (doctor.rating_average || 0) / 5 * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <p className="text-secondary-500 text-center py-12">
                Individual reviews would appear here. Patients can review after completed appointments.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="max-w-4xl">
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Location & Directions</h2>
            <Card className="border-0 shadow-card overflow-hidden">
              <MapView
                doctors={[doctor]}
                userLocation={null}
                hospitals={(doctor.hospitals || []).filter(h => h.latitude && h.longitude).map(h => ({
                  id: h.id,
                  name: h.name,
                  latitude: h.latitude!,
                  longitude: h.longitude!,
                }))}
                selectedDoctorId={doctor.id}
                onDoctorClick={() => {}}
                height="500px"
              />
            </Card>
          </div>
        )}
      </div>

      {/* Medical Disclaimer */}
      <div className="bg-secondary-100 border-t border-secondary-200 py-6">
        <div className="container">
          <p className="text-sm text-secondary-600 text-center max-w-4xl mx-auto">
            <strong className="text-secondary-900">Disclaimer:</strong> Information on MediNear is for discovery purposes only. 
            Please verify doctor credentials, availability, consultation fees, and hospital details directly with the provider before visiting. 
            MediNear does not guarantee appointment availability or medical outcomes.
          </p>
        </div>
      </div>
    </div>
  )
}
