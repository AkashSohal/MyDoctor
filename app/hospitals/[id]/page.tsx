import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { fetchHospitalDetails } from '@/lib/hospital-details'
import { HospitalDetailsClient } from './HospitalDetailsClient'

interface Props {
  params: Promise<{ id: string }>
}

// Hospital profiles are public data — serve from cache, revalidate in background.
export const revalidate = 300

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Cached per hospital id so generateMetadata and the page share one DB roundtrip.
function getHospitalDetails(id: string) {
  return unstable_cache(
    () => fetchHospitalDetails(id),
    ['hospital-details', id],
    { revalidate: 300, tags: ['hospitals', `hospital-${id}`] }
  )()
}

// Only generated for known hospital ids at build time — dynamic fetch at runtime.
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  if (!UUID_REGEX.test(id)) {
    notFound()
  }

  const hospital = await getHospitalDetails(id)

  if (!hospital) {
    notFound()
  }

  const title = `${hospital.name} | Hospitals & Clinics | MyDoctor`
  const description = `View ${hospital.name} details — location, contact info, doctors, and specialties. Book an appointment with doctors at ${hospital.address}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
    },
  }
}

export default async function HospitalDetailsPage({ params }: Props) {
  const { id } = await params

  // Reject malformed ids before touching the database.
  if (!UUID_REGEX.test(id)) {
    notFound()
  }

  const hospital = await getHospitalDetails(id)

  if (!hospital) {
    notFound()
  }

  return <HospitalDetailsClient hospital={hospital} />
}
