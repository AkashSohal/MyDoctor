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
import { MapPin, Clock, Calendar, Stethoscope, Heart, Building2, Shield, CheckCircle, Star, Phone, Mail, ExternalLink, ArrowRight, Award, Languages, GraduationCap, Briefcase, Info, AlertCircle } from 'lucide-react'
import { Doctor } from '@/lib/types'
import { MapView } from '@/components/map/MapView'

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
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
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
      {/* Hero Section */}
      <div className="bg-white border-b border-secondary-200">
        <div className="container py-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <Avatar
              src={doctor.photo_url}
              fallback={doctor.full_name}
              size="2xl"
              className="lg:shrink-0"
            />
            
            <div className="flex-1">
              <div className="flex flex-wrap items-start gap-3 mb-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900">
                  Dr. {doctor.full_name}
                </h1>
                {doctor.verification_status === 'verified' && (
                  <Badge variant="success" className="gap-1.5 self-center">
                    <CheckCircle className="h-4 w-4" />
                    Verified Doctor
                  </Badge>
                )}
                {doctor.match_score && (
                  <Badge variant="default" className="gap-1.5 bg-primary-50 text-primary-700 border-primary-200 self-center">
                    <CheckCircle className="h-4 w-4" />
                    {doctor.match_score}% Match
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-secondary-600">
                <span className="flex items-center gap-1.5 font-medium text-secondary-900">
                  {doctor.specialization?.name || 'Specialist'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4" />
                  {doctor.experience_years} years experience
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" />
                  {doctor.qualifications?.join(', ') || 'MBBS'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <RatingStars rating={doctor.rating_average} size="md" showValue maxRating={5} />
                  <span className="text-sm text-secondary-500">({doctor.rating_count} reviews)</span>
                </div>
                {doctor.distance_km && (
                  <span className="flex items-center gap-1.5 text-sm text-secondary-600">
                    <MapPin className="h-4 w-4" />
                    {formatDistance(doctor.distance_km)} away
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-sm text-secondary-600">
                  <Stethoscope className="h-4 w-4" />
                  {formatCurrency(doctor.consultation_fee)} consultation
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {doctor.languages?.map((lang) => (
                  <Badge key={lang} variant="outline" size="sm">
                    <Languages className="h-3 w-3 mr-1" />
                    {lang}
                  </Badge>
                ))}
                {doctor.gender && (
                  <Badge variant="outline" size="sm">
                    {doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 lg:shrink-0">
              <Button size="lg" onClick={() => router.push(`/appointments/new?doctor=${doctor.id}`)} className="w-full lg:w-auto">
                Book Appointment
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                disabled={!doctor.latitude || !doctor.longitude}
                onClick={() => window.open(`https://maps.google.com/?daddr=${doctor.latitude},${doctor.longitude}`, '_blank')}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Get Directions
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
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-secondary-200 sticky top-16 z-40">
        <div className="container">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({doctor.rating_count})</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="container py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* About */}
            {doctor.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary-600 whitespace-pre-wrap">{doctor.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Qualifications */}
            {doctor.qualifications && doctor.qualifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {doctor.qualifications.map((qual, i) => (
                      <li key={i} className="flex items-center gap-2 text-secondary-600">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        {qual}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Registration Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Medical Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <dt className="text-secondary-500">Registration Number</dt>
                    <dd className="font-medium text-secondary-900 col-span-2">{doctor.medical_registration_number}</dd>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <dt className="text-secondary-500">Registration Council</dt>
                    <dd className="font-medium text-secondary-900 col-span-2">{doctor.registration_council}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Why This Doctor */}
            <Card className="bg-primary-50 border-primary-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary-600" />
                  Why This Doctor?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-secondary-700">Relevant specialist for your search</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-secondary-700">Verified doctor profile with valid medical registration</span>
                  </li>
                  {doctor.rating_count > 0 && (
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-secondary-700">
                        {(doctor.rating_average || 0).toFixed(1)} rating from {doctor.rating_count} verified patients
                      </span>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-secondary-700">{doctor.experience_years} years of relevant experience</span>
                  </li>
                  {getTodaysAvailability().length > 0 && (
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-secondary-700">Available today</span>
                    </li>
                  )}
                  {doctor.distance_km && (
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-secondary-700">{formatDistance(doctor.distance_km)} from your location</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-secondary-900">Weekly Schedule</h2>
              <Badge variant={getTodaysAvailability().some(a => isAvailableNow(a)) ? 'success' : 'outline'}>
                {getTodaysAvailability().some(a => isAvailableNow(a)) ? 'Available Now' : 'Not Available Now'}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {getUpcomingAvailability().map((slot) => {
                const hospital = doctor.hospitals?.find(h => h.id === slot.hospital_id)
                return (
                  <Card key={`${slot.day_of_week}-${slot.start_time}-${slot.hospital_id}`} className={isAvailableNow(slot) && slot.day_of_week === today ? 'ring-2 ring-green-500' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-secondary-900">{getDayName(slot.day_of_week)}</span>
                        {isAvailableNow(slot) && slot.day_of_week === today && (
                          <Badge variant="success" size="sm">Available Now</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-secondary-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {slot.start_time} - {slot.end_time}
                        </span>
                        {hospital && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {hospital.name}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {getUpcomingAvailability().length === 0 && (
                <div className="col-span-full text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                  <p className="text-secondary-500">No availability scheduled for this week</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'hospitals' && (
          <div className="space-y-4">
            {doctor.hospitals?.map((hospital) => (
              <Card key={hospital.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-secondary-900">{hospital.name}</h3>
                        <p className="text-secondary-500 text-sm">{hospital.address}</p>
                        {hospital.phone && (
                          <a href={`tel:${hospital.phone}`} className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1 mt-1">
                            <Phone className="h-4 w-4" />
                            {hospital.phone}
                          </a>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedHospital(hospital.id)}>
                        View Schedule
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(`https://maps.google.com/?daddr=${hospital.latitude},${hospital.longitude}`, '_blank')}>
                        <MapPin className="mr-1.5 h-4 w-4" />
                        Directions
                      </Button>
                      {hospital.website && (
                        <a href={hospital.website} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                            Website
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>

                  {selectedHospital === hospital.id && (
                    <div className="mt-4 pt-4 border-t border-secondary-200">
                      <h4 className="font-medium text-secondary-900 mb-3">Weekly Schedule at {hospital.name}</h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {doctor.availability
                          ?.filter(a => a.hospital_id === hospital.id && a.is_active)
                          .sort((a, b) => a.day_of_week - b.day_of_week)
                          .map((slot) => (
                            <div key={`${slot.day_of_week}-${slot.start_time}`} className="flex items-center justify-between p-3 rounded-lg bg-secondary-50">
                              <span className="font-medium text-secondary-900">{getDayName(slot.day_of_week)}</span>
                              <span className="text-secondary-600">{slot.start_time} - {slot.end_time}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {(!doctor.hospitals || doctor.hospitals.length === 0) && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="mx-auto h-12 w-12 text-secondary-300 mb-3" />
                  <p className="text-secondary-500">No hospital affiliations listed</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-secondary-900">Patient Reviews</h2>
              <Button variant="outline" size="sm">
                Write a Review
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="text-5xl font-bold text-secondary-900">{(doctor.rating_average || 0).toFixed(1)}</div>
                    <RatingStars rating={doctor.rating_average} size="lg" maxRating={5} />
                    <p className="text-secondary-500 mt-1">{doctor.rating_count} verified reviews</p>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {['Communication', 'Professionalism', 'Waiting Time', 'Overall Experience'].map((category) => (
                      <div key={category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-secondary-600">{category}</span>
                          <span className="font-medium text-secondary-900">{(doctor.rating_average || 0).toFixed(1)}</span>
                        </div>
                        <div className="h-2 bg-secondary-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-600 rounded-full transition-all"
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
              <p className="text-secondary-500 text-center py-8">
                Individual reviews would appear here. Patients can review after completed appointments.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div>
            <h2 className="text-xl font-semibold text-secondary-900 mb-4">Location & Directions</h2>
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