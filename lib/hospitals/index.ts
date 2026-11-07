import type { BadgeProps } from '@/components/ui/badge'

/**
 * Hospital & Clinic Management — shared helpers (Part 1).
 * Kept in one place so Part 2 (post-registration management) can extend it
 * without duplicating validation or status mappings.
 */

export const HOSPITAL_TYPES = ['Hospital', 'Clinic', 'Medical Centre', 'Other'] as const
export type HospitalType = (typeof HOSPITAL_TYPES)[number]

export type HospitalVerificationStatus = 'pending' | 'verified' | 'rejected'

/** Row shape returned by the enriched hospitals select. */
export interface HospitalListItem {
  id: string
  name: string
  address: string
  latitude?: number | null
  longitude?: number | null
  city?: string | null
  state?: string | null
  pin_code?: string | null
  hospital_type?: string | null
  verification_status?: HospitalVerificationStatus | null
  phone?: string | null
  website?: string | null
  email?: string | null
  image_url?: string | null
  facilities?: string[] | null
  is_active?: boolean | null
  added_by?: string | null
  created_at?: string | null
}

/** A doctor <-> hospital link row with the embedded hospital. */
export interface HospitalAffiliation {
  id: string
  doctor_id: string
  hospital_id: string
  created_at?: string | null
  hospital: HospitalListItem
}

/** UI metadata for each verification status. */
export const HOSPITAL_STATUS_META: Record<
  HospitalVerificationStatus,
  { label: string; variant: BadgeProps['variant'] }
> = {
  pending: { label: 'Pending review', variant: 'warning' },
  verified: { label: 'Verified', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
}

/** Form state of the "Add Hospital / Clinic" modal. */
export interface HospitalFormValues {
  name: string
  hospital_type: HospitalType
  address: string
  city: string
  state: string
  pin_code: string
  phone: string
  website: string
}

export const emptyHospitalForm: HospitalFormValues = {
  name: '',
  hospital_type: 'Hospital',
  address: '',
  city: '',
  state: '',
  pin_code: '',
  phone: '',
  website: '',
}

const PIN_CODE_RE = /^[1-9][0-9]{5}$/
const PHONE_RE = /^[+()\-0-9\s]{6,20}$/
const WEBSITE_RE = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i

/**
 * Validates the add-hospital form.
 * Returns an error message, or null when the form is valid.
 */
export function validateHospitalForm(form: HospitalFormValues): string | null {
  const name = form.name.trim()
  const address = form.address.trim()
  const city = form.city.trim()
  const state = form.state.trim()
  const pin = form.pin_code.trim()

  if (!name) return 'Hospital / clinic name is required'
  if (name.length > 200) return 'Name is too long (max 200 characters)'
  if (!address) return 'Full address is required'
  if (address.length > 500) return 'Address is too long (max 500 characters)'
  if (!city) return 'City is required'
  if (city.length > 100) return 'City is too long (max 100 characters)'
  if (!state) return 'State is required'
  if (state.length > 100) return 'State is too long (max 100 characters)'
  if (!pin) return 'PIN code is required'
  if (!PIN_CODE_RE.test(pin)) return 'Enter a valid 6-digit PIN code'

  const phone = form.phone.trim()
  if (phone && !PHONE_RE.test(phone)) return 'Enter a valid contact number'

  const website = form.website.trim()
  if (website && !WEBSITE_RE.test(website)) return 'Enter a valid website (e.g. https://example.com)'

  return null
}

/** Normalized identity used for duplicate detection (name + address). */
export function normalizeHospitalKey(name: string, address: string): string {
  return `${name.trim().toLowerCase()}|${address.trim().toLowerCase()}`
}

/** True when a hospital with the same normalized name + address already exists. */
export function findDuplicateHospital(
  hospitals: Array<{ name: string; address: string }>,
  name: string,
  address: string
): boolean {
  const key = normalizeHospitalKey(name, address)
  return hospitals.some((h) => normalizeHospitalKey(h.name, h.address) === key)
}

/** Maps raw Supabase/PostgREST errors to user-friendly messages. */
export function friendlyHospitalError(error: unknown): string {
  const err = error as { code?: string; message?: string } | null
  const message = err?.message ?? ''

  if (err?.code === '23505' || /duplicate key/i.test(message)) {
    return 'A hospital with this name and address already exists'
  }
  if (err?.code === 'PGRST204' || /column .* does not exist/i.test(message)) {
    return 'Hospital management is not available yet — the database migration has not been applied'
  }
  if (/row-level security/i.test(message)) {
    return 'You are not allowed to perform this action'
  }
  return message || 'Something went wrong. Please try again.'
}
