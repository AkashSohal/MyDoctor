'use client'

import * as React from 'react'
import { formatDistance, formatCurrency, cn } from '@/lib/utils'
import { RatingStars } from '@/components/common/RatingStars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { MapPin, Clock, Star, CheckCircle, Stethoscope, Heart, Phone, Calendar, ArrowRight } from 'lucide-react'
import { Doctor } from '@/lib/types'

interface DoctorCardProps {
  doctor: Doctor
  userLocation?: { latitude: number; longitude: number } | { lat: number; lng: number } | null
  onViewProfile?: () => void
  onViewAvailability?: () => void
  onGetDirections?: () => void
  onCall?: () => void
  onBookAppointment?: () => void
  onCompare?: () => void
  showCompare?: boolean
  compared?: boolean
  variant?: 'default' | 'compact' | 'map'
}

export function DoctorCard({
  doctor,
  userLocation,
  onViewProfile,
  onViewAvailability,
  onGetDirections,
  onCall,
  onBookAppointment,
  onCompare,
  showCompare = false,
  compared = false,
  variant = 'default',
}: DoctorCardProps) {
  const distance = doctor.distance_km
  const matchScore = doctor.match_score

  const isAvailableToday = doctor.availability?.some(a => {
    const today = new Date().getDay()
    return a.day_of_week === today && a.is_active
  })

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-secondary-200 bg-white hover:shadow-soft transition-all duration-300 group">
        <Avatar src={doctor.photo_url} fallback={doctor.full_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-secondary-900 truncate">{doctor.full_name}</h3>
            {doctor.verification_status === 'verified' && (
              <Badge variant="success" size="sm">Verified</Badge>
            )}
          </div>
          <p className="text-sm text-secondary-500 truncate">{doctor.specialization?.name || 'Specialist'}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-secondary-500">
            {doctor.rating_average > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {doctor.rating_average.toFixed(1)} ({doctor.rating_count})
              </span>
            )}
            {distance && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {formatDistance(distance)}
              </span>
            )}
          </div>
        </div>
        {onViewProfile && (
          <Button variant="ghost" size="sm" onClick={onViewProfile} className="opacity-0 group-hover:opacity-100 transition-opacity">
            View
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'map') {
    return (
      <div className="w-64 p-3">
        <Card className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Avatar src={doctor.photo_url} fallback={doctor.full_name} size="md" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-secondary-900 truncate">{doctor.full_name}</h3>
                <p className="text-sm text-secondary-500 truncate">{doctor.specialization?.name || 'Specialist'}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-secondary-500">
                  {doctor.rating_average > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                      {doctor.rating_average.toFixed(1)}
                    </span>
                  )}
                  {distance && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {formatDistance(distance)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {matchScore && (
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <Badge variant="default" size="sm" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {matchScore}% Match
                </Badge>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              {onViewProfile && (
                <Button variant="outline" size="sm" className="flex-1" onClick={onViewProfile}>
                  View Profile
                </Button>
              )}
              {onGetDirections && (
                <Button variant="default" size="sm" className="flex-1" onClick={onGetDirections}>
                  Directions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-card-hover group border-0 shadow-card">
      {/* Verification status top border */}
      <div className={cn(
        'h-1 w-full',
        doctor.verification_status === 'verified' 
          ? 'bg-gradient-to-r from-primary-500 to-teal-500' 
          : doctor.verification_status === 'pending'
          ? 'bg-gradient-to-r from-amber-400 to-orange-400'
          : 'bg-gradient-to-r from-secondary-300 to-secondary-400'
      )} />
      
      <CardContent className="p-6">
        <div className="flex items-start gap-5">
          {/* Doctor Avatar */}
          <div className="relative shrink-0">
            <Avatar 
              src={doctor.photo_url} 
              fallback={doctor.full_name} 
              size="xl" 
              className="ring-4 ring-secondary-100 group-hover:ring-primary-100 transition-all duration-300"
            />
            {isAvailableToday && (
              <div className="absolute -bottom-1 -right-1 flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full shadow-md">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                Available
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Name and badges */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors">
                Dr. {doctor.full_name}
              </h3>
              {doctor.verification_status === 'verified' && (
                <Badge variant="success" className="gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
              {matchScore && (
                <Badge variant="default" className="gap-1 bg-gradient-to-r from-primary-500 to-teal-500 text-white border-0">
                  {matchScore}% Match
                </Badge>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <RatingStars rating={doctor.rating_average} size="sm" showValue maxRating={5} />
              <span className="text-sm text-secondary-500">
                ({doctor.rating_count} reviews)
              </span>
            </div>

            {/* Info chips */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium">
                <Stethoscope className="h-4 w-4" />
                {doctor.specialization?.name || 'Specialist'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-100 text-secondary-700 text-sm">
                {doctor.experience_years} years exp
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-100 text-secondary-700 text-sm">
                ₹{doctor.consultation_fee}
              </span>
              {distance && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-100 text-secondary-700 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  {formatDistance(distance)}
                </span>
              )}
            </div>

            {/* Hospitals */}
            {doctor.hospitals && doctor.hospitals.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {doctor.hospitals.slice(0, 2).map((hospital) => (
                  <span key={hospital.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary-100 text-secondary-700 text-sm">
                    {hospital.name}
                  </span>
                ))}
                {doctor.hospitals.length > 2 && (
                  <span className="text-sm text-secondary-500">
                    +{doctor.hospitals.length - 2} more
                  </span>
                )}
              </div>
            )}

            {/* Bio */}
            {doctor.bio && (
              <p className="text-sm text-secondary-500 line-clamp-2 mb-4">{doctor.bio}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-secondary-100">
          {onViewProfile && (
            <Button variant="outline" size="sm" onClick={onViewProfile} className="gap-1.5">
              View Profile
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
          {onViewAvailability && (
            <Button variant="outline" size="sm" onClick={onViewAvailability} className="gap-1.5">
              <Calendar className="h-4 w-4" />
              Availability
            </Button>
          )}
          {onGetDirections && (
            <Button variant="outline" size="sm" onClick={onGetDirections} className="gap-1.5">
              <MapPin className="h-4 w-4" />
              Directions
            </Button>
          )}
          {onCall && (
            <Button variant="outline" size="sm" onClick={onCall} className="gap-1.5">
              <Phone className="h-4 w-4" />
              Call
            </Button>
          )}
          {onBookAppointment && (
            <Button 
              size="sm" 
              onClick={onBookAppointment} 
              className="gap-1.5 ml-auto bg-gradient-to-r from-primary-600 to-teal-600 hover:from-primary-700 hover:to-teal-700 shadow-md hover:shadow-glow transition-all duration-300"
            >
              <Calendar className="h-4 w-4" />
              Book Appointment
            </Button>
          )}
          {showCompare && onCompare && (
            <Button
              variant={compared ? 'default' : 'outline'}
              size="sm"
              onClick={onCompare}
              className="gap-1.5"
            >
              {compared ? 'Compared' : 'Compare'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
