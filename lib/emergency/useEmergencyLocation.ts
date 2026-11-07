'use client'

import * as React from 'react'

export type EmergencyLocationStatus =
  | 'idle'
  | 'locating'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'error'

export interface EmergencyLocation {
  status: EmergencyLocationStatus
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  /** How the coordinates were obtained: device GPS or manual entry. */
  source: 'device' | 'manual' | null
  /** Human-readable label for the manual location, when set. */
  label: string | null
  /** User-facing message — always explains what to do next. */
  message: string
  requestLocation: () => void
  /** Use coordinates from a manual search (city / area / PIN code). */
  setManualLocation: (latitude: number, longitude: number, label: string) => void
  reset: () => void
}

const UNSUPPORTED_MESSAGE =
  'This browser cannot share your location. You can still call emergency services without it.'

const DENIED_MESSAGE =
  'Location permission denied. Your browser is blocking location access — allow it in your browser’s site settings, then try again. You can still call 112 without your location.'

/**
 * Location access for the emergency flow. Never silently fails: every
 * outcome (granted / denied / unsupported / timeout) produces a message
 * the UI can show verbatim.
 */
export function useEmergencyLocation(): EmergencyLocation {
  const [status, setStatus] = React.useState<EmergencyLocationStatus>('idle')
  const [coords, setCoords] = React.useState<{
    latitude: number
    longitude: number
    accuracy: number | null
  } | null>(null)
  const [source, setSource] = React.useState<'device' | 'manual' | null>(null)
  const [label, setLabel] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState('')

  const requestLocation = React.useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unsupported')
      setMessage(UNSUPPORTED_MESSAGE)
      return
    }

    setStatus('locating')
    setMessage('Requesting your location…')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
        })
        setSource('device')
        setLabel(null)
        setStatus('granted')
        setMessage(
          `Location found (accurate to about ${Math.round(position.coords.accuracy)} m). You can share it with your emergency contacts.`
        )
      },
      (error) => {
        setCoords(null)
        setSource(null)
        setLabel(null)
        if (error.code === error.PERMISSION_DENIED) {
          setStatus('denied')
          setMessage(DENIED_MESSAGE)
        } else if (error.code === error.TIMEOUT) {
          setStatus('error')
          setMessage('Location request timed out. Try again, or call emergency services without your location.')
        } else {
          setStatus('error')
          setMessage('We could not read your location. You can still call emergency services without it.')
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    )
  }, [])

  const setManualLocation = React.useCallback(
    (latitude: number, longitude: number, manualLabel: string) => {
      setCoords({ latitude, longitude, accuracy: null })
      setSource('manual')
      setLabel(manualLabel)
      setStatus('granted')
      setMessage(`Showing results near ${manualLabel}. This is the location you entered, not your device position.`)
    },
    []
  )

  const reset = React.useCallback(() => {
    setStatus('idle')
    setCoords(null)
    setSource(null)
    setLabel(null)
    setMessage('')
  }, [])

  return {
    status,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    accuracy: coords?.accuracy ?? null,
    source,
    label,
    message,
    requestLocation,
    setManualLocation,
    reset,
  }
}
