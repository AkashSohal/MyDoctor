/**
 * Emergency Assistance (Part 1) — shared constants and helpers.
 *
 * Part 2 will layer account sync (Supabase) and richer routing on top of
 * these helpers, so numbers, tel/sms link building and the honesty copy
 * live here instead of inside individual components.
 */

/** India's all-in-one emergency number. Overridable per deployment. */
export const EMERGENCY_SERVICES_NUMBER =
  process.env.NEXT_PUBLIC_EMERGENCY_NUMBER || '112'

/** Ambulance number (108 operates across most Indian states). */
export const AMBULANCE_NUMBER = process.env.NEXT_PUBLIC_AMBULANCE_NUMBER || '108'

export const EMERGENCY_SERVICES_LABEL = 'Call 112 – Emergency Services'
export const AMBULANCE_LABEL = 'Call Ambulance'

/** Shown wherever a call is initiated — never promise automatic dispatch. */
export const CALL_DISCLAIMER =
  'MyDoctor never places calls on its own. A call starts only after you confirm, and it is dialled by your device’s phone app.'

export const NO_DISPATCH_NOTICE =
  'MyDoctor does not contact emergency services or dispatch an ambulance for you. Please confirm the call yourself.'

export type EmergencyCallTarget = {
  id: 'emergency-services' | 'ambulance'
  label: string
  number: string
  hint: string
}

export const EMERGENCY_CALL_TARGETS: EmergencyCallTarget[] = [
  {
    id: 'emergency-services',
    label: EMERGENCY_SERVICES_LABEL,
    number: EMERGENCY_SERVICES_NUMBER,
    hint: 'Police, fire and medical — India’s single emergency number.',
  },
  {
    id: 'ambulance',
    label: AMBULANCE_LABEL,
    number: AMBULANCE_NUMBER,
    hint: 'Ambulance helpline (108) where available in your state.',
  },
]

/** Keep only characters a tel: link accepts. */
export function buildTelHref(number: string): string {
  return `tel:${number.replace(/[^\d+]/g, '')}`
}

export function isValidPhone(number: string): boolean {
  return /^\+?\d[\d\s-]{6,16}$/.test(number.trim())
}

/**
 * Ask the device to open its dialer for `number`.
 * Returns false when the environment cannot handle tel: links, so callers
 * can show the number to dial manually instead of pretending anything happened.
 */
export function dialNumber(number: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    window.location.href = buildTelHref(number)
    return true
  } catch {
    return false
  }
}

/** Human-readable coordinates + a tappable maps link. */
export function buildMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}

/**
 * Google Maps directions link. Prefers exact coordinates, falls back to
 * the postal address so hospitals without coordinates still work.
 * When `origin` is provided the route starts from the user's position.
 */
export function buildDirectionsUrl(target: {
  latitude?: number | null
  longitude?: number | null
  address: string
  city?: string | null
}, origin?: { latitude: number; longitude: number } | null): string {
  const params = new URLSearchParams({ api: '1' })
  if (typeof target.latitude === 'number' && typeof target.longitude === 'number') {
    params.set('destination', `${target.latitude},${target.longitude}`)
  } else {
    const address = [target.address, target.city].filter(Boolean).join(', ')
    if (address) params.set('destination', address)
  }
  if (origin) params.set('origin', `${origin.latitude},${origin.longitude}`)
  params.set('travelmode', 'driving')
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

export function formatCoordinates(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
}

/**
 * SMS body for sharing the current position with emergency contacts.
 * iOS expects `&body=`, Android expects `?body=` — pick by platform.
 */
export function buildSmsHref(phones: string[], body: string): string {
  const recipients = phones
    .map((phone) => phone.replace(/[^\d+]/g, ''))
    .filter(Boolean)
    .join(',')
  if (!recipients) return ''
  const separator = /iPad|iPhone|iPod/.test(navigator.userAgent) ? '&' : '?'
  return `sms:${recipients}${separator}body=${encodeURIComponent(body)}`
}

export function buildShareText(latitude: number, longitude: number): string {
  const mapsUrl = buildMapsUrl(latitude, longitude)
  return `EMERGENCY — my current location: ${formatCoordinates(latitude, longitude)}\n${mapsUrl}`
}
