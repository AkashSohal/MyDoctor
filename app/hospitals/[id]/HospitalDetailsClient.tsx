'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Building2, MapPin, Phone, Mail, Globe, Users, Stethoscope, ArrowRight,
  Navigation, CheckCircle, BadgeCheck, GraduationCap, Award, Star, Calendar,
  ExternalLink, Info,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { RatingStars } from '@/components/common/RatingStars'
import { ScrollReveal } from '@/components/common/ScrollReveal'
import { cn, formatCurrency } from '@/lib/utils'
import { formatDoctorName, formatExperienceYears } from '@/lib/utils/doctor'

export interface HospitalDoctor {
  id: string
  full_name: string
  photo_url?: string | null
  bio?: string | null
  qualifications?: string[] | null
  experience_years: number
  languages?: string[] | null
  consultation_fee: number
  rating_average: number
  rating_count: number
  specialization_id?: string | null
  specialization?: { id: string; name: string; description?: string } | { id: string; name: string; description?: string }[] | null
}

export interface HospitalDetails {
  id: string
  name: string
  address: string
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  website?: string | null
  email?: string | null
  verification_status?: string | null
  doctors: HospitalDoctor[]
}

function getSpecialization(doctor: HospitalDoctor) {
  if (Array.isArray(doctor.specialization)) return doctor.specialization[0]
  return doctor.specialization
}

function getSpecialties(doctors: HospitalDoctor[]) {
  const seen = new Map<string, string>()
  for (const doctor of doctors) {
    const spec = getSpecialization(doctor)
    if (spec?.name && !seen.has(spec.id)) seen.set(spec.id, spec.name)
  }
  return Array.from(seen, ([id, name]) => ({ id, name }))
}

function directionsUrl(hospital: HospitalDetails): string | null {
  if (hospital.latitude && hospital.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`
  }
  if (hospital.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.address)}`
  }
  return null
}

interface HospitalDetailsClientProps {
  hospital: HospitalDetails
}

export function HospitalDetailsClient({ hospital }: HospitalDetailsClientProps) {
  const doctors = hospital.doctors ?? []
  const specialties = getSpecialties(doctors)
  const directions = directionsUrl(hospital)
  const website = hospital.website?.startsWith('http') ? hospital.website : hospital.website ? `https://${hospital.website}` : null

  const featuredDoctor = doctors[0]
  const bookingHref = featuredDoctor
    ? `/appointments/new?doctor=${featuredDoctor.id}`
    : `/doctors?hospital_id=${encodeURIComponent(hospital.id)}`

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-teal-600">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-teal-500/20 blur-3xl" />
        </div>

        <div className="relative z-10 container py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Hospital icon */}
            <div className="relative shrink-0">
              <div className="h-24 w-24 rounded-2xl bg-white/15 backdrop-blur-sm ring-4 ring-white/20 shadow-xl flex items-center justify-center text-white">
                <Building2 className="h-12 w-12" />
              </div>
              {doctors.length > 0 && (
                <div className="absolute -bottom-1 -right-1 flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Active
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-white">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">{hospital.name}</h1>
                {(hospital.verification_status
                  ? hospital.verification_status === 'verified'
                  : doctors.length > 0) && (
                  <Badge
                    className="gap-1.5 bg-white/20 backdrop-blur-sm text-white border-white/30"
                    title={
                      hospital.verification_status
                        ? 'This facility is verified by MyDoctor'
                        : 'Doctors at this facility are verified on MyDoctor'
                    }
                  >
                    <BadgeCheck className="h-4 w-4" />
                    Verified Facility
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-white/90">
                <span className="flex items-start gap-1.5 font-medium">
                  <MapPin className="h-4 w-4 mt-1 shrink-0" />
                  {hospital.address}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {doctors.length} {doctors.length === 1 ? 'doctor' : 'doctors'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 lg:shrink-0 w-full sm:w-auto sm:min-w-[240px]">
              <Button
                size="lg"
                asChild
                className="w-full bg-white text-primary-600 hover:bg-primary-50 shadow-lg hover:shadow-xl transition-all duration-300 btn-shine font-semibold"
              >
                <Link href={bookingHref}>
                  <Calendar className="h-5 w-5 mr-2" />
                  Book Appointment
                </Link>
              </Button>
              {directions && (
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full bg-transparent border-white/30 text-white hover:bg-white/10"
                >
                  <a href={directions} target="_blank" rel="noopener noreferrer">
                    <Navigation className="mr-2 h-4 w-4" />
                    Get Directions
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            <ScrollReveal>
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-xl bg-primary-100">
                      <Info className="h-5 w-5 text-primary-600" />
                    </div>
                    About Hospital
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-secondary-600 leading-relaxed">
                    {hospital.name} is listed on MyDoctor, serving patients from
                    {' '}{hospital.address}. Contact the facility directly using the details below
                    or book an appointment with one of its verified doctors.
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>

            {specialties.length > 0 && (
              <ScrollReveal delay={100}>
                <Card className="border-0 shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <div className="p-2 rounded-xl bg-teal-100">
                        <Stethoscope className="h-5 w-5 text-teal-600" />
                      </div>
                      Specialties Offered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((spec) => (
                        <Link
                          key={spec.id}
                          href={`/doctors?specialty=${encodeURIComponent(spec.name)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-50 text-sm font-medium text-secondary-700 transition-colors hover:bg-primary-50 hover:text-primary-700"
                        >
                          <Stethoscope className="h-3.5 w-3.5" />
                          {spec.name}
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            {/* Doctors */}
            <ScrollReveal delay={200}>
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-xl bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    Doctors at {hospital.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {doctors.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-10 w-10 text-secondary-300 mb-3" />
                      <p className="font-medium text-secondary-900 mb-1">No verified doctors listed yet</p>
                      <p className="text-sm text-secondary-500 mb-4">
                        Doctors appear here once their profiles are verified on MyDoctor.
                      </p>
                      <Button variant="outline" asChild>
                        <Link href="/doctors">
                          Browse all doctors
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {doctors.map((doctor) => {
                        const spec = getSpecialization(doctor)
                        return (
                          <li
                            key={doctor.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-secondary-100 bg-secondary-50/50 transition-colors hover:border-primary-200 hover:bg-primary-50/30"
                          >
                            <Avatar
                              src={doctor.photo_url}
                              fallback={doctor.full_name}
                              size="xl"
                              className="ring-2 ring-white shadow-md"
                            />
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/doctors/${doctor.id}`}
                                className="font-semibold text-secondary-900 hover:text-primary-600 transition-colors"
                              >
                                {formatDoctorName(doctor.full_name)}
                              </Link>
                              <p className="text-sm text-secondary-500 mt-0.5">
                                {spec?.name || 'Specialist'}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-secondary-500">
                                <span className="flex items-center gap-1">
                                  <Award className="h-3.5 w-3.5" />
                                  {formatExperienceYears(doctor.experience_years)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="h-3.5 w-3.5" />
                                  {doctor.qualifications?.join(', ') || 'MBBS'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5" />
                                  <RatingStars rating={doctor.rating_average} size="sm" showValue maxRating={5} />
                                  {doctor.rating_count > 0 && (
                                    <span className="text-secondary-400">({doctor.rating_count})</span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 justify-between shrink-0">
                              <span className="text-sm font-semibold text-secondary-900">
                                {formatCurrency(doctor.consultation_fee)}
                              </span>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={`/doctors/${doctor.id}`}>Profile</Link>
                                </Button>
                                <Button size="sm" asChild>
                                  <Link href={`/appointments/new?doctor=${doctor.id}`}>Book</Link>
                                </Button>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ScrollReveal delay={100}>
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 rounded-xl bg-red-100">
                      <Phone className="h-5 w-5 text-red-600" />
                    </div>
                    Contact Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary-50">
                    <MapPin className="h-4 w-4 mt-0.5 text-secondary-400 shrink-0" />
                    <div>
                      <p className="text-sm text-secondary-500 mb-0.5">Address</p>
                      <p className="text-sm font-medium text-secondary-900">{hospital.address}</p>
                    </div>
                  </div>
                  {hospital.phone && (
                    <a href={`tel:${hospital.phone}`} className="flex items-start gap-3 p-3 rounded-xl bg-secondary-50 transition-colors hover:bg-primary-50">
                      <Phone className="h-4 w-4 mt-0.5 text-secondary-400 shrink-0" />
                      <div>
                        <p className="text-sm text-secondary-500 mb-0.5">Phone</p>
                        <p className="text-sm font-medium text-secondary-900">{hospital.phone}</p>
                      </div>
                    </a>
                  )}
                  {hospital.email && (
                    <a href={`mailto:${hospital.email}`} className="flex items-start gap-3 p-3 rounded-xl bg-secondary-50 transition-colors hover:bg-primary-50">
                      <Mail className="h-4 w-4 mt-0.5 text-secondary-400 shrink-0" />
                      <div>
                        <p className="text-sm text-secondary-500 mb-0.5">Email</p>
                        <p className="text-sm font-medium text-secondary-900 break-all">{hospital.email}</p>
                      </div>
                    </a>
                  )}
                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-xl bg-secondary-50 transition-colors hover:bg-primary-50">
                      <Globe className="h-4 w-4 mt-0.5 text-secondary-400 shrink-0" />
                      <div>
                        <p className="text-sm text-secondary-500 mb-0.5">Website</p>
                        <p className="text-sm font-medium text-primary-600 truncate">{hospital.website}</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 mt-1 text-secondary-400 shrink-0" />
                    </a>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>

            {directions && (
              <ScrollReveal delay={200}>
                <Card className="border-0 shadow-card">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-xl bg-green-100">
                        <Navigation className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-secondary-900">Location</h3>
                    </div>
                    <p className="text-sm text-secondary-500 mb-4">
                      {hospital.address}
                    </p>
                    <Button variant="outline" className="w-full" asChild>
                      <a href={directions} target="_blank" rel="noopener noreferrer">
                        <Navigation className="mr-2 h-4 w-4" />
                        Open in Google Maps
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </ScrollReveal>
            )}

            <ScrollReveal delay={300}>
              <Card className="border-0 shadow-card bg-gradient-to-br from-primary-50 to-teal-50 border-primary-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-primary-100">
                      <CheckCircle className="h-5 w-5 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-secondary-900">Why book here?</h3>
                  </div>
                  <ul className="space-y-2 text-sm text-secondary-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      Doctors verified by the MyDoctor team
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      Real availability, updated by doctors
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      No hidden booking charges
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/hospitals"
            className={cn('inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 hover:underline')}
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Back to all hospitals
          </Link>
        </div>
      </div>
    </div>
  )
}
