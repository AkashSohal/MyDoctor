'use client'

import * as React from 'react'

/**
 * Emergency contacts + medical information (Part 1).
 *
 * Data is stored on this device only (localStorage) so the SOS flow works
 * without an account. Part 2 can swap the persistence layer for a Supabase
 * table while keeping the same hook API used by the components.
 */

export interface EmergencyContact {
  id: string
  name: string
  relation: string
  phone: string
}

export interface EmergencyMedicalInfo {
  bloodGroup: string
  allergies: string
  conditions: string
  medications: string
  notes: string
}

export const EMPTY_MEDICAL_INFO: EmergencyMedicalInfo = {
  bloodGroup: '',
  allergies: '',
  conditions: '',
  medications: '',
  notes: '',
}

export const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
] as const

const CONTACTS_KEY = 'mydoctor.emergency.contacts'
/** Legacy Part-1 medical info key — still read once to prefill the Part-3 profile. */
export const MEDICAL_KEY = 'mydoctor.emergency.medical-info'

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `ec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function useEmergencyContacts() {
  const [contacts, setContacts] = React.useState<EmergencyContact[]>([])
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    setContacts(readJson<EmergencyContact[]>(CONTACTS_KEY, []))
    setLoaded(true)
  }, [])

  const persist = React.useCallback((next: EmergencyContact[]) => {
    setContacts(next)
    return writeJson(CONTACTS_KEY, next)
  }, [])

  const addContact = React.useCallback(
    (input: Omit<EmergencyContact, 'id'>) => {
      const next: EmergencyContact[] = [
        ...contacts,
        { id: createId(), name: input.name.trim(), relation: input.relation.trim(), phone: input.phone.trim() },
      ]
      return persist(next)
    },
    [contacts, persist]
  )

  const updateContact = React.useCallback(
    (id: string, input: Omit<EmergencyContact, 'id'>) => {
      const next = contacts.map((contact) =>
        contact.id === id
          ? { ...contact, name: input.name.trim(), relation: input.relation.trim(), phone: input.phone.trim() }
          : contact
      )
      return persist(next)
    },
    [contacts, persist]
  )

  const removeContact = React.useCallback(
    (id: string) => persist(contacts.filter((contact) => contact.id !== id)),
    [contacts, persist]
  )

  return { contacts, loaded, addContact, updateContact, removeContact }
}

export function useEmergencyMedicalInfo() {
  const [info, setInfo] = React.useState<EmergencyMedicalInfo>(EMPTY_MEDICAL_INFO)
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    setInfo({ ...EMPTY_MEDICAL_INFO, ...readJson<Partial<EmergencyMedicalInfo>>(MEDICAL_KEY, {}) })
    setLoaded(true)
  }, [])

  const saveInfo = React.useCallback((next: EmergencyMedicalInfo) => {
    setInfo(next)
    return writeJson(MEDICAL_KEY, next)
  }, [])

  const clearInfo = React.useCallback(() => {
    setInfo(EMPTY_MEDICAL_INFO)
    try {
      window.localStorage.removeItem(MEDICAL_KEY)
    } catch {
      /* storage may be unavailable — state reset is enough for this session */
    }
  }, [])

  return { info, loaded, saveInfo, clearInfo }
}
