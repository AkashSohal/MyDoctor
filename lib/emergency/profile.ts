'use client'

/**
 * Emergency medical profile (Part 3) — types, constants and validation shared
 * by the profile form, the digital medical ID and the Supabase hooks.
 *
 * Column names mirror public.patient_emergency_profiles exactly so a row can
 * be read/written without a mapping layer.
 */

import { BLOOD_GROUPS } from '@/lib/emergency/storage'

export interface EmergencyProfile {
  full_name: string
  blood_group: string
  allergies: string
  medications: string
  conditions: string
  emergency_contact_name: string
  emergency_contact_number: string
  additional_info: string
}

export const EMPTY_EMERGENCY_PROFILE: EmergencyProfile = {
  full_name: '',
  blood_group: '',
  allergies: '',
  medications: '',
  conditions: '',
  emergency_contact_name: '',
  emergency_contact_number: '',
  additional_info: '',
}

export type EmergencyProfileErrors = Partial<Record<keyof EmergencyProfile, string>>

/** Hard limits — mirror the CHECK constraints in the migration. */
export const PROFILE_LIMITS = {
  fullName: 120,
  shortText: 2000,
  longText: 4000,
  contactName: 120,
} as const

const PHONE_PATTERN = /^\+?\d[\d\s-]{6,16}$/

/**
 * Client-side validation. Stricter than the database (the DB allows an empty
 * full name as a column default; the form requires one) so bad input never
 * reaches Supabase.
 */
export function validateEmergencyProfile(
  input: EmergencyProfile
): EmergencyProfileErrors {
  const errors: EmergencyProfileErrors = {}
  const fullName = input.full_name.trim()
  const contactName = input.emergency_contact_name.trim()
  const contactNumber = input.emergency_contact_number.trim()

  if (!fullName) {
    errors.full_name = 'Full name is required'
  } else if (fullName.length > PROFILE_LIMITS.fullName) {
    errors.full_name = `Keep the name under ${PROFILE_LIMITS.fullName} characters`
  }

  if (input.blood_group && !(BLOOD_GROUPS as readonly string[]).includes(input.blood_group)) {
    errors.blood_group = 'Choose a blood group from the list'
  }

  if (input.allergies.length > PROFILE_LIMITS.shortText) {
    errors.allergies = `Keep this under ${PROFILE_LIMITS.shortText} characters`
  }
  if (input.medications.length > PROFILE_LIMITS.shortText) {
    errors.medications = `Keep this under ${PROFILE_LIMITS.shortText} characters`
  }
  if (input.conditions.length > PROFILE_LIMITS.shortText) {
    errors.conditions = `Keep this under ${PROFILE_LIMITS.shortText} characters`
  }
  if (input.additional_info.length > PROFILE_LIMITS.longText) {
    errors.additional_info = `Keep this under ${PROFILE_LIMITS.longText} characters`
  }

  if (contactName.length > PROFILE_LIMITS.contactName) {
    errors.emergency_contact_name = `Keep this under ${PROFILE_LIMITS.contactName} characters`
  }

  // The contact name and number travel as a pair — a name with no reachable
  // number (or a number with no name) is not useful in an emergency.
  if (contactName && !contactNumber) {
    errors.emergency_contact_number = 'Add a phone number for this contact'
  } else if (contactNumber && !contactName) {
    errors.emergency_contact_name = 'Add a name for this contact'
  } else if (contactNumber && !PHONE_PATTERN.test(contactNumber)) {
    errors.emergency_contact_number = 'Enter a valid phone number (digits only, 7–17)'
  }

  return errors
}

/** True when at least one medically useful field has been filled in. */
export function hasEmergencyProfileContent(profile: EmergencyProfile): boolean {
  return Boolean(
    profile.blood_group.trim() ||
      profile.allergies.trim() ||
      profile.medications.trim() ||
      profile.conditions.trim() ||
      profile.emergency_contact_name.trim() ||
      profile.emergency_contact_number.trim() ||
      profile.additional_info.trim()
  )
}
