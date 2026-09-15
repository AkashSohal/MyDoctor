'use client'

import * as React from 'react'
import { formatDistance, formatCurrency, cn } from '@/lib/utils'
import { RatingStars } from '@/components/common/RatingStars'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { MapPin, Clock, Star, CheckCircle, Stethoscope, Heart, ExternalLink, Phone, MapPin as MapPinIcon } from 'lucide-react'
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

  const getSpecialtyIcon = (specialtyId?: string) => {
    const icons: Record<string, React.ReactNode> = {
      'cardiologist': <Heart className="h-4 w-4" />,
      'dermatologist': <Star className="h-4 w-4" />,
      'orthopedic': <Stethoscope className="h-4 w-4" />,
      'pediatrician': <Heart className="h-4 w-4" />,
    }
    return icons[specialtyId || ''] || <Stethoscope className="h-4 w-4" />
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border border-secondary-200 bg-white hover:shadow-soft transition-shadow">
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
          <Button variant="ghost" size="sm" onClick={onViewProfile}>
            View
          </Button>
        )}
      </div>
    )
  }

  if (variant === 'map') {
    return (
      <div className="w-64 p-3">
        <Card>
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
    <Card className="overflow-hidden transition-all hover:shadow-soft">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar 
            src={doctor.photo_url} 
            fallback={doctor.full_name} 
            size="lg" 
            className="shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-secondary-900">{doctor.full_name}</h3>
                {doctor.verification_status === 'verified' && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {matchScore && (
                  <Badge variant="default" className="gap-1 bg-primary-50 text-primary-700 border-primary-200">
                    <CheckCircle className="h-3 w-3" />
                    {matchScore}% Match
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-sm text-secondary-500">
                <RatingStars rating={doctor.rating_average} size="sm" showValue maxRating={5} />
                <span>({doctor.rating_count} reviews)</span>
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-secondary-600">
              <span className="flex items-center gap-1 font-medium text-secondary-900">
                {getSpecialtyIcon(doctor.specialization?.id)}
                {doctor.specialization?.name || 'Specialist'}
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="h-4 w-4" />
                {doctor.experience_years} years exp
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {distance ? formatDistance(distance) : 'Distance unknown'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                ₹{doctor.consultation_fee}
              </span>
            </div>

            {doctor.hospitals && doctor.hospitals.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {doctor.hospitals.slice(0, 2).map((hospital) => (
                  <Badge key={hospital.id} variant="outline" size="sm">
                    {hospital.name}
                  </Badge>
                ))}
                {doctor.hospitals.length > 2 && (
                  <Badge variant="outline" size="sm">
                    +{doctor.hospitals.length - 2} more
                  </Badge>
                )}
              </div>
            )}

            {doctor.bio && (
              <p className="mt-3 text-sm text-secondary-500 line-clamp-2">{doctor.bio}</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {onViewProfile && (
            <Button variant="outline" size="sm" onClick={onViewProfile} className="flex-1 sm:flex-none">
              View Profile
            </Button>
          )}
          {onViewAvailability && (
            <Button variant="outline" size="sm" onClick={onViewAvailability} className="flex-1 sm:flex-none">
              <Clock className="mr-1.5 h-4 w-4" />
              Availability
            </Button>
          )}
          {onGetDirections && (
            <Button variant="outline" size="sm" onClick={onGetDirections} className="flex-1 sm:flex-none">
              <MapPinIcon className="mr-1.5 h-4 w-4" />
              Directions
            </Button>
          )}
          {onCall && (
            <Button variant="outline" size="sm" onClick={onCall} className="flex-1 sm:flex-none">
              <Phone className="mr-1.5 h-4 w-4" />
              Call
            </Button>
          )}
          {onBookAppointment && (
            <Button size="sm" onClick={onBookAppointment} className="flex-1 sm:flex-none ml-auto">
              Book Appointment
            </Button>
          )}
          {showCompare && onCompare && (
            <Button
              variant={compared ? 'default' : 'outline'}
              size="sm"
              onClick={onCompare}
              className="flex-1 sm:flex-none"
            >
              {compared ? 'Compared' : 'Compare'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}