'use client'

import * as React from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RatingStars } from '@/components/common/RatingStars'
import { ErrorState } from '@/components/common/ErrorState'
import { formatCurrency, formatDistance, cn } from '@/lib/utils'
import {
  formatDoctorName,
  formatExperienceYears,
  getAvailabilityStatus,
  getDoctorDescription,
  getNextAvailableSlot,
  getSpecializationName,
} from '@/lib/utils/doctor'
import { useDoctorCompare, MAX_COMPARE_DOCTORS } from '@/lib/hooks/useDoctorCompare'
import type { Doctor } from '@/lib/types'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Crosshair,
  GitCompare,
  MapPin,
  Star,
  Trash2,
  X,
} from 'lucide-react'

interface CompareRow {
  key: string
  label: string
  value: (doctor: Doctor) => string
  render: (doctor: Doctor) => React.ReactNode
}

const NOT_AVAILABLE = 'Not available'

const hasValue = (value?: string | number | null) =>
  value !== undefined && value !== null && String(value).trim() !== ''

const rows: CompareRow[] = [
  {
    key: 'verification',
    label: 'Verification status',
    value: (d) => d.verification_status || 'unknown',
    render: (d) =>
      d.verification_status === 'verified' ? (
        <Badge variant="success" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Verified
        </Badge>
      ) : (
        <Badge variant="warning" className="capitalize">
          {d.verification_status || 'Unknown'}
        </Badge>
      ),
  },
  {
    key: 'specialization',
    label: 'Medical specialization',
    value: (d) => getSpecializationName(d),
    render: (d) => <span className="font-medium text-primary-700">{getSpecializationName(d)}</span>,
  },
  {
    key: 'qualifications',
    label: 'Qualifications',
    value: (d) =>
      d.qualifications && d.qualifications.length > 0 ? d.qualifications.join(', ') : NOT_AVAILABLE,
    render: (d) =>
      d.qualifications && d.qualifications.length > 0 ? (
        <span>{d.qualifications.join(', ')}</span>
      ) : (
        <span className="text-secondary-400">{NOT_AVAILABLE}</span>
      ),
  },
  {
    key: 'experience',
    label: 'Years of experience',
    value: (d) => formatExperienceYears(d.experience_years),
    render: (d) => <span className="font-medium">{formatExperienceYears(d.experience_years)}</span>,
  },
  {
    key: 'rating',
    label: 'Average rating',
    value: (d) => (d.rating_average || 0).toFixed(1),
    render: (d) => (
      <span className="inline-flex items-center gap-2">
        <RatingStars rating={d.rating_average || 0} size="sm" showValue maxRating={5} />
      </span>
    ),
  },
  {
    key: 'reviews',
    label: 'Number of reviews',
    value: (d) => String(d.rating_count ?? 0),
    render: (d) => (
      <span className="inline-flex items-center gap-1.5">
        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
        {d.rating_count ?? 0} review{(d.rating_count ?? 0) === 1 ? '' : 's'}
      </span>
    ),
  },
  {
    key: 'fee',
    label: 'Consultation fee',
    value: (d) => String(d.consultation_fee ?? 0),
    render: (d) => (
      <span className="font-semibold text-secondary-900">
        {hasValue(d.consultation_fee) ? formatCurrency(d.consultation_fee) : NOT_AVAILABLE}
      </span>
    ),
  },
  {
    key: 'distance',
    label: 'Distance from you',
    value: (d) => (d.distance_km !== undefined && d.distance_km !== null ? formatDistance(d.distance_km) : NOT_AVAILABLE),
    render: (d) =>
      d.distance_km !== undefined && d.distance_km !== null ? (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary-600" />
          {formatDistance(d.distance_km)} away
        </span>
      ) : (
        <span className="text-secondary-400">{NOT_AVAILABLE}</span>
      ),
  },
  {
    key: 'next_appointment',
    label: 'Next available appointment',
    value: (d) => getNextAvailableSlot(d.availability) || 'No slots published',
    render: (d) => {
      const slot = getNextAvailableSlot(d.availability)
      return slot ? (
        <span className="inline-flex items-center gap-1.5 font-medium text-teal-700">
          <Calendar className="h-4 w-4" />
          {slot}
        </span>
      ) : (
        <span className="text-secondary-400">No slots published</span>
      )
    },
  },
  {
    key: 'hospitals',
    label: 'Hospital & clinic affiliations',
    value: (d) =>
      d.hospitals && d.hospitals.length > 0 ? d.hospitals.map((h) => h.name).join(', ') : 'No affiliations listed',
    render: (d) =>
      d.hospitals && d.hospitals.length > 0 ? (
        <ul className="space-y-1">
          {d.hospitals.map((hospital) => (
            <li key={hospital.id} className="inline-flex items-start gap-1.5">
              <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" />
              {hospital.name}
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-secondary-400">No affiliations listed</span>
      ),
  },
  {
    key: 'availability',
    label: 'Availability status',
    value: (d) => getAvailabilityStatus(d.availability),
    render: (d) => {
      const status = getAvailabilityStatus(d.availability)
      const tone =
        status === 'Available now'
          ? 'success'
          : status === 'Available today'
          ? 'success'
          : status === 'No schedule published'
          ? 'outline'
          : 'info'
      return (
        <Badge variant={tone as 'success' | 'outline' | 'info'} className="gap-1.5">
          {status === 'Available now' && (
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          )}
          {status}
        </Badge>
      )
    },
  },
]

function isDifferent(row: CompareRow, doctors: Doctor[]): boolean {
  if (doctors.length < 2) return false
  return new Set(doctors.map((d) => row.value(d))).size > 1
}

export function CompareClient() {
  const { doctors: selected, count, remove, clear } = useDoctorCompare()
  const [doctors, setDoctors] = React.useState<Doctor[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | null>(null)
  const [locating, setLocating] = React.useState(false)

  const idsKey = React.useMemo(() => selected.map((d) => d.id).join(','), [selected])

  // Reuse an already-granted location silently so distances can be shown
  // without prompting the user again.
  React.useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    const permissions = (navigator as unknown as { permissions?: Permissions }).permissions
    if (!permissions?.query) return

    let cancelled = false
    permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (cancelled || status.state !== 'granted') return
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (cancelled) return
            setCoords({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          },
          () => undefined,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        )
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  React.useEffect(() => {
    if (!idsKey) {
      setDoctors([])
      setError(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ ids: idsKey })
        if (coords) {
          params.set('lat', String(coords.latitude))
          params.set('lng', String(coords.longitude))
        }
        const response = await fetch(`/api/doctors/compare?${params.toString()}`, {
          signal: controller.signal,
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(
            typeof body.error === 'string' && body.error.trim()
              ? body.error
              : 'Could not load the selected doctors.'
          )
        }
        setDoctors(Array.isArray(body.doctors) ? (body.doctors as Doctor[]) : [])
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Could not load the selected doctors.')
        setDoctors([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    run()
    return () => controller.abort()
  }, [idsKey, coords, reloadKey])

  const handleUseLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast.info('Location is not supported by this browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude })
        setLocating(false)
      },
      () => {
        setLocating(false)
        toast.info('We could not read your location. Distances stay hidden.')
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }

  const missing = selected.filter((s) => !doctors.some((d) => d.id === s.id))

  const headerActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild variant="outline" className="gap-1.5">
        <Link href="/doctors">
          <ArrowLeft className="h-4 w-4" />
          Find doctors
        </Link>
      </Button>
      <Button
        variant="ghost"
        onClick={clear}
        disabled={count === 0}
        className="gap-1.5 text-secondary-600"
      >
        <Trash2 className="h-4 w-4" />
        Clear all
      </Button>
      {!coords && (
        <Button variant="ghost" onClick={handleUseLocation} disabled={locating} className="gap-1.5 text-secondary-600">
          <Crosshair className={cn('h-4 w-4', locating && 'animate-spin')} />
          {locating ? 'Locating…' : 'Show distances'}
        </Button>
      )}
    </div>
  )

  if (count === 0) {
    return (
      <div className="min-h-screen bg-secondary-50">
        <div className="container py-10">
          <PageHeader actions={headerActions} />
          <div className="rounded-2xl border border-secondary-200 bg-white px-6 py-16 text-center shadow-card">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <GitCompare className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-secondary-900">
              No doctors selected yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-secondary-500">
              Add up to {MAX_COMPARE_DOCTORS} doctors from the listings and their profiles, then
              compare them side by side.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/doctors">Find doctors to compare</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50 pb-16">
      <div className="container py-8 sm:py-10">
        <PageHeader actions={headerActions} />

        {count === 1 && (
          <div className="mt-4 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
            Select at least one more doctor to compare — you can add up to {MAX_COMPARE_DOCTORS}.
          </div>
        )}

        {missing.length > 0 && !loading && !error && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {missing.length === 1 ? 'A selected doctor is' : `${missing.length} selected doctors are`}{' '}
            no longer listed and {missing.length === 1 ? 'is' : 'are'} not shown below.
          </div>
        )}

        {error && (
          <div className="mt-6">
            <ErrorState
              title="Could not load the comparison"
              message={error}
              onRetry={() => setReloadKey((k) => k + 1)}
            />
          </div>
        )}

        {!error && loading && doctors.length === 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Array.from({ length: Math.max(count, 1) }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-secondary-200 bg-white" />
            ))}
          </div>
        )}

        {!error && doctors.length > 0 && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-secondary-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-100 ring-1 ring-amber-300" />
                Highlighted cells differ between doctors
              </span>
            </div>

            {/* Desktop / tablet: aligned comparison table */}
            <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-secondary-200 bg-white shadow-card md:block">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <caption className="sr-only">Side-by-side comparison of selected doctors</caption>
                <thead>
                  <tr className="border-b border-secondary-200 bg-secondary-50/60">
                    <th scope="col" className="w-52 p-4 align-bottom text-sm font-medium text-secondary-500">
                      Feature
                    </th>
                    {doctors.map((doctor) => (
                      <th key={doctor.id} scope="col" className="p-4 align-bottom">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <Avatar
                              src={doctor.photo_url}
                              fallback={doctor.full_name}
                              size="lg"
                              className="ring-2 ring-white shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => remove(doctor.id)}
                              aria-label={`Remove ${formatDoctorName(doctor.full_name)} from comparison`}
                              className="flex h-7 w-7 items-center justify-center rounded-full border border-secondary-200 bg-white text-secondary-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm font-bold text-secondary-900">{formatDoctorName(doctor.full_name)}</p>
                          <p className="text-xs font-normal text-secondary-500">
                            {getSpecializationName(doctor)}
                          </p>
                          <Link
                            href={`/doctors/${doctor.id}`}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            View profile
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const differs = isDifferent(row, doctors)
                    return (
                      <tr
                        key={row.key}
                        className={cn('border-b border-secondary-100 last:border-b-0', differs && 'bg-amber-50/70')}
                      >
                        <th scope="row" className="p-4 align-top text-sm font-medium text-secondary-600">
                          {row.label}
                          {differs && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                              differs
                            </span>
                          )}
                        </th>
                        {doctors.map((doctor) => (
                          <td
                            key={doctor.id}
                            className={cn('p-4 align-top text-sm text-secondary-800', differs && 'font-medium')}
                          >
                            {row.render(doctor)}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile: stacked comparison cards */}
            <div className="mt-3 space-y-4 md:hidden">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-card">
                  <div className="flex items-start gap-3 border-b border-secondary-100 bg-secondary-50/60 p-4">
                    <Avatar src={doctor.photo_url} fallback={doctor.full_name} size="lg" className="ring-2 ring-white shadow-md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-secondary-900">{formatDoctorName(doctor.full_name)}</p>
                      <p className="text-sm text-secondary-500">{getSpecializationName(doctor)}</p>
                      <Link
                        href={`/doctors/${doctor.id}`}
                        className="mt-1 inline-block text-xs font-medium text-primary-600"
                      >
                        View profile
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(doctor.id)}
                      aria-label={`Remove ${formatDoctorName(doctor.full_name)} from comparison`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-secondary-200 bg-white text-secondary-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <dl className="divide-y divide-secondary-100">
                    {rows.map((row) => {
                      const differs = isDifferent(row, doctors)
                      return (
                        <div
                          key={row.key}
                          className={cn('flex items-start justify-between gap-4 p-3', differs && 'bg-amber-50/70')}
                        >
                          <dt className="text-xs font-medium text-secondary-500">{row.label}</dt>
                          <dd className="text-right text-sm text-secondary-800">{row.render(doctor)}</dd>
                        </div>
                      )
                    })}
                  </dl>
                </div>
              ))}
            </div>

            {/* Bio / about strip */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="rounded-2xl border border-secondary-200 bg-white p-4 shadow-card">
                  <h3 className="text-sm font-semibold text-secondary-900">About {formatDoctorName(doctor.full_name)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-secondary-600">
                    {getDoctorDescription(doctor)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PageHeader({ actions }: { actions: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1.5 text-sm font-medium text-primary-700">
          <GitCompare className="h-4 w-4" aria-hidden="true" />
          Compare doctors
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-secondary-900 sm:text-3xl">
          Compare doctors side by side
        </h1>
        <p className="mt-1 text-secondary-500">
          Review specialization, experience, ratings, fees and availability in one view.
        </p>
      </div>
      {actions}
    </div>
  )
}
