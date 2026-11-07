'use client'

import * as React from 'react'
import { useOptionalAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import {
  EMPTY_EMERGENCY_PROFILE,
  validateEmergencyProfile,
  type EmergencyProfile,
  type EmergencyProfileErrors,
} from '@/lib/emergency/profile'
import { MEDICAL_KEY } from '@/lib/emergency/storage'

/**
 * Supabase-backed emergency medical profile (Part 3, TASK 1).
 *
 * One private row per patient in public.patient_emergency_profiles, protected
 * by RLS (own-row only). The hook loads the row after login, saves with an
 * upsert and deletes on demand — the UI only ever touches the caller's own
 * data because the database enforces it.
 */

export interface SaveEmergencyProfileResult {
  ok: boolean
  errors?: EmergencyProfileErrors
  error?: string
}

export interface UseEmergencyProfileResult {
  profile: EmergencyProfile
  /** True once the initial fetch (or the signed-out short-circuit) finished. */
  loaded: boolean
  saving: boolean
  /** True when a row already exists — decides between "create" and "update". */
  exists: boolean
  isAuthenticated: boolean
  /** Non-null when the last load failed (e.g. migration not applied yet). */
  loadError: string | null
  saveProfile: (input: EmergencyProfile) => Promise<SaveEmergencyProfileResult>
  deleteProfile: () => Promise<{ ok: boolean; error?: string }>
}

/** Turn raw Supabase errors into copy a patient can act on. */
export function emergencyStorageError(error: unknown): string {
  const err = error as { code?: string; message?: string } | null
  const code = err?.code ?? ''
  const message = err?.message ?? ''

  if (
    code === 'PGRST205' ||
    code === '42P01' ||
    /does not exist|schema cache|Could not find the table/i.test(message)
  ) {
    return 'Emergency medical storage is not set up yet on this deployment.'
  }
  if (code === '42501' || /row-level security|permission denied/i.test(message)) {
    return 'You do not have permission to change this information.'
  }
  if (code === '23505') return 'This information was already saved.'
  if (code === '23514') return 'Some of the information you entered is not valid.'
  if (/Failed to fetch|NetworkError|fetch failed/i.test(message)) {
    return 'We could not reach the server. Check your connection and try again.'
  }
  return 'Something went wrong while saving. Please try again.'
}

function rowToProfile(row: Record<string, unknown>): EmergencyProfile {
  const pick = (key: keyof EmergencyProfile): string =>
    typeof row[key] === 'string' ? (row[key] as string) : ''
  return {
    full_name: pick('full_name'),
    blood_group: pick('blood_group'),
    allergies: pick('allergies'),
    medications: pick('medications'),
    conditions: pick('conditions'),
    emergency_contact_name: pick('emergency_contact_name'),
    emergency_contact_number: pick('emergency_contact_number'),
    additional_info: pick('additional_info'),
  }
}

/**
 * One-time continuity with Part 1: if the account has no row yet but this
 * device still holds the old localStorage medical info, prefill the form from
 * it so nothing a patient typed earlier is lost. Saving then migrates it to
 * Supabase permanently.
 */
function readLegacyMedicalInfo(): Partial<EmergencyProfile> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(MEDICAL_KEY)
    if (!raw) return {}
    const legacy = JSON.parse(raw) as Record<string, unknown>
    const text = (value: unknown): string => (typeof value === 'string' ? value : '')
    return {
      blood_group: text(legacy.bloodGroup),
      allergies: text(legacy.allergies),
      medications: text(legacy.medications),
      conditions: text(legacy.conditions),
      additional_info: text(legacy.notes),
    }
  } catch {
    return {}
  }
}

export function useEmergencyProfile(): UseEmergencyProfileResult {
  const auth = useOptionalAuth()
  const user = auth?.user ?? null
  const authLoading = auth?.loading ?? false

  const [profile, setProfile] = React.useState<EmergencyProfile>(EMPTY_EMERGENCY_PROFILE)
  const [exists, setExists] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const userId = user?.id ?? null

  React.useEffect(() => {
    let cancelled = false

    if (authLoading) return

    if (!userId) {
      // Signed out: nothing to fetch, the form shows the sign-in gate.
      setProfile(EMPTY_EMERGENCY_PROFILE)
      setExists(false)
      setLoadError(null)
      setLoaded(true)
      return
    }

    setLoaded(false)
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('patient_emergency_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (cancelled) return
        if (error) {
          console.error('[MyDoctor] Failed to load emergency profile:', error)
          setProfile(EMPTY_EMERGENCY_PROFILE)
          setExists(false)
          setLoadError(emergencyStorageError(error))
          return
        }

        setLoadError(null)
        if (data) {
          setProfile(rowToProfile(data))
          setExists(true)
        } else {
          // No row yet — prefill from the account name and any legacy
          // localStorage entry so the first save is one tap.
          setProfile({
            ...EMPTY_EMERGENCY_PROFILE,
            ...readLegacyMedicalInfo(),
            full_name: user?.full_name ?? '',
          })
          setExists(false)
        }
      } catch (error) {
        if (cancelled) return
        console.error('[MyDoctor] Failed to load emergency profile:', error)
        setLoadError(emergencyStorageError(error))
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, authLoading, user?.full_name])

  const saveProfile = React.useCallback(
    async (input: EmergencyProfile): Promise<SaveEmergencyProfileResult> => {
      if (!userId) {
        return { ok: false, error: 'Sign in to save your emergency medical information.' }
      }

      const errors = validateEmergencyProfile(input)
      if (Object.keys(errors).length > 0) {
        return { ok: false, errors }
      }

      const trimmed: EmergencyProfile = {
        full_name: input.full_name.trim(),
        blood_group: input.blood_group,
        allergies: input.allergies.trim(),
        medications: input.medications.trim(),
        conditions: input.conditions.trim(),
        emergency_contact_name: input.emergency_contact_name.trim(),
        emergency_contact_number: input.emergency_contact_number.trim(),
        additional_info: input.additional_info.trim(),
      }

      setSaving(true)
      try {
        const { error } = await supabase
          .from('patient_emergency_profiles')
          .upsert({ user_id: userId, ...trimmed }, { onConflict: 'user_id' })

        if (error) {
          console.error('[MyDoctor] Failed to save emergency profile:', error)
          return { ok: false, error: emergencyStorageError(error) }
        }

        setProfile(trimmed)
        setExists(true)
        setLoadError(null)
        return { ok: true }
      } catch (error) {
        console.error('[MyDoctor] Failed to save emergency profile:', error)
        return { ok: false, error: emergencyStorageError(error) }
      } finally {
        setSaving(false)
      }
    },
    [userId]
  )

  const deleteProfile = React.useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!userId) {
      return { ok: false, error: 'Sign in first.' }
    }
    try {
      const { error } = await supabase
        .from('patient_emergency_profiles')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error('[MyDoctor] Failed to delete emergency profile:', error)
        return { ok: false, error: emergencyStorageError(error) }
      }

      setProfile({ ...EMPTY_EMERGENCY_PROFILE, full_name: user?.full_name ?? '' })
      setExists(false)
      return { ok: true }
    } catch (error) {
      console.error('[MyDoctor] Failed to delete emergency profile:', error)
      return { ok: false, error: emergencyStorageError(error) }
    }
  }, [userId, user?.full_name])

  return {
    profile,
    loaded: loaded && !authLoading,
    saving,
    exists,
    isAuthenticated: Boolean(userId),
    loadError,
    saveProfile,
    deleteProfile,
  }
}
