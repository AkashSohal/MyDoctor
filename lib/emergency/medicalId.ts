'use client'

import * as React from 'react'
import { useOptionalAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { emergencyStorageError } from '@/lib/emergency/useEmergencyProfile'
import type { EmergencyProfile } from '@/lib/emergency/profile'
import {
  buildSharePayload,
  buildShareUrl,
  createShareToken,
  payloadHasContent,
  type MedicalIdShare,
  type ShareableField,
} from '@/lib/emergency/medicalIdShared'

// Server-safe helpers live in medicalIdShared.ts (usable from Server
// Components, e.g. the public share viewer) — re-exported here so client
// components can keep importing everything from one place.
export * from '@/lib/emergency/medicalIdShared'

export interface UseEmergencyMedicalIdResult {
  shares: MedicalIdShare[]
  loaded: boolean
  creating: boolean
  /** URL of the most recently generated share — drives the QR preview. */
  activeShareUrl: string | null
  isAuthenticated: boolean
  createShare: (
    profile: EmergencyProfile,
    selected: readonly ShareableField[],
    expiresInHours: number
  ) => Promise<{ ok: boolean; url?: string; error?: string }>
  revokeShare: (shareId: string) => Promise<{ ok: boolean; error?: string }>
  clearActiveShare: () => void
}

export function useEmergencyMedicalId(): UseEmergencyMedicalIdResult {
  const auth = useOptionalAuth()
  const user = auth?.user ?? null
  const authLoading = auth?.loading ?? false
  const userId = user?.id ?? null

  const [shares, setShares] = React.useState<MedicalIdShare[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [activeShareUrl, setActiveShareUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    if (authLoading) return

    if (!userId) {
      setShares([])
      setActiveShareUrl(null)
      setLoaded(true)
      return
    }

    setLoaded(false)
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('emergency_medical_id_shares')
          .select('id, token, created_at, expires_at, payload')
          .eq('user_id', userId)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })

        if (cancelled) return
        if (error) {
          console.error('[MyDoctor] Failed to load medical ID shares:', error)
          setShares([])
          return
        }
        setShares((data as MedicalIdShare[]) ?? [])
      } catch (error) {
        if (cancelled) return
        console.error('[MyDoctor] Failed to load medical ID shares:', error)
        setShares([])
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [userId, authLoading])

  const createShare = React.useCallback(
    async (
      profile: EmergencyProfile,
      selected: readonly ShareableField[],
      expiresInHours: number
    ): Promise<{ ok: boolean; url?: string; error?: string }> => {
      if (!userId) {
        return { ok: false, error: 'Sign in to create a shareable medical ID.' }
      }

      const payload = buildSharePayload(profile, selected)
      if (!payloadHasContent(payload)) {
        return { ok: false, error: 'Choose at least one field with saved information.' }
      }

      const token = createShareToken()
      const now = Date.now()
      const expiresAt = new Date(now + expiresInHours * 60 * 60 * 1000).toISOString()

      setCreating(true)
      try {
        const { data, error } = await supabase
          .from('emergency_medical_id_shares')
          .insert({
            user_id: userId,
            token,
            payload,
            expires_at: expiresAt,
          })
          .select('id, token, created_at, expires_at, payload')

        if (error) {
          console.error('[MyDoctor] Failed to create medical ID share:', error)
          return { ok: false, error: emergencyStorageError(error) }
        }

        const url = buildShareUrl(window.location.origin, token)
        const row = (data as MedicalIdShare[] | null)?.[0]
        if (row) {
          setShares((previous) => [row, ...previous])
        }
        setActiveShareUrl(url)
        return { ok: true, url }
      } catch (error) {
        console.error('[MyDoctor] Failed to create medical ID share:', error)
        return { ok: false, error: emergencyStorageError(error) }
      } finally {
        setCreating(false)
      }
    },
    [userId]
  )

  const revokeShare = React.useCallback(
    async (shareId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!userId) return { ok: false, error: 'Sign in first.' }
      try {
        // Rows are inserted with a random UUID id; the list may hold either
        // the id or the token (optimistic rows use the token), so match both.
        let query = supabase.from('emergency_medical_id_shares').delete().eq('user_id', userId)
        const looksLikeUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shareId)
        query = looksLikeUuid ? query.eq('id', shareId) : query.eq('token', shareId)

        const { error } = await query
        if (error) {
          console.error('[MyDoctor] Failed to revoke medical ID share:', error)
          return { ok: false, error: emergencyStorageError(error) }
        }
        setShares((previous) =>
          previous.filter((share) => share.id !== shareId && share.token !== shareId)
        )
        setActiveShareUrl((current) =>
          current && current.endsWith(`/${shareId}`) ? null : current
        )
        return { ok: true }
      } catch (error) {
        console.error('[MyDoctor] Failed to revoke medical ID share:', error)
        return { ok: false, error: emergencyStorageError(error) }
      }
    },
    [userId]
  )

  const clearActiveShare = React.useCallback(() => setActiveShareUrl(null), [])

  return {
    shares,
    loaded: loaded && !authLoading,
    creating,
    activeShareUrl,
    isAuthenticated: Boolean(userId),
    createShare,
    revokeShare,
    clearActiveShare,
  }
}
