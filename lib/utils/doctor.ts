import type { Availability, Doctor, Specialty } from '@/lib/types'

/**
 * Helpers for rendering doctor information safely.
 *
 * Raw database identifiers (specialization UUIDs, internal ids) must never
 * reach the UI — these helpers resolve the real specialization name through
 * the doctors.specialization_id -> specialties relationship and fall back to
 * a human readable label when the join data is missing.
 */

const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i

/** True when the text is (or contains) a raw UUID / internal identifier. */
export function containsRawId(value?: string | null): boolean {
  if (!value) return false
  return UUID_RE.test(value)
}

type SpecializationLike = Specialty | Specialty[] | { name?: string | null } | null | undefined

export interface SpecializationSource {
  specialization?: SpecializationLike
  specialization_id?: string | null
}

/**
 * Resolve a doctor's specialization display name.
 * Never returns a UUID — falls back to "Specialist" when unavailable.
 */
export function getSpecializationName(doctor: SpecializationSource): string {
  const joined = Array.isArray(doctor.specialization)
    ? doctor.specialization[0]
    : doctor.specialization
  const name = typeof joined?.name === 'string' ? joined.name.trim() : ''
  if (!name || containsRawId(name)) return 'Specialist'
  return name
}

/**
 * Display name with a single "Dr." title.
 * Some records already store the title in full_name — never render
 * "Dr. Dr. ...".
 */
export function formatDoctorName(name?: string | null): string {
  const value = typeof name === 'string' ? name.trim() : ''
  if (!value) return 'Doctor'
  return /^dr\.\s+|^dr\s+/i.test(value) ? value : `Dr. ${value}`
}

/** "1 year of experience" / "5 years of experience" / "15 years of experience". */
export function formatExperienceYears(years?: number | null): string {
  const value = typeof years === 'number' && Number.isFinite(years) ? Math.round(years) : 0
  if (value <= 0) return 'Experience not listed'
  return `${value} year${value === 1 ? '' : 's'} of experience`
}

/**
 * A safe, human readable one-line description built from the real
 * specialization name (fetched via specialization_id) and experience_years.
 */
export function buildDoctorHeadline(doctor: SpecializationSource & { experience_years?: number | null }): string {
  const specialization = getSpecializationName(doctor)
  const years =
    typeof doctor.experience_years === 'number' && Number.isFinite(doctor.experience_years)
      ? Math.round(doctor.experience_years)
      : 0

  if (years <= 0) return `${specialization} at MyDoctor`
  return `Experienced ${specialization} with ${formatExperienceYears(years)}.`
}

/**
 * Returns the bio when it is safe to show to users, otherwise null.
 * Used by the API layer so a stored bio can never leak a raw identifier.
 */
export function getSafeBio(bio?: string | null): string | null {
  const value = typeof bio === 'string' ? bio.trim() : ''
  if (!value || containsRawId(value)) return null
  return value
}

/**
 * The description shown on cards/profiles.
 * A missing bio — or a bio that leaked a raw UUID — is replaced with a
 * generated headline instead of exposing internal identifiers.
 */
export function getDoctorDescription(
  doctor: SpecializationSource & { experience_years?: number | null; bio?: string | null }
): string {
  return getSafeBio(doctor.bio) ?? buildDoctorHeadline(doctor)
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** True when the doctor has at least one active slot today. */
export function isAvailableToday(availability?: Availability[] | null): boolean {
  if (!availability || availability.length === 0) return false
  const today = new Date().getDay()
  return availability.some((a) => a.day_of_week === today && a.is_active)
}

/** True when the doctor has an active slot that covers the current time. */
export function isAvailableNow(availability?: Availability[] | null): boolean {
  if (!availability || availability.length === 0) return false
  const now = new Date()
  const today = now.getDay()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return availability.some(
    (a) =>
      a.day_of_week === today &&
      a.is_active &&
      toMinutes(a.start_time) <= nowMinutes &&
      toMinutes(a.end_time) >= nowMinutes
  )
}

/**
 * Next upcoming slot label, e.g. "Today 9:00 AM", "Tomorrow 2:00 PM",
 * "Wed 9:00 AM". Returns null when nothing is scheduled in the next 7 days.
 */
export function getNextAvailableSlot(availability?: Availability[] | null): string | null {
  const slots = (availability || []).filter((a) => a.is_active)
  if (slots.length === 0) return null

  const now = new Date()
  const today = now.getDay()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (let offset = 0; offset < 7; offset++) {
    const day = (today + offset) % 7
    const candidate = slots
      .filter((a) => a.day_of_week === day)
      .filter((a) => (offset === 0 ? toMinutes(a.start_time) >= nowMinutes : true))
      .sort((a, b) => a.start_time.localeCompare(b.start_time))[0]

    if (candidate) {
      const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : dayNames[day]
      const [hours, minutes] = candidate.start_time.split(':')
      const hour = parseInt(hours, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      return `${label} ${hour % 12 || 12}:${minutes} ${ampm}`
    }
  }
  return null
}

/** Short availability status used across cards and the comparison view. */
export function getAvailabilityStatus(availability?: Availability[] | null): string {
  if (!availability || availability.length === 0 || !availability.some((a) => a.is_active)) {
    return 'No schedule published'
  }
  if (isAvailableNow(availability)) return 'Available now'
  if (isAvailableToday(availability)) return 'Available today'
  return 'Available this week'
}

/** Narrow helper so callers can pass a full Doctor record anywhere. */
export type DoctorLike = Pick<
  Doctor,
  'specialization' | 'specialization_id' | 'experience_years' | 'bio'
>
