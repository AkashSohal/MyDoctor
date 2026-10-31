'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { geocodeLocation } from '@/lib/utils/geocode'
import { Search, MapPin, Loader2, Crosshair, AlertCircle } from 'lucide-react'

export interface SearchPanelSpecialty {
  id: string
  name: string
}

interface SearchPanelProps {
  specialties: SearchPanelSpecialty[]
  className?: string
}

type GeoStatus = 'idle' | 'locating' | 'granted' | 'unavailable'

export function SearchPanel({ specialties, className }: SearchPanelProps) {
  const router = useRouter()
  const [locationText, setLocationText] = React.useState('')
  const [query, setQuery] = React.useState('')
  const [specialty, setSpecialty] = React.useState('')
  const [coordinates, setCoordinates] = React.useState<{ lat: number; lng: number } | null>(null)
  const [geoStatus, setGeoStatus] = React.useState<GeoStatus>('idle')
  const [geoMessage, setGeoMessage] = React.useState<string | null>(null)
  const [locationError, setLocationError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable')
      setGeoMessage('This browser does not support location sharing. Enter a city, area, or PIN code instead.')
      return
    }

    setGeoStatus('locating')
    setGeoMessage(null)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setGeoStatus('granted')
        setGeoMessage('Using your current location')
        setLocationText('')
      },
      (error) => {
        setGeoStatus('unavailable')
        setCoordinates(null)
        if (error.code === error.PERMISSION_DENIED) {
          setGeoMessage('Location permission denied. Enter a city, area, or PIN code instead.')
        } else if (error.code === error.TIMEOUT) {
          setGeoMessage('Location request timed out. Try again or enter a location manually.')
        } else {
          setGeoMessage('Unable to determine your location. Enter a city, area, or PIN code instead.')
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setLocationError(null)

    try {
      let coords = coordinates

      if (locationText.trim() && !coords) {
        const result = await geocodeLocation(locationText)
        if (!result) {
          setLocationError(
            `We couldn't find "${locationText.trim()}". Try a PIN code, a different area name, or use My Location.`
          )
          setSubmitting(false)
          return
        }
        coords = { lat: result.latitude, lng: result.longitude }
      }

      const params = new URLSearchParams()
      const trimmedQuery = query.trim()
      if (trimmedQuery) params.set('q', trimmedQuery)
      if (specialty) params.set('specialty', specialty)
      if (locationText.trim()) params.set('location', locationText.trim())
      if (coords) {
        params.set('lat', coords.lat.toString())
        params.set('lng', coords.lng.toString())
      }

      const qs = params.toString()
      router.push(`/doctors${qs ? `?${qs}` : ''}`)
    } catch {
      setLocationError('Something went wrong while preparing your search. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={className}
      aria-label="Search for doctors"
      noValidate
    >
      <div className="rounded-3xl border border-secondary-200/80 bg-white p-4 sm:p-5 shadow-float">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label
              htmlFor="hero-location"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-secondary-700"
            >
              <MapPin className="h-4 w-4 text-teal-600" aria-hidden="true" />
              Location
            </label>
            <div className="flex gap-2">
              <Input
                id="hero-location"
                type="text"
                value={locationText}
                onChange={(e) => {
                  setLocationText(e.target.value)
                  setLocationError(null)
                  if (e.target.value.trim()) setCoordinates(null)
                }}
                placeholder="Enter city, area, or PIN code"
                autoComplete="address-level2"
                className="h-11"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleUseMyLocation}
                disabled={geoStatus === 'locating'}
                className="h-11 shrink-0 gap-1.5"
                aria-label="Use my current location"
              >
                {geoStatus === 'locating' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">My Location</span>
              </Button>
            </div>
            {geoMessage && (
              <p
                className={`mt-1.5 flex items-center gap-1.5 text-xs ${
                  geoStatus === 'granted' ? 'text-teal-700' : 'text-amber-700'
                }`}
                role="status"
              >
                {geoStatus !== 'granted' && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                {geoMessage}
              </p>
            )}
            {locationError && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600" role="alert">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {locationError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="hero-doctor-search"
              className="mb-1.5 block text-sm font-medium text-secondary-700"
            >
              Doctor or specialty
            </label>
            <Input
              id="hero-doctor-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Doctor name, MBBS, or specialty"
              autoComplete="off"
              className="h-11"
            />
          </div>

          <div>
            <label htmlFor="hero-specialty" className="mb-1.5 block text-sm font-medium text-secondary-700">
              Specialty
            </label>
            <Select
              id="hero-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="h-11"
              aria-label="Select a specialty"
            >
              <option value="">All specialties</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          className="mt-4 w-full gap-2 bg-gradient-to-r from-primary-600 to-teal-600 text-base font-semibold hover:from-primary-700 hover:to-teal-700"
        >
          {!submitting && <Search className="h-5 w-5" />}
          Search Doctors
        </Button>
      </div>
    </form>
  )
}
