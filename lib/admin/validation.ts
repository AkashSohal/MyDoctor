export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

export function fail(error: string): ActionResult<never> {
  return { ok: false, error }
}

export function ok<T>(data?: T): ActionResult<T> {
  return { ok: true, data }
}

export function requireString(value: unknown, field: string, maxLength = 500): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required`)
  }
  if (value.trim().length > maxLength) {
    throw new Error(`${field} is too long (max ${maxLength} characters)`)
  }
  return value.trim()
}

export function optionalString(value: unknown, maxLength = 2000): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  if (value.trim().length > maxLength) {
    throw new Error(`Text is too long (max ${maxLength} characters)`)
  }
  return value.trim()
}

export function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) throw new Error('Invalid number')
  return n
}

export function optionalUuid(value: unknown, field: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRe.test(value.trim())) throw new Error(`${field} must be a valid identifier`)
  return value.trim()
}

const DOCTOR_STATUSES = ['pending', 'verified', 'rejected', 'suspended'] as const
const HOSPITAL_STATUSES = ['pending', 'verified', 'rejected'] as const
const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'] as const
const PATIENT_STATUSES = ['active', 'suspended'] as const

export function assertDoctorStatus(value: unknown): string {
  if (typeof value !== 'string' || !DOCTOR_STATUSES.includes(value as never)) {
    throw new Error('Invalid doctor verification status')
  }
  return value
}

export function assertHospitalStatus(value: unknown): string {
  if (typeof value !== 'string' || !HOSPITAL_STATUSES.includes(value as never)) {
    throw new Error('Invalid hospital verification status')
  }
  return value
}

export function assertAppointmentStatus(value: unknown): string {
  if (typeof value !== 'string' || !APPOINTMENT_STATUSES.includes(value as never)) {
    throw new Error('Invalid appointment status')
  }
  return value
}

export function assertPatientStatus(value: unknown): string {
  if (typeof value !== 'string' || !PATIENT_STATUSES.includes(value as never)) {
    throw new Error('Invalid patient status')
  }
  return value
}
