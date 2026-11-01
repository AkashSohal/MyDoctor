import { createPublicClient } from '@/utils/supabase/public'
import { HospitalDetails, HospitalDoctor } from '@/app/hospitals/[id]/HospitalDetailsClient'

const DOCTOR_COLUMNS = `
  id, full_name, photo_url, bio, qualifications, experience_years,
  languages, consultation_fee, rating_average, rating_count,
  specialization_id,
  specialization:specialties(id, name)
`

/**
 * Fetches a hospital plus its verified doctors from Supabase.
 * Returns null when the hospital does not exist or the query fails.
 */
export async function fetchHospitalDetails(id: string): Promise<HospitalDetails | null> {
  const supabase = createPublicClient()

  const { data: hospital, error: hospitalError } = await supabase
    .from('hospitals')
    .select('id, name, address, latitude, longitude, phone, website, email')
    .eq('id', id)
    .single()

  if (hospitalError || !hospital) return null

  const { data: doctorRows, error: doctorsError } = await supabase
    .from('doctor_hospitals')
    .select(`doctor:doctors!inner(${DOCTOR_COLUMNS})`)
    .eq('hospital_id', id)
    .eq('doctors.verification_status', 'verified')

  if (doctorsError) {
    console.error('[hospital-page] doctors fetch failed:', doctorsError.message)
  }
  console.error('[hospital-page][debug] id:', id, 'rows:', JSON.stringify(doctorRows).slice(0, 600), 'err:', JSON.stringify(doctorsError))

  const doctors: HospitalDoctor[] = (doctorRows ?? [])
    .map((row: any) => row.doctor as HospitalDoctor | null)
    .filter((doctor): doctor is HospitalDoctor => Boolean(doctor))
  doctors.sort((a, b) => b.rating_average - a.rating_average)

  return { ...hospital, doctors }
}
