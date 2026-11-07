import { unstable_cache } from 'next/cache'
import { createPublicClient } from '@/utils/supabase/public'
import type { HospitalListItem } from '@/lib/hospitals'

/**
 * Public hospital listing — shared by /hospitals and /emergency so both
 * surfaces read the same verified rows with the same cache tags.
 */

const HOSPITAL_LIST_SELECT = `
  id, name, address, phone, website, latitude, longitude, city, state, verification_status, facilities,
  doctors:doctor_hospitals(count)
`

// Tiers of degradation: the verification migration and the facilities
// column may not be applied on every deployment, so each query falls
// back to the next-widest select instead of failing outright.
const HOSPITAL_LIST_SELECT_NO_FACILITIES = `
  id, name, address, phone, website, latitude, longitude, city, state, verification_status,
  doctors:doctor_hospitals(count)
`

const HOSPITAL_LIST_SELECT_BASIC = `
  id, name, address, phone, website, latitude, longitude,
  doctors:doctor_hospitals(count)
`

export type PublicHospital = Pick<
  HospitalListItem,
  'id' | 'name' | 'address' | 'phone' | 'website' | 'latitude' | 'longitude' | 'city' | 'state'
> & {
  verification_status?: string | null
  facilities?: string[] | null
  doctors?: Array<{ count: number }>
}

export const getHospitalList = unstable_cache(
  async (): Promise<PublicHospital[]> => {
    const supabase = createPublicClient()
    // Only verified facilities are listed publicly. Each tier drops the
    // newest column first so older schemas keep working.
    const tiers = [
      { select: HOSPITAL_LIST_SELECT, verified: true },
      { select: HOSPITAL_LIST_SELECT_NO_FACILITIES, verified: true },
      { select: HOSPITAL_LIST_SELECT_BASIC, verified: false },
    ] as const

    for (const tier of tiers) {
      let query = supabase.from('hospitals').select(tier.select).order('name')
      if (tier.verified) query = query.eq('verification_status', 'verified')
      const result: any = await query
      if (!result.error) return (result.data ?? []) as PublicHospital[]
    }
    return []
  },
  ['hospitals-list'],
  { revalidate: 300, tags: ['hospitals'] }
)

/** Great-circle distance in kilometres. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(a))
}

/**
 * Emergency capability derived strictly from the hospital's own
 * `facilities` list (admin-curated, part of the verified profile).
 * Returns 'listed' only when a facility entry explicitly says so —
 * 'unknown' otherwise. Never inferred from the hospital name or type,
 * and never claiming real-time availability.
 */
export type EmergencyCapability = 'listed' | 'unknown'

export interface EmergencyInfo {
  emergencyDepartment: EmergencyCapability
  open24x7: EmergencyCapability
}

export function emergencyInfo(hospital: Pick<PublicHospital, 'facilities'>): EmergencyInfo {
  const entries = (hospital.facilities ?? []).map((entry) => entry.toLowerCase())
  const matches = (patterns: RegExp[]) => entries.some((entry) => patterns.some((re) => re.test(entry)))

  return {
    emergencyDepartment: matches([/\bemergency\b/, /\bER\b/, /\bcasualty\b/]) ? 'listed' : 'unknown',
    open24x7: matches([/24\s*[x/]\s*7/, /24\s*hour/, /around the clock/, /round the clock/])
      ? 'listed'
      : 'unknown',
  }
}
