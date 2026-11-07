'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { getAdminContext } from '@/lib/admin/auth'
import { logAdminAction } from '@/lib/admin/audit'
import {
  assertAppointmentStatus,
  assertDoctorStatus,
  assertHospitalStatus,
  assertPatientStatus,
  fail,
  ok,
  optionalNumber,
  optionalString,
  optionalUuid,
  requireString,
  type ActionResult,
} from '@/lib/admin/validation'

type AdminCtx = NonNullable<Awaited<ReturnType<typeof getAdminContext>>>
type ActionOutcome<T> = { ok: true; data?: T } | { ok: false; error: string }

async function run<T = undefined>(
  fn: (ctx: AdminCtx) => Promise<ActionOutcome<T>>
): Promise<ActionOutcome<T>> {
  const ctx = await getAdminContext()
  if (!ctx) return fail('You are not authorized to perform this action') as ActionOutcome<T>
  try {
    return await fn(ctx)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    console.error('[admin-action]', message)
    return fail(message) as ActionOutcome<T>
  }
}

function revalidateAdmin(...paths: string[]) {
  paths.forEach((p) => revalidatePath(p, 'layout'))
}

// ---------------------------------------------------------------------------
// Doctors
// ---------------------------------------------------------------------------

export async function setDoctorVerification(
  doctorId: string,
  status: string,
  reason?: string
): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const nextStatus = assertDoctorStatus(status)
    const safeReason = optionalString(reason, 1000)

    const { data: doctor, error: fetchError } = await supabase
      .from('doctors')
      .select('id, full_name, user_id, verification_status')
      .eq('id', doctorId)
      .single()
    if (fetchError || !doctor) return fail('Doctor not found')

    const { error } = await supabase
      .from('doctors')
      .update({ verification_status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', doctorId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: `doctor_${nextStatus}`,
      entity_type: 'doctor',
      entity_id: doctorId,
      reason: safeReason,
      details: { doctor_name: doctor.full_name, previous_status: doctor.verification_status },
    })

    revalidateAdmin('/admin', '/admin/doctors', '/admin/verification', `/admin/doctors/${doctorId}`)
    return ok()
  })
}

export async function updateDoctorProfile(
  doctorId: string,
  input: Record<string, unknown>
): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const payload: Record<string, unknown> = {
      full_name: requireString(input.full_name, 'Full name', 200),
      bio: optionalString(input.bio, 3000),
      address: optionalString(input.address, 500),
      medical_registration_number: requireString(input.medical_registration_number, 'Medical registration number', 100),
      registration_council: requireString(input.registration_council, 'Registration council', 100),
      consultation_fee: Math.max(0, Math.round(optionalNumber(input.consultation_fee) ?? 0)),
      experience_years: Math.max(0, Math.round(optionalNumber(input.experience_years) ?? 0)),
      photo_url: optionalString(input.photo_url, 1000),
      gender: ['male', 'female', 'other'].includes(String(input.gender)) ? String(input.gender) : null,
      specialization_id: optionalUuid(input.specialization_id, 'Specialization'),
    }
    if (Array.isArray(input.qualifications)) {
      payload.qualifications = input.qualifications
        .map((q) => (typeof q === 'string' ? q.trim() : ''))
        .filter(Boolean)
        .slice(0, 20)
    }
    if (Array.isArray(input.languages)) {
      payload.languages = input.languages
        .map((l) => (typeof l === 'string' ? l.trim() : ''))
        .filter(Boolean)
        .slice(0, 20)
    }

    const { error } = await supabase.from('doctors').update(payload).eq('id', doctorId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: 'doctor_updated',
      entity_type: 'doctor',
      entity_id: doctorId,
      details: { fields: Object.keys(payload) },
    })

    revalidateAdmin('/admin/doctors', `/admin/doctors/${doctorId}`)
    return ok()
  })
}

export async function deleteDoctor(doctorId: string): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id, full_name')
      .eq('id', doctorId)
      .single()
    if (!doctor) return fail('Doctor not found')

    const { count: appointmentCount } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', doctorId)

    if ((appointmentCount ?? 0) > 0) {
      return fail(
        'This doctor has appointment history and cannot be deleted. Suspend the account instead to preserve patient records.'
      )
    }

    const { error } = await supabase.from('doctors').delete().eq('id', doctorId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: 'doctor_deleted',
      entity_type: 'doctor',
      entity_id: doctorId,
      details: { doctor_name: doctor.full_name },
    })

    revalidateAdmin('/admin', '/admin/doctors', '/admin/verification')
    return ok()
  })
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export async function setPatientStatus(
  profileId: string,
  status: string,
  reason?: string
): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const nextStatus = assertPatientStatus(status)
    if (profileId === userId) return fail('You cannot suspend your own admin account')

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, role, status')
      .eq('id', profileId)
      .single()
    if (!profile) return fail('Patient not found')
    if (profile.role === 'admin') return fail('Admin accounts cannot be suspended from here')

    const { error } = await supabase
      .from('profiles')
      .update({ status: nextStatus })
      .eq('id', profileId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: nextStatus === 'suspended' ? 'patient_suspended' : 'patient_reactivated',
      entity_type: 'profile',
      entity_id: profileId,
      reason: optionalString(reason, 1000),
      details: { patient_name: profile.full_name, previous_status: profile.status },
    })

    revalidateAdmin('/admin/patients', `/admin/patients/${profileId}`)
    return ok()
  })
}

export async function updatePatientProfile(
  profileId: string,
  input: Record<string, unknown>
): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const payload = {
      full_name: requireString(input.full_name, 'Full name', 200),
      phone: optionalString(input.phone, 30),
      email: optionalString(input.email, 255),
    }

    const { error } = await supabase.from('profiles').update(payload).eq('id', profileId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: 'patient_updated',
      entity_type: 'profile',
      entity_id: profileId,
      details: { fields: Object.keys(payload) },
    })

    revalidateAdmin('/admin/patients', `/admin/patients/${profileId}`)
    return ok()
  })
}

// ---------------------------------------------------------------------------
// Hospitals
// ---------------------------------------------------------------------------

type HospitalInput = Record<string, unknown>

function parseHospitalInput(input: HospitalInput) {
  return {
    name: requireString(input.name, 'Hospital name', 200),
    address: requireString(input.address, 'Address', 500),
    phone: optionalString(input.phone, 30),
    website: optionalString(input.website, 300),
    email: optionalString(input.email, 255),
    image_url: optionalString(input.image_url, 1000),
    latitude: optionalNumber(input.latitude),
    longitude: optionalNumber(input.longitude),
    facilities: Array.isArray(input.facilities)
      ? input.facilities.map((f) => (typeof f === 'string' ? f.trim() : '')).filter(Boolean).slice(0, 30)
      : [],
    is_active: input.is_active === undefined ? true : Boolean(input.is_active),
  }
}

export async function createHospital(input: HospitalInput): Promise<ActionResult<{ id: string }>> {
  return run(async ({ supabase, userId }) => {
    const payload = parseHospitalInput(input)
    const { data, error } = await supabase.from('hospitals').insert(payload).select('id').single()
    if (error) {
      if (error.code === '23505') return fail('A hospital with this name and address already exists')
      return fail(error.message)
    }

    const specialtyIds = Array.isArray(input.specialty_ids)
      ? (input.specialty_ids as unknown[]).filter((v): v is string => typeof v === 'string')
      : []
    if (specialtyIds.length && data) {
      await supabase.from('hospital_specialties').insert(
        specialtyIds.map((specialty_id) => ({ hospital_id: data.id, specialty_id }))
      )
    }

    await logAdminAction(supabase, userId, {
      action: 'hospital_created',
      entity_type: 'hospital',
      entity_id: data?.id,
      details: { name: payload.name },
    })

    revalidateAdmin('/admin/hospitals', '/admin')
    return ok({ id: data!.id })
  })
}

export async function updateHospital(id: string, input: HospitalInput): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    optionalUuid(id, 'Hospital')
    const payload = parseHospitalInput(input)

    const { error } = await supabase.from('hospitals').update(payload).eq('id', id)
    if (error) return fail(error.message)

    if (Array.isArray(input.specialty_ids)) {
      const specialtyIds = (input.specialty_ids as unknown[]).filter(
        (v): v is string => typeof v === 'string'
      )
      await supabase.from('hospital_specialties').delete().eq('hospital_id', id)
      if (specialtyIds.length) {
        await supabase.from('hospital_specialties').insert(
          specialtyIds.map((specialty_id) => ({ hospital_id: id, specialty_id }))
        )
      }
    }

    await logAdminAction(supabase, userId, {
      action: 'hospital_updated',
      entity_type: 'hospital',
      entity_id: id,
      details: { name: payload.name },
    })

    revalidateAdmin('/admin/hospitals', `/admin/hospitals/${id}`, '/admin')
    return ok()
  })
}

export async function deleteHospital(id: string): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    optionalUuid(id, 'Hospital')

    const { data: hospital } = await supabase
      .from('hospitals')
      .select('id, name')
      .eq('id', id)
      .single()
    if (!hospital) return fail('Hospital not found')

    const { count: appointmentCount } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('hospital_id', id)

    if ((appointmentCount ?? 0) > 0) {
      return fail(
        'This hospital has appointment history and cannot be deleted. Deactivating it is recommended instead.'
      )
    }

    const { error } = await supabase.from('hospitals').delete().eq('id', id)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: 'hospital_deleted',
      entity_type: 'hospital',
      entity_id: id,
      details: { name: hospital.name },
    })

    revalidateAdmin('/admin/hospitals', '/admin')
    return ok()
  })
}

// Hospital verification (Part 1) — used by the admin verification page.
// Hospitals submitted by doctors start as 'pending'; only admins can move
// them to 'verified' / 'rejected' (enforced again by the DB trigger).
export async function setHospitalVerification(
  hospitalId: string,
  status: string,
  reason?: string
): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const nextStatus = assertHospitalStatus(status)
    const safeReason = optionalString(reason, 1000)

    const { data: hospital, error: fetchError } = await supabase
      .from('hospitals')
      .select('id, name, verification_status')
      .eq('id', hospitalId)
      .single()
    if (fetchError || !hospital) return fail('Hospital not found')

    const { error } = await supabase
      .from('hospitals')
      .update({ verification_status: nextStatus })
      .eq('id', hospitalId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: `hospital_${nextStatus}`,
      entity_type: 'hospital',
      entity_id: hospitalId,
      reason: safeReason,
      details: { hospital_name: hospital.name, previous_status: hospital.verification_status },
    })

    revalidateAdmin('/admin/hospitals', '/admin/verification', '/admin', '/hospitals')
    revalidateTag('hospitals')
    return ok()
  })
}

export async function assignDoctorToHospital(
  hospitalId: string,
  doctorId: string
): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const { error } = await supabase
      .from('doctor_hospitals')
      .insert({ hospital_id: hospitalId, doctor_id: doctorId })
    if (error) {
      if (error.code === '23505') return fail('This doctor is already assigned to the hospital')
      return fail(error.message)
    }

    await logAdminAction(supabase, userId, {
      action: 'doctor_assigned_to_hospital',
      entity_type: 'doctor_hospital',
      details: { hospital_id: hospitalId, doctor_id: doctorId },
    })

    revalidateAdmin('/admin/hospitals', `/admin/hospitals/${hospitalId}`)
    return ok()
  })
}

export async function removeDoctorFromHospital(
  hospitalId: string,
  doctorId: string
): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const { error } = await supabase
      .from('doctor_hospitals')
      .delete()
      .eq('hospital_id', hospitalId)
      .eq('doctor_id', doctorId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: 'doctor_removed_from_hospital',
      entity_type: 'doctor_hospital',
      details: { hospital_id: hospitalId, doctor_id: doctorId },
    })

    revalidateAdmin('/admin/hospitals', `/admin/hospitals/${hospitalId}`)
    return ok()
  })
}

// ---------------------------------------------------------------------------
// Specialties
// ---------------------------------------------------------------------------

export async function createSpecialty(input: Record<string, unknown>): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const payload = {
      name: requireString(input.name, 'Specialty name', 100),
      description: optionalString(input.description, 1000),
      icon: optionalString(input.icon, 100) || 'stethoscope',
    }

    const { error } = await supabase.from('specialties').insert(payload)
    if (error) {
      if (error.code === '23505') return fail('A specialty with this name already exists')
      return fail(error.message)
    }

    await logAdminAction(supabase, userId, {
      action: 'specialty_created',
      entity_type: 'specialty',
      details: { name: payload.name },
    })

    revalidateAdmin('/admin/specialties', '/admin', '/specialties')
    return ok()
  })
}

export async function updateSpecialty(id: string, input: Record<string, unknown>): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const payload = {
      name: requireString(input.name, 'Specialty name', 100),
      description: optionalString(input.description, 1000),
      icon: optionalString(input.icon, 100) || 'stethoscope',
    }

    const { error } = await supabase.from('specialties').update(payload).eq('id', id)
    if (error) {
      if (error.code === '23505') return fail('A specialty with this name already exists')
      return fail(error.message)
    }

    await logAdminAction(supabase, userId, {
      action: 'specialty_updated',
      entity_type: 'specialty',
      entity_id: id,
      details: { name: payload.name },
    })

    revalidateAdmin('/admin/specialties', '/specialties')
    return ok()
  })
}

export async function deleteSpecialty(id: string): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const { data: specialty } = await supabase
      .from('specialties')
      .select('id, name')
      .eq('id', id)
      .single()
    if (!specialty) return fail('Specialty not found')

    const { count: doctorCount } = await supabase
      .from('doctors')
      .select('id', { count: 'exact', head: true })
      .eq('specialization_id', id)

    if ((doctorCount ?? 0) > 0) {
      return fail(
        `Cannot delete: ${doctorCount} doctor(s) are still assigned to this specialty. Reassign them first.`
      )
    }

    const { error } = await supabase.from('specialties').delete().eq('id', id)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: 'specialty_deleted',
      entity_type: 'specialty',
      entity_id: id,
      details: { name: specialty.name },
    })

    revalidateAdmin('/admin/specialties', '/specialties', '/admin')
    return ok()
  })
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export async function setAppointmentStatus(
  appointmentId: string,
  status: string,
  reason?: string
): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const nextStatus = assertAppointmentStatus(status)

    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, status, patient_id, doctor_id')
      .eq('id', appointmentId)
      .single()
    if (!appointment) return fail('Appointment not found')

    const { error } = await supabase
      .from('appointments')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: `appointment_${nextStatus}`,
      entity_type: 'appointment',
      entity_id: appointmentId,
      reason: optionalString(reason, 1000),
      details: { previous_status: appointment.status },
    })

    revalidateAdmin('/admin/appointments', '/admin')
    return ok()
  })
}

// ---------------------------------------------------------------------------
// Reviews & reports
// ---------------------------------------------------------------------------

export async function setReviewStatus(
  reviewId: string,
  status: string,
  reason?: string
): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    if (!['published', 'reported', 'hidden', 'pending_moderation'].includes(status)) {
      return fail('Invalid review status')
    }

    const { data: review } = await supabase
      .from('reviews')
      .select('id, status, doctor_id')
      .eq('id', reviewId)
      .single()
    if (!review) return fail('Review not found')

    const { error } = await supabase.from('reviews').update({ status }).eq('id', reviewId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: `review_${status}`,
      entity_type: 'review',
      entity_id: reviewId,
      reason: optionalString(reason, 1000),
      details: { previous_status: review.status },
    })

    revalidateAdmin('/admin/reviews', '/admin')
    return ok()
  })
}

export async function deleteReview(reviewId: string, reason: string): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const safeReason = requireString(reason, 'Removal reason', 1000)

    const { data: review } = await supabase
      .from('reviews')
      .select('id, doctor_id, rating, status')
      .eq('id', reviewId)
      .single()
    if (!review) return fail('Review not found')

    const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: 'review_deleted',
      entity_type: 'review',
      entity_id: reviewId,
      reason: safeReason,
      details: { previous_status: review.status, rating: review.rating },
    })

    revalidateAdmin('/admin/reviews', '/admin')
    return ok()
  })
}

export async function setReportStatus(
  reportId: string,
  status: string,
  reason?: string
): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return fail('Invalid report status')
    }

    const { data: report } = await supabase
      .from('reports')
      .select('id, review_id, status')
      .eq('id', reportId)
      .single()
    if (!report) return fail('Report not found')

    const { error } = await supabase.from('reports').update({ status }).eq('id', reportId)
    if (error) return fail(error.message)

    // Resolving a report against a review hides that review by default
    if (status === 'resolved' && report.review_id) {
      await supabase.from('reviews').update({ status: 'hidden' }).eq('id', report.review_id)
    }

    await logAdminAction(supabase, userId, {
      action: `report_${status}`,
      entity_type: 'report',
      entity_id: reportId,
      reason: optionalString(reason, 1000),
      details: { previous_status: report.status, review_id: report.review_id },
    })

    revalidateAdmin('/admin/reviews', '/admin')
    return ok()
  })
}

// ---------------------------------------------------------------------------
// Admin profile
// ---------------------------------------------------------------------------

export async function updateAdminProfile(input: Record<string, unknown>): Promise<ActionResult> {
  return run(async ({ supabase, userId }) => {
    const payload = {
      full_name: requireString(input.full_name, 'Full name', 200),
      phone: optionalString(input.phone, 30),
    }

    const { error } = await supabase.from('profiles').update(payload).eq('id', userId)
    if (error) return fail(error.message)

    await logAdminAction(supabase, userId, {
      action: 'admin_profile_updated',
      entity_type: 'profile',
      entity_id: userId,
    })

    revalidateAdmin('/admin/settings', '/admin')
    return ok()
  })
}

// ---------------------------------------------------------------------------
// Uploads (storage bucket: admin-uploads)
// ---------------------------------------------------------------------------

export async function uploadAdminImage(formData: FormData): Promise<ActionResult<{ url: string }>> {
  return run(async ({ supabase }) => {
    const file = formData.get('file')
    if (!(file instanceof File)) return fail('No file provided')
    if (!file.type.startsWith('image/')) return fail('Only image files are allowed')
    if (file.size > 5 * 1024 * 1024) return fail('Image must be under 5MB')

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`

    const { error } = await supabase.storage
      .from('admin-uploads')
      .upload(path, file, { contentType: file.type, upsert: false })
    if (error) return fail(`Upload failed: ${error.message}`)

    const { data } = supabase.storage.from('admin-uploads').getPublicUrl(path)
    if (!data?.publicUrl) return fail('Could not resolve public URL for upload')

    return ok({ url: data.publicUrl })
  })
}
