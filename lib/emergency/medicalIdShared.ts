import type { EmergencyProfile } from '@/lib/emergency/profile'

/**
 * Server-safe pieces of the Digital Emergency Medical ID (Part 3, TASK 2).
 *
 * Split out of `medicalId.ts` (which is a client module because it contains
 * a hook) so Server Components — e.g. the public share viewer — can use the
 * token pattern and payload helpers without pulling in client references.
 *
 * A share is a deliberately limited, revocable grant:
 *   - the QR code contains only a secret URL token (never medical data),
 *   - the stored payload is a snapshot of the fields the patient selected,
 *   - shares expire (max 31 days, enforced by the database),
 *   - the patient can revoke a share at any time by deleting the row.
 */

export const SHAREABLE_FIELDS = [
  'name',
  'bloodGroup',
  'allergies',
  'conditions',
  'emergencyContact',
] as const

export type ShareableField = (typeof SHAREABLE_FIELDS)[number]

export interface MedicalIdSharePayload {
  name?: string
  bloodGroup?: string
  allergies?: string
  conditions?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
}

export interface MedicalIdShare {
  id: string
  token: string
  created_at: string
  expires_at: string
  payload: MedicalIdSharePayload
}

export const SHARE_DURATIONS = [
  { hours: 1, label: '1 hour' },
  { hours: 24, label: '24 hours' },
  { hours: 168, label: '7 days' },
] as const

/** 192 bits of randomness — matches the DB CHECK (48 lowercase hex chars). */
export function createShareToken(): string {
  const bytes = new Uint8Array(24)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    // Extremely old browsers only; still 192 bits of PRNG output.
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export const SHARE_TOKEN_PATTERN = /^[0-9a-f]{48}$/

/** Fields the token URL must never carry — only the secret token itself. */
export function buildShareUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, '')}/emergency/medical-id/${token}`
}

/**
 * Build the snapshot payload from the profile + the fields the patient chose.
 * Anything not explicitly selected (or empty) is simply absent — the DB
 * allow-list constraint rejects any key outside this set.
 */
export function buildSharePayload(
  profile: EmergencyProfile,
  selected: readonly ShareableField[]
): MedicalIdSharePayload {
  const payload: MedicalIdSharePayload = {}
  const wants = (field: ShareableField) => selected.includes(field)

  if (wants('name') && profile.full_name.trim()) {
    payload.name = profile.full_name.trim()
  }
  if (wants('bloodGroup') && profile.blood_group.trim()) {
    payload.bloodGroup = profile.blood_group.trim()
  }
  if (wants('allergies') && profile.allergies.trim()) {
    payload.allergies = profile.allergies.trim()
  }
  if (wants('conditions') && profile.conditions.trim()) {
    payload.conditions = profile.conditions.trim()
  }
  if (wants('emergencyContact')) {
    const contactName = profile.emergency_contact_name.trim()
    const contactPhone = profile.emergency_contact_number.trim()
    if (contactName) payload.emergencyContactName = contactName
    if (contactPhone) payload.emergencyContactPhone = contactPhone
  }
  return payload
}

export function payloadHasContent(payload: MedicalIdSharePayload): boolean {
  return Object.values(payload).some((value) => Boolean(value && String(value).trim()))
}
