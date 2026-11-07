'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Crosshair,
  MapPin,
  Phone,
  Navigation,
  Building2,
  ArrowRight,
  Search,
  ShieldCheck,
  HelpCircle,
  Clock,
  BadgeCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CallConfirmDialog } from '@/components/emergency/CallConfirmDialog'
import {
  emergencyInfo,
  haversineKm,
  type PublicHospital,
} from '@/lib/hospitals/list'
import { buildDirectionsUrl } from '@/lib/emergency'
import { useEmergencyLocation } from '@/lib/emergency/useEmergencyLocation'
import { geocodeLocation } from '@/lib/utils/geocode'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NearbyEmergencyHospitalsProps {
  hospitals: PublicHospital[]
}

type SortMode = 'emergency' | 'distance' | 'name'

type RankedHospital = PublicHospital & { distanceKm: number | null }

/**
 * Emergency hospitals near the user. Supports device location or a
 * manual place search, sorts by distance, and shows only what each
 * hospital's own verified profile declares about emergency services.
 */
export function NearbyEmergencyHospitals({ hospitals }: NearbyEmergencyHospitalsProps) {
  const location = useEmergencyLocation()
  const [callTarget, setCallTarget] = React.useState<PublicHospital | null>(null)
  const [query, setQuery] = React.useState('')
  const [sortMode, setSortMode] = React.useState<SortMode>('emergency')
  const [manualQuery, setManualQuery] = React.useState('')
  const [geocoding, setGeocoding] = React.useState(false)
  const [geocodeError, setGeocodeError] = React.useState<string | null>(null)

  const hasCoords = location.latitude !== null && location.longitude !== null

  // Text filter — name, city, address. Works with or without coordinates.
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return hospitals
    return hospitals.filter((hospital) =>
      [hospital.name, hospital.city ?? '', hospital.state ?? '', hospital.address]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [hospitals, query])

  const ranked: RankedHospital[] = React.useMemo(() => {
    const withDistance = filtered.map((hospital) => ({
      ...hospital,
      distanceKm:
        hasCoords && typeof hospital.latitude === 'number' && typeof hospital.longitude === 'number'
          ? haversineKm(
              location.latitude as number,
              location.longitude as number,
              hospital.latitude,
              hospital.longitude
            )
          : null,
    }))

    // Emergency-department listings rank first — but only when the
    // hospital's own verified profile declares one (see emergencyInfo).
    const emergencyFirst = (a: RankedHospital, b: RankedHospital) => {
      const aListed = emergencyInfo(a).emergencyDepartment === 'listed' ? 0 : 1
      const bListed = emergencyInfo(b).emergencyDepartment === 'listed' ? 0 : 1
      return aListed - bListed
    }

    if (sortMode === 'distance' && hasCoords) {
      withDistance.sort((a, b) => emergencyFirst(a, b) || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    } else if (sortMode === 'emergency') {
      withDistance.sort(
        (a, b) =>
          emergencyFirst(a, b) ||
          (hasCoords ? (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) : 0) ||
          a.name.localeCompare(b.name)
      )
    } else {
      withDistance.sort((a, b) => emergencyFirst(a, b) || a.name.localeCompare(b.name))
    }
    return withDistance
  }, [filtered, hasCoords, location.latitude, location.longitude, sortMode])

  const visible = ranked.slice(0, hasCoords ? 8 : 6)

  const handleManualSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = manualQuery.trim()
    if (!trimmed || geocoding) return
    setGeocoding(true)
    setGeocodeError(null)
    const result = await geocodeLocation(trimmed)
    setGeocoding(false)
    if (!result) {
      setGeocodeError(
        `We couldn't find "${trimmed}". Try a PIN code, area name, city, or use your current location instead.`
      )
      return
    }
    location.setManualLocation(result.latitude, result.longitude, trimmed)
    setManualQuery('')
    toast.success(`Showing hospitals near ${trimmed}`)
  }

  return (
    <div>
      {/* Location controls */}
      <div className="mb-4 space-y-3 rounded-2xl border border-secondary-200 bg-secondary-50/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-secondary-900">
              <Building2 className="h-4 w-4 text-red-600" aria-hidden="true" />
              {hospitals.length} verified hospital{hospitals.length === 1 ? '' : 's'} in the MyDoctor network
            </p>
            <p className="mt-1 text-xs text-secondary-500">
              {hasCoords
                ? location.source === 'manual'
                  ? `Sorted by distance from ${location.label ?? 'your chosen location'}.`
                  : 'Sorted by distance from your current position.'
                : 'Use your location or search a place to sort by distance — or browse them all.'}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50"
              loading={location.status === 'locating'}
              onClick={location.requestLocation}
            >
              <Crosshair className="h-4 w-4" aria-hidden="true" />
              {location.status === 'denied' ? 'Retry location' : hasCoords ? 'Update distance' : 'Find nearest'}
            </Button>
          </div>
        </div>

        {/* Manual location search */}
        <form onSubmit={handleManualSearch} className="flex flex-col gap-2 sm:flex-row" aria-label="Search by location">
          <Input
            value={manualQuery}
            onChange={(event) => {
              setManualQuery(event.target.value)
              setGeocodeError(null)
            }}
            placeholder="Or enter a city, area or PIN code"
            leftIcon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            aria-label="City, area or PIN code"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 sm:h-10"
            loading={geocoding}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </Button>
        </form>
        {geocodeError && (
          <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {geocodeError}
          </p>
        )}

        {/* Hospital text search + sort */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search hospitals by name or city"
              leftIcon={<Search className="h-4 w-4" aria-hidden="true" />}
              aria-label="Search hospitals by name or city"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={sortMode === 'emergency' ? 'default' : 'outline'}
              className="shrink-0"
              title="Hospitals that list an emergency department come first"
              onClick={() => setSortMode('emergency')}
            >
              Emergency first
            </Button>
            <Button
              type="button"
              size="sm"
              variant={sortMode === 'distance' ? 'default' : 'outline'}
              className="shrink-0"
              disabled={!hasCoords}
              title={hasCoords ? 'Sort by distance' : 'Enable location to sort by distance'}
              onClick={() => setSortMode('distance')}
            >
              Distance
            </Button>
            <Button
              type="button"
              size="sm"
              variant={sortMode === 'name' ? 'default' : 'outline'}
              className="shrink-0"
              onClick={() => setSortMode('name')}
            >
              Name
            </Button>
          </div>
        </div>
      </div>

      {location.message && (
        <p
          role={location.status === 'denied' ? 'alert' : 'status'}
          className={cn(
            'mb-4 rounded-xl border p-3 text-sm',
            location.status === 'denied'
              ? 'border-red-200 bg-red-50 text-red-700'
              : location.status === 'granted'
                ? 'border-primary-200 bg-primary-50 text-primary-800'
                : 'border-secondary-200 bg-white text-secondary-600'
          )}
        >
          {location.message}
          {location.status === 'denied' && (
            <button
              type="button"
              className="mt-2 block font-semibold underline hover:text-red-800"
              onClick={location.requestLocation}
            >
              Try again
            </button>
          )}
        </p>
      )}

      {hospitals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-secondary-300 bg-white p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-secondary-300" aria-hidden="true" />
          <p className="mt-3 font-medium text-secondary-900">No hospitals listed right now</p>
          <p className="mt-1 text-sm text-secondary-500">
            In an emergency, dial 112 — it works without an account or listing.
          </p>
        </div>
      ) : ranked.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-secondary-300 bg-white p-8 text-center">
          <Search className="mx-auto h-10 w-10 text-secondary-300" aria-hidden="true" />
          <p className="mt-3 font-medium text-secondary-900">No hospitals match “{query}”</p>
          <button
            type="button"
            className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            onClick={() => setQuery('')}
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-secondary-500">
            {sortMode === 'emergency'
              ? hasCoords
                ? 'Emergency departments first, then nearest'
                : 'Emergency departments first, then A–Z'
              : sortMode === 'distance' && hasCoords
                ? 'Nearest first'
                : 'Sorted by name'}{' '}
            · {ranked.length} result{ranked.length === 1 ? '' : 's'}
          </p>
          <ul className="space-y-3">
            {visible.map((hospital) => (
              <HospitalCard
                key={hospital.id}
                hospital={hospital}
                onCall={() => setCallTarget(hospital)}
              />
            ))}
          </ul>
        </>
      )}

      <div className="mt-4">
        <Link
          href="/hospitals"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Browse all hospitals & clinics
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <CallConfirmDialog
        open={Boolean(callTarget)}
        label={callTarget ? `Call ${callTarget.name}` : ''}
        number={callTarget?.phone ?? ''}
        onCancel={() => setCallTarget(null)}
      />
    </div>
  )
}

/**
 * Single hospital card. Emergency service claims come only from the
 * hospital's own verified facilities list — otherwise we say "not
 * confirmed" rather than guessing.
 */
function HospitalCard({
  hospital,
  onCall,
}: {
  hospital: RankedHospital
  onCall: () => void
}) {
  const info = emergencyInfo(hospital)
  const hasCoords = typeof hospital.latitude === 'number' && typeof hospital.longitude === 'number'

  return (
    <li className="rounded-2xl border border-secondary-200 bg-white p-4 transition-shadow hover:shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/hospitals/${hospital.id}`}
              className="font-semibold text-secondary-900 hover:text-primary-600"
            >
              {hospital.name}
            </Link>
            {hospital.verification_status === 'verified' && (
              <Badge variant="success" size="sm" className="gap-1">
                <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                Verified listing
              </Badge>
            )}
            {hospital.distanceKm !== null && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {hospital.distanceKm < 1 ? '< 1 km' : `${hospital.distanceKm.toFixed(1)} km`} away
              </span>
            )}
          </div>
          <p className="mt-1 flex items-start gap-1.5 text-sm text-secondary-500">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {hospital.address}
            {hospital.city ? `, ${hospital.city}` : ''}
          </p>
          {hospital.phone && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-secondary-600">
              <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
              <a href={`tel:${hospital.phone.replace(/[^\d+]/g, '')}`} className="tabular-nums hover:text-primary-600">
                {hospital.phone}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Emergency capability — only what the profile declares */}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {info.emergencyDepartment === 'listed' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Emergency department listed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-100 px-2.5 py-1 text-xs font-medium text-secondary-600">
            <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Emergency dept. not confirmed — call to check
          </span>
        )}
        {info.open24x7 === 'listed' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            24/7 emergency listed
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {hospital.phone && (
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={onCall}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            Call hospital
          </Button>
        )}
        <a
          href={buildDirectionsUrl(hospital)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          <Navigation className="h-4 w-4" aria-hidden="true" />
          Get directions
        </a>
        <Link
          href={`/hospitals/${hospital.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-secondary-600 transition-colors hover:bg-secondary-100"
        >
          View details
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {!hasCoords && (
        <p className="mt-2 text-xs text-secondary-400">
          Distance unavailable — set your location to see how far this hospital is.
        </p>
      )}
    </li>
  )
}
