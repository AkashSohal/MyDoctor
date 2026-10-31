import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/utils/supabase/public'
import { Doctor } from '@/lib/types'
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
  doctor_hospitals(hospital:hospitals(id, name, address, latitude, longitude, phone, website))
`

async function fetchDoctorProfile(id: string) {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('doctors')
    .select(DOCTOR_COLUMNS)
    .eq('id', id)
    .eq('verification_status', 'verified')
    .single()

  if (error || !data) return null

  const hospitals = (data.doctor_hospitals ?? [])
    .map((dh: { hospital: { id: string } | null }) => dh.hospital)
    .filter(Boolean)

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

  const specialization = Array.isArray(doctor.specialization)
    ? doctor.specialization[0]
    : doctor.specialization

  const title = `Dr. ${doctor.full_name} | ${specialization?.name || 'Specialist'} | MyDoctor`
  const description = doctor.bio || `Book an appointment with Dr. ${doctor.full_name}, ${specialization?.name || 'Specialist'}. Verified doctor with ${doctor.qualifications?.join(', ') || 'medical qualifications'}.`

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
