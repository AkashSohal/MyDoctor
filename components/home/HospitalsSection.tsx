import Link from 'next/link'
import { Hospital, MapPin, Phone, Globe, Users, Navigation, ArrowRight } from 'lucide-react'

export interface HospitalCardData {
  id: string
  name: string
  address: string
  phone?: string | null
  website?: string | null
  latitude?: number | null
  longitude?: number | null
  doctorCount?: number | null
}

interface HospitalsSectionProps {
  hospitals: HospitalCardData[]
}

function directionsUrl(hospital: HospitalCardData): string | null {
  if (hospital.latitude && hospital.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`
  }
  if (hospital.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.address)}`
  }
  return null
}

export function HospitalsSection({ hospitals }: HospitalsSectionProps) {
  return (
    <section className="section bg-gradient-to-b from-sky-50 to-white">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-medium text-primary-700">
              <Hospital className="h-4 w-4" aria-hidden="true" />
              Hospitals & clinics
            </div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-secondary-900 sm:text-4xl">
              Healthcare Around You.
            </h2>
            <p className="mt-2 max-w-2xl text-secondary-600">
              Facilities listed on MyDoctor, with the contact details and locations they have
              shared with us.
            </p>
          </div>
          <Link
            href="/hospitals"
            className="inline-flex shrink-0 items-center gap-2 font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            View all facilities
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {hospitals.length === 0 ? (
          <div className="rounded-2xl border border-secondary-200 bg-white px-6 py-12 text-center">
            <Hospital className="mx-auto h-10 w-10 text-secondary-400" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-secondary-900">
              No hospitals listed yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-secondary-500">
              Facilities are added as they join MyDoctor. You can still find doctors by specialty.
            </p>
            <Link
              href="/doctors"
              className="mt-6 inline-flex items-center gap-2 font-medium text-primary-600 hover:text-primary-700"
            >
              Browse doctors
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {hospitals.map((hospital) => {
              const directions = directionsUrl(hospital)
              return (
                <li
                  key={hospital.id}
                  className="flex flex-col rounded-2xl border border-secondary-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-soft"
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-md">
                      <Hospital className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-secondary-900">
                        {hospital.name}
                      </h3>
                      <p className="mt-1 flex items-start gap-1.5 text-sm text-secondary-500">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        {hospital.address}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-secondary-600">
                    {typeof hospital.doctorCount === 'number' && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-100 px-2.5 py-1.5">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {hospital.doctorCount} {hospital.doctorCount === 1 ? 'doctor' : 'doctors'}
                      </span>
                    )}
                    {hospital.phone && (
                      <a
                        href={`tel:${hospital.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-100 px-2.5 py-1.5 transition-colors hover:bg-primary-50 hover:text-primary-700"
                      >
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        {hospital.phone}
                      </a>
                    )}
                    {hospital.website && (
                      <a
                        href={hospital.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-100 px-2.5 py-1.5 transition-colors hover:bg-primary-50 hover:text-primary-700"
                      >
                        <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                        Website
                      </a>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-secondary-100 pt-4">
                    <Link
                      href={`/doctors?hospital_id=${encodeURIComponent(hospital.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-secondary-300 px-3 py-2 text-sm font-medium text-secondary-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    >
                      <Users className="h-4 w-4" aria-hidden="true" />
                      Doctors here
                    </Link>
                    {directions && (
                      <a
                        href={directions}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-secondary-300 px-3 py-2 text-sm font-medium text-secondary-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                      >
                        <Navigation className="h-4 w-4" aria-hidden="true" />
                        Directions
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
