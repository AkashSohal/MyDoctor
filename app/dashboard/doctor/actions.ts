'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import {
  fail,
  ok,
  optionalString,
  optionalUuid,
  requireString,
  type ActionResult,
} from '@/lib/admin/validation'

type ServerSupabase = ReturnType<typeof createClient>

type DoctorContext =
  | {
      ok: true
      supabase: ServerSupabase
      userId: string
      doctorId: string
    }
  | { ok: false; error: string }

const PHONE_RE = /^[+()\-0-9\s]{6,20}$/

async function getDoctorContext(): Promise<DoctorContext> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { ok: false, error: 'Your session has expired. Please sign in again.' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { ok: false, error: 'We could not verify your account. Please try again.' }
  }

  if (profile?.role !== 'doctor') {
    return { ok: false, error: 'Only doctor accounts can manage a doctor profile.' }
  }

  // RLS (doctors_select_own) guarantees this can only be the caller's row.
  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('id, user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (doctorError) {
    return { ok: false, error: 'We could not load your doctor profile. Please try again.' }
  }

  if (!doctor) {
    return { ok: false, error: 'No doctor profile was found for your account.' }
  }

  return { ok: true, supabase, userId: user.id, doctorId: doctor.id }
}

function revalidateDoctorSurfaces(doctorId: string) {
  revalidatePath('/dashboard/doctor')
  revalidatePath('/doctors')
  revalidatePath(`/doctors/${doctorId}`)
  revalidatePath('/hospitals')
  revalidatePath('/')
  // The public doctor profile is wrapped in unstable_cache with this tag.
  revalidateTag(`doctor-${doctorId}`)
  // Hospital lists/pickers are cached by public pages.
  revalidateTag('hospitals')
}

function parseStringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed || trimmed.length > maxLength) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
    if (result.length >= maxItems) break
  }
  return result
}

function boundedInt(value: unknown, min: number, max: number, field: string): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) throw new Error(`${field} must be a number`)
  const rounded = Math.round(n)
  if (rounded < min || rounded > max) {
    throw new Error(`${field} must be between ${min} and ${max}`)
  }
  return rounded
}

// ---------------------------------------------------------------------------
// Doctor profile
// ---------------------------------------------------------------------------

export async function updateDoctorProfileAction(
  input: Record<string, unknown>
): Promise<ActionResult> {
  const ctx = await getDoctorContext()
  if (!ctx.ok) return fail(ctx.error)

  try {
    const fullName = requireString(input.full_name, 'Full name', 120)
    const phone = optionalString(input.phone, 30)
    if (phone && !PHONE_RE.test(phone)) {
      return fail('Enter a valid contact number')
    }

    const bio = optionalString(input.bio, 3000)
    const photoUrl = optionalString(input.photo_url, 1000)
    const qualifications = parseStringArray(input.qualifications, 20, 100)
    if (qualifications.length === 0) {
      return fail('Add at least one qualification')
    }
    const languages = parseStringArray(input.languages, 20, 50)

    const experienceYears = boundedInt(input.experience_years, 0, 80, 'Years of experience')
    const consultationFee = boundedInt(input.consultation_fee, 0, 1000000, 'Consultation fee')
    const specializationId = optionalUuid(input.specialization_id, 'Specialization')

    if (specializationId) {
      const { data: specialty, error: specialtyError } = await ctx.supabase
        .from('specialties')
        .select('id')
        .eq('id', specializationId)
        .maybeSingle()
      if (specialtyError) return fail(specialtyError.message)
      if (!specialty) return fail('The selected specialization could not be found')
    }

    const gender = ['male', 'female', 'other'].includes(String(input.gender))
      ? String(input.gender)
      : null

    // Only the fields a doctor is allowed to own are included. Verification
    // status, user_id, ratings and registration identifiers are never touched.
    const payload: Record<string, unknown> = {
      full_name: fullName,
      photo_url: photoUrl,
      bio,
      qualifications,
      languages,
      specialization_id: specializationId,
      experience_years: experienceYears,
      consultation_fee: consultationFee,
      gender,
    }

    const { data: updated, error: updateError } = await ctx.supabase
      .from('doctors')
      .update(payload)
      .eq('id', ctx.doctorId)
      .eq('user_id', ctx.userId)
      .select('id')
      .maybeSingle()

    if (updateError) return fail(updateError.message)
    if (!updated) {
      return fail('Your doctor profile could not be updated. Please try again.')
    }

    // Keep the account-level profile in sync so the name/phone/photo show up
    // consistently across the app (account page, appointment embeds, etc.).
    const { error: profileError } = await ctx.supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        avatar_url: photoUrl,
      })
      .eq('id', ctx.userId)

    if (profileError) {
      console.error('[doctor-profile] profile sync failed:', profileError.message)
    }

    revalidateDoctorSurfaces(ctx.doctorId)
    return ok()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    return fail(message)
  }
}

// ---------------------------------------------------------------------------
// Hospital & clinic affiliations
// ---------------------------------------------------------------------------

export async function addHospitalAffiliationAction(input: {
  hospital_id?: unknown
}): Promise<ActionResult> {
  const ctx = await getDoctorContext()
  if (!ctx.ok) return fail(ctx.error)

  try {
    const hospitalId = optionalUuid(input?.hospital_id, 'Hospital')
    if (!hospitalId) return fail('Select a hospital to add')

    const { data: hospital, error: hospitalError } = await ctx.supabase
      .from('hospitals')
      .select('id, name, verification_status, is_active')
      .eq('id', hospitalId)
      .maybeSingle()

    if (hospitalError) return fail(hospitalError.message)
    if (!hospital) return fail('That hospital could not be found')
    if (hospital.is_active === false) {
      return fail('This facility is not currently accepting affiliations')
    }

    const { error } = await ctx.supabase
      .from('doctor_hospitals')
      .insert({ doctor_id: ctx.doctorId, hospital_id: hospitalId })

    if (error) {
      if (error.code === '23505') {
        return fail('You are already affiliated with this hospital')
      }
      if (/row-level security/i.test(error.message)) {
        return fail('You are not allowed to add this affiliation')
      }
      return fail(error.message)
    }

    revalidateDoctorSurfaces(ctx.doctorId)
    return ok()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    return fail(message)
  }
}

export async function removeHospitalAffiliationAction(input: {
  hospital_id?: unknown
}): Promise<ActionResult> {
  const ctx = await getDoctorContext()
  if (!ctx.ok) return fail(ctx.error)

  try {
    const hospitalId = optionalUuid(input?.hospital_id, 'Hospital')
    if (!hospitalId) return fail('Select a hospital to remove')

    const { data: deleted, error } = await ctx.supabase
      .from('doctor_hospitals')
      .delete()
      .eq('doctor_id', ctx.doctorId)
      .eq('hospital_id', hospitalId)
      .select('id')

    if (error) {
      if (/row-level security/i.test(error.message)) {
        return fail('You are not allowed to remove this affiliation')
      }
      return fail(error.message)
    }

    if (!deleted || deleted.length === 0) {
      return fail('Affiliation not found or you do not have permission to remove it')
    }

    // A schedule at a hospital the doctor no longer practises at would keep
    // showing on the public profile — remove those slots as part of the same
    // confirmed action.
    const { error: availabilityError } = await ctx.supabase
      .from('availability')
      .delete()
      .eq('doctor_id', ctx.doctorId)
      .eq('hospital_id', hospitalId)

    if (availabilityError) {
      console.error('[doctor-affiliation] availability cleanup failed:', availabilityError.message)
    }

    revalidateDoctorSurfaces(ctx.doctorId)
    return ok()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    return fail(message)
  }
}

/**
 * Revalidates the public doctor/hospital surfaces after a change that was
 * written directly with the browser client (e.g. editing a pending hospital
 * through the shared Part 1 form modal).
 */
export async function revalidateDoctorSurfacesAction(): Promise<ActionResult> {
  const ctx = await getDoctorContext()
  if (!ctx.ok) return fail(ctx.error)
  revalidateDoctorSurfaces(ctx.doctorId)
  return ok()
}
