'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DoctorCard } from '@/components/doctors/DoctorCard'
import { DoctorCardSkeleton } from '@/components/common/LoadingSkeleton'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Doctor } from '@/lib/types'
import { DISTANCE_FILTERS } from '@/lib/constants'
import {
  ArrowRight,
  Crosshair,
  RotateCcw,
  ListFilter,
  Stethoscope,
  CalendarCheck,
} from 'lucide-react'

interface NearbyDoctorsSpecialty {
  id: string
  name: string
}

interface NearbyDoctorsProps {
  specialties: NearbyDoctorsSpecialty[]
}

const FEE_FILTERS = [
  { value: '', label: 'Any fee' },
  { value: '500', label: 'Up to ₹500' },
  { value: '1000', label: 'Up to ₹1,000' },
  { value: '1500', label: 'Up to ₹1,500' },
  { value: '2000', label: 'Up to ₹2,000' },
]

const EXPERIENCE_FILTERS = [
  { value: '', label: 'Any experience' },
  { value: '5', label: '5+ years' },
  { value: '10', label: '10+ years' },
  { value: '15', label: '15+ years' },
]

interface Filters {
  specialty: string
  minExperience: string
  maxFee: string
  distanceKm: string
  availableToday: boolean
}

const EMPTY_FILTERS: Filters = {
  specialty: '',
  minExperience: '',
  maxFee: '',
  distanceKm: '',
  availableToday: false,
}

export function NearbyDoctors({ specialties }: NearbyDoctorsProps) {
  const router = useRouter()
  const [filters, setFilters] = React.useState<Filters>(EMPTY_FILTERS)
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating] = React.useState(false)
  const [locationMessage, setLocationMessage] = React.useState<string | null>(null)
  const [doctors, setDoctors] = React.useState<Doctor[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const abortRef = React.useRef<AbortController | null>(null)

  const fetchDoctors = React.useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ per_page: '4', sort_by: 'best_match' })
      if (filters.specialty) params.set('specialty', filters.specialty)
      if (filters.minExperience) params.set('min_experience', filters.minExperience)
      if (filters.maxFee) params.set('max_fee', filters.maxFee)
      if (filters.availableToday) params.set('available_today', 'true')
      if (coords && filters.distanceKm) params.set('distance_km', filters.distanceKm)
      if (coords) {
        params.set('lat', coords.lat.toString())
        params.set('lng', coords.lng.toString())
      }

      const response = await fetch(`/api/doctors/search?${params.toString()}`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'We could not load doctors right now.')
      }

      const data = await response.json()
      setDoctors(Array.isArray(data.doctors) ? data.doctors : [])
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'We could not load doctors right now.')
    } finally {
      if (abortRef.current === controller) {
        setLoading(false)
      }
    }
  }, [filters, coords])

  React.useEffect(() => {
    fetchDoctors()
    return () => abortRef.current?.abort()
  }, [fetchDoctors])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('This browser does not support location sharing.')
      return
    }
    setLocating(true)
    setLocationMessage(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocating(false)
        setLocationMessage('Sorted and filtered using your current location.')
      },
      (err) => {
        setLocating(false)
        setLocationMessage(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. You can still browse all doctors.'
            : 'Could not read your location. You can still browse all doctors.'
        )
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  const hasActiveFilters =
    filters.specialty !== '' ||
    filters.minExperience !== '' ||
    filters.maxFee !== '' ||
    filters.distanceKm !== '' ||
    filters.availableToday

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700">
              <Stethoscope className="h-4 w-4" aria-hidden="true" />
              Doctors
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">
              Find Trusted Doctors Near You.
            </h2>
            <p className="mt-2 max-w-2xl text-secondary-600">
              Live profiles from the MyDoctor directory, with verified registration details,
              qualifications, fees, and published schedules.
            </p>
          </div>
          <Link
            href="/doctors"
            className="inline-flex shrink-0 items-center gap-2 font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            View all doctors
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-secondary-200 bg-secondary-50/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-secondary-700">
              <ListFilter className="h-4 w-4 text-primary-600" aria-hidden="true" />
              Filter results
            </p>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="gap-1.5 text-secondary-600"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              aria-label="Filter by specialty"
              value={filters.specialty}
              onChange={(e) => setFilters((prev) => ({ ...prev, specialty: e.target.value }))}
            >
              <option value="">All specialties</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Filter by experience"
              value={filters.minExperience}
              onChange={(e) => setFilters((prev) => ({ ...prev, minExperience: e.target.value }))}
            >
              {EXPERIENCE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Filter by consultation fee"
              value={filters.maxFee}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxFee: e.target.value }))}
            >
              {FEE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Filter by distance"
              value={filters.distanceKm}
              disabled={!coords}
              onChange={(e) => setFilters((prev) => ({ ...prev, distanceKm: e.target.value }))}
            >
              <option value="">Any distance</option>
              {DISTANCE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-secondary-700">
              <input
                type="checkbox"
                checked={filters.availableToday}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, availableToday: e.target.checked }))
                }
                className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              Available today
            </label>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="gap-1.5"
            >
              {locating ? (
                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Crosshair className="h-3.5 w-3.5" />
              )}
              {coords ? 'Update my location' : 'Use my location'}
            </Button>
          </div>

          {locationMessage && (
            <p className="mt-2 text-xs text-secondary-500" role="status">
              {locationMessage}
            </p>
          )}
        </div>

        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            <DoctorCardSkeleton />
            <DoctorCardSkeleton />
          </div>
        )}

        {!loading && error && (
          <ErrorState
            title="We couldn't load doctors"
            message={error}
            onRetry={fetchDoctors}
          />
        )}

        {!loading && !error && doctors.length === 0 && (
          <div className="rounded-2xl border border-secondary-200 bg-secondary-50 px-6 py-12 text-center">
            <CalendarCheck className="mx-auto h-10 w-10 text-secondary-400" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-secondary-900">
              No doctors match these filters
            </h3>
            <p className="mt-2 text-secondary-500">
              Try removing a filter, widening your search, or browse the full directory.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                Reset filters
              </Button>
              <Button onClick={() => router.push('/doctors')}>Browse all doctors</Button>
            </div>
          </div>
        )}

        {!loading && !error && doctors.length > 0 && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  onPointerEnter={() => router.prefetch(`/doctors/${doctor.id}`)}
                >
                  <DoctorCard
                    doctor={doctor}
                    userLocation={coords}
                    onViewProfile={() => router.push(`/doctors/${doctor.id}`)}
                    onBookAppointment={() => router.push(`/appointments/new?doctor=${doctor.id}`)}
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button size="lg" variant="outline" asChild className="gap-2 font-semibold">
                <Link href="/doctors">
                  See more doctors
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
