import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/utils/supabase/public'
import { Doctor } from '@/lib/types'
import {
  containsRawId,
  formatDoctorName,
  formatExperienceYears,
  getSpecializationName,
} from '@/lib/utils/doctor'
import { DoctorProfileClient } from './DoctorProfileClient'

interface Props {
  params: Promise<{ id: string }>
}

// Verified doctor profiles are public data — serve from cache, revalidate in background.
export const revalidate = 60

const DOCTOR_COLUMNS = `
  *,
  specialization:specialties(id, name, description),
  availability(id, doctor_id, hospital_id, day_of_week, start_time, end_time, is_active),
  doctor_hospitals(hospital:hospitals(id, name, address, latitude, longitude, phone, website, verification_status, is_active))
`

type PublicHospital = {
  id: string
  name: string
  address: string
  latitude?: number | null
  longitude?: number | null
  phone?: string | null
  website?: string | null
  verification_status?: string | null
  is_active?: boolean | null
}

async function fetchDoctorProfile(id: string) {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('doctors')
    .select(DOCTOR_COLUMNS)
    .eq('id', id)
    .eq('verification_status', 'verified')
    .single()

  if (error || !data) return null

  const affiliations = (data.doctor_hospitals ?? []) as Array<{
    hospital: PublicHospital | null
  }>
  const hospitals = affiliations
    .map((dh) => dh.hospital)
    .filter(
      (hospital): hospital is PublicHospital =>
        Boolean(hospital) &&
        hospital?.verification_status === 'verified' &&
        hospital.is_active !== false
    )

  const { doctor_hospitals: _junction, ...doctor } = data
  return { ...doctor, hospitals } as Doctor
}

// Cached per doctor id so generateMetadata and the page share one DB roundtrip.
function getDoctorProfile(id: string) {
  return unstable_cache(
    () => fetchDoctorProfile(id),
    ['doctor-profile', id],
    { revalidate: 60, tags: ['doctor', `doctor-${id}`] }
  )()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const doctor = await getDoctorProfile(id)

  if (!doctor) {
    return { title: 'Doctor Not Found | MyDoctor' }
  }

  const specializationName = getSpecializationName(doctor)
  const title = `${formatDoctorName(doctor.full_name)} | ${specializationName} | MyDoctor`

  // Never surface a raw bio that leaked an internal id (e.g. a specialization
  // UUID) — build a safe description from the real specialization + experience.
  const bio = typeof doctor.bio === 'string' ? doctor.bio.trim() : ''
  const years =
    typeof doctor.experience_years === 'number' && Number.isFinite(doctor.experience_years)
      ? Math.round(doctor.experience_years)
      : 0
  const description = bio && !containsRawId(bio)
    ? bio
    : `Book an appointment with ${formatDoctorName(doctor.full_name)}, ${specializationName}. ${
        years > 0 ? `${formatExperienceYears(years)}. ` : ''
      }Verified doctor on MyDoctor.`

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

export default async function DoctorProfilePage({ params }: Props) {
  const { id } = await params
  const doctor = await getDoctorProfile(id)

  if (!doctor) {
    notFound()
  }

  return <DoctorProfileClient doctor={doctor} />
}
