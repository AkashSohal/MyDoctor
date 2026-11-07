'use client'

import * as React from 'react'
import { toast } from 'sonner'
import type { Doctor } from '@/lib/types'
import { getSpecializationName } from '@/lib/utils/doctor'

/** Maximum number of doctors a patient can compare side by side. */
export const MAX_COMPARE_DOCTORS = 3

const STORAGE_KEY = 'mydoctor:compare:v1'

/**
 * Lightweight snapshot kept in shared state so the selection survives
 * navigation between listings, profiles and the comparison page.
 * Only display fields are stored — the full records are re-fetched from the
 * database when the comparison is rendered.
 */
export interface CompareDoctor {
  id: string
  full_name: string
  photo_url?: string | null
  specialization_name?: string | null
}

interface DoctorCompareContextValue {
  doctors: CompareDoctor[]
  count: number
  isSelected: (id: string) => boolean
  toggle: (doctor: CompareDoctor) => void
  remove: (id: string) => void
  clear: () => void
}

const DoctorCompareContext = React.createContext<DoctorCompareContextValue | null>(null)

function isCompareDoctor(value: unknown): value is CompareDoctor {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Partial<CompareDoctor>
  return typeof entry.id === 'string' && entry.id.length > 0 && typeof entry.full_name === 'string'
}

/** Map a full doctor record to the snapshot stored for comparison. */
export function toCompareDoctor(doctor: Doctor): CompareDoctor {
  return {
    id: doctor.id,
    full_name: doctor.full_name,
    photo_url: doctor.photo_url ?? null,
    specialization_name: getSpecializationName(doctor),
  }
}

export function DoctorCompareProvider({ children }: { children: React.ReactNode }) {
  const [doctors, setDoctors] = React.useState<CompareDoctor[]>([])
  const [hydrated, setHydrated] = React.useState(false)

  // Rehydrate the selection once on the client so it persists across pages.
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setDoctors(parsed.filter(isCompareDoctor).slice(0, MAX_COMPARE_DOCTORS))
        }
      }
    } catch {
      // Corrupt or unavailable storage — start with an empty selection.
    }
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      if (doctors.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY)
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(doctors))
      }
    } catch {
      // Storage unavailable (private mode) — selection still works in-memory.
    }
  }, [doctors, hydrated])

  const isSelected = React.useCallback(
    (id: string) => doctors.some((d) => d.id === id),
    [doctors]
  )

  const remove = React.useCallback((id: string) => {
    setDoctors((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const clear = React.useCallback(() => setDoctors([]), [])

  const toggle = React.useCallback(
    (doctor: CompareDoctor) => {
      if (doctors.some((d) => d.id === doctor.id)) {
        setDoctors((prev) => prev.filter((d) => d.id !== doctor.id))
        return
      }
      if (doctors.length >= MAX_COMPARE_DOCTORS) {
        toast.info(`You can compare up to ${MAX_COMPARE_DOCTORS} doctors at a time.`, {
          description: 'Remove a doctor before adding another.',
        })
        return
      }
      setDoctors((prev) =>
        // Guard against a duplicate slipping in from a rapid double click.
        prev.some((d) => d.id === doctor.id) ? prev : [...prev, doctor]
      )
    },
    [doctors]
  )

  const value = React.useMemo<DoctorCompareContextValue>(
    () => ({ doctors, count: doctors.length, isSelected, toggle, remove, clear }),
    [doctors, isSelected, toggle, remove, clear]
  )

  return <DoctorCompareContext.Provider value={value}>{children}</DoctorCompareContext.Provider>
}

export function useDoctorCompare(): DoctorCompareContextValue {
  const context = React.useContext(DoctorCompareContext)
  if (!context) {
    throw new Error('useDoctorCompare must be used within a DoctorCompareProvider')
  }
  return context
}
